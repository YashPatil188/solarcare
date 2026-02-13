import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Lock, Mail, Phone, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export default function Login() {
    const { t } = useTranslation();
    const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(''); // [NEW] for Phone Auth
    const [otpSent, setOtpSent] = useState(false); // [NEW]
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(email, password);
            navigate('/');
            toast.success(t('welcome'));
        } catch (err) {
            toast.error(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!otpSent) {
                // Send OTP
                const { error } = await supabase.auth.signInWithOtp({
                    phone: phone,
                });
                if (error) throw error;
                setOtpSent(true);
                toast.success('OTP sent to your phone');
            } else {
                // Verify OTP
                const { error } = await supabase.auth.verifyOtp({
                    phone: phone,
                    token: otp,
                    type: 'sms',
                });
                if (error) throw error;
                navigate('/');
                toast.success(t('welcome'));
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-solar/10 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white shadow-xl border-solar/20">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 bg-solar rounded-xl flex items-center justify-center">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{t('welcome')}</CardTitle>
                    <p className="text-sm text-gray-500">{t('signin_desc')}</p>
                </CardHeader>
                <CardContent>
                    {/* Toggle Auth Method */}
                    <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                        <button
                            onClick={() => { setAuthMethod('email'); setOtpSent(false); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${authMethod === 'email' ? 'bg-white shadow text-solar-dark' : 'text-gray-500'}`}
                        >
                            Email
                        </button>
                        <button
                            onClick={() => setAuthMethod('phone')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${authMethod === 'phone' ? 'bg-white shadow text-solar-dark' : 'text-gray-500'}`}
                        >
                            Phone (OTP)
                        </button>
                    </div>

                    {authMethod === 'email' ? (
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-solar focus:border-transparent outline-none transition-all"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-solar focus:border-transparent outline-none transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full font-bold" disabled={loading} isLoading={loading}>
                                {t('signin')}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handlePhoneLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        required
                                        disabled={otpSent}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-solar focus:border-transparent outline-none transition-all"
                                        placeholder="+91 9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            {otpSent && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-sm font-medium text-gray-700">Enter OTP</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-solar focus:border-transparent outline-none transition-all"
                                            placeholder="123456"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className="w-full font-bold" disabled={loading} isLoading={loading}>
                                {otpSent ? 'Verify & Login' : 'Send OTP'}
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-solar-dark font-semibold hover:underline">
                            {t('signup')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
