/**
 * InfiniteCanvasView
 * A wrapper for pan/zoom freeform spatial layout.
 * Uses CSS transforms for performance; designed for react-infinite-canvas integration.
 */

import { useState, useRef, useCallback, ReactNode, WheelEvent, MouseEvent } from 'react';
import { motion } from 'framer-motion';

interface InfiniteCanvasViewProps {
    children: ReactNode;
    minScale?: number;
    maxScale?: number;
}

interface Transform {
    x: number;
    y: number;
    scale: number;
}

export function InfiniteCanvasView({
    children,
    minScale = 0.25,
    maxScale = 2
}: InfiniteCanvasViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Handle wheel for zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setTransform(prev => ({
            ...prev,
            scale: Math.min(maxScale, Math.max(minScale, prev.scale + delta)),
        }));
    }, [minScale, maxScale]);

    // Handle pan start
    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (e.button === 1 || e.altKey) { // Middle mouse or Alt+click
            setIsPanning(true);
            setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        }
    }, [transform.x, transform.y]);

    // Handle pan move
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isPanning) {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            }));
        }
    }, [isPanning, panStart]);

    // Handle pan end
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    // Reset view
    const handleReset = useCallback(() => {
        setTransform({ x: 0, y: 0, scale: 1 });
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-zinc-950"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
            {/* Grid Background */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `
                        radial-gradient(circle, rgba(244, 63, 94, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
                    backgroundPosition: `${transform.x}px ${transform.y}px`,
                }}
            />

            {/* Canvas Content */}
            <motion.div
                style={{
                    x: transform.x,
                    y: transform.y,
                    scale: transform.scale,
                    transformOrigin: 'center center',
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 500 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                {children}
            </motion.div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md rounded-lg p-1 shadow-lg z-50">
                <button
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(minScale, prev.scale - 0.25) }))}
                    className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors text-sm font-mono"
                >
                    −
                </button>
                <span className="text-[10px] font-mono text-zinc-500 w-12 text-center">
                    {Math.round(transform.scale * 100)}%
                </span>
                <button
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(maxScale, prev.scale + 0.25) }))}
                    className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors text-sm font-mono"
                >
                    +
                </button>
                <div className="w-px h-4 bg-zinc-700" />
                <button
                    onClick={handleReset}
                    className="px-2 py-1 hover:bg-zinc-800 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
