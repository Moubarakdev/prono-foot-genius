import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    Ticket,
    LogOut,
    ChevronRight,
    Star,
    Menu,
    X,
    UserCircle,
    Crown
} from 'lucide-react';
import { useAuthStore } from '../features/auth/store/auth-store';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import logo from '../assets/logo.png';

interface LayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);


    const menuItems = useMemo(() => [
        { icon: LayoutDashboard, label: t('dashboard.title'), path: '/dashboard' },
        { icon: BarChart3, label: t('dashboard.analyze'), path: '/analyze' },
        { icon: Ticket, label: t('dashboard.coupons'), path: '/coupons' },
        { icon: Star, label: t('dashboard.pricing'), path: '/pricing' },
        { icon: Crown, label: t('dashboard.subscription'), path: '/subscription' },
        { icon: UserCircle, label: t('common.profile'), path: '/profile' },
    ], [t]);

    return (
        <div className="flex h-screen bg-navy overflow-hidden relative">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed md:relative inset-y-0 left-0 z-50 w-64 glass border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center space-x-2">
                        <img src={logo} alt="FootIntel" className="h-10 w-auto" />
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                                location.pathname === item.path
                                    ? "bg-emerald/10 text-emerald"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight size={16} className={cn(
                                "opacity-0 transition-all",
                                location.pathname === item.path ? "opacity-100" : "group-hover:opacity-50"
                            )} />
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all cursor-pointer"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">{t('common.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative bg-navy/50">
                {/* Background blobs for aesthetics */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <header className="h-20 flex items-center justify-between px-4 md:px-8 glass border-b border-white/5 sticky top-0 z-30 backdrop-blur-md">
                    <div className="flex items-center flex-1">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden text-gray-400 hover:text-white mr-4 transition-colors cursor-pointer"
                        >
                            <Menu size={24} />
                        </button>
                    </div> {/* Spacer to keep right alignment clean */}
                    <div className="flex items-center space-x-6">
                        <LanguageSwitcher />
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <Link to="/profile" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white">{user?.full_name || t('common.user')}</p>
                                <p className="text-xs text-emerald font-medium uppercase tracking-wider">{user?.subscription || t('pricing.free.name')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald to-cyan flex items-center justify-center text-navy font-black shadow-lg shadow-emerald/20">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                        </Link>
                    </div>
                </header>

                <div className="p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
};
