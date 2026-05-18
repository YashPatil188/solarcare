import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RootRedirect from './components/auth/RootRedirect';
import { AppShell } from './components/layout/AppShell';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import Services from './pages/Services';
import Reports from './pages/Reports';
import AMC from './pages/AMC';
import Account from './pages/Account';
import AIChat from './pages/AIChat';
import TicketTracker from './pages/TicketTracker';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Customer Routes (Wrapped in AppShell for Bottom Nav) */}
            <Route element={
              <ProtectedRoute allowedRoles={['customer']}>
                <AppShell />
              </ProtectedRoute>
            }>
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              <Route path="/services" element={<Services />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/amc" element={<AMC />} />
              <Route path="/account" element={<Account />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/tickets" element={<TicketTracker />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Technician Routes */}
            <Route path="/technician-dashboard" element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />

            {/* Root & Catch-all */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
