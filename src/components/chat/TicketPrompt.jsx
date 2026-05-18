import { motion } from 'framer-motion';
import { AlertTriangle, Ticket, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/Button';

const categoryLabels = {
    panel_issue: '🔆 Panel Issue',
    inverter_issue: '⚡ Inverter Issue',
    battery_issue: '🔋 Battery Issue',
    cleaning_maintenance: '🧹 Cleaning/Maintenance',
    installation: '🔧 Installation',
    amc: '📋 AMC',
    billing: '💰 Billing',
    urgent_safety: '🚨 Urgent Safety',
    general: '📝 General',
};

const priorityStyles = {
    emergency: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-blue-500 text-white',
};

export function TicketPrompt({ ticketData, onConfirm, onDismiss, isCreating }) {
    if (!ticketData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mx-2 mb-3"
        >
            <div className={`rounded-2xl border-2 overflow-hidden ${
                ticketData.priority === 'emergency'
                    ? 'border-red-300 bg-red-50'
                    : 'border-indigo-200 bg-indigo-50'
            }`}>
                <div className={`px-4 py-2.5 flex items-center justify-between ${
                    ticketData.priority === 'emergency'
                        ? 'bg-red-100'
                        : 'bg-indigo-100'
                }`}>
                    <div className="flex items-center gap-2">
                        {ticketData.priority === 'emergency' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
                        ) : (
                            <Ticket className="h-4 w-4 text-indigo-600" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Issue Detected — Create Ticket?
                        </span>
                    </div>
                    <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                            {categoryLabels[ticketData.category] || ticketData.category}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            priorityStyles[ticketData.priority] || priorityStyles.medium
                        }`}>
                            {ticketData.priority}
                        </span>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                        {ticketData.title || ticketData.summary}
                    </p>

                    {ticketData.diagnosis && (
                        <p className="text-xs text-gray-500 bg-white/60 rounded-lg p-2 border border-gray-200">
                            💡 <strong>AI Diagnosis:</strong> {ticketData.diagnosis}
                        </p>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button
                            onClick={onConfirm}
                            disabled={isCreating}
                            className={`flex-1 text-sm h-10 ${
                                ticketData.priority === 'emergency'
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-solar hover:bg-[#00c958] text-white'
                            }`}
                        >
                            {isCreating ? 'Creating...' : 'Create Ticket'}
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button
                            onClick={onDismiss}
                            variant="outline"
                            className="text-sm h-10 border-gray-200 text-gray-500"
                        >
                            Not Now
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
