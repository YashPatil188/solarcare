import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, ClipboardList, CheckCircle, Clock, UserPlus, Search, AlertCircle, FileText, Trash2, Eye, Phone, MapPin, Calendar, ShieldCheck, User, X, Wrench, Crown, Filter, CheckCircle2, MoreVertical, Mail, Upload, Camera, Save, Loader2, Settings, Check, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { TicketTimeline } from '../components/tickets/TicketTimeline';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { customerService } from '../services/customerService';
import { ticketService } from '../services/ticketService';
import { supabase } from '../lib/supabase';
import { cleanPhone } from '../utils/phone';

// Helper for clean uppercase text with no underscores
const cleanText = (str) => {
    if (!str) return '';
    return String(str).replaceAll('_', ' ').toUpperCase();
};

// Helper for Unique IDs across roles
const getUniqueId = (item) => {
    if (!item) return '';
    const rawId = item.id || item.email || '1042';
    const hash = rawId.replaceAll('-', '').slice(0, 4).toUpperCase();
    const role = item.role || 'customer';
    if (role === 'customer') return `CUST-${hash}`;
    if (role === 'technician') return `TECH-${hash}`;
    if (role === 'admin') return `ADM-${hash}`;
    return `ID-${hash}`;
};

const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=TechMaster'
];

