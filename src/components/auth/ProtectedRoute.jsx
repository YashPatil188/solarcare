import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-solar" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
        // Redirect to appropriate dashboard based on actual role
        if (profile.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
        if (profile.role === 'technician') return <Navigate to="/technician-dashboard" replace />;
        return <Navigate to="/customer-dashboard" replace />;
    }

    return children;
}
