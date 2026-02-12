import { Wrench, Droplets, Zap, Activity, Clock, Phone, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';

const services = [
    { id: 1, name: 'Site Visit', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 2, name: 'Panel Cleaning', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { id: 3, name: 'Inverter Issue', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 4, name: 'Health Check', icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
];

const tickets = [
    { id: 'TIC-2024-001', service: 'Panel Cleaning', date: 'Yesterday', status: 'In Progress', variant: 'warning' },
    { id: 'TIC-2023-892', service: 'Inverter Check', date: 'Dec 12, 2023', status: 'Completed', variant: 'success' },
];

export default function Services() {
    return (
        <div className="space-y-6 pb-6">
            <Header title="Services" />

            <div className="px-4 space-y-8">
                {/* Request New Service */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Request Service</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {services.map((service) => (
                            <Card key={service.id} className="interactive hover:border-solar hover:shadow-md transition-all cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                    <div className={`h-12 w-12 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <service.icon className="h-6 w-6" />
                                    </div>
                                    <span className="font-medium text-gray-900 text-sm">{service.name}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Emergency Support */}
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-red-700">Emergency Support</h3>
                            <p className="text-xs text-red-600/80">System breakdown? 24x7 Help</p>
                        </div>
                        <Button variant="danger" size="sm" className="shadow-none">
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Tickets */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
                        <Button variant="ghost" size="sm" className="text-solar h-auto p-0">View All</Button>
                    </div>

                    <div className="space-y-3">
                        {tickets.map((ticket) => (
                            <Card key={ticket.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{ticket.service}</p>
                                            <p className="text-xs text-gray-500">{ticket.date} • {ticket.id}</p>
                                        </div>
                                    </div>
                                    <Badge variant={ticket.variant}>{ticket.status}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