export default function AdminDashboard() {
    const { t } = useTranslation();
    const { signOut, user: currentUser, profile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets', 'directory', 'verification'
    const [directoryFilter, setDirectoryFilter] = useState('customers'); // 'customers', 'technicians', 'admins'
    const [ticketFilter, setTicketFilter] = useState('to_assign'); // 'to_assign', 'assigned', 'in_progress', 'resolved', 'all'

    // Data States
    const [tickets, setTickets] = useState([]);
    const [pendingCustomers, setPendingCustomers] = useState([]);
    const [activeCustomers, setActiveCustomers] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [amcRequests, setAmcRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals & Popup States
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);
    const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);
    const [activeMenuUserId, setActiveMenuUserId] = useState(null);
    const [roleModalUser, setRoleModalUser] = useState(null);
    const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);

    // Admin Profile Edit Form State
    const [isSavingAdminProfile, setIsSavingAdminProfile] = useState(false);
    const [isUploadingAdminPhoto, setIsUploadingAdminPhoto] = useState(false);
    const [isEditingAdminProfile, setIsEditingAdminProfile] = useState(false);
    const [adminProfileData, setAdminProfileData] = useState({
        name: '',
        phone: '',
        address: '',
        avatar_url: ''
    });

    // New User Onboarding Form State
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        capacity: '',
        address: '',
        role: 'customer',
        avatar_url: AVATAR_OPTIONS[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    useEffect(() => {
        fetchData();
        if (profile) {
            setAdminProfileData({
                name: profile.name || '',
                phone: profile.phone || '',
                address: profile.address || '',
                avatar_url: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`
            });
        }
    }, [currentUser, profile]);

    async function fetchData() {
        setLoading(true);
        try {
            // 1. Fetch Tickets
            const ticketsData = await ticketService.getTickets(null, 'admin');
            setTickets(ticketsData || []);

            // 2. Fetch Customers
            const allCustomers = await customerService.getCustomers('all');
            setPendingCustomers(allCustomers.filter(c => c.status === 'pre_registered'));
            setActiveCustomers(allCustomers.filter(c => c.status === 'verified' || c.status === 'active'));

            // 3. Fetch Profiles & Technicians
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            // Merge customers_master and profiles into unified Directory list
            const combinedMap = new Map();

            (allCustomers || []).forEach(c => {
                if (c.email) {
                    combinedMap.set(c.email.trim().toLowerCase(), {
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        phone: c.phone,
                        address: c.address,
                        role: c.role || 'customer',
                        system_capacity_kw: c.system_capacity_kw,
                        status: c.status
                    });
                }
            });

            (profilesData || []).forEach(p => {
                const key = p.email ? p.email.trim().toLowerCase() : p.id;
                const existing = combinedMap.get(key) || {};
                combinedMap.set(key, {
                    ...existing,
                    ...p,
                    role: p.role || existing.role || 'customer'
                });
            });

            const mergedProfiles = Array.from(combinedMap.values());
            setAllProfiles(mergedProfiles);
            setTechnicians(mergedProfiles.filter(p => p.role === 'technician'));

            // 4. Fetch AMC Requests
            const { data: amcData } = await supabase
                .from('amc_subscriptions')
                .select('*, profiles(name, phone), amc_plans(*)')
                .eq('status', 'pending_payment')
                .order('created_at', { ascending: false });
            setAmcRequests(amcData || []);

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
            toast.success('Technician assigned to ticket!');
        } catch (error) {
            console.error('Error assigning technician:', error);
            toast.error('Failed to assign technician');
        }
    };

    const handleVerifyCustomer = async (customerId) => {
        try {
            await customerService.verifyCustomer(customerId);
            fetchData();
            toast.success('Customer verified successfully');
        } catch (error) {
            console.error('Error verifying customer:', error);
            toast.error('Failed to verify customer');
        }
    };

    const handleCloseTicket = async (ticketId) => {
        try {
            await ticketService.updateTicket(ticketId, { status: 'closed' });
            fetchData();
            toast.success('Ticket closed');
        } catch (error) {
            console.error('Error closing ticket:', error);
            toast.error('Failed to close ticket');
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!window.confirm('Are you sure you want to permanently delete this ticket?')) return;
        try {
            await ticketService.deleteTicket(ticketId);
            toast.success('Ticket deleted successfully');
            fetchData();
            if (selectedTicketDetails?.id === ticketId) setSelectedTicketDetails(null);
        } catch (error) {
            console.error('Error deleting ticket:', error);
            toast.error('Failed to delete ticket: ' + (error.message || 'Check database permissions'));
        }
    };

    const handleDeleteCustomer = async (customerId, customerName) => {
        if (!window.confirm(`Are you sure you want to delete customer record for "${customerName}"?`)) return;
        try {
            await customerService.deleteCustomer(customerId);
            toast.success('Customer deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error('Failed to delete customer');
        }
    };

    const handleDeleteProfile = async (profileId, profileName, profileRole) => {
        if (profileId === currentUser?.id) {
            toast.error("You cannot delete your own Super Admin account!");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete profile for "${profileName}" (${cleanText(profileRole)})?`)) return;
        try {
            await customerService.deleteProfile(profileId);
            toast.success('Profile deleted successfully');
            fetchData();
            setActiveMenuUserId(null);
        } catch (error) {
            console.error('Error deleting profile:', error);
            toast.error('Failed to delete profile: ' + (error.message || 'Check permissions'));
        }
    };

    const handleOnboardUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await customerService.addCustomer({
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                address: newUser.address,
                role: newUser.role,
                avatar_url: newUser.avatar_url,
                system_capacity_kw: newUser.capacity || 5.0,
                installation_date: new Date().toISOString(),
                amc_status: 'active',
                amc_valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            });

            setNewUser({ name: '', email: '', phone: '', capacity: '', address: '', role: 'customer', avatar_url: AVATAR_OPTIONS[0] });
            toast.success(`USER ONBOARDED AS ${cleanText(newUser.role)}!`);
            fetchData();
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error(error.message || 'Failed to add user.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOnboardPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingPhoto(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `onboard_${Date.now()}.${fileExt}`;
            const { data, error: uploadErr } = await supabase.storage
                .from('service-attachments')
                .upload(fileName, file, { upsert: true });

            if (uploadErr) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewUser(prev => ({ ...prev, avatar_url: reader.result }));
                    toast.success('Onboarding photo attached!');
                    setIsUploadingPhoto(false);
                };
                reader.readAsDataURL(file);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('service-attachments')
                .getPublicUrl(fileName);

            setNewUser(prev => ({ ...prev, avatar_url: publicUrl }));
            toast.success('Onboarding photo uploaded!');
        } catch (err) {
            console.error('Error uploading photo:', err);
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    // Admin Photo Upload Handler
    const handleAdminPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;
        setIsUploadingAdminPhoto(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `admin_${currentUser.id}_${Date.now()}.${fileExt}`;
            let finalUrl = '';

            const { error: uploadErr } = await supabase.storage
                .from('service-attachments')
                .upload(fileName, file, { upsert: true });

            if (uploadErr) {
                await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        finalUrl = reader.result;
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('service-attachments')
                    .getPublicUrl(fileName);
                finalUrl = publicUrl;
            }

            if (finalUrl) {
                setAdminProfileData(prev => ({ ...prev, avatar_url: finalUrl }));
                await customerService.updateProfile(currentUser.id, { avatar_url: finalUrl });
                await refreshProfile();
                toast.success('Admin Profile Photo updated!');
            }
        } catch (err) {
            console.error('Error updating admin photo:', err);
            toast.error('Failed to upload photo');
        } finally {
            setIsUploadingAdminPhoto(false);
        }
    };

    // Save Admin Profile & Settings
    const handleSaveAdminProfile = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSavingAdminProfile(true);
        try {
            await customerService.updateProfile(currentUser.id, {
                name: adminProfileData.name,
                phone: adminProfileData.phone,
                address: adminProfileData.address,
                avatar_url: adminProfileData.avatar_url
            });
            await refreshProfile();
            toast.success('Admin Profile & Settings saved successfully!');
            setShowAdminProfileModal(false);
            fetchData();
        } catch (err) {
            console.error('Error saving admin profile:', err);
            toast.error('Failed to save profile');
        } finally {
            setIsSavingAdminProfile(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            toast.success(`Role updated to ${cleanText(newRole)}`);
            setRoleModalUser(null);
            setActiveMenuUserId(null);
            fetchData();
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('Failed to update role');
        }
    };

    const currentAdminAvatar = profile?.avatar_url || adminProfileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`;

    return (
        <div className="space-y-6 pb-32 bg-gray-50 min-h-screen">
            <Header
                title="ADMIN PORTAL"
                rightAction={
                    <div className="flex items-center gap-3">
                        {/* Top Right Admin Profile Button */}
                        <button
                            onClick={() => setShowAdminProfileModal(true)}
                            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-solar p-1 pr-2.5 rounded-full shadow-sm transition-all group cursor-pointer"
                            title="Admin Profile & Settings"
                        >
                            <div className="h-8 w-8 rounded-full bg-solar/10 overflow-hidden border border-solar shrink-0 group-hover:scale-105 transition-transform">
                                <img src={currentAdminAvatar} alt="Admin Profile" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider hidden sm:inline-block">
                                {profile?.name || 'ADMIN'}
                            </span>
                        </button>

                        <Button variant="ghost" size="sm" onClick={signOut} className="text-red-500 font-bold uppercase text-xs">
                            {t('logout')}
                        </Button>
                    </div>
                }
            />

            <div className="px-4 space-y-6">

                {/* --- TAB CONTENT AREA --- */}
                <div className="min-h-[300px]">

                    {/* ─── 1. TICKETS TAB ─── */}
                    {activeTab === 'tickets' && (
                        <div className="space-y-4">
                            {/* Ticket Filter Sub-Tabs */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {[
                                    { key: 'to_assign', label: 'TO ASSIGN', count: tickets.filter(t => !t.assigned_technician_id && !['closed', 'completed', 'resolved'].includes(t.status)).length },
                                    { key: 'assigned', label: 'ASSIGNED', count: tickets.filter(t => t.assigned_technician_id && !['in_progress', 'closed', 'completed', 'resolved'].includes(t.status)).length },
                                    { key: 'in_progress', label: 'IN PROGRESS', count: tickets.filter(t => t.status === 'in_progress').length },
                                    { key: 'resolved', label: 'RESOLVED', count: tickets.filter(t => ['closed', 'completed', 'resolved'].includes(t.status)).length },
                                    { key: 'all', label: 'ALL TICKETS', count: tickets.length }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setTicketFilter(tab.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 border ${
                                            ticketFilter === tab.key 
                                                ? 'bg-solar text-white border-transparent shadow-sm' 
                                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {tab.label}
                                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {(() => {
                                const filtered = tickets.filter(t => {
                                    if (ticketFilter === 'to_assign') return !t.assigned_technician_id && !['closed', 'completed', 'resolved'].includes(t.status);
                                    if (ticketFilter === 'assigned') return t.assigned_technician_id && !['in_progress', 'closed', 'completed', 'resolved'].includes(t.status);
                                    if (ticketFilter === 'in_progress') return t.status === 'in_progress';
                                    if (ticketFilter === 'resolved') return ['closed', 'completed', 'resolved'].includes(t.status);
                                    return true;
                                });

                                if (filtered.length === 0) {
                                    return <p className="text-center text-gray-500 py-10 tracking-wide font-medium">NO TICKETS FOUND IN THIS SECTION.</p>;
                                }

                                return filtered.map((ticket) => (
                                    <Card key={ticket.id} className="bg-white border border-gray-200 hover:border-solar/40 transition-all shadow-sm">
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono font-bold text-gray-400">#TKT-{ticket.id?.slice(0, 4).toUpperCase()}</span>
                                                        <h3 className="font-extrabold text-gray-900 text-base">
                                                            {cleanText(ticket.issue_type)}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-500 mt-1">
                                                        CUSTOMER: <span className="font-bold text-gray-900">{cleanText(ticket.customer?.name || ticket.profiles?.name || 'SOLAR CUSTOMER')}</span> • CAPACITY: <span className="font-bold text-solar">{ticket.solar_systems?.capacity_kw || 5.0}KW</span>
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="font-bold uppercase tracking-wider text-xs bg-gray-50 text-gray-800 border-gray-300">
                                                    {cleanText(ticket.status)}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 line-clamp-2 font-medium">{ticket.description}</p>

                                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 text-xs border-solar/30 text-solar hover:bg-solar/10 font-bold"
                                                    onClick={() => setSelectedTicketDetails(ticket)}
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> VIEW TIMELINE & MEDIA
                                                </Button>

                                                <select
                                                    className="flex-1 text-xs border border-gray-200 rounded-lg py-2 px-3 bg-gray-50 text-gray-900 focus:border-solar outline-none font-bold uppercase"
                                                    value={ticket.assigned_technician_id || ''}
                                                    onChange={(e) => handleAssignTechnician(ticket.id, e.target.value)}
                                                    disabled={['closed', 'completed'].includes(ticket.status)}
                                                >
                                                    <option value="">ASSIGN TECHNICIAN...</option>
                                                    {technicians.map(tech => (
                                                        <option key={tech.id} value={tech.id}>{cleanText(tech.name)} (ID: TECH-{tech.id?.slice(0,4).toUpperCase()})</option>
                                                    ))}
                                                </select>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 border border-red-200 rounded-lg"
                                                    onClick={() => handleDeleteTicket(ticket.id)}
                                                    title="DELETE TICKET"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ));
                            })()}
                        </div>
                    )}

                    {/* ─── 2. USERS & DIRECTORY TAB ─── */}
                    {activeTab === 'directory' && (
                        <div className="space-y-5">
                            {/* Directory Role Sub-Tabs */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200 pb-3">
                                {[
                                    { key: 'customers', label: 'CUSTOMERS', count: allProfiles.filter(p => p.role === 'customer').length, icon: User },
                                    { key: 'technicians', label: 'TECHNICIANS', count: allProfiles.filter(p => p.role === 'technician').length, icon: Wrench },
                                    { key: 'admins', label: 'ADMINS', count: allProfiles.filter(p => p.role === 'admin').length, icon: Crown }
                                ].map(subTab => (
                                    <button
                                        key={subTab.key}
                                        onClick={() => setDirectoryFilter(subTab.key)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 border ${
                                            directoryFilter === subTab.key 
                                                ? 'bg-solar text-white border-transparent shadow-sm' 
                                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <subTab.icon className="w-3.5 h-3.5" />
                                        {subTab.label}
                                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                            {subTab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* CUSTOMERS / TECHNICIANS / ADMINS LIST */}
                            <div className="space-y-3">
                                {(() => {
                                    const roleProfiles = allProfiles.filter(p => p.role === directoryFilter.slice(0, -1)); // customer, technician, admin
                                    
                                    if (roleProfiles.length === 0) {
                                        return <p className="text-center text-gray-500 py-10 tracking-wide font-medium">NO {directoryFilter.toUpperCase()} REGISTERED YET.</p>;
                                    }

                                    return roleProfiles.map(prof => (
                                        <div key={prof.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-3 hover:border-solar/30 transition-all shadow-sm relative">
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-full bg-solar/10 overflow-hidden border border-solar/20 shrink-0">
                                                    <img src={prof.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prof.name}`} alt={prof.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-extrabold text-gray-900 text-sm">{cleanText(prof.name || 'USER')}</p>
                                                        <span className="text-[10px] font-mono font-extrabold text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                                                            {getUniqueId(prof)}
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase text-gray-700 bg-gray-50">{cleanText(prof.role)}</Badge>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{cleanPhone(prof.phone) || 'NO PHONE NUMBER'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setSelectedUserDetails(prof)} className="gap-1 text-xs border-gray-300 font-bold">
                                                    <Eye className="w-3.5 h-3.5 text-solar" /> VIEW DETAILS
                                                </Button>

                                                {/* 3-Dot Action Menu Button */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveMenuUserId(activeMenuUserId === prof.id ? null : prof.id)}
                                                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all"
                                                        title="More Actions"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {/* Dropdown Options */}
                                                    {activeMenuUserId === prof.id && (
                                                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1 font-bold text-xs animate-in zoom-in-95">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUserDetails(prof);
                                                                    setActiveMenuUserId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-solar" /> View Full Details
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRoleModalUser(prof);
                                                                    setActiveMenuUserId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                                                            >
                                                                <User className="w-3.5 h-3.5 text-solar" /> Change User Role
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProfile(prof.id, prof.name || 'User', prof.role)}
                                                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete Profile
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}

                    {/* ─── 3. VERIFICATION & ONBOARDING TAB ─── */}
                    {activeTab === 'verification' && (
                        <div className="space-y-6">
                            {/* ONBOARD NEW USER FORM */}
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2 font-bold uppercase">
                                        <UserPlus className="w-5 h-5 text-solar" />
                                        ONBOARD NEW USER (CUSTOMER / TECHNICIAN / ADMIN)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleOnboardUser} className="space-y-4">
                                        {/* Avatar Selection / Upload & Live Preview */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Profile Photo ({cleanText(newUser.role)})</label>
                                            
                                            <div className="flex items-center gap-4">
                                                {/* Selected Photo Preview Box */}
                                                <div className="relative shrink-0">
                                                    <div className="h-16 w-16 rounded-full bg-solar/10 overflow-hidden border-2 border-solar shadow-md">
                                                        <img src={newUser.avatar_url || AVATAR_OPTIONS[0]} alt="Selected Profile Photo" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full text-[9px] shadow" title="Photo Attached">
                                                        <Check className="w-3 h-3" />
                                                    </span>
                                                </div>

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <label className="cursor-pointer bg-solar text-white hover:bg-solar-dark px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all">
                                                            <Upload className="w-3.5 h-3.5" />
                                                            {isUploadingPhoto ? 'Uploading...' : 'Upload Device Photo'}
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleOnboardPhotoUpload} />
                                                        </label>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 font-medium">or pick a preset avatar:</p>
                                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                                        {AVATAR_OPTIONS.map((avatar, idx) => (
                                                            <button
                                                                type="button"
                                                                key={idx}
                                                                onClick={() => setNewUser({ ...newUser, avatar_url: avatar })}
                                                                className={`h-9 w-9 rounded-full border-2 p-0.5 overflow-hidden transition-all shrink-0 ${newUser.avatar_url === avatar ? 'border-solar scale-110 shadow-md ring-2 ring-solar/30' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                                                            >
                                                                <img src={avatar} alt="Avatar Preset" className="w-full h-full object-cover rounded-full" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input required placeholder="Full Name" className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                            <input required type="email" placeholder="Email Address" className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                            <select className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-bold focus:border-solar outline-none uppercase" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                                <option value="customer">ROLE: CUSTOMER</option>
                                                <option value="technician">ROLE: TECHNICIAN</option>
                                                <option value="admin">ROLE: ADMIN</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                placeholder="10-Digit Phone Number (e.g. 9876543210)"
                                                maxLength={10}
                                                className={`p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium ${newUser.role !== 'customer' ? 'md:col-span-2' : ''}`}
                                                value={newUser.phone}
                                                onChange={e => setNewUser({ ...newUser, phone: cleanPhone(e.target.value) })}
                                            />
                                            {newUser.role === 'customer' && (
                                                <input
                                                    placeholder="System Capacity (kW)"
                                                    type="number"
                                                    step="0.1"
                                                    className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium"
                                                    value={newUser.capacity}
                                                    onChange={e => setNewUser({ ...newUser, capacity: e.target.value })}
                                                />
                                            )}
                                        </div>

                                        <input
                                            required
                                            placeholder={newUser.role === 'customer' ? 'Installation Address' : 'Residential Address'}
                                            className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium"
                                            value={newUser.address}
                                            onChange={e => setNewUser({ ...newUser, address: e.target.value })}
                                        />

                                        <Button type="submit" className="w-full bg-solar text-white hover:bg-solar-dark shadow-md font-bold uppercase" disabled={isSubmitting}>
                                            {isSubmitting ? 'ONBOARDING...' : 'REGISTER & VERIFY USER'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                </div>
            </div>

            {/* --- FIXED BOTTOM MAIN ADMIN NAVIGATION BAR --- */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-2.5 z-40 shadow-2xl">
                <div className="max-w-md mx-auto flex gap-2 p-1 bg-gray-100/80 rounded-2xl">
                    {[
                        { key: 'tickets', label: 'TICKETS', icon: ClipboardList, badge: null },
                        { key: 'directory', label: 'DIRECTORY', icon: Users, badge: allProfiles.length },
                        { key: 'verification', label: 'ONBOARDING', icon: ShieldCheck, badge: pendingCustomers.length > 0 ? pendingCustomers.length : null }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2.5 px-2 text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all flex flex-col items-center justify-center gap-1 shrink-0 ${
                                activeTab === tab.key 
                                    ? 'bg-solar text-white shadow-md' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- ADMIN PROFILE & ACCOUNT SETTINGS MODAL --- */}
            {showAdminProfileModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2 uppercase">
                                <ShieldCheck className="w-5 h-5 text-solar" />
                                ADMIN ACCOUNT & PROFILE SETTINGS
                            </h3>
                            <button onClick={() => { setShowAdminProfileModal(false); setIsEditingAdminProfile(false); }} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                        </div>

                        {/* Admin Photo & Info */}
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                            <div className="relative shrink-0">
                                <div className="h-20 w-20 rounded-full bg-solar/10 overflow-hidden border-2 border-solar shadow-md">
                                    <img src={currentAdminAvatar} alt="Admin Avatar" className="w-full h-full object-cover" />
                                </div>
                                {isEditingAdminProfile && (
                                    <label className="absolute -bottom-1 -right-1 bg-solar text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-solar-dark transition-all border border-white" title="Upload Photo">
                                        <Camera className="w-3.5 h-3.5" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAdminPhotoUpload} />
                                    </label>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900 capitalize">{adminProfileData.name || profile?.name || 'Super Admin'}</h2>
                                <p className="text-xs text-gray-500 font-medium">{currentUser?.email}</p>
                                <span className="inline-block mt-1 text-[10px] font-mono font-extrabold text-solar bg-solar/10 px-2 py-0.5 rounded border border-solar/20 uppercase">
                                    {getUniqueId(profile || { role: 'admin', id: currentUser?.id })}
                                </span>
                            </div>
                        </div>

                        {/* Read-Only View vs Editable Form */}
                        {!isEditingAdminProfile ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Admin Full Name</p>
                                    <p className="font-extrabold text-gray-900 text-sm">{adminProfileData.name || profile?.name || 'Super Admin'}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Phone Number</p>
                                        <p className="font-extrabold text-gray-900 text-sm">{adminProfileData.phone || 'No Phone Number'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Email Address</p>
                                        <p className="font-extrabold text-gray-900 text-sm font-mono">{currentUser?.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Headquarters / Office Address</p>
                                    <p className="font-extrabold text-gray-900 text-sm">{adminProfileData.address || 'Address Not Updated'}</p>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => setIsEditingAdminProfile(true)}
                                    className="w-full bg-solar text-white hover:bg-solar-dark gap-2 shadow-md font-bold uppercase"
                                >
                                    <Edit3 className="w-4 h-4" /> EDIT PROFILE DETAILS
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveAdminProfile} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Admin Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium"
                                        value={adminProfileData.name}
                                        onChange={(e) => setAdminProfileData({ ...adminProfileData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            placeholder="+91 98765 43210"
                                            className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium"
                                            value={adminProfileData.phone}
                                            onChange={(e) => setAdminProfileData({ ...adminProfileData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email (Account)</label>
                                        <input
                                            disabled
                                            type="text"
                                            className="w-full p-3 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed"
                                            value={currentUser?.email || ''}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Headquarters / Office Address</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Solar Care Headquarters"
                                        className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium"
                                        value={adminProfileData.address}
                                        onChange={(e) => setAdminProfileData({ ...adminProfileData, address: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 font-bold uppercase"
                                        onClick={() => setIsEditingAdminProfile(false)}
                                    >
                                        CANCEL
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-solar text-white hover:bg-solar-dark gap-2 shadow-md font-bold uppercase" disabled={isSavingAdminProfile}>
                                        {isSavingAdminProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        SAVE PROFILE
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* --- USER DETAILED RECORD MODAL (For Customers, Technicians & Admins) --- */}
            {selectedUserDetails && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2 uppercase">
                                <User className="w-5 h-5 text-solar" />
                                {cleanText(selectedUserDetails.role)} DETAILED RECORD
                            </h3>
                            <button onClick={() => setSelectedUserDetails(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="p-4 bg-gray-50 rounded-xl space-y-2 flex items-center gap-4 border border-gray-200">
                                <div className="h-14 w-14 rounded-full bg-solar/10 overflow-hidden border border-solar shrink-0">
                                    <img src={selectedUserDetails.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserDetails.name}`} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-extrabold text-gray-900 text-base">{cleanText(selectedUserDetails.name)}</p>
                                        <span className="text-[10px] font-mono font-extrabold text-solar bg-solar/10 px-2 py-0.5 rounded border border-solar/20">
                                            {getUniqueId(selectedUserDetails)}
                                        </span>
                                    </div>
                                    {selectedUserDetails.email ? (
                                        <p className="text-xs text-gray-700 font-bold flex items-center gap-1.5 mt-1">
                                            <Mail className="w-3.5 h-3.5 text-solar shrink-0" />
                                            <span className="text-gray-900 select-all font-mono">{selectedUserDetails.email}</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-1">
                                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span className="italic text-gray-400">No Email Provided</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5 mt-0.5">
                                        <Phone className="w-3.5 h-3.5 text-solar shrink-0" />
                                        <span>{cleanPhone(selectedUserDetails.phone) || 'No Phone Number'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                                <p className="text-xs text-gray-500 font-bold uppercase">LOCATION / ADDRESS</p>
                                <p className="text-gray-800 font-medium">{selectedUserDetails.address || 'Address not updated'}</p>
                            </div>

                            {selectedUserDetails.role === 'customer' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-solar/10 rounded-xl border border-solar/20">
                                        <p className="text-[10px] text-solar font-bold uppercase">SYSTEM CAPACITY</p>
                                        <p className="font-black text-gray-900 text-base">{selectedUserDetails.system_capacity_kw || 5.0} KW</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase">AMC STATUS</p>
                                        <p className="font-black text-emerald-700 text-base uppercase">{cleanText(selectedUserDetails.amc_status || 'ACTIVE')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button className="w-full bg-gray-900 text-white font-bold uppercase" onClick={() => setSelectedUserDetails(null)}>
                            CLOSE RECORD
                        </Button>
                    </div>
                </div>
            )}

            {/* --- CHANGE ROLE MODAL --- */}
            {roleModalUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-extrabold text-gray-900 text-sm uppercase">CHANGE USER ROLE</h3>
                            <button onClick={() => setRoleModalUser(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                        </div>
                        <p className="text-xs text-gray-600">Select new role for <strong>{roleModalUser.name}</strong> ({getUniqueId(roleModalUser)}):</p>
                        <div className="space-y-2">
                            {['customer', 'technician', 'admin'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => handleUpdateRole(roleModalUser.id, r)}
                                    className={`w-full p-3 rounded-xl border text-xs font-extrabold uppercase transition-all flex justify-between items-center ${roleModalUser.role === r ? 'bg-solar/10 border-solar text-solar' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'}`}
                                >
                                    <span>{cleanText(r)}</span>
                                    {roleModalUser.role === r && <CheckCircle className="w-4 h-4 text-solar" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- TICKET TIMELINE MODAL --- */}
            {selectedTicketDetails && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <span className="text-xs font-mono font-bold text-gray-400">#TKT-{selectedTicketDetails.id?.slice(0, 4).toUpperCase()}</span>
                                <h3 className="font-extrabold text-gray-900 text-lg uppercase tracking-wider">{cleanText(selectedTicketDetails.issue_type)}</h3>
                            </div>
                            <button onClick={() => setSelectedTicketDetails(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                        </div>

                        {/* Timeline Component */}
                        <TicketTimeline ticket={selectedTicketDetails} />

                        {/* Customer & System Quick Card */}
                        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5">
                            <p className="font-bold text-gray-700 uppercase">Customer Information</p>
                            <p className="text-gray-900 font-extrabold text-sm">{cleanText(selectedTicketDetails.customer?.name || selectedTicketDetails.profiles?.name)}</p>
                            <p className="text-gray-600">{selectedTicketDetails.customer?.phone || selectedTicketDetails.profiles?.phone || 'NO PHONE'}</p>
                            <p className="text-gray-600 leading-relaxed">{selectedTicketDetails.customer?.address || selectedTicketDetails.profiles?.address || 'NO ADDRESS'}</p>
                        </div>

                        {/* Action Buttons inside modal */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                            {['open', 'raised', 'assigned', 'in_progress'].includes(selectedTicketDetails.status) && (
                                <Button
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase"
                                    onClick={() => {
                                        handleCloseTicket(selectedTicketDetails.id);
                                        setSelectedTicketDetails(null);
                                    }}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> CLOSE TICKET
                                </Button>
                            )}
                            <Button variant="outline" className="flex-1 text-xs font-bold uppercase" onClick={() => setSelectedTicketDetails(null)}>
                                CLOSE WINDOW
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
