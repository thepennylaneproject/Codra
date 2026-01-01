/**
 * SETTING ROW COMPONENT
 * Read-only display of a setting value with Change button
 */

import { ChevronRight } from 'lucide-react';

interface SettingRowProps {
    label: string;
    value: string;
    description?: string;
    onChange: () => void;
    isOverride?: boolean;
}

export function SettingRow({ label, value, description, onChange, isOverride = false }: SettingRowProps) {
    return (
        <div className="p-6 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1A1A1A]">
                            {label}
                        </h3>
                        {isOverride && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#FF4D4D] bg-[#FF4D4D]/5 px-2 py-0.5 rounded-full border border-[#FF4D4D]/10">
                                Override
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="text-[10px] text-zinc-400 mb-3">{description}</p>
                    )}
                    <p className="text-sm font-medium text-zinc-600">{value}</p>
                </div>
                <button
                    onClick={onChange}
                    className="ml-6 px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-all flex items-center gap-2 group-hover:gap-3"
                >
                    Change
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
}
