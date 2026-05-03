import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // [NEW]
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
    const { t } = useTranslation(); // [NEW]
    const { signOut } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('tickets');

    // Data States
    const [tickets, setTickets] = useState([]);
    const [pendingCustomers, setPendingCustomers] = useState([]);
    const [activeCustomers, setActiveCustomers] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]); // [NEW] For Role Management
    const [technicians, setTechnicians] = useState([]);
    const [amcRequests, setAmcRequests] = useState([]); // [FIX] Added missing state
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
            // [MODIFIED] Fetch ALL profiles for Role Management
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            setAllProfiles(profilesData || []);
            setTechnicians(profilesData?.filter(p => p.role === 'technician') || []);

            // 4. Fetch AMC Requests
            const { data: amcData } = await supabase
                .from('amc_subscriptions')
                .select('*, profiles(name, phone), amc_plans(*)')
                .eq('status', 'pending_payment')
                .order('created_at', { ascending: false });
            setAmcRequests(amcData || []);

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

    const handleUpdateRole = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            toast.success(`Role updated to ${newRole}`);
            fetchData();
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('Failed to update role');
        }
    };

    return (
        <div className="space-y-6 pb-20 bg-gray-50 min-h-screen">
            <Header
                title={t('admin_panel')}
                rightAction={<Button variant="ghost" size="sm" onClick={signOut} className="text-red-500">{t('logout')}</Button>}
            />

            <div className="px-4 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="bg-blue-500/10 border-blue-500/20 shadow-none hover:shadow-sm transition-all">
                        <CardContent className="p-4 text-center space-y-0.5">
                            <div className="text-3xl font-extrabold text-blue-400">{stats.total}</div>
                            <div className="text-[10px] text-blue-400/80 font-bold uppercase tracking-wider">{t('total_tickets')}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-500/10 border-whitember-500/20 shadow-none hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all">
                        <CardContent className="p-4 text-center space-y-0.5">
                            <div className="text-3xl font-extrabold text-amber-400">{pendingCustomers.length}</div>
                            <div className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">{t('pending_verifications')}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all">
                        <CardContent className="p-4 text-center space-y-0.5">
                            <div className="text-3xl font-extrabold text-emerald-400">{activeCustomers.length}</div>
                            <div className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">{t('active_customers')}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-500/10 border-purple-500/20 shadow-none hover:shadow-sm transition-all">
                        <CardContent className="p-4 text-center space-y-0.5">
                            <div className="text-3xl font-extrabold text-purple-400">{amcRequests.length}</div>
                            <div className="text-[10px] text-purple-400/80 font-bold uppercase tracking-wider">AMC Requests</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-gray-50 border border-gray-200 rounded-2xl overflow-x-auto hide-scrollbar">
                    {['tickets', 'amc', 'verification', 'customers', 'users'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 min-w-[100px] py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-solar text-white shadow-md shadow-solar/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            {tab === 'verification' && pendingCustomers.length > 0 && (
                                <span className="mr-1 inline-block w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]"></span>
                            )}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[300px]">
                    {activeTab === 'tickets' && (
                        <div className="space-y-4">
                            {tickets.length === 0 ? <p className="text-center text-gray-500 py-10 tracking-wide">{t('no_active_tickets')}</p> : tickets.map((ticket) => (
                                <Card key={ticket.id} className="bg-white border border-gray-200 hover:shadow-md shadow-solar/10 hover:border-solar/30 transition-all">
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-extrabold text-gray-900 capitalize flex items-center gap-2 text-lg">
                                                    {ticket.issue_type.replaceAll('_', ' ').toUpperCase()}
                                                </h3>
                                                <p className="text-sm font-medium text-gray-500 mt-1">{ticket.profiles?.name} • <span className="font-bold text-gray-900">{ticket.solar_systems?.capacity_kw}kW</span></p>
                                            </div>
                                            <Badge variant={ticket.status === 'raised' ? 'destructive' : 'default'} className="font-bold uppercase tracking-wider shadow-sm">{ticket.status.replaceAll('_', ' ').toUpperCase()}</Badge>
                                        </div>

                                        {ticket.booking_date && (
                                            <div className="bg-blue-500/20 text-blue-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-medium">
                                                <Clock className="w-4 h-4" />
                                                {t('booking')}: {new Date(ticket.booking_date).toLocaleString()}
                                            </div>
                                        )}

                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">{ticket.description}</p>

                                        {/* Questionnaire Answers Preview */}
                                        {ticket.service_metadata && Object.keys(ticket.service_metadata).length > 0 && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                <p className="font-semibold mb-1 text-gray-600">{t('details')}:</p>
                                                <ul className="list-disc pl-4 space-y-0.5">
                                                    {Object.entries(ticket.service_metadata).map(([key, value]) => (
                                                        <li key={key}>
                                                            <span className="font-bold uppercase tracking-wider">{key.replaceAll('_', ' ').toUpperCase()}: </span>
                                                            {typeof value === 'object' && value !== null ? (
                                                                <div className="pl-2 mt-1 border-l-2 border-gray-300">
                                                                    {Object.entries(value).map(([subKey, subValue]) => (
                                                                        <div key={subKey} className="text-gray-600">
                                                                            <span className="font-medium text-[10px] tracking-wider uppercase text-gray-500">{subKey}:</span> {String(subValue)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span>{String(value)}</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Media Section */}
                                        {(ticket.voice_note_url || (ticket.photos && ticket.photos.length > 0)) && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attached Media</h4>

                                                {/* Voice Note */}
                                                {ticket.voice_note_url && (
                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 mb-2">
                                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1 font-bold uppercase tracking-wider">🎤 Voice Note</p>
                                                        <audio controls src={ticket.voice_note_url} className="w-full h-8 outline-none filter invert contrast-150 grayscale" />
                                                    </div>
                                                )}

                                                {/* Photos Grid */}
                                                {ticket.photos && ticket.photos.length > 0 && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {ticket.photos.map((photo, index) => {
                                                            const url = typeof photo === 'string' ? photo : photo.url;
                                                            const isTechnician = typeof photo === 'object' && photo.type === 'completion_proof';
                                                            return (
                                                                <a key={index} href={url} target="_blank" rel="noreferrer" className="block relative group">
                                                                    <img
                                                                        src={url}
                                                                        alt={`Evidence ${index + 1}`}
                                                                        className={`w-full h-20 object-cover rounded-md border ${isTechnician ? 'border-green-400' : 'border-gray-200'}`}
                                                                    />
                                                                    {isTechnician && (
                                                                        <span className="absolute top-1 right-1 bg-green-500 text-gray-900 text-[8px] px-1 rounded shadow-sm">TECH</span>
                                                                    )}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-200">
                                            <select
                                                className="flex-1 text-sm border border-gray-200 rounded-lg py-2 px-3 bg-gray-50 text-gray-900 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all"
                                                value={ticket.assigned_technician_id || ''}
                                                onChange={(e) => handleAssignTechnician(ticket.id, e.target.value)}
                                                disabled={['closed', 'completed'].includes(ticket.status)}
                                            >
                                                <option value="">{t('assign_technician')}...</option>
                                                {technicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                                                ))}
                                            </select>
                                            {ticket.status === 'completed' && (
                                                <Button size="sm" className="bg-solar text-white hover:bg-solar-dark shadow-md shadow-solar/10" onClick={() => handleCloseTicket(ticket.id)}>
                                                    {t('close_ticket')}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'amc' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                AMC Requests ({amcRequests.length})
                            </h3>
                            {amcRequests.length === 0 ? <p className="text-gray-500 text-sm tracking-wide">No pending AMC requests.</p> : amcRequests.map(req => (
                                <div key={req.id} className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-500/50 transition-all">
                                    <div>
                                        <p className="font-bold text-lg text-gray-900">{req.amc_plans?.name}</p>
                                        <p className="text-sm text-gray-600 font-medium mt-1">for <span className="font-bold text-gray-900">{req.profiles?.name}</span> ({req.profiles?.phone})</p>
                                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <Button onClick={() => handleApproveAMC(req.id, req.amc_plans?.duration_months)} className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-gray-900 gap-2 shadow-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        Approve & Activate
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'verification' && (
                        <div className="space-y-6">
                            <Card className="bg-white border-l-4 border-l-solar border-y-white/10 border-r-white/10 shadow-md shadow-solar/10">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-solar" />
                                        {t('pre_register_customer')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handlePreRegister} className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input required placeholder="Full Name" className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-white/30 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                                            <input required type="email" placeholder="Email" className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-white/30 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                                            <input required placeholder="Phone" className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-white/30 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                            <input required placeholder="Capacity (kW)" type="number" step="0.1" className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-white/30 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all" value={newCustomer.capacity} onChange={e => setNewCustomer({ ...newCustomer, capacity: e.target.value })} />
                                        </div>
                                        <input required placeholder="Address" className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-white/30 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                                        <Button type="submit" className="w-full bg-solar text-white shadow-md shadow-solar/10 hover:bg-solar-dark" disabled={isSubmitting}>
                                            {isSubmitting ? 'Registering...' : 'Pre-Register Customer'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-orange-400" />
                                    Pending Verification ({pendingCustomers.length})
                                </h3>
                                {pendingCustomers.length === 0 ? <p className="text-gray-500 text-sm tracking-wide">No pending customers.</p> : pendingCustomers.map(cust => (
                                    <div key={cust.id} className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-orange-500/50 transition-all">
                                        <div>
                                            <p className="font-bold text-lg text-gray-900">{cust.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">{cust.email} • {cust.phone}</p>
                                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Pre-registered on {new Date(cust.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Button onClick={() => handleVerifyCustomer(cust.id)} className="w-full md:w-auto bg-solar hover:bg-solar-dark text-white shadow-md shadow-solar/10 gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            {t('verify_activate')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-900 uppercase tracking-wider">Active Customers ({activeCustomers.length})</h3>
                            {activeCustomers.map(cust => (
                                <div key={cust.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center hover:border-gray-300 transition-all">
                                    <div>
                                        <p className="font-bold text-gray-900 tracking-wide">{cust.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{cust.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{cust.system_capacity_kw} kW</p>
                                        <Badge variant="outline" className="text-solar border-solar/30 bg-solar-light shadow-md shadow-solar/10 mt-1">Verified</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 uppercase tracking-wider">{t('user_management')}</h3>
                            <div className="space-y-3">
                                {allProfiles.map(profile => (
                                    <div key={profile.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-3 hover:border-gray-300 transition-all">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 tracking-wide">{profile.name || 'Unknown Name'}</p>
                                                <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">{profile.role}</Badge>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{profile.email || 'No Email (Check Auth)'} • {profile.phone || 'No Phone'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="text-sm border border-gray-200 rounded-lg p-2 bg-gray-50 text-gray-900 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all"
                                                value={profile.role}
                                                onChange={(e) => handleUpdateRole(profile.id, e.target.value)}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="technician">Technician</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
