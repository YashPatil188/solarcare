import { useState } from 'react';
import { Button } from '../ui/Button';
import { Info, Mic, Image as ImageIcon } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../context/ToastContext';
import { VoiceRecorder } from '../ui/VoiceRecorder';
import { ImageUploader } from '../ui/ImageUploader';
import { supabase } from '../../lib/supabase';

export function SiteVisitModal({ isOpen, onClose, userId, systemId, onSuccess }) {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [voiceBlob, setVoiceBlob] = useState(null);
    const [images, setImages] = useState([]);
    const { toast } = useToast();

    if (!isOpen) return null;

    const uploadFile = async (file, folder) => {
        const fileExt = file.name ? file.name.split('.').pop() : 'webm';
        const fileName = `${userId}/${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage
            .from('service-attachments')
            .upload(filePath, file);

        if (error) throw error;

        // Get Public URL
        const { data } = supabase.storage
            .from('service-attachments')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async () => {
        if (!description.trim() && !voiceBlob) {
            toast.error('Please describe the issue or add a voice note.');
            return;
        }

        setLoading(true);
        try {
            let voiceUrl = null;
            let photoUrls = [];

            // 1. Upload Voice Note
            if (voiceBlob) {
                voiceUrl = await uploadFile(voiceBlob, 'voice-notes');
            }

            // 2. Upload Images
            if (images.length > 0) {
                const uploadPromises = images.map(img => uploadFile(img, 'photos'));
                photoUrls = await Promise.all(uploadPromises);
            }

            // 3. Create Ticket
            await ticketService.createTicket({
                customer_id: userId,
                system_id: systemId,
                issue_type: 'site_visit',
                description: description,
                status: 'raised',
                priority: 'medium',
                service_metadata: { type: 'site_visit' },
                voice_note_url: voiceUrl,
                photos: photoUrls
            });

            toast.success('Site Visit Requested!');
            onSuccess();
            onClose();

            // Reset Form
            setDescription('');
            setVoiceBlob(null);
            setImages([]);

        } catch (error) {
            console.error(error);
            toast.error('Failed to request site visit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg text-blue-800">
                    <Info className="w-5 h-5 mt-0.5 shrink-0" />
                    <p className="text-sm leading-relaxed">
                        <strong>Note:</strong> A technician will visit your site within 24-48 hours.
                        Please ensure someone is available to provide access to the inverter and panels.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Describe the Issue</label>
                    <textarea
                        className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-solar focus:border-solar outline-none min-h-[80px]"
                        placeholder="e.g., System is making noise, low generation..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Voice Note Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Mic className="w-4 h-4 text-solar" /> Add Voice Note
                    </label>
                    <VoiceRecorder
                        onRecordingComplete={(blob) => setVoiceBlob(blob)}
                        onDelete={() => setVoiceBlob(null)}
                    />
                </div>

                {/* Photos Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-solar" /> Add Photos
                    </label>
                    <ImageUploader
                        onImagesChange={(files) => setImages(files)}
                        maxImages={3}
                    />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
                        {loading ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span> Uploading...
                            </>
                        ) : 'Confirm Request'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
