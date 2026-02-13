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
                    <div className="h-8 w-8 rounded-full bg-solar/10 flex items-center justify-center text-solar font-bold text-xs ring-2 ring-white">
                        {profile?.name?.charAt(0) || 'U'}
                    </div>
                }
            />

            <div className="px-4 space-y-6">
                {/* System Status Card */}
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            {system ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                        <span className="font-semibold text-green-700">{t('system_healthy')}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{t('capacity')}: {system.capacity_kw} kW</p>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                                    <span className="font-semibold text-gray-600">{t('no_system')}</span>
                                </div>
                            )}
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Zap className="h-6 w-6 fill-current" />
                        </div>
                    </CardContent>
                </Card>

                {system && (
                    <>
                        {/* Real-time Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <div className="h-10 w-10 rounded-full bg-solar-light flex items-center justify-center text-solar mb-3">
                                        <Sun className="h-5 w-5" />
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">{currentOutput} kW</span>
                                    <span className="text-xs text-gray-500">{t('current_output')}</span>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">{todaysGen} kWh</span>
                                    <span className="text-xs text-gray-500">{t('todays_generation')}</span>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Extended Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs text-gray-500 mb-1">This Month</p>
                                    <p className="text-lg font-bold text-gray-900">{monthGen} kWh</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs text-gray-500 mb-1">Lifetime</p>
                                    <p className="text-lg font-bold text-gray-900">{lifetimeGen} MWh</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Battery Status */}
                        <Card className="border-gray-200">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Battery className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-900">Battery Level</span>
                                        <span className="text-sm font-bold text-gray-900">85%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-[85%]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AMC Status Summary */}
                        <Card>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">AMC Status</p>
                                    <p className="text-xs text-gray-500">
                                        {system.amc_valid_until ? `Valid until ${new Date(system.amc_valid_until).toLocaleDateString()}` : 'No Active Plan'}
                                    </p>
                                </div>
                                <Badge variant={system.amc_status === 'active' ? 'success' : 'destructive'}>
                                    {system.amc_status === 'active' ? 'Active' : 'Expired'}
                                </Badge>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* CTA */}
                <Link to="/services">
                    <Button className="w-full shadow-lg shadow-solar/30" size="lg">
                        {t('request_service')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
