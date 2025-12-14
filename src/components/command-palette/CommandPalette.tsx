
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCommandPalette } from './useCommandPalette';
import { useCommands, Command } from './useCommands';
import { CommandInput } from './CommandInput';
import { CommandGroup } from './CommandGroup';
import { CommandItem } from './CommandItem';

export const CommandPalette: React.FC = () => {
    const { isOpen, close, toggle } = useCommandPalette();
    const [search, setSearch] = useState('');
    const { commands } = useCommands(search);

    // Track selected index for keyboard navigation
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Group commands logic
    const sections = useMemo(() => {
        const grouped = {
            actions: commands.filter(c => c.group === 'actions'),
            navigation: commands.filter(c => c.group === 'navigation'),
            recent: commands.filter(c => c.group === 'recent'),
            settings: commands.filter(c => c.group === 'settings'),
        };

        // Define order of groups in the flat list for navigation
        const flatList: Command[] = [];

        // Push in specific visual order
        // 1. Quick Actions (if any)
        if (grouped.actions.length > 0) flatList.push(...grouped.actions);
        // 2. Navigation (if any)
        if (grouped.navigation.length > 0) flatList.push(...grouped.navigation);
        // 3. Recent Projects (if any)
        if (grouped.recent.length > 0) flatList.push(...grouped.recent);
        // 4. Settings (if any)
        if (grouped.settings.length > 0) flatList.push(...grouped.settings);

        return { grouped, flatList };
    }, [commands]);

    // Reset selection when search changes or opens
    useEffect(() => {
        setSelectedIndex(0);
    }, [search, isOpen]);

    // Global keyboard listener for Toggle (Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggle();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggle]);

    // Keyboard navigation within the palette
    useEffect(() => {
        if (!isOpen) return;

        const handleNavigation = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(i => (i + 1) % sections.flatList.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(i => (i - 1 + sections.flatList.length) % sections.flatList.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    const command = sections.flatList[selectedIndex];
                    if (command) {
                        command.action();
                        close();
                        setSearch('');
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    close();
                    break;
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, sections.flatList, selectedIndex, close]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearch(''); // Reset search on close
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const selectedId = sections.flatList[selectedIndex]?.id;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={close}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed left-1/2 top-[15%] z-[101] w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/80 flex flex-col max-h-[70vh]"
                    >
                        <CommandInput value={search} onValueChange={setSearch} />

                        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                            {sections.flatList.length === 0 ? (
                                <div className="px-6 py-12 text-center text-zinc-500 text-sm">
                                    No results found.
                                </div>
                            ) : (
                                <div className="pb-2">
                                    {sections.grouped.actions.length > 0 && (
                                        <CommandGroup heading="Quick Actions">
                                            {sections.grouped.actions.map(cmd => (
                                                <CommandItem
                                                    key={cmd.id}
                                                    {...cmd}
                                                    isSelected={cmd.id === selectedId}
                                                    onSelect={() => { cmd.action(); close(); setSearch(''); }}
                                                    onMouseEnter={() => {
                                                        const idx = sections.flatList.findIndex(c => c.id === cmd.id);
                                                        if (idx !== -1) setSelectedIndex(idx);
                                                    }}
                                                />
                                            ))}
                                        </CommandGroup>
                                    )}

                                    {sections.grouped.navigation.length > 0 && (
                                        <CommandGroup heading="Navigation">
                                            {sections.grouped.navigation.map(cmd => (
                                                <CommandItem
                                                    key={cmd.id}
                                                    {...cmd}
                                                    isSelected={cmd.id === selectedId}
                                                    onSelect={() => { cmd.action(); close(); setSearch(''); }}
                                                    onMouseEnter={() => {
                                                        const idx = sections.flatList.findIndex(c => c.id === cmd.id);
                                                        if (idx !== -1) setSelectedIndex(idx);
                                                    }}
                                                />
                                            ))}
                                        </CommandGroup>
                                    )}

                                    {sections.grouped.recent.length > 0 && (
                                        <CommandGroup heading="Recent Projects">
                                            {sections.grouped.recent.map(cmd => (
                                                <CommandItem
                                                    key={cmd.id}
                                                    {...cmd}
                                                    isSelected={cmd.id === selectedId}
                                                    onSelect={() => { cmd.action(); close(); setSearch(''); }}
                                                    onMouseEnter={() => {
                                                        const idx = sections.flatList.findIndex(c => c.id === cmd.id);
                                                        if (idx !== -1) setSelectedIndex(idx);
                                                    }}
                                                />
                                            ))}
                                        </CommandGroup>
                                    )}

                                    {sections.grouped.settings.length > 0 && (
                                        <CommandGroup heading="Settings">
                                            {sections.grouped.settings.map(cmd => (
                                                <CommandItem
                                                    key={cmd.id}
                                                    {...cmd}
                                                    isSelected={cmd.id === selectedId}
                                                    onSelect={() => { cmd.action(); close(); setSearch(''); }}
                                                    onMouseEnter={() => {
                                                        const idx = sections.flatList.findIndex(c => c.id === cmd.id);
                                                        if (idx !== -1) setSelectedIndex(idx);
                                                    }}
                                                />
                                            ))}
                                        </CommandGroup>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer / Shortcuts hint - as requested in design */}
                        <div className="hidden border-t border-white/5 bg-zinc-900/30 px-4 py-2.5 text-[10px] text-zinc-500 md:flex items-center justify-between font-medium">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1.5"><kbd className="font-sans bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded min-w-[16px] text-center">↵</kbd> to select</span>
                                <span className="flex items-center gap-1.5"><kbd className="font-sans bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded min-w-[16px] text-center">↓</kbd> <kbd className="font-sans bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded min-w-[16px] text-center">↑</kbd> to navigate</span>
                            </div>
                            <span className="flex items-center gap-1.5"><kbd className="font-sans bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded min-w-[24px] text-center">esc</kbd> to close</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
