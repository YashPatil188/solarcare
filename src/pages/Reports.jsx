import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, Upload, Leaf, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { cn } from '../lib/utils';

const data = [
    { name: 'Mon', kwh: 24 },
    { name: 'Tue', kwh: 18 },
    { name: 'Wed', kwh: 32 },
    { name: 'Thu', kwh: 28 },
    { name: 'Fri', kwh: 35 },
    { name: 'Sat', kwh: 42 },
    { name: 'Sun', kwh: 38 },
];

const ranges = ['Day', 'Week', 'Month', 'Year'];

export default function Reports() {
    const [activeRange, setActiveRange] = useState('Week');

    return (
        <div className="space-y-6 pb-6">
            <Header title="Reports" rightAction={<Button variant="ghost" size="icon"><Download className="h-5 w-5 text-gray-500" /></Button>} />

            <div className="px-4 space-y-6">
                {/* Time Range Toggle */}
                <div className="bg-gray-100 p-1 rounded-xl flex">
                    {ranges.map((range) => (
                        <button
                            key={range}
                            onClick={() => setActiveRange(range)}
                            className={cn(
                                "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
                                activeRange === range ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                {/* Chart Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="mb-6">
                            <p className="text-sm text-gray-500">Total Generation ({activeRange})</p>
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                217.5 <span className="text-base font-medium text-gray-500">kWh</span>
                            </h3>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar
                                        dataKey="kwh"
                                        fill="#F4B400"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Impact Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2 text-green-700">
                                <Leaf className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">CO₂ Saved</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">128 kg</p>
                            <p className="text-xs text-green-600 mt-1">Equivalent to 6 trees</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-solar-light border-solar/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2 text-solar-dark">
                                <IndianRupee className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Saved</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">₹ 1,850</p>
                            <p className="text-xs text-solar-dark mt-1">This week</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
