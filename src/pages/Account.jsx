import { useState, useEffect } from 'react';
import { User, CreditCard, Bell, LogOut, ChevronRight, MapPin, Settings, Loader2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // [NEW]
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ticketService } from '../services/ticketService';

export default function Account() {
    const { user, profile, signOut } = useAuth();
    const { t, i18n } = useTranslation(); // [NEW]
    const [system, setSystem] = useState(null);
    const [ticketCount, setTicketCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

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
            <Header title={t('account')} />

            <div className="px-4 space-y-6">
                {/* Profile Card */}
                <div className="flex items-center gap-4 py-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 overflow-hidden border-2 border-[#1a1a1a] shadow-md shadow-solar/10">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                            alt="User"
                            className="h-full w-full object-cover "
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900 tracking-wide uppercase">{profile?.name || 'User'}</h2>
                        <p className="text-sm font-medium text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-300 font-mono tracking-widest mt-0.5">ID: {profile?.id?.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Installation Details */}
                <Card className="bg-white border-gray-200 hover:border-solar/30 transition-all hover:shadow-md shadow-solar/10">
                    <CardContent className="p-5">
                        <h3 className="font-extrabold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-3">{t('installation_date')} & {t('capacity')}</h3>
                        {system ? (
                            <div className="grid grid-cols-2 gap-y-5 gap-x-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('capacity')}</p>
                                    <p className="text-sm font-bold text-gray-900 tracking-wide">{system.capacity_kw} kW</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('installation_date')}</p>
                                    <p className="text-sm font-bold text-gray-900 tracking-wide">
                                        {new Date(system.installation_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('services')}</p>
                                    <p className="text-sm font-bold text-gray-900 tracking-wide">{ticketCount} Total</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">AMC Status</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-solar-light text-solar border border-solar/20 shadow-md shadow-solar/10 uppercase tracking-wider">
                                        Active
                                    </span>
                                </div>
                                <div className="col-span-2 mt-1 border-t border-gray-100 pt-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('address')}</p>
                                    <p className="text-sm font-medium text-gray-700 flex items-start gap-2 leading-relaxed">
                                        <MapPin className="h-4 w-4 mt-0.5 text-solar" />
                                        {system.address || "Address not updated"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 text-sm tracking-wide">
                                No solar system linked.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Settings Menu */}
                <Card className="bg-white border-gray-200 overflow-hidden hover:border-solar/30 transition-all hover:shadow-md shadow-solar/10">
                    <CardContent className="p-0 divide-y divide-white/10">
                        {/* Language Selector */}
                        <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-gray-500 group-hover:text-solar transition-colors" />
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t('language')}</span>
                            </div>
                            <select
                                className="text-sm bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium"
                                value={i18n.language}
                                onChange={(e) => changeLanguage(e.target.value)}
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                                <option value="mr">मराठी (Marathi)</option>
                                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                            </select>
                        </div>

                        {[
                            { icon: CreditCard, label: 'Payment Methods' },
                            { icon: Bell, label: 'Notifications' },
                            { icon: Settings, label: t('settings') },
                        ].map((item, i) => (
                            <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group">
                                <div className="flex items-center gap-3">
                                    <item.icon className="h-5 w-5 text-gray-500 group-hover:text-solar transition-colors" />
                                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">{item.label}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-solar transition-colors" />
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Button variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold uppercase tracking-wider" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('logout')}
                </Button>
            </div>
        </div>
    );
}
