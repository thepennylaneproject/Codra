/**
 * CollabPresenceLayer
 * Overlay that renders all remote cursors.
 * Uses mock data initially; designed for Liveblocks useOthers integration.
 */

import { useState, useEffect, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CollabCursor } from './CollabCursor';

interface MockCollaborator {
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
}

// Mock collaborators for UI demonstration - Emptying as requested
const MOCK_COLLABORATORS: MockCollaborator[] = [];

interface CollabPresenceLayerProps {
    children: ReactNode;
    enabled?: boolean;
}

export function CollabPresenceLayer({ children, enabled = true }: CollabPresenceLayerProps) {
    const [collaborators, setCollaborators] = useState<MockCollaborator[]>(MOCK_COLLABORATORS);
    const [showCollaborators, setShowCollaborators] = useState(enabled);

    // Simulate cursor movement for mock collaborators
    useEffect(() => {
        if (!showCollaborators) return;

        const interval = setInterval(() => {
            setCollaborators(prev =>
                prev.map(c => ({
                    ...c,
                    x: c.x + (Math.random() - 0.5) * 20,
                    y: c.y + (Math.random() - 0.5) * 20,
                }))
            );
        }, 100);

        return () => clearInterval(interval);
    }, [showCollaborators]);

    // Toggle with keyboard shortcut (Alt+C)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 'c') {
                setShowCollaborators(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative w-full h-full">
            {children}

            {/* Remote Cursors Layer */}
            {showCollaborators && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <AnimatePresence>
                        {collaborators.map(collab => (
                            <CollabCursor
                                key={collab.id}
                                x={collab.x}
                                y={collab.y}
                                name={collab.name}
                                color={collab.color}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Indicator - Only show if there are collaborators and it is enabled */}
            {showCollaborators && collaborators.length > 0 && (
                <div className="absolute bottom-10 left-6 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg z-50">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {collaborators.length} Live
                </div>
            )}
        </div>
    );
}
