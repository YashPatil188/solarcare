import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';

export function AppShell() {
    const location = useLocation();
    const isFullScreen = location.pathname === '/ai-chat';

    return (
        <div className={isFullScreen ? 'h-screen bg-gray-50' : 'min-h-screen bg-gray-50 pb-20'}>
            <div className={`mx-auto max-w-md bg-gray-50 shadow-2xl relative ${isFullScreen ? 'h-full flex flex-col' : 'min-h-screen'}`}>
                <Outlet />
                {!isFullScreen && <BottomNavigation />}
            </div>
            {isFullScreen && (
                <div className="fixed bottom-0 left-0 right-0 z-40">
                    <div className="mx-auto max-w-md">
                        <BottomNavigation />
                    </div>
                </div>
            )}
        </div>
    );
}
