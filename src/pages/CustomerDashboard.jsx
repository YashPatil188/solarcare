import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Sun, Battery, ArrowRight, Loader2, ShieldCheck, Calendar, CheckCircle2, CreditCard, Smartphone, Building, Lock, CheckCircle, PlusCircle, ChevronRight, X, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

export default function CustomerDashboard() {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [system, setSystem] = useState(null);
    const [activeSub, setActiveSub] = useState(null);
    const [allSubscriptions, setAllSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // AMC Modal & Payment States
    const [showAmcModal, setShowAmcModal] = useState(false);
    const [amcStep, setAmcStep] = useState('details'); // 'details', 'select_plan', 'payment'
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        if (user) fetchDashboardData();
    }, [user]);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            // 1. Fetch System
            const { data: sysData } = await supabase
                .from('solar_systems')
                .select('*')
                .eq('customer_id', user.id)
                .maybeSingle();
            setSystem(sysData);

            // 2. Fetch User's AMC Subscriptions
            const { data: subData } = await supabase
                .from('amc_subscriptions')
                .select('*, amc_plans(*)')
                .eq('user_id', user.id)
                .order('end_date', { ascending: true });

            const subs = subData || [];
            setAllSubscriptions(subs);
            
            const now = new Date();
            const active = subs.find(s => new Date(s.start_date || s.created_at) <= now && new Date(s.end_date) >= now);
            setActiveSub(active || subs[subs.length - 1] || null);

            // 3. Fetch Plans for purchasing
            const { data: plansData } = await supabase
                .from('amc_plans')
                .select('*')
                .order('price', { ascending: true });
            setPlans(plansData || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleConfirmPayment = async () => {
        if (!selectedPlan) return;
        setIsPaying(true);

        try {
            // Simulate 1.2s dummy payment processing delay
            await new Promise(res => setTimeout(res, 1200));

            // Jio-style date extension stacking calculation
            let startDate = new Date();
            if (allSubscriptions && allSubscriptions.length > 0) {
                const validDates = allSubscriptions
                    .map(s => new Date(s.end_date))
                    .filter(d => !isNaN(d) && d > new Date());
                if (validDates.length > 0) {
                    startDate = new Date(Math.max(...validDates));
                }
            }

            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + selectedPlan.duration_months);

            // 1. Insert Subscription Record
            const { error: subErr } = await supabase
                .from('amc_subscriptions')
                .insert({
                    user_id: user.id,
                    plan_id: selectedPlan.id,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    services_total: 4 * (selectedPlan.duration_months / 12),
                    services_used: 0,
                    payment_reference: `PAY_${Date.now().toString().slice(-6)}_UPI`
                });

            if (subErr) throw subErr;

            // 2. Update Solar System table
            if (system?.id) {
                await supabase
                    .from('solar_systems')
                    .update({
                        amc_status: 'active',
                        amc_valid_until: endDate.toISOString()
                    })
                    .eq('id', system.id);
            }

            toast.success(`🎉 Payment Successful! Plan queued until ${endDate.toLocaleDateString()}`);
            setShowAmcModal(false);
            setAmcStep('details');
            fetchDashboardData();

        } catch (err) {
            console.error('Error in payment:', err);
            toast.error('Payment failed: ' + (err.message || 'Check connection'));
        } finally {
            setIsPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen pb-20">
                <Loader2 className="h-8 w-8 animate-spin text-solar" />
            </div>
        );
    }

    // Calculations for display
    const currentOutput = system ? (system.capacity_kw * 0.75).toFixed(1) : '0';
    const todaysGen = system ? (system.capacity_kw * 4.2).toFixed(1) : '0';
    const monthGen = system ? (system.capacity_kw * 120).toFixed(0) : '0';
    const lifetimeGen = system ? (system.capacity_kw * 3.5).toFixed(1) : '0';

    const farthestEndDate = allSubscriptions.length > 0
        ? new Date(Math.max(...allSubscriptions.map(s => new Date(s.end_date))))
        : (system?.amc_valid_until ? new Date(system.amc_valid_until) : null);

    const isAmcActive = farthestEndDate && farthestEndDate > new Date();

    return (
        <div className="space-y-6 pb-20 bg-gray-50 min-h-screen">
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

                        {/* Fully Interactive AMC Status Card */}
                        <Card
                            className="bg-white border border-solar/30 hover:border-solar transition-all cursor-pointer shadow-sm hover:shadow-md group"
                            onClick={() => {
                                setShowAmcModal(true);
                                setAmcStep('details');
                            }}
                        >
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="h-11 w-11 rounded-xl bg-solar/10 flex items-center justify-center text-solar group-hover:scale-105 transition-transform">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">AMC Protection</p>
                                            <Badge variant={isAmcActive ? 'success' : 'destructive'} className="font-bold text-[10px] uppercase">
                                                {isAmcActive ? 'Active' : 'Expired'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 mt-0.5">
                                            {farthestEndDate
                                                ? `Valid until ${farthestEndDate.toLocaleDateString()}`
                                                : 'Click to view plans & activate'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-solar transition-colors" />
                            </CardContent>
                        </Card>
                    </>
                )}

            </div>

            {/* --- INTERACTIVE AMC MODAL / JIO-STYLE PLAN QUEUEING & PAYMENT --- */}
            {showAmcModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-solar" />
                                <h3 className="font-extrabold text-gray-900 text-base uppercase tracking-wider">
                                    {amcStep === 'details' && 'AMC Coverage Activity'}
                                    {amcStep === 'select_plan' && 'Select AMC Plan'}
                                    {amcStep === 'payment' && 'Dummy Payment Gateway'}
                                </h3>
                            </div>
                            <button onClick={() => setShowAmcModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                        </div>

                        {/* STEP 1: AMC Details & Jio-Style Active/Queued Subscriptions Timeline */}
                        {amcStep === 'details' && (
                            <div className="space-y-4">
                                <div className="bg-solar-light/40 border border-solar/20 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Overall Protection Status</span>
                                        <Badge variant={isAmcActive ? 'success' : 'destructive'} className="font-bold uppercase">
                                            {isAmcActive ? 'Active' : 'Expired'}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Farthest Valid Until Date</span>
                                        <span className="text-xs font-extrabold text-solar">
                                            {farthestEndDate ? farthestEndDate.toLocaleDateString() : 'Not Set'}
                                        </span>
                                    </div>
                                </div>

                                {/* List of Active & Queued Plans */}
                                <div className="space-y-2">
                                    <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Plan Queue Timeline</p>
                                    {allSubscriptions.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No AMC plan purchased yet.</p>
                                    ) : (
                                        allSubscriptions.map((sub, idx) => {
                                            const startDate = new Date(sub.start_date || sub.created_at);
                                            const endDate = new Date(sub.end_date);
                                            const now = new Date();
                                            const isCurrentlyRunning = startDate <= now && endDate >= now;
                                            const isQueuedFuture = startDate > now;

                                            return (
                                                <div key={sub.id || idx} className={`p-3 rounded-xl border text-xs space-y-1.5 ${isCurrentlyRunning ? 'bg-emerald-50/60 border-emerald-300' : isQueuedFuture ? 'bg-amber-50/60 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-gray-900">{sub.amc_plans?.name || 'AMC Coverage Plan'}</span>
                                                        {isCurrentlyRunning && <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">ACTIVE NOW</span>}
                                                        {isQueuedFuture && <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> QUEUED</span>}
                                                    </div>
                                                    <div className="flex justify-between text-gray-600 font-medium">
                                                        <span>{startDate.toLocaleDateString()} &rarr; {endDate.toLocaleDateString()}</span>
                                                        <span className="font-bold">{sub.amc_plans?.price ? `₹${sub.amc_plans.price}` : ''}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <Button
                                    className="w-full bg-solar hover:bg-solar-dark text-white font-bold h-12 shadow-md gap-2"
                                    onClick={() => setAmcStep('select_plan')}
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    {isAmcActive ? 'Extend / Add Next AMC Plan' : 'Buy & Activate AMC Plan'}
                                </Button>
                            </div>
                        )}

                        {/* STEP 2: Plan Selection */}
                        {amcStep === 'select_plan' && (
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                {plans.map((plan) => {
                                    const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'border-solar bg-solar/5 ring-2 ring-solar/20' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-extrabold text-gray-900 text-sm">{plan.name}</h4>
                                                    <p className="text-xs text-gray-500">{plan.duration_months} Months Coverage</p>
                                                </div>
                                                <Badge className="bg-solar text-white font-bold text-xs">
                                                    ₹{plan.price.toLocaleString()}
                                                </Badge>
                                            </div>
                                            <ul className="text-xs text-gray-600 space-y-1">
                                                {features?.slice(0, 2).map((f, idx) => (
                                                    <li key={idx} className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-solar" /> {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}

                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setAmcStep('details')}>Back</Button>
                                    <Button
                                        className="flex-1 bg-solar text-white hover:bg-solar-dark"
                                        disabled={!selectedPlan}
                                        onClick={() => setAmcStep('payment')}
                                    >
                                        Proceed to Pay
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Dummy Payment Simulation */}
                        {amcStep === 'payment' && selectedPlan && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{selectedPlan.name}</p>
                                        <p className="text-xs text-gray-500">{selectedPlan.duration_months} Months Coverage</p>
                                    </div>
                                    <span className="text-lg font-black text-solar">₹{selectedPlan.price.toLocaleString()}</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase text-gray-600">Select Payment Method</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('upi')}
                                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${paymentMethod === 'upi' ? 'border-solar bg-solar/10 text-solar' : 'border-gray-200 text-gray-600'}`}
                                        >
                                            <Smartphone className="w-4 h-4" /> UPI
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('card')}
                                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${paymentMethod === 'card' ? 'border-solar bg-solar/10 text-solar' : 'border-gray-200 text-gray-600'}`}
                                        >
                                            <CreditCard className="w-4 h-4" /> Card
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('netbanking')}
                                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${paymentMethod === 'netbanking' ? 'border-solar bg-solar/10 text-solar' : 'border-gray-200 text-gray-600'}`}
                                        >
                                            <Building className="w-4 h-4" /> Net Banking
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 shadow-lg gap-2 text-base"
                                    onClick={handleConfirmPayment}
                                    disabled={isPaying}
                                >
                                    {isPaying ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing Dummy Payment...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Pay ₹{selectedPlan.price.toLocaleString()} & Activate AMC
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
