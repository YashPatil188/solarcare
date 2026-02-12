import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, FileText, ShieldCheck, IndianRupee, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BottomNavigation() {
    const location = useLocation();

    const tabs = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/services', label: 'Services', icon: Wrench },
        { path: '/reports', label: 'Reports', icon: FileText },
        { path: '/amc', label: 'AMC', icon: ShieldCheck },
        { path: '/account', label: 'Account', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 pb-safe">
            <div className="flex justify-around items-center h-16">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={cn(
                                'flex flex-col items-center justify-center w-full h-full space-y-1',
                                isActive ? 'text-solar' : 'text-gray-400 hover:text-gray-600'
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
