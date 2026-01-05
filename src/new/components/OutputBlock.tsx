import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface OutputBlockProps {
    title: string;
    status?: string;
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function OutputBlock({ title, status, footer, children, className }: OutputBlockProps) {
    return (
        <section
            className={cn(
                "bg-[var(--color-ivory)]/80 border border-[var(--ui-border)]/60 rounded-2xl px-[var(--space-xl)] py-[var(--space-lg)]",
                "space-y-[var(--space-md)]",
                className
            )}
        >
            <header className="flex items-start justify-between gap-[var(--space-lg)]">
                <div className="space-y-[var(--space-2xs)]">
                    <h3 className="text-base font-semibold text-text-primary">{title}</h3>
                </div>
                {status && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold text-text-soft bg-[var(--ui-border-soft)] rounded-full">
                        {status}
                    </span>
                )}
            </header>

            <div className="text-[15px] leading-7 text-text-primary/90">
                {children}
            </div>

            {footer && (
                <footer className="pt-[var(--space-xs)] text-[11px] text-text-soft flex items-center justify-between">
                    {footer}
                </footer>
            )}
        </section>
    );
}
