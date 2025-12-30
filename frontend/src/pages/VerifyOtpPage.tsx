import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../features/auth/store/auth-store';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import logo from '../assets/logo.png';
import { motion } from 'framer-motion';

export const VerifyOtpPage = () => {
    const { t } = useTranslation();
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState('');
    const { verifyOtp, resendOtp, isLoading, error, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Get email from location state or user store
        const stateEmail = (location.state as any)?.email;
        if (stateEmail) {
            setEmail(stateEmail);
        } else if (user?.email) {
            setEmail(user.email);
        } else {
            navigate('/login');
        }
    }, [location.state, user, navigate]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const pasted = value.slice(0, 6).split('');
            const newOtp = [...otpValues];
            pasted.forEach((char, i) => {
                if (index + i < 6) newOtp[index + i] = char;
            });
            setOtpValues(newOtp);
            inputs.current[Math.min(index + pasted.length, 5)]?.focus();
            return;
        }

        const newOtp = [...otpValues];
        newOtp[index] = value;
        setOtpValues(newOtp);

        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otpValues.join('');
        if (code.length !== 6) return;

        try {
            await verifyOtp(email, code);
            navigate('/dashboard');
        } catch (err) {
            console.error('Verification failed:', err);
        }
    };

    const handleResend = async () => {
        try {
            await resendOtp(email);
            // Show success message or toast
        } catch (err) {
            console.error('Resend failed:', err);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-navy text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 flex flex-col justify-center px-6 lg:px-20 py-12">
                <div className="absolute top-6 left-6 lg:left-20 flex items-center justify-between w-[calc(100%-3rem)] lg:w-[calc(100%-10rem)]">
                    <Link to="/" className="flex items-center space-x-2">
                        <img src={logo} alt="Foot Genius" className="h-8 w-auto" />
                    </Link>
                    <LanguageSwitcher />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full mx-auto"
                >
                    <div className="w-16 h-16 rounded-2xl bg-emerald/10 flex items-center justify-center mb-6 border border-emerald/20">
                        <ShieldCheck className="text-emerald" size={32} />
                    </div>

                    <h1 className="text-4xl font-black italic tracking-tighter mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Vérifiez votre compte
                    </h1>
                    <p className="text-gray-400 mb-8">
                        Nous avons envoyé un code de vérification à <span className="text-white font-bold">{email}</span>
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between gap-2">
                            {otpValues.map((value, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => { inputs.current[idx] = el; }}
                                    type="text"
                                    maxLength={idx === 0 ? 6 : 1}
                                    value={value}
                                    onChange={(e) => handleChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className="w-12 h-14 md:w-14 md:h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-black focus:outline-none focus:border-emerald/50 focus:bg-white/10 transition-all text-emerald"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || otpValues.join('').length !== 6}
                            className="btn-primary w-full py-4 text-sm relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                            <span className="relative z-10 flex items-center justify-center space-x-2">
                                <span>{isLoading ? 'Vérification...' : 'Vérifier mon compte'}</span>
                                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald via-cyan to-emerald bg-[length:200%_100%] animate-[shimmer_3s_infinite]"></div>
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <p className="text-gray-400 text-sm">
                            Vous n'avez pas reçu le code ?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={isLoading}
                            className="flex items-center justify-center space-x-2 mx-auto text-emerald font-bold hover:text-emerald/80 transition-colors cursor-pointer"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            <span>Renvoyer un code</span>
                        </button>
                    </div>
                </motion.div>
            </div>

            <div className="hidden lg:flex relative bg-gradient-to-br from-emerald/5 to-navy border-l border-white/5 items-center justify-center p-20">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=3540&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10 max-w-lg text-center">
                    <h2 className="text-5xl font-black italic mb-6 leading-tight">
                        {t('verify.hero.title')} <span className="text-emerald">{t('verify.hero.highlight')}</span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        {t('verify.hero.description')}
                    </p>
                </div>
            </div>
        </div>
    );
};
