import { useState } from 'react';
import { Button } from '../ui/Button';
import { CheckCircle, Zap, Mic, Image as ImageIcon, Info } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../context/ToastContext';
import { VoiceRecorder } from '../ui/VoiceRecorder';
import { ImageUploader } from '../ui/ImageUploader';
import { supabase } from '../../lib/supabase';

export function InverterQuestionnaire({ isOpen, onClose, userId, systemId, onSuccess }) {
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);

    // Custom Issue State
    const [customDescription, setCustomDescription] = useState('');
    const [voiceBlob, setVoiceBlob] = useState(null);
    const [images, setImages] = useState([]);

    const { toast } = useToast();

    if (!isOpen) return null;

    const questions = [
        { id: 'q1', text: 'Is the inverter display on?', options: ['Yes', 'No', 'Flashing'] },
        { id: 'q2', text: 'Any error code visible?', options: ['None', 'Error 404', 'Grid Fail', 'Other'] },
        { id: 'q3', text: 'Is the fan running loudly?', options: ['Yes', 'No'] },
        { id: 'q4', text: 'Have you tried restarting it?', options: ['Yes', 'No'] }
    ];

    const handleOptionSelect = (qId, option) => {
        setAnswers(prev => ({ ...prev, [qId]: option }));
    };

    const uploadFile = async (file, folder) => {
        const fileExt = file.name ? file.name.split('.').pop() : 'webm';
        const fileName = `${userId}/${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage
            .from('service-attachments')
            .upload(filePath, file);

        if (error) throw error;

        const { data } = supabase.storage
            .from('service-attachments')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            toast.error('Please answer all diagnostic questions.');
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

            await ticketService.createTicket({
                customer_id: userId,
                system_id: systemId,
                issue_type: 'inverter_issue',
                description: customDescription || 'Inverter Issue Diagnosis',
                status: 'raised',
                priority: 'high',
                service_metadata: {
                    type: 'questionnaire',
                    answers: answers
                },
                voice_note_url: voiceUrl,
                photos: photoUrls
            });

            toast.success('Diagnosis & Details Submitted!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit diagnosis.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-solar" />
                    Inverter Diagnosis
                </h2>

                <div className="space-y-6">
                    {/* Diagnosis Questions */}
                    {questions.map((q, index) => (
                        <div key={q.id} className="space-y-2">
                            <p className="text-sm font-medium text-gray-800">{index + 1}. {q.text}</p>
                            <div className="flex flex-wrap gap-2">
                                {q.options.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => handleOptionSelect(q.id, option)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${answers[q.id] === option ? 'bg-solar text-white border-solar shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Custom Request Section */}
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-500" />
                            Additional Details (Optional)
                        </h3>

                        <textarea
                            className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-solar focus:border-solar outline-none min-h-[60px]"
                            placeholder="Describe any other issue not covered above..."
                            value={customDescription}
                            onChange={(e) => setCustomDescription(e.target.value)}
                        />

                        {/* Voice Note */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                                <Mic className="w-3 h-3 text-solar" /> Voice Note
                            </label>
                            <VoiceRecorder
                                onRecordingComplete={(blob) => setVoiceBlob(blob)}
                                onDelete={() => setVoiceBlob(null)}
                            />
                        </div>

                        {/* Photos */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                                <ImageIcon className="w-3 h-3 text-solar" /> Photos
                            </label>
                            <ImageUploader
                                onImagesChange={(files) => setImages(files)}
                                maxImages={3}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span> Submitting...
                            </>
                        ) : 'Submit Diagnosis'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
