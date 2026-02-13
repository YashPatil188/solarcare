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
                        <Card className={`overflow-hidden relative border-none ${activeSubscription.status === 'active' ? 'bg-gradient-to-br from-[#FFF8E1] to-white' : 'bg-gray-100'}`}>
                            {/*  Background decorative user provided style */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <ShieldCheck className="h-40 w-40 text-solar" />
                            </div>

                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Annual Maintenance Contract</p>
                                        <h2 className="text-2xl font-bold text-gray-900">{activeSubscription.amc_plans?.name}</h2>
                                    </div>
                                    <Badge variant={activeSubscription.status === 'active' ? 'success' : 'outline'} className="px-3 py-1">
                                        {activeSubscription.status === 'active' ? 'Active' : 'Pending Approval'}
                                    </Badge>
                                </div>

                                {activeSubscription.status === 'active' ? (
                                    <>
                                        <div className="space-y-4 mb-6">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" /> {t('amc_valid_until')}
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    {new Date(activeSubscription.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" /> {t('amc_services_left')}
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    {activeSubscription.services_total - activeSubscription.services_used} / {activeSubscription.services_total}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-solar-dark hover:bg-yellow-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-900/10"
                                            onClick={() => setView('shop')}
                                        >
                                            {t('amc_renew')}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="py-4">
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            Admin verification in progress.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Warranty Details */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('warranty_details')}</h3>
                            <div className="space-y-3">
                                {[
                                    { item: 'Solar Panels', years: '25 Years', end: '2049' },
                                    { item: 'Inverter', years: '10 Years', end: '2034' },
                                    { item: 'Structure', years: '5 Years', end: '2029' },
                                ].map((w, i) => (
                                    <Card key={i} className="border border-gray-100 shadow-sm">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{w.item}</p>
                                                    <p className="text-xs text-gray-500">{w.years} Warranty</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Expires</p>
                                                <p className="text-sm font-bold text-gray-900">{w.end}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* History */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('history')}</h3>
                            <Card className="border border-gray-100 shadow-sm">
                                <CardContent className="p-0 divide-y divide-gray-100">
                                    <div className="p-8 text-center text-gray-400 text-sm">
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
                            <h2 className="text-xl font-bold text-gray-900">Select a Plan</h2>
                            {activeSubscription && (
                                <Button variant="ghost" size="sm" onClick={() => setView('dashboard')}>Cancel</Button>
                            )}
                        </div>

                        {/* AI Recommendation Card */}
                        {recommendation && (
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <Sparkles className="h-32 w-32 animate-pulse" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
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
                                        className={`cursor-pointer transition-all duration-200 relative ${isSelected ? 'ring-2 ring-solar border-solar bg-orange-50/50' : 'border-gray-200 hover:border-solar/60'} ${isRecommended ? 'border-indigo-300 shadow-md' : ''}`}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                    >
                                        {isRecommended && (
                                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg z-10">
                                                Recommended
                                            </div>
                                        )}

                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg font-bold text-gray-900">{plan.name}</CardTitle>
                                                    <p className="text-sm text-gray-500">{plan.duration_months} Months Coverage</p>
                                                </div>
                                                <Badge variant="secondary" className="text-lg px-3 py-1 bg-gray-900 text-white">
                                                    ₹{plan.price.toLocaleString()}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Services Included</p>
                                                    {features.map((f, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600" /> {f}
                                                        </div>
                                                    ))}
                                                </div>

                                                {benefits && benefits.length > 0 && (
                                                    <div className="space-y-1 pt-2 border-t border-dashed border-gray-200">
                                                        <p className="text-xs font-bold text-solar uppercase tracking-wider">Extra Benefits</p>
                                                        {benefits.map((b, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                                                <ShoppingBag className="w-3 h-3 text-solar" /> {b}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <Button
                                                    className={`w-full mt-4 ${isSelected ? 'bg-solar-dark hover:bg-yellow-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} ${isRecommended && !isSelected ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : ''}`}
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
