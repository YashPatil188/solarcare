import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Filter, Search, ChevronLeft, AlertTriangle, Clock, CheckCircle, ArrowUpRight, Loader2, MessageSquare, Star } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TicketCard } from '../components/tickets/TicketCard';
import { TicketTimeline } from '../components/tickets/TicketTimeline';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';

const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'escalated', label: 'Escalated' },
];

export default function TicketTracker() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();

    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackTicket, setFeedbackTicket] = useState(null);

    useEffect(() => {
        if (user) fetchData();
    }, [user, activeFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketData, statsData] = await Promise.all([
                complaintService.getCustomerTickets(user.id, { status: activeFilter }),
                complaintService.getTicketStats(user.id),
            ]);
            setTickets(ticketData);
            setStats(statsData);
        } catch (err) {
            console.error('Error fetching tickets:', err);
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleEscalate = async (ticketId) => {
        if (!window.confirm('Are you sure you want to escalate this ticket? This will flag it for urgent attention.')) return;
        try {
            await complaintService.escalateTicket(ticketId);
            toast.success('Ticket escalated successfully');
            fetchData();
            setSelectedTicket(null);
        } catch (err) {
            toast.error('Failed to escalate ticket');
        }
    };

    const handleOpenFeedback = (ticket) => {
        setFeedbackTicket(ticket);
        setShowFeedback(true);
    };

    // ─── Ticket Detail View ────────────────────────────────────
    if (selectedTicket) {
        const ticket = selectedTicket;
        const hasFeedback = ticket.customer_feedback && ticket.customer_feedback.length > 0;
        const canFeedback = ['resolved', 'completed', 'closed'].includes(ticket.status) && !hasFeedback;

        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <Header
                    title={
                        <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                            <ChevronLeft className="h-5 w-5" />
                            <span className="text-sm font-bold">Ticket Details</span>
                        </button>
                    }
                />

                <div className="px-4 space-y-4 pt-2">
                    {/* Ticket ID & Status */}
                    <Card className="bg-white">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ticket</p>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {ticket.customer_summary || ticket.issue_type?.replace(/_/g, ' ')}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1 font-mono">
                                        #{ticket.id?.slice(0, 8).toUpperCase()}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant={ticket.priority === 'emergency' ? 'destructive' : 'outline'} className="font-bold uppercase text-[10px]">
                                        {ticket.priority}
                                    </Badge>
                                    {ticket.ai_generated && (
                                        <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" /> AI Generated
                                        </span>
                                    )}
                                </div>
                            </div>

                            {ticket.description && (
                                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed">
                                    {ticket.description}
                                </p>
                            )}

                            {ticket.ai_diagnosis && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">🤖 AI Diagnosis</p>
                                    <p className="text-sm text-indigo-700">{ticket.ai_diagnosis}</p>
                                </div>
                            )}

                            <div className="text-xs text-gray-500 flex items-center gap-4 pt-2 border-t border-gray-100">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Created {new Date(ticket.created_at).toLocaleString()}
                                </span>
                                {ticket.resolved_at && (
                                    <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" />
                                        Resolved {new Date(ticket.resolved_at).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Timeline */}
                    <Card className="bg-white">
                        <CardContent className="p-5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Progress</p>
                            <TicketTimeline ticket={ticket} />
                        </CardContent>
                    </Card>

                    {/* Resolution Notes */}
                    {ticket.resolution_notes && (
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-4">
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Resolution Notes</p>
                                <p className="text-sm text-green-800">{ticket.resolution_notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        {!['resolved', 'closed', 'completed', 'escalated'].includes(ticket.status) && (
                            <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleEscalate(ticket.id)}
                            >
                                <AlertTriangle className="h-4 w-4 mr-1" /> Escalate
                            </Button>
                        )}
                        {canFeedback && (
                            <Button
                                className="flex-1 bg-solar text-white hover:bg-[#00c958]"
                                onClick={() => handleOpenFeedback(ticket)}
                            >
                                <Star className="h-4 w-4 mr-1" /> Give Feedback
                            </Button>
                        )}
                    </div>

                    {/* Existing Feedback */}
                    {hasFeedback && (
                        <Card className="bg-amber-50 border-amber-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Your Feedback</p>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} className={`h-3.5 w-3.5 ${
                                                s <= ticket.customer_feedback[0].rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                            }`} />
                                        ))}
                                    </div>
                                </div>
                                {ticket.customer_feedback[0].review_text && (
                                    <p className="text-sm text-amber-800 italic">"{ticket.customer_feedback[0].review_text}"</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Feedback Modal */}
                <FeedbackModal
                    isOpen={showFeedback}
                    onClose={() => setShowFeedback(false)}
                    ticket={feedbackTicket}
                    userId={user?.id}
                    onSuccess={fetchData}
                />
            </div>
        );
    }

    // ─── Ticket List View ──────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header title="My Tickets" />

            <div className="px-4 space-y-4 pt-2">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-gray-900 bg-gray-50 border-gray-200' },
                            { label: 'Open', value: stats.open, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                            { label: 'Resolved', value: stats.resolved, color: 'text-green-600 bg-green-50 border-green-200' },
                            { label: 'Escalated', value: stats.escalated, color: 'text-red-600 bg-red-50 border-red-200' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`rounded-xl border p-2.5 text-center ${stat.color}`}
                            >
                                <p className="text-xl font-black">{stat.value}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Status Filter */}
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                    {statusFilters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                                activeFilter === filter.value
                                    ? 'bg-solar text-white shadow-sm'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Ticket List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-solar" />
                    </div>
                ) : tickets.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 space-y-3"
                    >
                        <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
                            <Ticket className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No tickets found</p>
                        <p className="text-xs text-gray-400">
                            {activeFilter !== 'all' ? 'Try a different filter' : 'Chat with AI to raise your first ticket'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {tickets.map((ticket, i) => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                index={i}
                                onClick={() => setSelectedTicket(ticket)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
                ticket={feedbackTicket}
                userId={user?.id}
                onSuccess={fetchData}
            />
        </div>
    );
}
