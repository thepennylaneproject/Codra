import { ChevronRight } from 'lucide-react';
import { Heading, Text, Label } from '../../new/components';
import { Button } from '@/components/ui/Button';

interface SettingRowProps {
    label: string;
    value: string;
    description?: string;
    onChange: () => void;
    isOverride?: boolean;
}

export function SettingRow({ label, value, description, onChange, isOverride = false }: SettingRowProps) {
    return (
        <div className="p-6 bg-white border border-[var(--ui-border)] rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <Heading size="sm">
                            {label}
                        </Heading>
                        {isOverride && (
                            <span className="text-xs font-semibold text-zinc-500 bg-zinc-200/40 px-2 py-0 rounded-full border border-zinc-300/60">
                                Override
                            </span>
                        )}
                    </div>
                    {description && (
                        <Label variant="muted" className="mb-3 block">{description}</Label>
                    )}
                    <Text variant="muted" size="sm" className="font-medium">{value}</Text>
                </div>
                <Button
                    variant="secondary"
                    onClick={onChange}
                    size="sm"
                    className="ml-6 group"
                >
                    <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
                        Change
                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Button>
            </div>
        </div>
    );
}
