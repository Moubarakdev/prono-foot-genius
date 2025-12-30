import React, { useState } from 'react';
import { useAuthStore } from '../features/auth/store/auth-store';
import {
    User as UserIcon,
    Mail,
    Lock,
    Shield,
    Save,
    CheckCircle,
    AlertCircle,
    UserCircle,
    Camera,
    Trophy,
    TrendingUp,
    BarChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export const ProfilePage = () => {
    const { t } = useTranslation();
    const { user, updateProfile, changePassword, isLoading, error } = useAuthStore();

    // Profile State
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [profileType, setProfileType] = useState(user?.profile_type || 'balanced');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setLocalError(null);
        try {
            await updateProfile({
                full_name: fullName,
                avatar_url: avatarUrl,
                profile_type: profileType
            });
            setSuccessMessage("Profil mis à jour avec succès !");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setLocalError(err.message);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setLocalError(null);

        if (newPassword !== confirmPassword) {
            setLocalError("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        try {
            await changePassword({ current_password: currentPassword, new_password: newPassword });
            setSuccessMessage("Mot de passe changé avec succès !");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setLocalError(err.message);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white">
                        {t('profile.title')} <span className="text-emerald text-outline">{t('profile.titleHighlight')}</span>
                    </h1>
                    <p className="text-gray-400">{t('profile.subtitle')}</p>
                </div>
            </header>

            {(successMessage || localError || error) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-4 rounded-xl flex items-center space-x-3 text-sm font-medium",
                        successMessage ? "bg-emerald/10 text-emerald border border-emerald/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}
                >
                    {successMessage ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{successMessage || localError || error}</span>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Summary & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                        <div className="relative group mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald to-cyan flex items-center justify-center text-navy text-4xl font-black shadow-xl shadow-emerald/20 relative overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    fullName.charAt(0) || 'U'
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-navy border border-white/10 rounded-full text-emerald hover:bg-emerald hover:text-navy transition-all shadow-lg cursor-pointer">
                                <Camera size={16} />
                            </button>
                        </div>

                        <h2 className="text-xl font-bold text-white mb-1">{user?.full_name}</h2>
                        <p className="text-gray-400 text-sm mb-4">{user?.email}</p>

                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald/10 text-emerald text-xs font-black uppercase tracking-widest border border-emerald/20">
                            {user?.subscription}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border border-white/5 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-emerald mb-1 flex justify-center"><Trophy size={20} /></div>
                            <div className="text-xl font-black italic">89%</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Win Rate</div>
                        </div>
                        <div className="text-center border-x border-white/5">
                            <div className="text-cyan mb-1 flex justify-center"><TrendingUp size={20} /></div>
                            <div className="text-xl font-black italic">12</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{t('profile.stats.valueBets')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-emerald mb-1 flex justify-center"><BarChart size={20} /></div>
                            <div className="text-xl font-black italic">45</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{t('profile.stats.analyses')}</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* General Settings */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass p-8 rounded-3xl border border-white/5"
                    >
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald">
                                <UserCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold font-italic">Paramètres Généraux</h3>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">Nom Complet</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 focus:outline-none focus:border-emerald/50 focus:bg-white/10 transition-all font-medium"
                                            placeholder={t('profile.form.namePlaceholder')}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">Email (non modifiable)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={18} />
                                        <input
                                            type="email"
                                            value={user?.email}
                                            readOnly
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-12 py-3 focus:outline-none text-gray-600 font-medium cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">URL de l'avatar</label>
                                    <div className="relative">
                                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 focus:outline-none focus:border-emerald/50 focus:bg-white/10 transition-all font-medium"
                                            placeholder={t('profile.form.avatarPlaceholder')}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-400">Type de pronostiqueur</label>
                                    <div className="grid grid-cols-3 gap-4 mt-2">
                                        {['safe', 'balanced', 'ambitious'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setProfileType(type)}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl border transition-all text-sm font-bold capitalize cursor-pointer",
                                                    profileType === type
                                                        ? "bg-emerald/10 border-emerald/50 text-emerald shadow-lg shadow-emerald/10"
                                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary px-8 py-3 text-sm flex items-center space-x-2 shadow-lg shadow-emerald/20 hover:shadow-emerald/30"
                            >
                                <Save size={18} />
                                <span>{isLoading ? "Enregistrement..." : "Enregistrer les modifications"}</span>
                            </button>
                        </form>
                    </motion.div>

                    {/* Security Settings */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass p-8 rounded-3xl border border-white/5"
                    >
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold font-italic">Sécurité</h3>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400">Mot de passe actuel</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 focus:outline-none focus:border-cyan/50 focus:bg-white/10 transition-all font-medium"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">Nouveau mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 focus:outline-none focus:border-cyan/50 focus:bg-white/10 transition-all font-medium"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400">Confirmer le nouveau mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 focus:outline-none focus:border-cyan/50 focus:bg-white/10 transition-all font-medium"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-cyan hover:bg-cyan/80 text-navy font-black px-8 py-3 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-lg shadow-cyan/20 cursor-pointer"
                            >
                                <Lock size={18} />
                                <span>Mettre à jour le mot de passe</span>
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
