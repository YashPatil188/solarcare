import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootRedirect() {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-solar" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (profile) {
        if (profile.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
        if (profile.role === 'technician') return <Navigate to="/technician-dashboard" replace />;
        return <Navigate to="/customer-dashboard" replace />;
    }

    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
}
