import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Calendar, CheckCircle2, FileText, History, ArrowRight, AlertCircle, ShoppingBag, Sparkles, Lightbulb } from 'lucide-react';
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
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard' or 'shop'

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

            // 2. Fetch User's Active Subscription
            const { data: subData, error: subError } = await supabase
                .from('amc_subscriptions')
                .select('*, amc_plans(*)')
                .eq('user_id', user.id)
                .in('status', ['active', 'pending_payment'])
                .order('created_at', { ascending: false })
                .maybeSingle();

            if (subError) throw subError;

            setActiveSubscription(subData);
            if (!subData) {
                setView('shop');
                // Only fetch system for recommendation if in Shop mode (no active plan)
                fetchSystemAndRecommend(plansData);
            } else {
                setView('dashboard');
            }

        } catch (error) {
            console.error('Error fetching AMC data:', error);
            // toast.error('Failed to load AMC data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemAndRecommend = async (availablePlans) => {
        // Fetch System Data
        const { data: system } = await supabase
            .from('solar_systems')
            .select('*')
            .eq('customer_id', user.id)
            .single();

        if (system) {
            setUserSystem(system);
            const rec = solarRecommendationEngine.recommend(system, availablePlans);
            setRecommendation(rec);
            if (rec) setSelectedPlanId(rec.recommendedPlanId);
        }
    };

    const handleBuyPlan = async (plan) => {
        try {
            const { error } = await supabase
                .from('amc_subscriptions')
                .insert({
                    user_id: user.id,
                    plan_id: plan.id,
                    status: 'pending_payment',
                    services_total: JSON.parse(plan.features).length // Rough estimate or specific logic
                });

            if (error) throw error;

            toast.success(t('amc_request_submitted') || 'Request Submitted! Waiting for approval.');
            fetchAMCData(); // Refresh to see pending state
        } catch (error) {
            console.error('Error buying plan:', error);
            toast.error('Failed to submit request');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading AMC Data...</div>;

    return (
        <div className="space-y-6 pb-20 bg-gray-50 min-h-screen">
            <Header title={t('amc_title')} />

            <div className="px-4 space-y-6">

                {/* --- 1. DASHBOARD VIEW (Active/Pending Subscription) --- */}
                {view === 'dashboard' && activeSubscription && (
                    <>
                        {/* AMC Status Card */}
                        <Card className={`overflow-hidden relative border border-gray-200 ${activeSubscription.status === 'active' ? 'bg-gray-50 shadow-md shadow-solar/10' : 'bg-white'}`}>
                            {/*  Background decorative user provided style */}
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <ShieldCheck className="h-40 w-40 text-solar" />
                            </div>

                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Annual Maintenance Contract</p>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-wide">{activeSubscription.amc_plans?.name}</h2>
                                    </div>
                                    <Badge variant={activeSubscription.status === 'active' ? 'success' : 'outline'} className={`px-3 py-1 ${activeSubscription.status !== 'active' ? 'text-gray-600 border-gray-300' : ''}`}>
                                        {activeSubscription.status === 'active' ? 'Active' : 'Pending Approval'}
                                    </Badge>
                                </div>

                                {activeSubscription.status === 'active' ? (
                                    <>
                                        <div className="space-y-4 mb-6">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 font-medium flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" /> {t('amc_valid_until')}
                                                </span>
                                                <span className="font-bold text-gray-900 tracking-wide">
                                                    {new Date(activeSubscription.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 font-medium flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" /> {t('amc_services_left')}
                                                </span>
                                                <span className="font-bold text-gray-900 tracking-wide">
                                                    {activeSubscription.services_total - activeSubscription.services_used} / {activeSubscription.services_total}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-solar hover:bg-solar-dark text-white font-bold py-6 rounded-xl shadow-md shadow-solar/10 tracking-wide"
                                            onClick={() => setView('shop')}
                                        >
                                            {t('amc_renew')}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="py-4">
                                        <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-400" />
                                            Admin verification in progress.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Warranty Details */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{t('warranty_details')}</h3>
                            <div className="space-y-3">
                                {[
                                    { item: 'Solar Panels', years: '25 Years', end: '2049' },
                                    { item: 'Inverter', years: '10 Years', end: '2034' },
                                    { item: 'Structure', years: '5 Years', end: '2029' },
                                ].map((w, i) => (
                                    <Card key={i} className="bg-white border border-gray-200 hover:border-gray-300 transition-all">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-solar">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm tracking-wide">{w.item}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{w.years} Warranty</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Expires</p>
                                                <p className="text-sm font-bold text-gray-900">{w.end}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* History */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{t('history')}</h3>
                            <Card className="bg-white border border-gray-200">
                                <CardContent className="p-0 divide-y divide-white/5">
                                    <div className="p-8 text-center text-gray-400 text-sm font-medium tracking-wide">
                                        No previous history found.
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </>
                )}

                {/* --- 2. SHOP VIEW (Select Plan) --- */}
                {view === 'shop' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 tracking-wide uppercase">Select a Plan</h2>
                            {activeSubscription && (
                                <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="text-gray-500 hover:text-gray-900">Cancel</Button>
                            )}
                        </div>

                        {/* AI Recommendation Card */}
                        {recommendation && (
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-gray-900 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <Sparkles className="h-32 w-32 animate-pulse" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-white/20 text-gray-900 border-0 backdrop-blur-sm">
                                            <Sparkles className="w-3 h-3 mr-1" /> AI Recommended
                                        </Badge>
                                        <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider">
                                            {recommendation.section}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold mb-1">
                                        {recommendation.tier} Plan is Best for You
                                    </h3>
                                    <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                                        {recommendation.message} {recommendation.reasoning}
                                    </p>

                                    <div className="grid grid-cols-1 gap-2">
                                        {recommendation.highlights.map((h, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-indigo-50">
                                                <CheckCircle2 className="w-3 h-3 text-green-300" /> {h}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {plans.map((plan) => {
                                const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                                const benefits = typeof plan.benefits === 'string' ? JSON.parse(plan.benefits) : plan.benefits;
                                const isSelected = selectedPlanId === plan.id;
                                const isRecommended = recommendation?.recommendedPlanId === plan.id;

                                return (
                                    <Card
                                        key={plan.id}
                                        className={`cursor-pointer transition-all duration-300 relative bg-white ${isSelected ? 'ring-2 ring-solar border-solar shadow-md shadow-solar/10 bg-gray-50' : 'border-gray-200 hover:border-solar/50'} ${isRecommended ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : ''}`}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                    >
                                        {isRecommended && (
                                            <div className="absolute top-0 right-0 bg-indigo-600 text-gray-900 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl z-10 shadow-md tracking-wider">
                                                Recommended
                                            </div>
                                        )}

                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-xl font-black text-gray-900 tracking-wide">{plan.name}</CardTitle>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{plan.duration_months} Months Coverage</p>
                                                </div>
                                                <Badge variant="secondary" className="text-lg px-3 py-1 bg-solar text-white font-black shadow-md shadow-solar/10">
                                                    ₹{plan.price.toLocaleString()}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Services Included</p>
                                                    {features.map((f, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                                            <CheckCircle2 className="w-4 h-4 text-solar shrink-0" /> {f}
                                                        </div>
                                                    ))}
                                                </div>

                                                {benefits && benefits.length > 0 && (
                                                    <div className="space-y-2 pt-3 border-t border-dashed border-gray-200">
                                                        <p className="text-[10px] font-bold text-solar uppercase tracking-wider">Extra Benefits</p>
                                                        {benefits.map((b, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                                                <ShoppingBag className="w-3 h-3 text-solar shrink-0" /> {b}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <Button
                                                    className={`w-full mt-4 font-bold text-[15px] h-12 transition-all ${isSelected ? 'bg-solar hover:bg-solar-dark text-white shadow-md shadow-solar/10' : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'} ${isRecommended && !isSelected ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBuyPlan(plan);
                                                    }}
                                                >
                                                    {isSelected ? 'Buy Now' : isRecommended ? 'Select Recommended Plan' : 'Select Plan'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
