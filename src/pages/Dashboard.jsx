import { Zap, Sun, Battery, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';

export default function Dashboard() {
    return (
        <div className="space-y-6 pb-6 bg-gray-50 min-h-screen">
            <Header
                title="Dashboard"
                rightAction={<div className="h-10 w-10 rounded-full bg-gray-50 border-2 border-[#1a1a1a] overflow-hidden shadow-md shadow-solar/10"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="" /></div>}
            />

            <div className="px-4 space-y-6">
                {/* System Status Card */}
                <Card className="bg-gray-50 border-[#1a1a1a] shadow-md shadow-solar/10 overflow-hidden relative">
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-3 w-3 rounded-full bg-solar shadow-md shadow-solar/10 animate-pulse" />
                                <span className="font-bold text-solar tracking-wide uppercase text-xs">System Healthy</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Last updated: Just now</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-solar-light flex items-center justify-center text-solar shadow-md shadow-solar/10">
                            <Zap className="h-6 w-6 fill-current drop-shadow-md shadow-solar/10" />
                        </div>
                    </CardContent>
                </Card>

                {/* Real-time Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-white border-gray-200 hover:border-solar/30 transition-all hover:shadow-md shadow-solar/10">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="h-10 w-10 rounded-xl bg-solar-light flex items-center justify-center text-solar mb-3 shadow-md shadow-solar/10 border border-solar/20">
                                <Sun className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-black text-gray-900 tracking-wide">4.2 kW</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Current Output</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-gray-200 hover:border-blue-500/30 transition-all hover:shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 shadow-sm border border-blue-500/20">
                                <Zap className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-black text-gray-900 tracking-wide">23.5 kWh</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Today's Generation</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Extended Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-white border-gray-200 hover:border-gray-300 transition-all">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">This Month</p>
                            <p className="text-lg font-bold text-gray-900 tracking-wide">450 kWh</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-gray-200 hover:border-gray-300 transition-all">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lifetime</p>
                            <p className="text-lg font-bold text-gray-900 tracking-wide">12.5 MWh</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Battery Status */}
                <Card className="bg-white border-gray-200 hover:border-purple-500/30 transition-all hover:shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-sm">
                            <Battery className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Battery Level</span>
                                <span className="text-sm font-black text-gray-900">85%</span>
                            </div>
                            <div className="h-2 bg-gray-50 border border-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-[85%] shadow-sm" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* AMC Status Summary */}
                <Card className="bg-white border-gray-200">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">AMC Status</p>
                            <p className="text-sm font-bold text-gray-900 tracking-wide">Expires in 45 days</p>
                        </div>
                        <Badge variant="success" className="shadow-md shadow-solar/10 uppercase tracking-wider text-[10px]">Active</Badge>
                    </CardContent>
                </Card>

                {/* CTA */}
                <Button className="w-full h-14 text-[15px] font-bold bg-solar hover:bg-solar-dark text-white shadow-md shadow-solar/10 transition-all">
                    Raise Service Request
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
