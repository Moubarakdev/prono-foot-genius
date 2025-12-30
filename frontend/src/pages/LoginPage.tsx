import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/auth-store';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import logo from '../assets/logo.png';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
            const user = useAuthStore.getState().user;
            if (user && !user.is_verified) {
                navigate('/verify-otp', { state: { email } });
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-navy text-white relative overflow-hidden">
            {/* Gradient Orbs */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Left Side - Form */}
            <div className="relative z-10 flex flex-col justify-center px-6 lg:px-20 py-12">
                <div className="absolute top-6 left-6 lg:left-20 flex items-center justify-between w-[calc(100%-3rem)] lg:w-[calc(100%-10rem)]">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <img src={logo} alt="Foot Genius" className="h-8 w-auto" />
                    </Link>
                    <LanguageSwitcher />
                </div>

                <div className="max-w-md w-full mx-auto mt-20 lg:mt-0">
                    <h1 className="text-4xl font-black italic tracking-tighter mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {t('auth.login.title')}
                    </h1>
                    <p className="text-gray-400 mb-8">{t('auth.login.subtitle')}</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 ml-1">{t('auth.login.email')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 focus:outline-none focus:border-emerald/50 focus:bg-white/10 transition-all font-medium placeholder:text-gray-600"
                                    placeholder={t('auth.form.emailPlaceholder')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 ml-1">{t('auth.login.password')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 focus:outline-none focus:border-emerald/50 focus:bg-white/10 transition-all font-medium placeholder:text-gray-600"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-4 text-sm relative overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                        >
                            <span className="relative z-10 flex items-center justify-center space-x-2">
                                <span>{isLoading ? t('common.loading') : t('auth.login.button')}</span>
                                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald via-cyan to-emerald bg-[length:200%_100%] animate-[shimmer_3s_infinite]"></div>
                        </button>
                    </form>

                    <p className="mt-8 text-center text-gray-400">
                        {t('auth.login.noAccount')} {' '}
                        <Link to="/register" className="text-emerald font-bold hover:text-emerald/80 transition-colors hover:underline">
                            {t('auth.login.register')}
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Feature Highlight */}
            <div className="hidden lg:flex relative bg-gradient-to-br from-emerald/5 to-navy border-l border-white/5 items-center justify-center p-20">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=3540&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

                <div className="relative z-10 max-w-lg">
                    <div className="glass p-10 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-navy/40">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald to-cyan flex items-center justify-center mb-8 shadow-lg">
                            <img src={logo} alt="Foot Genius" className="h-10 w-auto" />
                        </div>

                        <h2 className="text-3xl font-black italic mb-6">
                            {t('auth.features.login.title')}
                        </h2>

                        <ul className="space-y-4">
                            {[
                                t('auth.features.login.item1'),
                                t('auth.features.login.item2'),
                                t('auth.features.login.item3'),
                                t('auth.features.login.item4')
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center space-x-3 text-gray-300">
                                    <CheckCircle className="text-emerald shrink-0" size={20} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
