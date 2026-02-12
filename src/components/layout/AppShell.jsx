import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';

export function AppShell() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="mx-auto max-w-md bg-gray-50 min-h-screen shadow-2xl relative">
                <Outlet />
                <BottomNavigation />
            </div>
        </div>
    );
}
