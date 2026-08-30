import { useState, useEffect, useRef } from 'react';
import { Bell, User, X, CheckCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

export function Header({ title, rightAction }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Real-time subscription to notifications table
            const channel = supabase
                .channel(`notifications_${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    (payload) => {
                        if (payload?.new) {
                            toast.info(payload.new.message);
                            setNotifications(prev => [payload.new, ...prev]);
                            setUnreadCount(prev => prev + 1);
                        }
                    }
                )
                .subscribe();

            // Fallback poll every 10 seconds
            const interval = setInterval(() => {
                fetchNotifications();
            }, 10000);

            return () => {
                supabase.removeChannel(channel);
                clearInterval(interval);
            };
        }
    }, [user]);

    // Close notifications when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function fetchNotifications() {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(15);

            if (error) throw error;
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !(n.is_read || n.read)).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    const markAsRead = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, read: true })
                .eq('user_id', user.id);

            if (error) throw error;
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const toggleNotifications = () => {
        if (!showNotifications) {
            setShowNotifications(true);
            markAsRead();
        } else {
            setShowNotifications(false);
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-lg border-b border-gray-200 px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px]">{title}</h1>
            <div className="flex items-center gap-3">
                {rightAction}

                <div className="relative" ref={notificationRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-gray-600 relative transition-colors hover:bg-gray-100 rounded-full", showNotifications && "bg-gray-100 text-solar")}
                        onClick={toggleNotifications}
                        title="Notifications"
                    >
                        <Bell className="h-5 w-5 text-gray-700" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                        )}
                    </Button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-solar" />
                                    <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wider">Notifications</h3>
                                </div>
                                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
                            </div>
                            <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-xs font-medium tracking-wide">
                                        No notifications yet.
                                    </div>
                                ) : (
                                    notifications.map((notification) => {
                                        const isUnread = !(notification.is_read || notification.read);
                                        return (
                                            <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-solar/5' : ''}`}>
                                                <p className="text-xs font-medium text-gray-800 leading-relaxed">{notification.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 font-mono">
                                                    {new Date(notification.created_at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
