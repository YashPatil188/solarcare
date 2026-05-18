import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // [NEW]
import { Calendar, MapPin, CheckCircle, Play, Upload, Camera, Users, Phone, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

export default function TechnicianDashboard() {
    const { t } = useTranslation();
    const { user, signOut } = useAuth();
    const { toast } = useToast(); // [FIX] Destructure toast
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null); // For completing a ticket
    const [completionData, setCompletionData] = useState({ remarks: '', photo: null });

    useEffect(() => {
        if (user) fetchMyTickets();
    }, [user]);

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
            const { error } = await supabase
                .from('tickets')
                .update({ status: 'in_progress' })
                .eq('id', ticketId);

            if (error) throw error;
            fetchMyTickets();
            toast.success('Work started!');
        } catch (error) {
            console.error('Error starting work:', error);
            toast.error('Could not start work.');
        }
    };

    const handleUploadPhoto = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCompletionData({ ...completionData, photo: file });
        toast.info('Photo selected: ' + file.name);
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

            // 1. Upload Photo if exists
            if (completionData.photo) {
                const fileName = `${activeTicket}-${Date.now()}.jpg`;
                const { data, error: uploadError } = await supabase.storage
                    .from('service-attachments')
                    .upload(fileName, completionData.photo);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('service-attachments')
                    .getPublicUrl(fileName);

                photoUrl = publicUrl;
            }

            // 2. Create Ticket Update
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

            // 3. Update Ticket Status AND Photos

            // First fetch existing photos
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
                    photos: existingPhotos
                })
                .eq('id', activeTicket);

            if (ticketError) throw ticketError;

            if (ticketError) throw ticketError;

            setActiveTicket(null);
            setCompletionData({ remarks: '', photo: null });
            fetchMyTickets();
            toast.success('Work marked as completed!');

        } catch (error) {
            console.error('Error completing work:', error);
            toast.error('Failed to complete work. Check remarks or connection.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20 bg-gray-50 min-h-screen">
            <Header
                title={t('technician_portal')}
                rightAction={<Button variant="ghost" size="sm" onClick={signOut} className="text-red-500">{t('logout')}</Button>}
            />

            <div className="px-4 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{t('my_tasks')}</h2>
                    <Badge variant="outline">{tickets.filter(t => t.status !== 'completed').length} Active</Badge>
                </div>

                {tickets.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 tracking-wide">{t('no_assigned_tickets')}</div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <Card key={ticket.id} className="border-l-4 border-l-solar overflow-hidden hover:shadow-md shadow-solar/10 transition-all bg-white">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-extrabold text-gray-900 uppercase tracking-wider text-lg">{ticket.issue_type.replaceAll('_', ' ').toUpperCase()}</h3>
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mt-1">
                                                <Users className="h-4 w-4" />
                                                <span>{ticket.profiles?.name}</span>
                                            </div>
                                        </div>
                                        <Badge variant={ticket.status === 'in_progress' ? 'warning' : 'default'} className="font-bold uppercase tracking-wider shadow-sm">
                                            {ticket.status.replaceAll('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>

                                    {/* Process Stepper */}
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 py-3 border-y border-gray-200 uppercase tracking-wider">
                                        <div className={`flex items-center gap-1 ${ticket.status !== 'assigned' ? 'text-solar' : 'text-blue-400'}`}>
                                            <div className="w-2 h-2 rounded-full bg-current shadow-sm"></div> 1. {t('assigned')}
                                        </div>
                                        <div className={`h-0.5 flex-1 mx-2 rounded-full ${ticket.status !== 'assigned' ? 'bg-solar/30' : 'bg-gray-100'}`}></div>
                                        <div className={`flex items-center gap-1 ${ticket.status === 'in_progress' ? 'text-blue-400' : (['completed', 'closed'].includes(ticket.status) ? 'text-solar' : 'text-gray-300')}`}>
                                            <div className="w-2 h-2 rounded-full bg-current shadow-sm"></div> 2. {t('in_progress')}
                                        </div>
                                        <div className={`h-0.5 flex-1 mx-2 rounded-full ${['completed', 'closed'].includes(ticket.status) ? 'bg-solar/30' : 'bg-gray-100'}`}></div>
                                        <div className={`flex items-center gap-1 ${['completed', 'closed'].includes(ticket.status) ? 'text-solar' : 'text-gray-300'}`}>
                                            <div className="w-2 h-2 rounded-full bg-current shadow-sm"></div> 3. {t('completed')}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm space-y-3.5">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <div className="flex-1">
                                                <span className="text-gray-700 block">{ticket.profiles?.address || t('no_address')}</span>
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ticket.profiles?.address)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-400 text-xs hover:underline flex items-center gap-1 mt-1 font-bold tracking-wide"
                                                >
                                                    <Navigation className="w-3 h-3" /> {t('navigate')}
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <div className="flex-1">
                                                <span className="text-gray-700 block">{ticket.profiles?.phone || 'No Phone'}</span>
                                                {ticket.profiles?.phone && (
                                                    <a href={`tel:${ticket.profiles.phone}`} className="text-blue-400 text-xs hover:underline flex items-center gap-1 mt-1 font-bold tracking-wide">
                                                        <Phone className="w-3 h-3" /> {t('call_customer')}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <span className="text-gray-700">
                                                {new Date(ticket.created_at).toLocaleDateString()} • <span className="font-bold">{ticket.solar_systems?.capacity_kw}kW System</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-2">
                                        {ticket.status === 'assigned' && (
                                            <Button className="w-full" onClick={() => handleStartWork(ticket.id)}>
                                                <Play className="h-4 w-4 mr-2" /> {t('start_work')}
                                            </Button>
                                        )}

                                        {ticket.status === 'in_progress' && !activeTicket && (
                                            <Button className="w-full" variant="success" onClick={() => setActiveTicket(ticket.id)}>
                                                <CheckCircle className="h-4 w-4 mr-2" /> {t('mark_completed')}
                                            </Button>
                                        )}

                                        {activeTicket === ticket.id && (
                                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <textarea
                                                    className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all"
                                                    placeholder="Technician remarks..."
                                                    rows="3"
                                                    value={completionData.remarks}
                                                    onChange={e => setCompletionData({ ...completionData, remarks: e.target.value })}
                                                ></textarea>

                                                <div className="flex items-center gap-2">
                                                    <label className="flex-1 cursor-pointer bg-white border border-dashed border-gray-300 rounded p-2 text-center text-sm text-gray-500 hover:bg-gray-50">
                                                        <Camera className="h-4 w-4 mx-auto mb-1" />
                                                        {completionData.photo ? 'Photo Selected' : t('upload_proof')}
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                                                    </label>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => setActiveTicket(null)}>Cancel</Button>
                                                    <Button variant="success" className="flex-1" onClick={handleCompleteWork} disabled={uploading}>
                                                        {uploading ? 'Uploading...' : t('submit_completion')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {ticket.status === 'completed' && (
                                            <div className="text-center text-sm text-green-600 font-medium py-2 bg-green-50 rounded">
                                                Work Completed
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
