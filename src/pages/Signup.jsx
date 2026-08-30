import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

export default function Signup() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isTechnician = searchParams.get('type') === 'technician';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await signUp(email.trim().toLowerCase(), password, {
                email: email.trim().toLowerCase(),
                role: isTechnician ? 'technician' : 'customer'
            });

            toast.success(isTechnician ? 'Technician account activated!' : 'Account activated successfully!');
            navigate('/');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white shadow-md shadow-solar/10 border border-gray-200 rounded-3xl">
                <CardHeader className="text-center space-y-3 pb-2">
                    <div className="mx-auto h-16 w-16 bg-solar-light rounded-2xl border border-solar/30 flex items-center justify-center shadow-md shadow-solar/10">
                        <ShieldCheck className="h-8 w-8 text-solar" />
                    </div>
                    <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">
                        {isTechnician ? 'ACTIVATE TECHNICIAN ACCOUNT' : 'ACTIVATE ACCOUNT'}
                    </CardTitle>
                    <p className="text-xs font-medium text-gray-500">
                        Enter your registered email address & set your password to sign in.
                    </p>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="bg-solar/10 border border-solar/20 text-solar-dark text-xs p-3 rounded-xl mb-4 font-medium">
                        <strong>Registered User Activation:</strong> Your profile details were pre-configured by Administrator. Simply enter your registered email and choose a password.
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">REGISTERED EMAIL</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium text-sm"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">CREATE PASSWORD</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">CONFIRM PASSWORD</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium text-sm"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full text-base h-12 mt-4 bg-solar hover:bg-solar-dark text-white font-bold uppercase shadow-md" disabled={loading} isLoading={loading}>
                            ACTIVATE & SIGN IN
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-xs font-medium text-gray-500">
                        Already set up your account?{' '}
                        <Link to="/login" className="text-solar hover:text-[#00c958] font-bold tracking-wide transition-colors uppercase">
                            SIGN IN HERE
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
