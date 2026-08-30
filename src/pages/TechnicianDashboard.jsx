import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, CheckCircle, Play, Upload, Camera, Users, Phone, Navigation, Wrench, User, Globe, Edit3, Save, Loader2, X, Check, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { customerService } from '../services/customerService';
import { cleanPhone } from '../utils/phone';

const cleanText = (str) => {
    if (!str) return '';
    return String(str).replaceAll('_', ' ').toUpperCase();
};

export default function TechnicianDashboard() {
    const { t, i18n } = useTranslation();
    const { user, profile, refreshProfile, signOut } = useAuth();
    const { toast } = useToast();
    
    // View & Filter States
    const [taskFilter, setTaskFilter] = useState('assigned'); // 'assigned', 'in_progress', 'completed', 'all'
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    
    // Ticket States
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);
    const [completionData, setCompletionData] = useState({ remarks: '', photo: null, previewUrl: null });

    // Technician Profile Edit State
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        address: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (user) {
            fetchMyTickets();
            setProfileData({
                name: profile?.name || '',
                phone: profile?.phone || '',
                address: profile?.address || '',
                avatar_url: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
            });
        }
    }, [user, profile]);

    async function fetchMyTickets() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*, profiles!customer_id(name, address, phone), solar_systems(capacity_kw)')
                .eq('assigned_technician_id', user.id)
                .order('priority', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleStartWork = async (ticketId) => {
        try {
            await supabase
                .from('tickets')
                .update({ 
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .eq('id', ticketId);

            fetchMyTickets();
            toast.success('Work started successfully!');
        } catch (error) {
            console.error('Error starting work:', error);
            toast.error('Could not start work.');
        }
    };

    const handleUploadPhoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setCompletionData(prev => ({ ...prev, photo: file, previewUrl }));
        toast.success('Proof photo selected!');
    };

    const handleCompleteWork = async () => {
        if (!completionData.remarks) {
            toast.error('Please add remarks.');
            return;
        }
        if (!completionData.photo) {
            toast.error('Photo proof is required to complete the job.');
            return;
        }

        setUploading(true);
        try {
            let photoUrl = null;

            if (completionData.photo) {
                const fileName = `${activeTicket}-${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage
                    .from('service-attachments')
                    .upload(fileName, completionData.photo);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('service-attachments')
                    .getPublicUrl(fileName);

                photoUrl = publicUrl;
            }

            // Create Ticket Update
            const { error: updateError } = await supabase
                .from('ticket_updates')
                .insert({
                    ticket_id: activeTicket,
                    technician_id: user.id,
                    status_change: 'completed',
                    remarks: completionData.remarks,
                    photo_url: photoUrl
                });

            if (updateError) throw updateError;

            // Fetch existing photos
            const { data: ticketData } = await supabase
                .from('tickets')
                .select('photos')
                .eq('id', activeTicket)
                .single();

            const existingPhotos = Array.isArray(ticketData?.photos) ? ticketData.photos : [];
            if (photoUrl) existingPhotos.push({ url: photoUrl, type: 'completion_proof', timestamp: new Date().toISOString() });

            const { error: ticketError } = await supabase
                .from('tickets')
                .update({
                    status: 'completed',
                    photos: existingPhotos,
                    completed_at: new Date().toISOString()
                })
                .eq('id', activeTicket);

            if (ticketError) throw ticketError;

            setActiveTicket(null);
            setCompletionData({ remarks: '', photo: null, previewUrl: null });
            fetchMyTickets();
            toast.success('Work marked as completed!');

        } catch (error) {
            console.error('Error completing work:', error);
            toast.error('Failed to complete work.');
        } finally {
            setUploading(false);
        }
    };

    // Save Profile & Photo
    const handlePhotoFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingPhoto(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `tech_profile_${user.id}_${Date.now()}.${fileExt}`;
            let finalAvatarUrl = '';

            const { error: uploadErr } = await supabase.storage
                .from('service-attachments')
                .upload(fileName, file, { upsert: true });

            if (uploadErr) {
                await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        finalAvatarUrl = reader.result;
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('service-attachments')
                    .getPublicUrl(fileName);
                finalAvatarUrl = publicUrl;
            }

            if (finalAvatarUrl) {
                setProfileData(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
                await customerService.updateProfile(user.id, { avatar_url: finalAvatarUrl });
                await refreshProfile();
                toast.success('Technician photo updated!');
            }
        } catch (err) {
            console.error('Error uploading photo:', err);
            toast.error('Failed to upload photo');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await customerService.updateProfile(user.id, {
                name: profileData.name,
                phone: profileData.phone,
                address: profileData.address,
                avatar_url: profileData.avatar_url
            });
            await refreshProfile();
            toast.success('Technician Profile saved successfully!');
            setShowProfileModal(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const currentAvatar = profile?.avatar_url || profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

    const filteredTickets = tickets.filter(t => {
        if (taskFilter === 'assigned') return t.status === 'assigned';
        if (taskFilter === 'in_progress') return t.status === 'in_progress';
        if (taskFilter === 'completed') return ['completed', 'closed', 'resolved'].includes(t.status);
        return true;
    });

    return (
        <div className="space-y-6 pb-20 bg-gray-50 min-h-screen">
            <Header
                title="TECHNICIAN PORTAL"
                rightAction={
                    <div className="flex items-center gap-3">
                        {/* Top Right Technician Profile Button */}
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-solar p-1 pr-2.5 rounded-full shadow-sm transition-all group cursor-pointer"
                            title="Technician Profile & Settings"
                        >
                            <div className="h-8 w-8 rounded-full bg-solar/10 overflow-hidden border border-solar shrink-0 group-hover:scale-105 transition-transform">
                                <img src={currentAvatar} alt="Technician Avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider hidden sm:inline-block">
                                {profile?.name || 'TECHNICIAN'}
                            </span>
                        </button>

                        <Button variant="ghost" size="sm" onClick={signOut} className="text-red-500 font-bold uppercase text-xs">
                            {t('logout')}
                        </Button>
                    </div>
                }
            />

            <div className="px-4 space-y-6">
                {/* --- TASKS SECTION --- */}
                <div className="space-y-4">
                    {/* Task Status Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {[
                            { key: 'assigned', label: 'ASSIGNED', count: tickets.filter(t => t.status === 'assigned').length },
                            { key: 'in_progress', label: 'IN PROGRESS', count: tickets.filter(t => t.status === 'in_progress').length },
                            { key: 'completed', label: 'COMPLETED', count: tickets.filter(t => ['completed', 'closed', 'resolved'].includes(t.status)).length },
                            { key: 'all', label: 'ALL TASKS', count: tickets.length }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setTaskFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 border ${
                                    taskFilter === tab.key 
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

                    {filteredTickets.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 tracking-wide font-medium">NO TASKS IN THIS STATUS SECTION.</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTickets.map((ticket) => (
                                <Card key={ticket.id} className="border-l-4 border-l-solar overflow-hidden hover:shadow-md shadow-solar/10 transition-all bg-white">
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-extrabold text-gray-900 uppercase tracking-wider text-lg">{cleanText(ticket.issue_type)}</h3>
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mt-1">
                                                    <Users className="h-4 w-4 text-solar" />
                                                    <span>{cleanText(ticket.profiles?.name || 'CUSTOMER')}</span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="font-bold uppercase tracking-wider text-xs bg-gray-50 text-gray-800 border-gray-300">
                                                {cleanText(ticket.status)}
                                            </Badge>
                                        </div>

                                        {/* Process Stepper */}
                                        <div className="flex items-center justify-between text-xs font-bold text-gray-400 py-3 border-y border-gray-200 uppercase tracking-wider">
                                            <div className={`flex items-center gap-1 ${ticket.status !== 'assigned' ? 'text-solar' : 'text-blue-500'}`}>
                                                <div className="w-2 h-2 rounded-full bg-current shadow-sm"></div> 1. ASSIGNED
                                            </div>
                                            <div className={`h-0.5 flex-1 mx-2 rounded-full ${ticket.status !== 'assigned' ? 'bg-solar/30' : 'bg-gray-200'}`}></div>
                                            <div className={`flex items-center gap-1 ${ticket.status === 'in_progress' ? 'text-blue-500' : (['completed', 'closed', 'resolved'].includes(ticket.status) ? 'text-solar' : 'text-gray-400')}`}>
                                                <div className="w-2 h-2 rounded-full bg-current shadow-sm"></div> 2. IN PROGRESS
                                            </div>
                                            <div className={`h-0.5 flex-1 mx-2 rounded-full ${['completed', 'closed', 'resolved'].includes(ticket.status) ? 'bg-solar/30' : 'bg-gray-200'}`}></div>
                                            <div className={`flex items-center gap-1 ${['completed', 'closed', 'resolved'].includes(ticket.status) ? 'text-solar' : 'text-gray-400'}`}>
                                                <div className="w-2 h-2 rounded-full bg-current shadow-sm"></div> 3. COMPLETED
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm space-y-3.5">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <span className="text-gray-700 block font-medium">{ticket.profiles?.address || 'No Address Updated'}</span>
                                                    {ticket.profiles?.address && (
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ticket.profiles?.address)}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-blue-500 text-xs hover:underline flex items-center gap-1 mt-1 font-bold tracking-wide uppercase"
                                                        >
                                                            <Navigation className="w-3 h-3" /> NAVIGATE TO LOCATION
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <span className="text-gray-700 block font-medium">{cleanPhone(ticket.profiles?.phone) || 'No Phone'}</span>
                                                    {ticket.profiles?.phone && (
                                                        <a href={`tel:${cleanPhone(ticket.profiles.phone)}`} className="text-blue-500 text-xs hover:underline flex items-center gap-1 mt-1 font-bold tracking-wide uppercase">
                                                            <Phone className="w-3 h-3" /> CALL CUSTOMER
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                                <span className="text-gray-700 font-medium">
                                                    {new Date(ticket.created_at).toLocaleDateString()} • <span className="font-extrabold text-solar">{ticket.solar_systems?.capacity_kw || 5.0}KW SYSTEM</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-2">
                                            {ticket.status === 'assigned' && (
                                                <Button className="w-full bg-solar text-white hover:bg-solar-dark font-extrabold uppercase shadow-sm" onClick={() => handleStartWork(ticket.id)}>
                                                    <Play className="h-4 w-4 mr-2" /> START WORK
                                                </Button>
                                            )}

                                            {ticket.status === 'in_progress' && !activeTicket && (
                                                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold uppercase shadow-sm" onClick={() => setActiveTicket(ticket.id)}>
                                                    <CheckCircle className="h-4 w-4 mr-2" /> MARK WORK COMPLETED
                                                </Button>
                                            )}

                                            {activeTicket === ticket.id && (
                                                <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                                    <textarea
                                                        className="w-full p-3 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-solar outline-none transition-all font-medium"
                                                        placeholder="Technician completion remarks..."
                                                        rows="3"
                                                        value={completionData.remarks}
                                                        onChange={e => setCompletionData({ ...completionData, remarks: e.target.value })}
                                                    ></textarea>

                                                    {/* Completion Proof Photo Selector & Live Image Preview */}
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-bold text-gray-600 uppercase">SERVICE COMPLETION PROOF PHOTO</label>

                                                        {completionData.previewUrl ? (
                                                            <div className="relative rounded-xl border-2 border-solar/40 overflow-hidden bg-gray-900 shadow-md">
                                                                <img
                                                                    src={completionData.previewUrl}
                                                                    alt="Selected Completion Proof"
                                                                    className="w-full h-44 object-cover"
                                                                />
                                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex justify-between items-center text-white">
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                                                        <span className="text-xs font-bold truncate max-w-[200px]">{completionData.photo?.name}</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCompletionData({ ...completionData, photo: null, previewUrl: null })}
                                                                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" /> REMOVE
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:bg-gray-50 hover:border-solar transition-all group">
                                                                <div className="h-10 w-10 rounded-full bg-solar/10 flex items-center justify-center text-solar group-hover:scale-110 transition-transform">
                                                                    <Camera className="h-5 w-5" />
                                                                </div>
                                                                <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">CLICK TO SELECT PROOF PHOTO</span>
                                                                <span className="text-[11px] text-gray-400">Take a clear photo of completed maintenance work</span>
                                                                <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                                                            </label>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button variant="outline" className="flex-1 font-bold uppercase" onClick={() => setActiveTicket(null)}>CANCEL</Button>
                                                        <Button variant="success" className="flex-1 bg-emerald-500 text-white font-bold uppercase" onClick={handleCompleteWork} disabled={uploading}>
                                                            {uploading ? 'UPLOADING...' : 'SUBMIT COMPLETION'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {['completed', 'closed', 'resolved'].includes(ticket.status) && (
                                                <div className="text-center text-sm font-extrabold text-emerald-600 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200 uppercase tracking-wider">
                                                    WORK COMPLETED
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- TECHNICIAN PROFILE & ACCOUNT SETTINGS MODAL --- */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2 uppercase">
                                <Wrench className="w-5 h-5 text-solar" />
                                TECHNICIAN PROFILE & SETTINGS
                            </h3>
                            <button onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                        </div>

                        {/* Profile Photo & Info Header */}
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                            <div className="relative shrink-0">
                                <div className="h-20 w-20 rounded-full bg-solar/10 overflow-hidden border-2 border-solar shadow-md">
                                    <img src={currentAvatar} alt="Technician Avatar" className="w-full h-full object-cover" />
                                </div>
                                {isEditingProfile && (
                                    <label className="absolute -bottom-1 -right-1 bg-solar text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-solar-dark transition-all border border-white" title="Upload Photo">
                                        <Camera className="w-3.5 h-3.5" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFileUpload} />
                                    </label>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900 capitalize">{profileData.name || profile?.name || 'Technician'}</h2>
                                <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                                <span className="inline-block mt-1 text-[10px] font-mono font-extrabold text-solar bg-solar/10 px-2 py-0.5 rounded border border-solar/20 uppercase">
                                    ID: TECH-{user.id?.replaceAll('-', '').slice(0, 4).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Read-Only View vs Editable Form */}
                        {!isEditingProfile ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Technician Full Name</p>
                                    <p className="font-extrabold text-gray-900 text-sm">{profileData.name || profile?.name || 'Technician'}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Phone Number</p>
                                        <p className="font-extrabold text-gray-900 text-sm">{profileData.phone || 'No Phone Number'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Email Address</p>
                                        <p className="font-extrabold text-gray-900 text-sm font-mono">{user?.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Base Location / Service Center Address</p>
                                    <p className="font-extrabold text-gray-900 text-sm">{profileData.address || 'Address Not Updated'}</p>
                                </div>

                                {/* Language Selector */}
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-solar" />
                                        <span className="text-xs font-bold text-gray-700 uppercase">APP LANGUAGE</span>
                                    </div>
                                    <select
                                        className="text-xs font-bold bg-white border border-gray-200 text-gray-900 rounded-lg px-2.5 py-1.5 outline-none uppercase"
                                        value={i18n.language}
                                        onChange={(e) => i18n.changeLanguage(e.target.value)}
                                    >
                                        <option value="en">English</option>
                                        <option value="hi">हिंदी (Hindi)</option>
                                        <option value="mr">मराठी (Marathi)</option>
                                        <option value="kn">ಕನ್ನಡ (Kannada)</option>
                                    </select>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => setIsEditingProfile(true)}
                                    className="w-full bg-solar text-white hover:bg-solar-dark gap-2 shadow-md font-bold uppercase"
                                >
                                    <Edit3 className="w-4 h-4" /> EDIT PROFILE DETAILS
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phone Number (10 Digits)</label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            placeholder="9876543210"
                                            className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: cleanPhone(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Base Location / Address</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Service Center Address"
                                        className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-medium"
                                        value={profileData.address}
                                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 font-bold uppercase"
                                        onClick={() => setIsEditingProfile(false)}
                                    >
                                        CANCEL
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-solar text-white hover:bg-solar-dark gap-2 shadow-md font-bold uppercase" disabled={isSavingProfile}>
                                        {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        SAVE PROFILE
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
