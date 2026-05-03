import { cn } from '../../lib/utils';

export function Badge({
    className,
    variant = 'default',
    children,
    ...props
}) {
    const variants = {
        default: 'bg-gray-100 text-gray-900 border border-gray-200',
        success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border border-whitember-500/30',
        error: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        solar: 'bg-solar-light text-solar border border-solar/30',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
