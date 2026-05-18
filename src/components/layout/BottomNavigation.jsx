import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Bot, Ticket, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export function BottomNavigation() {
    const location = useLocation();
    const { t } = useTranslation();

    const tabs = [
        { path: '/customer-dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { path: '/services', label: t('services'), icon: Wrench },
        { path: '/ai-chat', label: 'AI', icon: Bot, isCenter: true },
        { path: '/tickets', label: t('tickets_label'), icon: Ticket },
        { path: '/account', label: t('account'), icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 pb-safe">
            <div className="flex justify-around items-center h-16">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;

                    // Center AI button with special styling
                    if (tab.isCenter) {
                        return (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                className="flex flex-col items-center justify-center -mt-5"
                            >
                                <div className={cn(
                                    'h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all',
                                    isActive
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200 scale-110'
                                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-100 hover:scale-105'
                                )}>
                                    <tab.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold mt-1",
                                    isActive ? 'text-indigo-600' : 'text-gray-400'
                                )}>{tab.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={cn(
                                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                                isActive ? 'text-solar' : 'text-gray-400 hover:text-gray-700'
                            )}
                        >
                            <tab.icon className={cn("h-5 w-5", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
