import { useState, useEffect } from 'react';
import { User, CreditCard, Bell, LogOut, ChevronRight, MapPin, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ticketService } from '../services/ticketService';

export default function Account() {
    const { user, profile, signOut } = useAuth();
    const [system, setSystem] = useState(null);
    const [ticketCount, setTicketCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function fetchAccountData() {
            setLoading(true);
            try {
                // 1. Fetch System details
                const { data: sysData } = await supabase
                    .from('solar_systems')
                    .select('*')
                    .eq('customer_id', user.id)
                    .single();
                setSystem(sysData);

                // 2. Fetch Ticket Count (Service History)
                const tickets = await ticketService.getTickets(user.id, 'customer');
                setTicketCount(tickets?.length || 0);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchAccountData();
    }, [user]);

    if (loading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-solar w-8 h-8" /></div>;

    return (
        <div className="space-y-6 pb-6">
            <Header title="Account" />

            <div className="px-4 space-y-6">
                {/* Profile Card */}
                <div className="flex items-center gap-4 py-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                            alt="User"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{profile?.name || 'User'}</h2>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">ID: {profile?.id?.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Installation Details */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Installation Details</h3>
                        {system ? (
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                <div>
                                    <p className="text-xs text-gray-500">System Size</p>
                                    <p className="text-sm font-semibold text-gray-900">{system.capacity_kw} kW</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Installed On</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {new Date(system.installation_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Service Requests</p>
                                    <p className="text-sm font-semibold text-gray-900">{ticketCount} Total</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">AMC Status</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500">Address</p>
                                    <p className="text-sm font-semibold text-gray-900 flex items-start gap-1">
                                        <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                                        {system.address || "Address not updated"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                No solar system linked.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Settings Menu */}
                <Card className="overflow-hidden">
                    <CardContent className="p-0 divide-y divide-gray-100">
                        {[
                            { icon: CreditCard, label: 'Payment Methods' },
                            { icon: Bell, label: 'Notifications' },
                            { icon: Settings, label: 'App Settings' },
                        ].map((item, i) => (
                            <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <item.icon className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                </Button>
            </div>
        </div>
    );
}
