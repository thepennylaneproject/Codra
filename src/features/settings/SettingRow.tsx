import { ChevronRight } from 'lucide-react';
import { Heading, Text, Label } from '../../new/components';

interface SettingRowProps {
    label: string;
    value: string;
    description?: string;
    onChange: () => void;
    isOverride?: boolean;
}

export function SettingRow({ label, value, description, onChange, isOverride = false }: SettingRowProps) {
    return (
        <div className="py-6 border-b border-[var(--ui-border)] group">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <Heading size="sm">
                            {label}
                        </Heading>
                        {isOverride && (
                            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                Override
                            </span>
                        )}
                    </div>
                    {description && (
                        <Label variant="muted" className="mb-3 block">{description}</Label>
                    )}
                    <Text variant="muted" size="sm" className="font-medium">{value}</Text>
                </div>
                <button
                    onClick={onChange}
                    className="ml-6 text-xs uppercase tracking-[0.2em] underline underline-offset-4 text-text-primary"
                >
                    <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
                        Change
                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </button>
            </div>
        </div>
    );
}
