import { ShieldCheck, Calendar, CheckCircle2, FileText, History } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';

export default function AMC() {
    return (
        <div className="space-y-6 pb-6">
            <Header title="AMC & Warranty" />

            <div className="px-4 space-y-6">
                {/* AMC Status Card */}
                <Card className="bg-gradient-to-br from-solar-light to-white border-solar/30 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldCheck className="h-32 w-32" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Annual Maintenance Contract</p>
                                <h2 className="text-2xl font-bold text-gray-900">Gold Plan</h2>
                            </div>
                            <Badge variant="success" className="px-3 py-1">Active</Badge>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Valid Until</span>
                                <span className="font-semibold text-gray-900">15 Aug 2026</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Services Left</span>
                                <span className="font-semibold text-gray-900">2 / 4</span>
                            </div>
                        </div>

                        <Button className="w-full bg-solar-dark hover:bg-yellow-700 border-none shadow-none">
                            Renew AMC
                        </Button>
                    </CardContent>
                </Card>

                {/* Warranty Details */}
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Warranty Details</h3>
                    <div className="space-y-3">
                        {[
                            { item: 'Solar Panels', years: '25 Years', end: '2049' },
                            { item: 'Inverter', years: '10 Years', end: '2034' },
                            { item: 'Structure', years: '5 Years', end: '2029' },
                        ].map((w, i) => (
                            <Card key={i}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
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
                    <h3 className="text-lg font-bold text-gray-900 mb-4">History</h3>
                    <Card>
                        <CardContent className="p-0 divide-y divide-gray-100">
                            {[1, 2].map((_, i) => (
                                <div key={i} className="p-4 flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                        <History className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">AMC Renewal</p>
                                        <p className="text-xs text-gray-500">Aug 15, 2025 • ₹ 4,999</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-solar h-8 px-2">Invoice</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
