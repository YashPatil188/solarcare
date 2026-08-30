import { useState, useEffect } from 'react';
import { User, CreditCard, Bell, LogOut, ChevronRight, MapPin, Settings, Loader2, Globe, Edit3, Save, Upload, Lock, ShieldCheck, Camera, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { ticketService } from '../services/ticketService';
import { customerService } from '../services/customerService';

const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Nandini'
];

export default function Account() {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const { toast } = useToast();
    const { t, i18n } = useTranslation();
    const [system, setSystem] = useState(null);
    const [ticketCount, setTicketCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Editable Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        phone: '',
        address: '',
        avatar_url: ''
    });

    // Settings States
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    useEffect(() => {
        if (!user) return;
        async function fetchAccountData() {
            setLoading(true);
            try {
                // 1. Fetch System details
                const { data: sysData } = await supabase
                    .from('solar_systems')
                    .select('*')
                    .eq('customer_id', user.id)
                    .maybeSingle();
                setSystem(sysData);

                // 2. Fetch Ticket Count
                const tickets = await ticketService.getTickets(user.id, 'customer');
                setTicketCount(tickets?.length || 0);

                // 3. Set Initial Edit State from profile
                setEditData({
                    name: profile?.name || '',
                    phone: profile?.phone || '',
                    address: profile?.address || sysData?.address || '',
                    avatar_url: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchAccountData();
    }, [user, profile]);

    const handlePhotoFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingPhoto(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `profile_${user.id}_${Date.now()}.${fileExt}`;
            let finalAvatarUrl = '';

            // Upload to Supabase Storage bucket 'service-attachments'
            const { error: uploadErr } = await supabase.storage
                .from('service-attachments')
                .upload(fileName, file, { upsert: true });

            if (uploadErr) {
                // Fallback to Base64 data URL
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
                setEditData(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
                await customerService.updateProfile(user.id, { avatar_url: finalAvatarUrl });
                await refreshProfile();
                toast.success('Profile photo updated & saved to database!');
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
        setIsSaving(true);
        try {
            // Update profiles table in database
            await customerService.updateProfile(user.id, {
                name: editData.name,
                phone: editData.phone,
                address: editData.address,
                avatar_url: editData.avatar_url
            });

            // Update solar_systems address if exists
            if (system?.id) {
                await supabase.from('solar_systems').update({ address: editData.address }).eq('id', system.id);
            }

            await refreshProfile();
            toast.success('Profile & Settings saved to database!');
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }
        setIsUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Password updated successfully!');
            setShowPasswordModal(false);
            setNewPassword('');
        } catch (err) {
            console.error('Error updating password:', err);
            toast.error('Failed to update password');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    if (loading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-solar w-8 h-8" /></div>;

    const currentAvatar = profile?.avatar_url || editData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

    return (
        <div className="space-y-6 pb-20 bg-gray-50 min-h-screen">
            <Header title={t('account')} />

            <div className="px-4 space-y-6">
                {/* Clean Profile Card */}
                <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="relative shrink-0">
                                    <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-solar/10 overflow-hidden border-2 border-solar shadow-sm">
                                        <img
                                            src={currentAvatar}
                                            alt="User Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <label className="absolute -bottom-1 -right-1 bg-solar text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-solar-dark transition-all border border-white" title="Upload Photo">
                                        <Camera className="w-3 h-3" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFileUpload} />
                                    </label>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight capitalize truncate leading-tight">{editData.name || profile?.name || 'User'}</h2>
                                    <p className="text-xs text-gray-500 truncate font-medium mt-0.5">{user.email}</p>
                                    {editData.phone && <p className="text-[11px] text-gray-400 font-mono mt-0.5">{editData.phone}</p>}
                                </div>
                            </div>
                            
                            <button
                                type="button"
                                onClick={() => setIsEditing(!isEditing)}
                                className={`shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm border ${
                                    isEditing 
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300' 
                                        : 'bg-solar text-white hover:bg-solar-dark border-transparent shadow-solar/10'
                                }`}
                            >
                                {isEditing ? (
                                    <>
                                        <X className="w-3.5 h-3.5" /> Cancel
                                    </>
                                ) : (
                                    <>
                                        <Edit3 className="w-3.5 h-3.5 text-white" /> Edit Profile
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Editable Form */}
                        {isEditing && (
                            <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                                {/* Upload Custom Photo or Select Avatar */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Profile Photo Options</label>
                                    <div className="flex items-center gap-3 mb-3">
                                        <label className="cursor-pointer bg-solar/10 text-solar hover:bg-solar/20 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-solar/30 transition-all">
                                            <Upload className="w-3.5 h-3.5" />
                                            {isUploadingPhoto ? 'Uploading...' : 'Upload Device Photo'}
                                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFileUpload} />
                                        </label>
                                        <span className="text-xs text-gray-400 font-medium">or pick an avatar:</span>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {AVATAR_OPTIONS.map((avatar, idx) => (
                                            <button
                                                type="button"
                                                key={idx}
                                                onClick={() => setEditData({ ...editData, avatar_url: avatar })}
                                                className={`h-11 w-11 rounded-full border-2 p-0.5 overflow-hidden transition-all shrink-0 ${editData.avatar_url === avatar ? 'border-solar scale-110 shadow-md ring-2 ring-solar/20' : 'border-gray-200'}`}
                                            >
                                                <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar focus:ring-1 focus:ring-solar outline-none font-medium"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            placeholder="+91 98765 43210"
                                            className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar focus:ring-1 focus:ring-solar outline-none font-medium"
                                            value={editData.phone}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Installation Address</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Full Address"
                                        className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar focus:ring-1 focus:ring-solar outline-none font-medium"
                                        value={editData.address}
                                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-solar text-white hover:bg-solar-dark gap-2 shadow-md" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Profile Changes
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Installation & AMC Details Card */}
                <Card className="bg-white border-gray-200 hover:border-solar/30 transition-all shadow-sm">
                    <CardContent className="p-5">
                        <h3 className="font-extrabold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">{t('installation_date')} & {t('capacity')}</h3>
                        {system ? (
                            <div className="grid grid-cols-2 gap-y-5 gap-x-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('capacity')}</p>
                                    <p className="text-sm font-bold text-gray-900 tracking-wide">{system.capacity_kw} kW</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('installation_date')}</p>
                                    <p className="text-sm font-bold text-gray-900 tracking-wide">
                                        {new Date(system.installation_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('services')}</p>
                                    <p className="text-sm font-bold text-gray-900 tracking-wide">{ticketCount} Total</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">AMC Status</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 uppercase tracking-wider shadow-sm">
                                        {system.amc_status || 'ACTIVE'}
                                    </span>
                                </div>
                                <div className="col-span-2 mt-1 border-t border-gray-100 pt-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{t('address')}</p>
                                    <p className="text-sm font-medium text-gray-700 flex items-start gap-2 leading-relaxed">
                                        <MapPin className="h-4 w-4 mt-0.5 text-solar shrink-0" />
                                        {editData.address || system.address || "Address not updated"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 text-sm tracking-wide">
                                No solar system linked.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Comprehensive Settings & Security Menu */}
                <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
                    <CardContent className="p-0 divide-y divide-gray-100">
                        {/* Language Preference */}
                        <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-solar" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('language')}</p>
                                    <p className="text-xs text-gray-400">Select app display language</p>
                                </div>
                            </div>
                            <select
                                className="text-xs font-bold bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-solar outline-none uppercase"
                                value={i18n.language}
                                onChange={(e) => changeLanguage(e.target.value)}
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                                <option value="mr">मराठी (Marathi)</option>
                                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                            </select>
                        </div>

                        {/* Push & Service Notifications Toggle */}
                        <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-solar" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Service Notifications</p>
                                    <p className="text-xs text-gray-400">Receive SMS & Email updates on ticket status</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setNotificationsEnabled(!notificationsEnabled);
                                    toast.success(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled');
                                }}
                                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${notificationsEnabled ? 'bg-solar' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Account Security & Password */}
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <Lock className="h-5 w-5 text-solar" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Account Security</p>
                                    <p className="text-xs text-gray-400">Update account password & login options</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-solar transition-colors" />
                        </button>
                    </CardContent>
                </Card>

                {/* Sign Out Button */}
                <Button variant="ghost" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 font-bold uppercase tracking-wider border border-red-200" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('logout')}
                </Button>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                                <Lock className="w-4 h-4 text-solar" /> Change Password
                            </h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">New Password</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-solar outline-none font-mono"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1 bg-solar text-white hover:bg-solar-dark" disabled={isUpdatingPassword}>
                                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
