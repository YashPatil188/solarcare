import { useState } from 'react';
import { Button } from '../ui/Button';
import { CheckCircle, Zap } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../context/ToastContext';

export function InverterQuestionnaire({ isOpen, onClose, userId, systemId, onSuccess }) {
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            toast.error('Please answer all questions.');
            return;
        }

        setLoading(true);
        try {
            await ticketService.createTicket({
                customer_id: userId,
                system_id: systemId,
                issue_type: 'inverter_issue',
                description: 'Inverter Issue Diagnosis',
                status: 'raised',
                priority: 'high',
                service_metadata: {
                    type: 'questionnaire',
                    answers: answers
                }
            });
            toast.success('Diagnosis Submitted! Technician will review.');
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
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Diagnosis'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
