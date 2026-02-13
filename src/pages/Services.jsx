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
    { id: 'site_visit', name: 'Site Visit', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'panel_cleaning', name: 'Panel Cleaning', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { id: 'inverter_issue', name: 'Inverter Issue', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'health_check', name: 'Health Check', icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
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
                    <h2 className="text-lg font-bold text-gray-900 mb-4">{t('request_service')}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {services.map((service) => (
                            <Card
                                key={service.id}
                                className="interactive hover:border-solar hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => handleRequestClick(service.id)}
                            >
                                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                    <div className={`h-12 w-12 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <service.icon className="h-6 w-6" />
                                    </div>
                                    <span className="font-medium text-gray-900 text-sm">{service.name}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Emergency Support */}
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-red-700">{t('emergency_support')}</h3>
                            <p className="text-xs text-red-600/80">System breakdown? 24x7 Help</p>
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
                        <h2 className="text-lg font-bold text-gray-900">{t('recent_requests')}</h2>
                        <Button variant="ghost" size="sm" className="text-solar h-auto p-0">View All</Button>
                    </div>

                    <div className="space-y-3">
                        {tickets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">No service requests yet.</div>
                        ) : (
                            tickets.map((ticket) => (
                                <Card key={ticket.id}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm capitalize">{ticket.issue_type}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(ticket.created_at).toLocaleDateString()} • {ticket.status}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={getStatusVariant(ticket.status)}>
                                            {ticket.status.replace('_', ' ')}
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
