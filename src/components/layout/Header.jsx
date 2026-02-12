import { cn } from '../../lib/utils';
import { Bell, User } from 'lucide-react';
import { Button } from '../ui/Button';

export function Header({ title, rightAction }) {
    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <div className="flex items-center gap-2">
                {rightAction}
                <Button variant="ghost" size="icon" className="text-gray-500">
                    <Bell className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
