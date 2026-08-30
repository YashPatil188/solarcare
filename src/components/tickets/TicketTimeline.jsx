import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, AlertTriangle, User, Phone } from 'lucide-react';

const steps = [
    { key: 'open', label: 'Ticket Created', matchStatuses: ['open', 'raised'], timeKey: 'created_at' },
    { key: 'assigned', label: 'Technician Assigned', matchStatuses: ['assigned'], timeKey: 'assigned_at' },
    { key: 'in_progress', label: 'Work In Progress', matchStatuses: ['in_progress'], timeKey: 'started_at' },
    { key: 'completed', label: 'Service Completed', matchStatuses: ['completed', 'resolved', 'closed'], timeKey: 'completed_at' },
];

export function TicketTimeline({ ticket }) {
    const currentStatus = ticket.status;
    const isEscalated = ticket.escalated || currentStatus === 'escalated';

    const currentStepIndex = steps.findIndex(s => s.matchStatuses.includes(currentStatus));
    const activeIndex = currentStepIndex >= 0 ? currentStepIndex : (isEscalated ? -1 : 0);

    const techInfo = ticket.technician || (ticket.assigned_technician_id ? {
        name: ticket.technician_name || 'Assigned Technician',
        phone: ticket.technician_phone || '+91 98765 43210',
        avatar_url: ticket.technician_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tech'
    } : null);

    return (
        <div className="space-y-5">
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

            {/* Assigned Technician Card */}
            {techInfo && (
                <div className="bg-solar/10 border border-solar/30 rounded-2xl p-4 flex items-center justify-between shadow-sm gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-full bg-white border-2 border-solar overflow-hidden shrink-0 shadow-sm">
                            <img src={techInfo.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${techInfo.name}`} alt={techInfo.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-black text-solar uppercase tracking-wider">ASSIGNED TECHNICIAN</span>
                                <span className="text-[10px] font-mono font-extrabold text-gray-800 bg-white px-2 py-0.5 rounded-md border border-solar/30 shadow-2xs whitespace-nowrap">
                                    ID: {(() => {
                                        if (techInfo.id && techInfo.id !== 'assigned') return `TECH-${techInfo.id.replaceAll('-', '').slice(0, 4).toUpperCase()}`;
                                        if (techInfo.phone) return `TECH-${techInfo.phone.replace(/[^0-9]/g, '').slice(-4)}`;
                                        return 'TECH-4102';
                                    })()}
                                </span>
                            </div>
                            <p className="text-sm font-extrabold text-gray-900 truncate">
                                {techInfo.name && techInfo.name !== 'Assigned Technician' ? techInfo.name : 'Solar Care Engineer'}
                            </p>
                        </div>
                    </div>
                    {techInfo.phone && (
                        <a
                            href={`tel:${techInfo.phone}`}
                            className="bg-solar text-white px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:bg-solar-dark transition-all shrink-0 uppercase tracking-wider"
                        >
                            <Phone className="w-3.5 h-3.5" /> Call Tech
                        </a>
                    )}
                </div>
            )}

            {/* Timeline Steps with Detailed Timestamps */}
            <div className="relative pl-1">
                {steps.map((step, i) => {
                    const isComplete = i <= activeIndex;
                    const isCurrent = i === activeIndex;
                    const timestamp = ticket[step.timeKey] || (i === 0 ? ticket.created_at : null);

                    return (
                        <motion.div
                            key={step.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-3 relative pb-6 last:pb-0"
                        >
                            {/* Connector Line */}
                            {i < steps.length - 1 && (
                                <div className={`absolute left-3.5 top-7 w-0.5 h-full ${
                                    isComplete && !isCurrent ? 'bg-solar' : 'bg-gray-200'
                                }`} />
                            )}

                            {/* Step Icon */}
                            <div className="relative z-10 flex-shrink-0">
                                {isComplete ? (
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                                        isCurrent ? 'bg-solar text-white ring-4 ring-solar/20' : 'bg-solar text-white'
                                    }`}>
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <div className="h-7 w-7 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center">
                                        <Circle className="h-3 w-3 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1">
                                <div className="flex justify-between items-baseline">
                                    <p className={`text-sm font-bold ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {step.label}
                                    </p>
                                    {timestamp && (
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>

                                {timestamp && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {new Date(timestamp).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                )}

                                {isCurrent && (
                                    <p className="text-xs text-solar font-bold mt-1 flex items-center gap-1">
                                        <Clock className="h-3 w-3 animate-pulse" /> Active Stage
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
