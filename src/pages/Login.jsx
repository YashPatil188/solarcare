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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white shadow-md shadow-solar/10 border border-gray-200 rounded-3xl">
                <CardHeader className="text-center space-y-3 pb-2">
                    <div className="mx-auto h-16 w-16 bg-solar-light rounded-2xl border border-solar/30 flex items-center justify-center shadow-md shadow-solar/10">
                        <Lock className="h-7 w-7 text-solar" />
                    </div>
                    <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">{t('welcome')}</CardTitle>
                    <p className="text-sm font-medium text-gray-500">{t('signin_desc')}</p>
                </CardHeader>
                <CardContent className="pt-6">
                    {/* Toggle Auth Method */}
                    <div className="flex p-1.5 bg-gray-50 border border-gray-200 rounded-xl mb-6">
                        <button
                            onClick={() => { setAuthMethod('email'); setOtpSent(false); }}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${authMethod === 'email' ? 'bg-solar text-white shadow-md shadow-solar/10' : 'text-gray-400 hover:text-gray-700'}`}
                        >
                            Email
                        </button>
                        <button
                            onClick={() => setAuthMethod('phone')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${authMethod === 'phone' ? 'bg-solar text-white shadow-md shadow-solar/10' : 'text-gray-400 hover:text-gray-700'}`}
                        >
                            Phone (OTP)
                        </button>
                    </div>

                    {authMethod === 'email' ? (
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-white/30 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-white/30 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full text-lg h-14 mt-4 bg-solar hover:bg-solar-dark text-white shadow-md shadow-solar/10" disabled={loading} isLoading={loading}>
                                {t('signin')}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handlePhoneLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        required
                                        disabled={otpSent}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-white/30 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium disabled:opacity-50"
                                        placeholder="+91 9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            {otpSent && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Enter OTP</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-white/30 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium tracking-[0.5em] text-center"
                                            placeholder="••••••"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className="w-full text-lg h-14 mt-4 bg-solar hover:bg-solar-dark text-white shadow-md shadow-solar/10" disabled={loading} isLoading={loading}>
                                {otpSent ? 'Verify & Login' : 'Send OTP'}
                            </Button>
                        </form>
                    )}

                    <div className="mt-8 text-center text-sm font-medium text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-solar hover:text-[#00c958] font-bold tracking-wide transition-colors">
                            {t('signup')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
