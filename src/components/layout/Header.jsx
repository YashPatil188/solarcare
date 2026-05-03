import { useState, useEffect, useRef } from 'react';
import { Bell, User, X } from 'lucide-react';
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

            // Subscribe to new notifications
            const channel = supabase
                .channel('header_notifications')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    (payload) => {
                        toast.info(payload.new.message);
                        setNotifications(prev => [payload.new, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
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
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    const markAsRead = async () => {
        if (unreadCount === 0) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
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
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        )}
                    </Button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-2xl shadow-black/50 z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Notifications</h3>
                                <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-900">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div key={notification.id} className={`p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${!notification.is_read ? 'bg-solar/5' : ''}`}>
                                            <p className="text-sm text-gray-900/90">{notification.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
