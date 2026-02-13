import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // [NEW]
import { Calendar, MapPin, CheckCircle, Play, Upload, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

export default function TechnicianDashboard() {
    const { t } = useTranslation(); // [NEW]
    const { user, signOut } = useAuth();
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

        setUploading(true);
        try {
            let photoUrl = null;

            // 1. Upload Photo if exists
            if (completionData.photo) {
                const fileName = `${activeTicket}-${Date.now()}.jpg`;
                const { data, error: uploadError } = await supabase.storage
                    .from('service-photos')
                    .upload(fileName, completionData.photo);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('service-photos')
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

            // 3. Update Ticket Status
            const { error: ticketError } = await supabase
                .from('tickets')
                .update({ status: 'completed' })
                .eq('id', activeTicket);

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
                    <h2 className="text-lg font-bold text-gray-900">{t('my_tasks')}</h2>
                    <Badge variant="outline">{tickets.filter(t => t.status !== 'completed').length} Active</Badge>
                </div>

                {tickets.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">{t('no_assigned_tickets')}</div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <Card key={ticket.id} className="border-l-4 border-l-solar">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 capitalize text-lg">{ticket.issue_type.replace('_', ' ')}</h3>
                                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                                <Users className="h-3 w-3" />
                                                <span>{ticket.profiles?.name}</span>
                                            </div>
                                        </div>
                                        <Badge variant={ticket.status === 'in_progress' ? 'warning' : 'default'}>
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                    </div>

                                    <div className="bg-white border rounded-lg p-3 text-sm space-y-2">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <span className="text-gray-600">{ticket.profiles?.address || t('no_address')}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <span className="text-gray-600">
                                                {new Date(ticket.created_at).toLocaleDateString()} • {ticket.solar_systems?.capacity_kw}kW System
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
                                            <div className="bg-gray-100 p-3 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <textarea
                                                    className="w-full p-2 text-sm border rounded"
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
        </div>
    );
}
