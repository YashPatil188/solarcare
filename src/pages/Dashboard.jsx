import { Zap, Sun, Battery, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';

export default function Dashboard() {
    return (
        <div className="space-y-6 pb-6">
            <Header
                title="Dashboard"
                rightAction={<div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" /></div>}
            />

            <div className="px-4 space-y-6">
                {/* System Status Card */}
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                <span className="font-semibold text-green-700">System Healthy</span>
                            </div>
                            <p className="text-sm text-gray-500">Last updated: Just now</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Zap className="h-6 w-6 fill-current" />
                        </div>
                    </CardContent>
                </Card>

                {/* Real-time Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="h-10 w-10 rounded-full bg-solar-light flex items-center justify-center text-solar mb-3">
                                <Sun className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">4.2 kW</span>
                            <span className="text-xs text-gray-500">Current Output</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
                                <Zap className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">23.5 kWh</span>
                            <span className="text-xs text-gray-500">Today's Generation</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Extended Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500 mb-1">This Month</p>
                            <p className="text-lg font-bold text-gray-900">450 kWh</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500 mb-1">Lifetime</p>
                            <p className="text-lg font-bold text-gray-900">12.5 MWh</p>
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
                            <p className="text-xs text-gray-500">Expires in 45 days</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                    </CardContent>
                </Card>

                {/* CTA */}
                <Button className="w-full shadow-lg shadow-solar/30" size="lg">
                    Raise Service Request
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
