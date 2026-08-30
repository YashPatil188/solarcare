import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Lock, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(email.trim().toLowerCase(), password);
            navigate('/');
            toast.success(t('welcome'));
        } catch (err) {
            toast.error(err.message || 'Failed to sign in');
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
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('email')}</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium"
                                    placeholder="user@example.com"
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
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-solar focus:border-solar outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full text-lg h-14 mt-4 bg-solar hover:bg-solar-dark text-white shadow-md shadow-solar/10 font-bold uppercase" disabled={loading} isLoading={loading}>
                            {t('signin')}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-gray-500">
                        Pre-onboarded by Admin?{' '}
                        <Link to="/signup" className="text-solar hover:text-[#00c958] font-bold tracking-wide transition-colors uppercase">
                            ACTIVATE ACCOUNT HERE
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
