import { motion } from 'framer-motion';
import { Clock, User, AlertTriangle, CheckCircle, Loader2, ArrowUpRight, MessageSquare, Phone } from 'lucide-react';
import { cleanPhone } from '../../utils/phone';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

const categoryIcons = {
    panel_issue: '🔆',
    inverter_issue: '⚡',
    battery_issue: '🔋',
    cleaning_maintenance: '🧹',
    installation: '🔧',
    amc: '📋',
    billing: '💰',
    urgent_safety: '🚨',
    general: '📝',
    site_visit: '🏠',
    panel_cleaning: '🧹',
    health_check: '💊',
};

const statusConfig = {
    open: { label: 'Open', variant: 'warning', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    raised: { label: 'Raised', variant: 'warning', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    assigned: { label: 'Assigned', variant: 'info', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    in_progress: { label: 'In Progress', variant: 'warning', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    completed: { label: 'Completed', variant: 'success', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    resolved: { label: 'Resolved', variant: 'success', color: 'text-green-600 bg-green-50 border-green-200' },
    closed: { label: 'Closed', variant: 'default', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    escalated: { label: 'Escalated', variant: 'destructive', color: 'text-red-600 bg-red-50 border-red-200' },
};

const priorityConfig = {
    emergency: { label: 'EMERGENCY', color: 'bg-red-500 text-white' },
    high: { label: 'HIGH', color: 'bg-orange-500 text-white' },
    medium: { label: 'MEDIUM', color: 'bg-amber-500 text-white' },
    low: { label: 'LOW', color: 'bg-blue-500 text-white' },
};

export function TicketCard({ ticket, onClick, index = 0 }) {
    const status = statusConfig[ticket.status] || statusConfig.open;
    const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
    const category = ticket.category || ticket.issue_type || 'general';
    const icon = categoryIcons[category] || '📝';
    const isEmergency = ticket.priority === 'emergency';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            <Card
                className={`cursor-pointer transition-all hover:shadow-md group ${
                    isEmergency
                        ? 'border-red-300 hover:border-red-400 shadow-red-100/50'
                        : 'border-gray-200 hover:border-solar/40 shadow-gray-100/50'
                }`}
                onClick={onClick}
            >
                <CardContent className="p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${status.color} border`}>
                                {icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-900 text-sm truncate leading-tight">
                                    {ticket.customer_summary || ticket.issue_type?.replace(/_/g, ' ').toUpperCase() || 'Service Request'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                    ID: {ticket.id?.slice(0, 8).toUpperCase()} • {new Date(ticket.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${priority.color}`}>
                                {priority.label}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>

                    {/* Description Preview */}
                    {ticket.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 rounded-lg p-2 border border-gray-100">
                            {ticket.description}
                        </p>
                    )}

                    {/* AI Diagnosis */}
                    {ticket.ai_diagnosis && (
                        <div className="flex items-start gap-1.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2.5 py-1.5 border border-indigo-100">
                            <span className="font-medium">🤖 AI:</span>
                            <span className="line-clamp-1">{ticket.ai_diagnosis}</span>
                        </div>
                    )}

                    {/* Assigned Technician Banner */}
                    {ticket.technician && (
                        <div className="bg-solar/10 border border-solar/30 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-9 w-9 rounded-full bg-white border-2 border-solar overflow-hidden shrink-0 shadow-sm">
                                    <img
                                        src={ticket.technician.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.technician.name}`}
                                        alt={ticket.technician.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black text-solar uppercase tracking-wider">ASSIGNED TECHNICIAN</span>
                                        <span className="text-[9px] font-mono font-extrabold text-gray-800 bg-white px-1.5 py-0.2 rounded border border-solar/30 whitespace-nowrap">
                                            ID: TECH-{(ticket.technician.id || '4102').replaceAll('-', '').slice(0, 4).toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="font-extrabold text-gray-900 truncate text-xs">{ticket.technician.name || 'Solar Care Engineer'}</p>
                                </div>
                            </div>

                            {ticket.technician.phone && (
                                <a
                                    href={`tel:${cleanPhone(ticket.technician.phone)}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-solar text-white px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 hover:bg-solar-dark transition-all shrink-0 uppercase tracking-wider shadow-sm"
                                >
                                    <Phone className="w-3 h-3" /> Call
                                </a>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                            {ticket.ai_generated && (
                                <span className="flex items-center gap-1 text-indigo-500 font-semibold">
                                    <MessageSquare className="h-3 w-3" /> AI Generated
                                </span>
                            )}
                            {ticket.estimated_resolution_hours && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> ~{ticket.estimated_resolution_hours}h ETA
                                </span>
                            )}
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-solar transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
