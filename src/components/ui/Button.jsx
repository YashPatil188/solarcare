import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
    className,
    variant = 'primary',
    size = 'default',
    isLoading,
    children,
    ...props
}) {
    const variants = {
        primary: 'bg-solar hover:bg-solar-dark text-white font-bold shadow-md shadow-solar/10',
        secondary: 'bg-gray-50 hover:bg-[#222222] text-gray-900 border border-gray-200',
        ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
        danger: 'bg-red-500 hover:bg-red-600 text-gray-900 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        outline: 'border-2 border-solar text-solar hover:bg-solar-light',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        default: 'h-12 px-6 text-sm font-medium',
        lg: 'h-14 px-8 text-base',
        icon: 'h-10 w-10 p-0 flex items-center justify-center',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 hover:shadow-md shadow-solar/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
