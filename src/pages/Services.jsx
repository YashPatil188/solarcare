import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // [NEW]
import { Wrench, Droplets, Zap, Activity, Clock, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ticketService } from '../services/ticketService';
import { supabase } from '../lib/supabase';

// Service Modals
import { SiteVisitModal } from '../components/services/SiteVisitModal';
import { SlotBookingModal } from '../components/services/SlotBookingModal';
import { InverterQuestionnaire } from '../components/services/InverterQuestionnaire';

const services = [
    { id: 'site_visit', name: 'Site Visit', icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20' },
    { id: 'panel_cleaning', name: 'Panel Cleaning', icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border border-cyan-500/20' },
    { id: 'inverter_issue', name: 'Inverter Issue', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border border-whitember-500/20' },
    { id: 'health_check', name: 'Health Check', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
];

export default function Services() {
    const { t } = useTranslation(); // [NEW]
    const { user } = useAuth();
    const { toast } = useToast();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [systemId, setSystemId] = useState(null);

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'site_visit', 'panel_cleaning', etc.

    useEffect(() => {
        if (user) {
            fetchSystemAndTickets();
        }
    }, [user]);

    async function fetchSystemAndTickets() {
        try {
            // 1. Get System ID
            const { data: system } = await supabase
                .from('solar_systems')
                .select('id')
                .eq('customer_id', user.id)
                .single();

            if (system) setSystemId(system.id);

            // 2. Get Tickets via Service
            const ticketData = await ticketService.getTickets(user.id, 'customer');
            setTickets(ticketData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleRequestClick = (serviceId) => {
        if (!systemId) {
            toast.error("No solar system linked to your account. Cannot raise request.");
            return;
        }
        setActiveModal(serviceId);
    };

    const handleServiceSuccess = () => {
        fetchSystemAndTickets(); // Refresh list
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'raised': return 'warning';
            case 'assigned': return 'info';
            case 'in_progress': return 'warning';
            case 'completed': return 'success';
            case 'closed': return 'default';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen pb-20">
                <Loader2 className="h-8 w-8 animate-spin text-solar" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <Header title={t('services')} />

            <div className="px-4 space-y-8">
                {/* Request New Service */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-wide uppercase">{t('request_service')}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {services.map((service) => (
                            <Card
                                key={service.id}
                                className="bg-white hover:-translate-y-1 hover:shadow-md shadow-solar/10 hover:border-solar/50 transition-all cursor-pointer group"
                                onClick={() => handleRequestClick(service.id)}
                            >
                                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                                    <div className={`h-14 w-14 rounded-xl ${service.bg} ${service.color} flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-[0_0_15px_currentColor]`}>
                                        <service.icon className="h-6 w-6 stroke-[1.5]" />
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm tracking-wide uppercase">{service.name}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Emergency Support */}
                <Card className="bg-red-500/10 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-red-400 uppercase tracking-wider">{t('emergency_support')}</h3>
                            <p className="text-xs font-medium text-red-400/80 mt-1">System breakdown? 24x7 Help</p>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            className="shadow-none"
                            onClick={() => window.location.href = 'tel:8792015164'}
                        >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                        </Button>
                    </CardContent>
                </Card>

                {/* MODALS */}
                {/* 1. Site Visit */}
                <SiteVisitModal
                    isOpen={activeModal === 'site_visit'}
                    onClose={() => setActiveModal(null)}
                    userId={user.id}
                    systemId={systemId}
                    onSuccess={handleServiceSuccess}
                />

                {/* 2. Slot Booking (Panel Cleaning & Health Check) */}
                <SlotBookingModal
                    isOpen={activeModal === 'panel_cleaning' || activeModal === 'health_check'}
                    onClose={() => setActiveModal(null)}
                    userId={user.id}
                    systemId={systemId}
                    serviceType={activeModal}
                    onSuccess={handleServiceSuccess}
                />

                {/* 3. Inverter Questionnaire */}
                <InverterQuestionnaire
                    isOpen={activeModal === 'inverter_issue'}
                    onClose={() => setActiveModal(null)}
                    userId={user.id}
                    systemId={systemId}
                    onSuccess={handleServiceSuccess}
                />


                {/* Recent Tickets */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 tracking-wide uppercase">{t('recent_requests')}</h2>
                        <Button variant="ghost" size="sm" className="text-solar h-auto p-0 hover:bg-transparent hover:text-solar-dark tracking-wide uppercase text-xs">View All</Button>
                    </div>

                    <div className="space-y-3">
                        {tickets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm font-medium tracking-wide">No service requests yet.</div>
                        ) : (
                            tickets.map((ticket) => (
                                <Card key={ticket.id} className="bg-white">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-200">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm uppercase tracking-wider">{ticket.issue_type.replaceAll('_', ' ').toUpperCase()}</p>
                                                <p className="text-xs font-medium text-gray-500 mt-0.5">
                                                    {new Date(ticket.created_at).toLocaleDateString()} • {ticket.status.replaceAll('_', ' ').toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={getStatusVariant(ticket.status)} className="font-bold uppercase tracking-wider">
                                            {ticket.status.replaceAll('_', ' ').toUpperCase()}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
