
import React, { useState } from 'react';
import { useTheme } from '../../lib/design/ThemeContext';
import { THEME_PRESETS } from '../../lib/design/theme-presets';
import { DesignConsole } from '../../components/architect/design-console/DesignConsole';
import { Monitor, Moon, Sun, Sidebar, LayoutTemplate } from 'lucide-react';

// Simple Modal component since we might not have a global UI kit one readily available or visible
const Modal: React.FC<{ onClose: () => void; children: React.ReactNode; size?: 'full' | 'md' }> = ({ onClose, children, size }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className={`bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col ${size === 'full' ? 'w-full h-full' : 'max-w-2xl w-full max-h-[80vh]'}`}>
            <div className="flex justify-end p-4 border-b border-zinc-800">
                <button onClick={onClose} className="text-zinc-400 hover:text-white">Close</button>
            </div>
            <div className="flex-1 overflow-auto p-0">
                {children}
            </div>
        </div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-100">{title}</h3>
        {children}
    </div>
);

export const AppearanceSettings: React.FC = () => {
    const { theme, mode, setMode, applyPreset, setThemeSeed } = useTheme();
    const [showFullConsole, setShowFullConsole] = useState(false);
    const [sidebarMode, setSidebarMode] = useState('expanded');
    const [density, setDensity] = useState('comfortable');

    return (
        <div className="space-y-10">
            <Section title="Theme Mode">
                <div className="flex gap-4 p-1 bg-zinc-900 rounded-lg inline-flex border border-zinc-800">
                    <button
                        onClick={() => setMode('dark')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${mode === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <Moon className="w-4 h-4" />
                        Dark
                    </button>
                    <button
                        onClick={() => setMode('light')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${mode === 'light' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <Sun className="w-4 h-4" />
                        Light
                    </button>
                    <button
                        onClick={() => setMode('system')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${mode === 'system' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <Monitor className="w-4 h-4" />
                        System
                    </button>
                </div>
            </Section>

            <Section title="Color Scheme">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            onClick={() => applyPreset(key)}
                            className="group relative flex flex-col p-3 rounded-lg border border-zinc-800 hover:border-teal-500/50 bg-zinc-900/50 hover:bg-zinc-900 transition-all text-left overflow-hidden"
                        >
                            <div className="relative w-full h-16 rounded-md overflow-hidden mb-2 border border-zinc-700/50">
                                {preset.backgroundImage && (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{
                                            backgroundImage: `url(${preset.backgroundImage})`,
                                            filter: `hue-rotate(${preset.atmosphere?.hueRotate || 0}deg)`
                                        }}
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-2 left-2 flex gap-1.5">
                                    <div className="w-4 h-4 rounded-full ring-1 ring-white/20" style={{ backgroundColor: preset.colors.primary }} />
                                    <div className="w-4 h-4 rounded-full ring-1 ring-white/20" style={{ backgroundColor: preset.colors.accent }} />
                                </div>
                            </div>
                            <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{preset.name}</span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowFullConsole(true)}
                    className="mt-6 flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                >
                    Open Full Design Console <span aria-hidden="true">&rarr;</span>
                </button>
            </Section>

            <Section title="Sidebar Preference">
                <div className="flex gap-4">
                    {['collapsed', 'expanded', 'auto'].map((sm) => (
                        <label key={sm} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${sidebarMode === sm ? 'border-teal-500/50 bg-teal-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}>
                            <input
                                type="radio"
                                name="sidebar"
                                value={sm}
                                checked={sidebarMode === sm}
                                onChange={(e) => setSidebarMode(e.target.value)}
                                className="text-teal-500 focus:ring-teal-500 bg-zinc-950 border-zinc-700"
                            />
                            <div className="flex items-center gap-2">
                                <Sidebar className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm font-medium text-zinc-200 capitalize">{sm}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </Section>

            <Section title="Density">
                <div className="flex gap-4">
                    {['compact', 'comfortable', 'spacious'].map((d) => (
                        <label key={d} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${density === d ? 'border-teal-500/50 bg-teal-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}>
                            <input
                                type="radio"
                                name="density"
                                value={d}
                                checked={density === d}
                                onChange={(e) => setDensity(e.target.value)}
                                className="text-teal-500 focus:ring-teal-500 bg-zinc-950 border-zinc-700"
                            />
                            <div className="flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm font-medium text-zinc-200 capitalize">{d}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </Section>

            {/* Full Design Console Modal */}
            {showFullConsole && (
                <Modal onClose={() => setShowFullConsole(false)} size="full">
                    {/* We import DesignConsole from existing component and pass required props */}
                    <div className="p-6 h-full bg-zinc-950">
                        <DesignConsole
                            initialTheme={theme}
                            onSave={(newTheme) => {
                                setThemeSeed(newTheme.seed);
                                setShowFullConsole(false);
                            }}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
};
