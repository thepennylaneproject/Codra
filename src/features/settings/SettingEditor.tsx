/**
 * SETTING EDITOR COMPONENT
 * Modal for editing a setting value
 */

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
                        className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-[#FFFAF0] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                            {/* Header */}
                            <div className="p-8 border-b border-[#1A1A1A]/5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">
                                            {title}
                                        </h2>
                                        {description && (
                                            <p className="text-xs text-zinc-400 mt-2">{description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto max-h-[50vh]">
                                {type === 'select' && (
                                    <div className="space-y-3">
                                        {options.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setSelectedValue(option.value)}
                                                className={`w-full p-5 rounded-2xl border text-left transition-all ${
                                                    selectedValue === option.value
                                                        ? 'border-[#1A1A1A] bg-[#1A1A1A]/5 shadow-sm'
                                                        : 'border-zinc-200 hover:border-zinc-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span
                                                        className={`text-[11px] font-black uppercase tracking-widest ${
                                                            selectedValue === option.value
                                                                ? 'text-[#1A1A1A]'
                                                                : 'text-zinc-600'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </span>
                                                    {selectedValue === option.value && (
                                                        <div className="w-4 h-4 rounded-full bg-[#1A1A1A]" />
                                                    )}
                                                </div>
                                                {option.description && (
                                                    <p className="text-[10px] text-zinc-400">{option.description}</p>
                                                )}
                                            </button>
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
                                        className="w-full p-4 rounded-2xl border border-zinc-200 bg-white text-lg font-medium focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10"
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
                                            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#1A1A1A]"
                                        />
                                        <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                                            <span>{min}</span>
                                            <span className="text-lg font-black text-[#1A1A1A]">{selectedValue}</span>
                                            <span>{max}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-[#1A1A1A]/5 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-[11px] font-black uppercase tracking-widest text-zinc-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-[11px] font-black uppercase tracking-widest text-white transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
