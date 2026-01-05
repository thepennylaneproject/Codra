import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Heading, Text, Label } from '../../new/components';
import { Button } from '@/components/ui/Button';

interface SettingOption {
    value: string;
    label: string;
    description?: string;
}

interface SettingEditorProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    currentValue: string;
    options: SettingOption[];
    onSave: (value: string) => void;
    type?: 'select' | 'number' | 'range';
    min?: number;
    max?: number;
}

export function SettingEditor({
    isOpen,
    onClose,
    title,
    description,
    currentValue,
    options,
    onSave,
    type = 'select',
    min,
    max,
}: SettingEditorProps) {
    const [selectedValue, setSelectedValue] = useState(currentValue);

    const handleSave = () => {
        onSave(selectedValue);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 glass-panel border-0 rounded-none bg-[var(--brand-ink)]/40 z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-[var(--ui-bg)] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-[var(--ui-border)]">
                            {/* Header */}
                            <div className="p-8 border-b border-[var(--ui-border)]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Heading size="lg" className="tracking-tight">
                                            {title}
                                        </Heading>
                                        {description && (
                                            <Label variant="muted" className="mt-2 block">{description}</Label>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={onClose}
                                        size="sm"
                                        className="p-2"
                                    >
                                        <X size={20} />
                                    </Button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto max-h-[50vh]">
                                {type === 'select' && (
                                    <div className="space-y-3">
                                        {options.map((option) => (
                                            <Button
                                                key={option.value}
                                                onClick={() => setSelectedValue(option.value)}
                                                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                                                    selectedValue === option.value
                                                        ? 'border-[var(--brand-ink)] bg-[var(--brand-ink)]/5 shadow-sm'
                                                        : 'border-[var(--ui-border)] hover:border-[var(--brand-ink)]/20'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span
                                                        className={`text-xs font-semibold ${
                                                            selectedValue === option.value
                                                                ? 'text-brand-ink'
                                                                : 'text-text-soft'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </span>
                                                    {selectedValue === option.value && (
                                                        <div className="w-4 h-4 rounded-full bg-[var(--brand-ink)]" />
                                                    )}
                                                </div>
                                                {option.description && (
                                                    <Text variant="muted" size="xs">{option.description}</Text>
                                                )}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                {type === 'number' && (
                                    <input
                                        type="number"
                                        value={selectedValue}
                                        onChange={(e) => setSelectedValue(e.target.value)}
                                        min={min}
                                        max={max}
                                        className="w-full p-4 rounded-2xl border border-[var(--ui-border)] bg-white text-base font-medium focus:outline-none focus:border-[var(--brand-ink)] focus:ring-2 focus:ring-[var(--brand-ink)]/10 text-brand-ink"
                                    />
                                )}

                                {type === 'range' && (
                                    <div className="space-y-4">
                                        <input
                                            type="range"
                                            value={selectedValue}
                                            onChange={(e) => setSelectedValue(e.target.value)}
                                            min={min}
                                            max={max}
                                            className="w-full h-2 bg-[var(--ui-border)] rounded-lg appearance-none cursor-pointer accent-[var(--brand-ink)]"
                                        />
                                        <div className="flex justify-between text-xs text-text-soft font-mono">
                                            <span>{min}</span>
                                            <span className="text-base font-semibold text-brand-ink">{selectedValue}</span>
                                            <span>{max}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-[var(--ui-border)] flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    className="flex-1"
                                    size="lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    className="flex-1"
                                    size="lg"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
