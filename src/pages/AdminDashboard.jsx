import { useState, useEffect } from 'react';
import { Users, ClipboardList, CheckCircle, Clock, UserPlus, Search, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { customerService } from '../services/customerService';
import { ticketService } from '../services/ticketService';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
    const { signOut } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('tickets');

    // Data States
    const [tickets, setTickets] = useState([]);
    const [pendingCustomers, setPendingCustomers] = useState([]);
    const [activeCustomers, setActiveCustomers] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

    // New Customer Form State
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', capacity: '', address: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            // 1. Fetch Tickets via Service
            const ticketsData = await ticketService.getTickets(null, 'admin');
            setTickets(ticketsData || []);

            // 2. Fetch Customers via Service
            const allCustomers = await customerService.getCustomers('all');
            setPendingCustomers(allCustomers.filter(c => c.status === 'pre_registered'));
            setActiveCustomers(allCustomers.filter(c => c.status === 'verified' || c.status === 'active'));

            // 3. Fetch Technicians direct (or we could make a profileService)
            const { data: techsData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'technician');
            setTechnicians(techsData || []);

            // 4. Calculate Stats
            const total = ticketsData?.length || 0;
            const active = ticketsData?.filter(t => !['closed', 'completed'].includes(t.status)).length || 0;
            const completed = ticketsData?.filter(t => ['closed', 'completed'].includes(t.status)).length || 0;
            setStats({ total, active, completed });

        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }

    const handleAssignTechnician = async (ticketId, technicianId) => {
        try {
            await ticketService.updateTicket(ticketId, {
                assigned_technician_id: technicianId,
                status: 'assigned'
            });
            fetchData();
            toast.success('Technician assigned successfully');
        } catch (error) {
            toast.error('Failed to assign technician');
        }
    };

    const handleCloseTicket = async (ticketId) => {
        if (!window.confirm('Are you sure you want to close this ticket?')) return;
        try {
            await ticketService.updateTicket(ticketId, { status: 'closed' });
            fetchData();
            toast.success('Ticket closed');
        } catch (error) {
            console.error('Error closing ticket:', error);
            toast.error('Failed to close ticket');
        }
    };

    const handlePreRegister = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await customerService.addCustomer({
                name: newCustomer.name,
                email: newCustomer.email,
                phone: newCustomer.phone,
                address: newCustomer.address,
                system_capacity_kw: newCustomer.capacity,
                installation_date: new Date().toISOString(),
                amc_status: 'active',
                amc_valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            });

            setNewCustomer({ name: '', email: '', phone: '', capacity: '', address: '' });
            toast.success('Customer Pre-Registered! Verify them to allow signup.');
            fetchData();
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Failed to add customer. Email must be unique.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyCustomer = async (customerId) => {
        try {
            await customerService.verifyCustomer(customerId);
            toast.success('Customer Verified! They can now sign up.');
            fetchData();
        } catch (error) {
            toast.error('Failed to verify customer');
        }
    };

    return (
        <div className="space-y-6 pb-20 bg-gray-50 min-h-screen">
            <Header
                title="Admin Panel"
                rightAction={<Button variant="ghost" size="sm" onClick={signOut} className="text-red-500">Log Out</Button>}
            />

            <div className="px-4 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-3 text-center">
                            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                            <div className="text-[10px] text-blue-600 font-medium">Total Tickets</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-100">
                        <CardContent className="p-3 text-center">
                            <div className="text-2xl font-bold text-yellow-700">{pendingCustomers.length}</div>
                            <div className="text-[10px] text-yellow-600 font-medium">Pending Verifications</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-3 text-center">
                            <div className="text-2xl font-bold text-green-700">{activeCustomers.length}</div>
                            <div className="text-[10px] text-green-600 font-medium">Active Customers</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-200 rounded-lg">
                    {['tickets', 'verification', 'customers'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${activeTab === tab ? 'bg-white shadow-sm text-solar-dark' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab === 'verification' && pendingCustomers.length > 0 && (
                                <span className="mr-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[300px]">
                    {activeTab === 'tickets' && (
                        <div className="space-y-4">
                            {tickets.length === 0 ? <p className="text-center text-gray-500 py-10">No active tickets.</p> : tickets.map((ticket) => (
                                <Card key={ticket.id} className="border border-gray-100">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 capitalize flex items-center gap-2">
                                                    {ticket.issue_type.replace('_', ' ')}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">{ticket.profiles?.name} • {ticket.solar_systems?.capacity_kw}kW</p>
                                            </div>
                                            <Badge variant={ticket.status === 'raised' ? 'destructive' : 'default'}>{ticket.status.replace('_', ' ')}</Badge>
                                        </div>

                                        {ticket.booking_date && (
                                            <div className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                Booking: {new Date(ticket.booking_date).toLocaleString()}
                                            </div>
                                        )}

                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{ticket.description}</p>

                                        {/* Questionnaire Answers Preview */}
                                        {ticket.service_metadata && Object.keys(ticket.service_metadata).length > 0 && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                <p className="font-semibold mb-1">Details:</p>
                                                <ul className="list-disc pl-4 space-y-0.5">
                                                    {Object.entries(ticket.service_metadata).map(([key, value]) => (
                                                        <li key={key}>{key}: {value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
                                            <select
                                                className="flex-1 text-sm border-gray-200 rounded-md py-1.5 bg-white"
                                                value={ticket.assigned_technician_id || ''}
                                                onChange={(e) => handleAssignTechnician(ticket.id, e.target.value)}
                                                disabled={['closed', 'completed'].includes(ticket.status)}
                                            >
                                                <option value="">Assign Technician...</option>
                                                {technicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                                                ))}
                                            </select>
                                            {ticket.status === 'completed' && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleCloseTicket(ticket.id)}>
                                                    Close Ticket
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'verification' && (
                        <div className="space-y-6">
                            <Card className="border-l-4 border-l-solar">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-solar" />
                                        Pre-Register New Customer
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handlePreRegister} className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input required placeholder="Full Name" className="p-2 text-sm border rounded" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                                            <input required type="email" placeholder="Email" className="p-2 text-sm border rounded" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                                            <input required placeholder="Phone" className="p-2 text-sm border rounded" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                            <input required placeholder="Capacity (kW)" type="number" step="0.1" className="p-2 text-sm border rounded" value={newCustomer.capacity} onChange={e => setNewCustomer({ ...newCustomer, capacity: e.target.value })} />
                                        </div>
                                        <input required placeholder="Address" className="w-full p-2 text-sm border rounded" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                                        <Button type="submit" className="w-full bg-gray-900 text-white" disabled={isSubmitting}>
                                            {isSubmitting ? 'Registering...' : 'Pre-Register Customer'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    Pending Verification ({pendingCustomers.length})
                                </h3>
                                {pendingCustomers.length === 0 ? <p className="text-gray-500 text-sm">No pending customers.</p> : pendingCustomers.map(cust => (
                                    <div key={cust.id} className="bg-white p-4 rounded-lg border border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                                        <div>
                                            <p className="font-bold text-base">{cust.name}</p>
                                            <p className="text-sm text-gray-500">{cust.email} • {cust.phone}</p>
                                            <p className="text-xs text-gray-400 mt-1">Pre-registered on {new Date(cust.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Button onClick={() => handleVerifyCustomer(cust.id)} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Verify & Activate
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-900">Active Customers ({activeCustomers.length})</h3>
                            {activeCustomers.map(cust => (
                                <div key={cust.id} className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm">{cust.name}</p>
                                        <p className="text-xs text-gray-500">{cust.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">{cust.system_capacity_kw} kW</p>
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Verified</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
