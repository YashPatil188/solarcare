import { User, CreditCard, Bell, LogOut, ChevronRight, MapPin, Settings } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';

export default function Account() {
    return (
        <div className="space-y-6 pb-6">
            <Header title="Account" />

            <div className="px-4 space-y-6">
                {/* Profile Card */}
                <div className="flex items-center gap-4 py-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Rahul Sharma</h2>
                        <p className="text-sm text-gray-500">+91 98765 43210</p>
                        <p className="text-xs text-gray-400">ID: SC-8921</p>
                    </div>
                </div>

                {/* Installation Details */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Installation Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                            <div>
                                <p className="text-xs text-gray-500">System Size</p>
                                <p className="text-sm font-semibold text-gray-900">5 kW On-Grid</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Installed On</p>
                                <p className="text-sm font-semibold text-gray-900">Jan 15, 2024</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500">Address</p>
                                <p className="text-sm font-semibold text-gray-900 flex items-start gap-1">
                                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                                    123, Green Park Avenue, New Delhi - 110016
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Menu */}
                <Card className="overflow-hidden">
                    <CardContent className="p-0 divide-y divide-gray-100">
                        {[
                            { icon: CreditCard, label: 'Payment Methods' },
                            { icon: Bell, label: 'Notifications' },
                            { icon: Settings, label: 'App Settings' },
                        ].map((item, i) => (
                            <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <item.icon className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                </Button>
            </div>
        </div>
    );
}
