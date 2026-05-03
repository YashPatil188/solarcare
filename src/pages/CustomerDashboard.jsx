import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // [NEW]
import { Zap, Sun, Battery, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function CustomerDashboard() {
    const { t } = useTranslation(); // [NEW]
    const { user, profile } = useAuth();
    const [system, setSystem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSystem() {
            try {
                const { data, error } = await supabase
                    .from('solar_systems')
                    .select('*')
                    .eq('customer_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"
                setSystem(data);
            } catch (error) {
                console.error('Error fetching system:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) fetchSystem();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen pb-20">
                <Loader2 className="h-8 w-8 animate-spin text-solar" />
            </div>
        );
    }

    // Dummy calculation for display purposes based on capacity
    const currentOutput = system ? (system.capacity_kw * 0.75).toFixed(1) : '0';
    const todaysGen = system ? (system.capacity_kw * 4.2).toFixed(1) : '0';
    const monthGen = system ? (system.capacity_kw * 120).toFixed(0) : '0';
    const lifetimeGen = system ? (system.capacity_kw * 3.5).toFixed(1) : '0'; // MWh estimate

    return (
        <div className="space-y-6 pb-6">
            <Header
                title={t('dashboard')}
                rightAction={
                    <div className="h-8 w-8 rounded-full bg-solar-light flex items-center justify-center text-solar font-bold text-xs border border-solar/50">
                        {profile?.name?.charAt(0) || 'U'}
                    </div>
                }
            />

            <div className="px-4 space-y-6">
                {/* System Status Card */}
                <Card className="bg-white border border-solar/20 relative overflow-hidden shadow-md shadow-solar/10">
                    <div className="absolute -right-6 -top-6 h-32 w-32 bg-solar-light rounded-full blur-[40px] pointer-events-none"></div>
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            {system ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-solar animate-pulse shadow-[0_0_10px_#0ce86b]" />
                                        <span className="font-bold text-solar tracking-wider uppercase text-sm">{t('system_healthy')}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 tracking-wide">{t('capacity')}: <span className="text-gray-900 font-bold">{system.capacity_kw} kW</span></p>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-white/20" />
                                    <span className="font-bold text-gray-500 tracking-wider uppercase text-sm">{t('no_system')}</span>
                                </div>
                            )}
                        </div>
                        <div className="h-14 w-14 rounded-xl bg-solar-light flex items-center justify-center text-solar border border-solar/20 backdrop-blur-md">
                            <Zap className="h-7 w-7 fill-current" />
                        </div>
                    </CardContent>
                </Card>

                {system && (
                    <>
                        {/* Real-time Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="hover:border-solar/40 transition-all cursor-default bg-white">
                                <CardContent className="p-5 flex flex-col items-center text-center">
                                    <div className="h-12 w-12 rounded-xl bg-solar-light flex items-center justify-center text-solar mb-3 border border-solar/20">
                                        <Sun className="h-6 w-6" />
                                    </div>
                                    <span className="text-2xl font-black text-gray-900 tracking-tight">{currentOutput} <span className="text-sm font-medium text-gray-500">kW</span></span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{t('current_output')}</span>
                                </CardContent>
                            </Card>
                            <Card className="hover:border-blue-500/40 transition-all cursor-default bg-white">
                                <CardContent className="p-5 flex flex-col items-center text-center">
                                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/20">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <span className="text-2xl font-black text-gray-900 tracking-tight">{todaysGen} <span className="text-sm font-medium text-gray-500">kWh</span></span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{t('todays_generation')}</span>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Extended Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-white hover:bg-gray-50 transition-colors">
                                <CardContent className="p-5">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">This Month</p>
                                    <p className="text-xl font-bold text-gray-900">{monthGen} kWh</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white hover:bg-gray-50 transition-colors">
                                <CardContent className="p-5">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lifetime</p>
                                    <p className="text-xl font-bold text-gray-900">{lifetimeGen} MWh</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Battery Status */}
                        <Card className="bg-white border-purple-500/20">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                    <Battery className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Battery</span>
                                        <span className="text-sm font-black text-purple-400">85%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-[85%] rounded-full shadow-[0_0_10px_#a855f7]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AMC Status Summary */}
                        <Card className="bg-white">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">AMC Status</p>
                                    <p className="text-xs font-medium text-gray-500 mt-1">
                                        {system.amc_valid_until ? `Valid until ${new Date(system.amc_valid_until).toLocaleDateString()}` : 'No Active Plan'}
                                    </p>
                                </div>
                                <Badge variant={system.amc_status === 'active' ? 'success' : 'error'}>
                                    {system.amc_status === 'active' ? 'Active' : 'Expired'}
                                </Badge>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* CTA */}
                <Link to="/services">
                    <Button className="w-full text-lg h-14" size="lg">
                        {t('request_service')}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
