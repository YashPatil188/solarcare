import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Calendar, CheckCircle2, FileText, ArrowRight, AlertCircle, ShoppingBag, Sparkles, CreditCard, Smartphone, Building, Lock, Loader2, CheckCircle, PlusCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { solarRecommendationEngine } from '../utils/solarRecommendationEngine';

export default function AMC() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [allSubscriptions, setAllSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard' or 'shop'
    
    // Payment Modal State
    const [purchasingPlan, setPurchasingPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
    const [upiId, setUpiId] = useState('solar.care@upi');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Recommendation State
    const [recommendation, setRecommendation] = useState(null);
    const [userSystem, setUserSystem] = useState(null);

    useEffect(() => {
        fetchAMCData();
    }, [user]);

    const fetchAMCData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Plans
            const { data: plansData, error: plansError } = await supabase
                .from('amc_plans')
                .select('*')
                .order('price', { ascending: true });

            if (plansError) throw plansError;
            setPlans(plansData || []);

            // 2. Fetch User's Subscriptions ordered chronologically by start_date / end_date
            const { data: subData, error: subError } = await supabase
                .from('amc_subscriptions')
                .select('*, amc_plans(*)')
                .eq('user_id', user.id)
                .order('end_date', { ascending: true });

            if (subError) throw subError;

            const subs = subData || [];
            setAllSubscriptions(subs);
            
            // Find active running sub or furthest sub
            const now = new Date();
            const active = subs.find(s => new Date(s.start_date || s.created_at) <= now && new Date(s.end_date) >= now);
            setActiveSubscription(active || subs[subs.length - 1] || null);

            if (subs.length === 0) {
                setView('shop');
                fetchSystemAndRecommend(plansData);
            } else {
                setView('dashboard');
            }

        } catch (error) {
            console.error('Error fetching AMC data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemAndRecommend = async (availablePlans) => {
        const { data: system } = await supabase
            .from('solar_systems')
            .select('*')
            .eq('customer_id', user.id)
            .maybeSingle();

        if (system) {
            setUserSystem(system);
            const rec = solarRecommendationEngine.recommend(system, availablePlans);
            setRecommendation(rec);
            if (rec) setSelectedPlanId(rec.recommendedPlanId);
        }
    };

    const openPaymentModal = (plan) => {
        setPurchasingPlan(plan);
    };

    const handleConfirmPayment = async () => {
        if (!purchasingPlan) return;
        setIsProcessingPayment(true);

        try {
            // Simulate 1.2 second payment processing delay
            await new Promise(res => setTimeout(res, 1200));

            // Calculate dates using Jio-style extension stacking logic (max existing end_date)
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
            endDate.setMonth(endDate.getMonth() + purchasingPlan.duration_months);

            // 1. Create & Auto-Activate AMC Subscription in Supabase
            const { error: subErr } = await supabase
                .from('amc_subscriptions')
                .insert({
                    user_id: user.id,
                    plan_id: purchasingPlan.id,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    services_total: 4 * (purchasingPlan.duration_months / 12),
                    services_used: 0,
                    payment_reference: `PAY_${Date.now().toString().slice(-6)}_${paymentMethod.toUpperCase()}`
                });

            if (subErr) throw subErr;

            // 2. Fetch or update Solar System AMC valid_until
            const { data: systemData } = await supabase
                .from('solar_systems')
                .select('id')
                .eq('customer_id', user.id)
                .maybeSingle();

            if (systemData?.id) {
                await supabase
                    .from('solar_systems')
                    .update({
                        amc_status: 'active',
                        amc_valid_until: endDate.toISOString()
                    })
                    .eq('id', systemData.id);
            }

            toast.success(`🎉 AMC Extended Successfully! Valid until ${endDate.toLocaleDateString()}`);
            setPurchasingPlan(null);
            fetchAMCData();

        } catch (error) {
            console.error('Error completing payment:', error);
            toast.error('Payment processing failed: ' + (error.message || 'Check connection'));
        } finally {
            setIsProcessingPayment(false);
        }
    };

    if (loading) return <div className="p-10 text-center flex items-center justify-center gap-2"><Loader2 className="w-6 h-6 animate-spin text-solar" /> Loading AMC Subscriptions...</div>;

    const farthestEndDate = allSubscriptions.length > 0 
        ? new Date(Math.max(...allSubscriptions.map(s => new Date(s.end_date))))
        : null;

    return (
        <div className="space-y-6 pb-20 bg-gray-50 min-h-screen">
            <Header title={t('amc_title')} />

            <div className="px-4 space-y-6">

                {/* --- 1. DASHBOARD VIEW (Active & Queued Subscriptions) --- */}
                {view === 'dashboard' && (
                    <>
                        {/* Overall Coverage Summary Card */}
                        <Card className="overflow-hidden relative border border-solar/30 bg-gradient-to-br from-solar/5 to-white shadow-md">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <ShieldCheck className="h-40 w-40 text-solar" />
                            </div>

                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Annual Maintenance Contract</p>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-wide">
                                            {activeSubscription?.amc_plans?.name || 'Solar Care Plan'}
                                        </h2>
                                    </div>
                                    <Badge className="bg-emerald-500 text-white font-bold uppercase px-3 py-1 shadow-sm">
                                        Protected
                                    </Badge>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <span className="text-gray-600 font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-solar" /> Total Coverage Valid Until
                                        </span>
                                        <span className="font-extrabold text-solar tracking-wide">
                                            {farthestEndDate ? farthestEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </span>
                                    </div>
                                    {activeSubscription && (
                                        <div className="flex items-center justify-between text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <span className="text-gray-600 font-medium flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Visits Remaining
                                            </span>
                                            <span className="font-bold text-gray-900 tracking-wide">
                                                {(activeSubscription.services_total || 4) - (activeSubscription.services_used || 0)} / {activeSubscription.services_total || 4}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-solar hover:bg-solar-dark text-white font-bold py-3 rounded-xl shadow-md gap-2"
                                        onClick={() => setView('shop')}
                                    >
                                        <PlusCircle className="w-4 h-4" /> Extend AMC / Add Next Plan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Jio-Style Active & Queued Plans Timeline List */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Active & Queued AMC Plans</h3>
                                <span className="text-xs font-bold text-solar">
                                    {allSubscriptions.length} {allSubscriptions.length === 1 ? 'Plan' : 'Plans'} Total
                                </span>
                            </div>

                            <div className="space-y-3">
                                {allSubscriptions.map((sub, idx) => {
                                    const startDate = new Date(sub.start_date || sub.created_at);
                                    const endDate = new Date(sub.end_date);
                                    const now = new Date();

                                    const isCurrentlyRunning = startDate <= now && endDate >= now;
                                    const isQueuedFuture = startDate > now;

                                    return (
                                        <div key={sub.id || idx} className={`p-4 rounded-xl border transition-all ${isCurrentlyRunning ? 'bg-emerald-50/50 border-emerald-300 shadow-sm' : isQueuedFuture ? 'bg-amber-50/50 border-amber-300 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-extrabold text-gray-900 text-sm">{sub.amc_plans?.name || 'Solar Care Plan'}</h4>
                                                        {isCurrentlyRunning && (
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider shadow-sm">
                                                                ACTIVE NOW
                                                            </span>
                                                        )}
                                                        {isQueuedFuture && (
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> QUEUED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Ref: {sub.payment_reference || 'MANUAL_ACTIVATION'}</p>
                                                </div>
                                                <span className="text-xs font-extrabold text-gray-900">
                                                    {sub.amc_plans?.price ? `₹${sub.amc_plans.price.toLocaleString()}` : ''}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs font-medium text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-solar" />
                                                    <span>
                                                        {startDate.toLocaleDateString()} &rarr; <span className="font-extrabold text-gray-900">{endDate.toLocaleDateString()}</span>
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-500">
                                                    {isQueuedFuture ? `Activates on ${startDate.toLocaleDateString()}` : `Expires on ${endDate.toLocaleDateString()}`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}

                {/* --- 2. SHOP VIEW (Select & Buy Plan) --- */}
                {(view === 'shop' || allSubscriptions.length === 0) && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 uppercase">Choose Solar Care AMC Plan</h2>
                                {farthestEndDate && <p className="text-xs text-solar font-bold mt-0.5">✨ New plan will queue & extend after your current AMC ends on {farthestEndDate.toLocaleDateString()}</p>}
                            </div>
                            {allSubscriptions.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="text-gray-500">Back</Button>
                            )}
                        </div>

                        {/* AI Recommendation Card */}
                        {recommendation && (
                            <div className="bg-gradient-to-r from-solar/90 to-solar-dark rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                                            <Sparkles className="w-3 h-3 mr-1" /> AI Recommended
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">
                                        {recommendation.tier} Plan is Best for Your System
                                    </h3>
                                    <p className="text-white/90 text-xs mb-3">
                                        {recommendation.message}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {plans.map((plan) => {
                                const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                                const benefits = typeof plan.benefits === 'string' ? JSON.parse(plan.benefits) : plan.benefits;

                                return (
                                    <Card key={plan.id} className="bg-white border border-gray-200 hover:border-solar/40 transition-all shadow-sm">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg font-black text-gray-900">{plan.name}</CardTitle>
                                                    <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">{plan.duration_months} Months Total Coverage</p>
                                                </div>
                                                <Badge className="text-base px-3 py-1 bg-solar text-white font-black shadow-sm">
                                                    ₹{plan.price.toLocaleString()}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    {features.map((f, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-solar shrink-0" /> {f}
                                                        </div>
                                                    ))}
                                                </div>

                                                {benefits && (
                                                    <div className="pt-2 border-t border-gray-100 space-y-1">
                                                        <p className="text-[10px] font-bold text-solar uppercase">Included Perks</p>
                                                        {benefits.map((b, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                                                <ShoppingBag className="w-3 h-3 text-solar shrink-0" /> {b}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <Button
                                                    className="w-full mt-3 font-bold bg-solar hover:bg-solar-dark text-white h-11 shadow-md gap-2"
                                                    onClick={() => openPaymentModal(plan)}
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    Buy & Queue Plan (₹{plan.price.toLocaleString()})
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- 3. DUMMY PAYMENT GATEWAY MODAL --- */}
                {purchasingPlan && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <div>
                                    <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-emerald-500" />
                                        Secure Dummy Payment Gateway
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Automated Plan Queueing & Date Extension</p>
                                </div>
                                <button onClick={() => setPurchasingPlan(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                            </div>

                            {/* Plan Summary Box */}
                            <div className="bg-solar-light/40 border border-solar/20 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{purchasingPlan.name}</p>
                                    <p className="text-xs text-gray-500">{purchasingPlan.duration_months} Months Coverage</p>
                                </div>
                                <span className="text-xl font-black text-solar">₹{purchasingPlan.price.toLocaleString()}</span>
                            </div>

                            {/* Payment Options Tabs */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold uppercase text-gray-600">Select Payment Method</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('upi')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${paymentMethod === 'upi' ? 'border-solar bg-solar/10 text-solar' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        <Smartphone className="w-5 h-5" /> UPI / QR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${paymentMethod === 'card' ? 'border-solar bg-solar/10 text-solar' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        <CreditCard className="w-5 h-5" /> Card
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('netbanking')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${paymentMethod === 'netbanking' ? 'border-solar bg-solar/10 text-solar' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        <Building className="w-5 h-5" /> Net Banking
                                    </button>
                                </div>

                                {paymentMethod === 'upi' && (
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">UPI VPA Address</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-mono"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                        />
                                    </div>
                                )}

                                {paymentMethod === 'card' && (
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                                        <input type="text" placeholder="Card Number (4000 1234 5678 9010)" className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg outline-none font-mono" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="MM/YY" className="p-2.5 text-sm bg-white border border-gray-200 rounded-lg outline-none font-mono" />
                                            <input type="password" placeholder="CVV" maxLength={3} className="p-2.5 text-sm bg-white border border-gray-200 rounded-lg outline-none font-mono" />
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'netbanking' && (
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <select className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg outline-none">
                                            <option>HDFC Bank</option>
                                            <option>State Bank of India (SBI)</option>
                                            <option>ICICI Bank</option>
                                            <option>Axis Bank</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 shadow-lg gap-2 text-base"
                                onClick={handleConfirmPayment}
                                disabled={isProcessingPayment}
                            >
                                {isProcessingPayment ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing Dummy Payment...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Pay ₹{purchasingPlan.price.toLocaleString()} & Activate AMC
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
