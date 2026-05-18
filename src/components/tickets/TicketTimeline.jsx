import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, AlertTriangle, User, ArrowRight } from 'lucide-react';

const steps = [
    { key: 'open', label: 'Opened', matchStatuses: ['open', 'raised'] },
    { key: 'assigned', label: 'Assigned', matchStatuses: ['assigned'] },
    { key: 'in_progress', label: 'In Progress', matchStatuses: ['in_progress'] },
    { key: 'completed', label: 'Completed', matchStatuses: ['completed', 'resolved', 'closed'] },
];

export function TicketTimeline({ ticket }) {
    const currentStatus = ticket.status;
    const isEscalated = ticket.escalated || currentStatus === 'escalated';

    // Determine which step is currently active
    const currentStepIndex = steps.findIndex(s => s.matchStatuses.includes(currentStatus));
    const activeIndex = currentStepIndex >= 0 ? currentStepIndex : (isEscalated ? -1 : 0);

    return (
        <div className="space-y-4">
            {/* Escalation Warning */}
            {isEscalated && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-red-50 text-red-700 text-xs font-bold px-3 py-2 rounded-lg border border-red-200"
                >
                    <AlertTriangle className="h-4 w-4 animate-pulse" />
                    Ticket has been escalated for urgent attention
                </motion.div>
            )}

            {/* Timeline Steps */}
            <div className="relative">
                {steps.map((step, i) => {
                    const isComplete = i <= activeIndex;
                    const isCurrent = i === activeIndex;
                    const isPending = i > activeIndex;

                    return (
                        <motion.div
                            key={step.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 relative"
                        >
                            {/* Connector Line */}
                            {i < steps.length - 1 && (
                                <div className={`absolute left-3.5 top-8 w-0.5 h-8 ${
                                    isComplete && !isCurrent ? 'bg-solar' : 'bg-gray-200'
                                }`} />
                            )}

                            {/* Step Icon */}
                            <div className="relative z-10 flex-shrink-0">
                                {isComplete ? (
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                                        isCurrent ? 'bg-solar text-white ring-4 ring-solar/20' : 'bg-solar text-white'
                                    }`}>
                                        {isCurrent ? (
                                            <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-7 w-7 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center">
                                        <Circle className="h-3 w-3 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            {/* Step Content */}
                            <div className={`pb-8 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
                                <p className={`text-sm font-bold ${
                                    isComplete ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                    {step.label}
                                </p>
                                {isCurrent && (
                                    <p className="text-xs text-solar font-medium mt-0.5 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Current Status
                                    </p>
                                )}
                                {step.key === 'assigned' && ticket.assigned_technician_id && isComplete && (
                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                        <User className="h-3 w-3" /> Technician assigned
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ETA Card */}
            {ticket.estimated_resolution_hours && !['resolved', 'closed', 'completed'].includes(currentStatus) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Estimated Resolution</p>
                        <p className="text-sm font-bold text-blue-900">{ticket.estimated_resolution_hours} hours</p>
                    </div>
                </div>
            )}
        </div>
    );
}
