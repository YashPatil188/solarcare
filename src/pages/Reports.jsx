import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // [NEW]
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, Upload, Leaf, IndianRupee, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const ranges = ['Day', 'Week', 'Month'];

export default function Reports() {
    const { t } = useTranslation(); // [NEW]
    const { user } = useAuth();
    const [activeRange, setActiveRange] = useState('Week');
    const [loading, setLoading] = useState(true);
    const [installationDate, setInstallationDate] = useState(new Date());
    const [systemCapacity, setSystemCapacity] = useState(0);

    // Fetch System Data
    useEffect(() => {
        if (!user) return;
        async function fetchSystem() {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from('solar_systems')
                    .select('installation_date, capacity_kw')
                    .eq('customer_id', user.id)
                    .single();

                if (data) {
                    setInstallationDate(new Date(data.installation_date));
                    setSystemCapacity(data.capacity_kw);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchSystem();
    }, [user]);

    // Deterministic Data Generation
    const chartData = useMemo(() => {
        if (!user || !systemCapacity) return [];

        const data = [];
        const today = new Date();
        const seed = user.id.charCodeAt(0); // Simple seed from User ID

        // Helper for randomish but consistent number
        const getGen = (dateStr) => {
            const dateSeed = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const baseGen = systemCapacity * 4.5; // Avg 4.5 units per kW
            const variance = (dateSeed % 20) / 10 - 1; // +/- 1 unit
            return Math.max(0, parseFloat((baseGen + variance).toFixed(1)));
        };

        if (activeRange === 'Day') {
            // Hourly generation for today (simulated bell curve)
            for (let i = 6; i <= 18; i++) {
                let gen = 0;
                if (i >= 7 && i <= 17) {
                    // Peak at 12-1 PM
                    const peak = systemCapacity * 0.8;
                    const dist = Math.abs(12 - i);
                    gen = Math.max(0, peak - (dist * (peak / 6))).toFixed(2);
                }
                data.push({ name: `${i}:00`, kwh: parseFloat(gen) });
            }
        } else if (activeRange === 'Week') {
            // Last 7 Days
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                data.push({
                    name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    kwh: getGen(dateStr),
                    fullDate: dateStr
                });
            }
        } else if (activeRange === 'Month') {
            // Last 30 Days aggregated by weeks or just last 30 days? 
            // Let's do last 4 weeks for cleaner chart
            for (let i = 28; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                data.push({
                    name: d.getDate(),
                    kwh: getGen(dateStr),
                    fullDate: dateStr
                });
            }
        }
        return data;
    }, [activeRange, user, systemCapacity]);

    const stats = useMemo(() => {
        const totalGen = chartData.reduce((acc, curr) => acc + curr.kwh, 0);
        const co2Saved = (totalGen * 0.82).toFixed(1); // 0.82 kg per kWh (approx India grid)
        const moneySaved = (totalGen * 8).toFixed(0); // ₹8 per unit
        return { totalGen: totalGen.toFixed(1), co2Saved, moneySaved };
    }, [chartData]);

    const handleDownload = () => {
        const headers = "Date/Time,Generation (kWh)\n";
        const rows = chartData.map(d => `${d.fullDate || d.name},${d.kwh}`).join("\n");
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `solar_report_${activeRange.toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-solar w-8 h-8" /></div>;

    return (
        <div className="space-y-6 pb-6">
            <Header title={t('reports')} rightAction={<Button variant="ghost" size="icon" className="hover:bg-gray-50" onClick={handleDownload}><Download className="h-5 w-5 text-gray-500" /></Button>} />

            <div className="px-4 space-y-6">
                {/* Time Range Toggle */}
                <div className="bg-gray-50 border border-gray-200 p-1.5 rounded-xl flex">
                    {ranges.map((range) => (
                        <button
                            key={range}
                            onClick={() => setActiveRange(range)}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                activeRange === range ? "bg-solar shadow-md shadow-solar/10 text-white" : "text-gray-400 hover:text-gray-700"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                {/* Chart Card */}
                <Card className="bg-white border-gray-200">
                    <CardContent className="p-6">
                        <div className="mb-6">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{t('total_generation')} ({activeRange})</p>
                            <h3 className="text-3xl font-black text-gray-900 flex items-baseline gap-2 tracking-wide">
                                {stats.totalGen} <span className="text-base font-bold text-gray-500">kWh</span>
                            </h3>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                                        dy={10}
                                        interval={activeRange === 'Month' ? 6 : 0}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a', color: 'white', fontWeight: 'bold' }}
                                    />
                                    <Bar
                                        dataKey="kwh"
                                        fill="#0ce86b"
                                        radius={[4, 4, 0, 0]}
                                        barSize={activeRange === 'Month' ? 6 : 20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Impact Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                <Leaf className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('co2_saved')}</span>
                            </div>
                            <p className="text-xl font-black text-emerald-400 tracking-wide">{stats.co2Saved} kg</p>
                            <p className="text-xs text-emerald-400/70 mt-1 font-medium">~ {Math.ceil(stats.co2Saved / 20)} trees planted</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-solar-light border-solar/20 shadow-none">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2 text-solar">
                                <IndianRupee className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('money_saved')}</span>
                            </div>
                            <p className="text-xl font-black text-solar tracking-wide">₹ {stats.moneySaved}</p>
                            <p className="text-xs text-solar/70 mt-1 font-medium">This {activeRange.toLowerCase()}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
