import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    primaryAction?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    primaryAction,
    secondaryAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
            {Icon && (
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-text-soft" strokeWidth={1.5} />
                </div>
            )}
            
            <h3 className="text-base font-semibold text-text-primary mb-2">
                {title}
            </h3>
            
            {description && (
                <p className="text-sm text-text-soft max-w-sm mb-6">
                    {description}
                </p>
            )}
            
            {(primaryAction || secondaryAction) && (
                <div className="flex items-center gap-3">
                    {secondaryAction && (
                        <Button variant="ghost" onClick={secondaryAction.onClick}>
                            {secondaryAction.label}
                        </Button>
                    )}
                    {primaryAction && (
                        <Button variant="primary" onClick={primaryAction.onClick}>
                            {primaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
