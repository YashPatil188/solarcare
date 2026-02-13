import { useState } from 'react';
import { Button } from '../ui/Button';
import { Info } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../context/ToastContext';

export function SiteVisitModal({ isOpen, onClose, userId, systemId, onSuccess }) {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast.error('Please describe the issue.');
            return;
        }

        setLoading(true);
        try {
            await ticketService.createTicket({
                customer_id: userId,
                system_id: systemId,
                issue_type: 'site_visit',
                description: description,
                status: 'raised',
                priority: 'medium',
                service_metadata: { type: 'site_visit' }
            });
            toast.success('Site Visit Requested!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to request site visit.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
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
                        className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-solar focus:border-solar outline-none min-h-[100px]"
                        placeholder="e.g., System is making noise, low generation..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : 'Confirm Request'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
