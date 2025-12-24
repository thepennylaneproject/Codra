/**
 * CollabCursor
 * Renders a single collaborator's cursor with their name/avatar
 */

import { motion } from 'framer-motion';

interface CollabCursorProps {
    x: number;
    y: number;
    name: string;
    color: string;
}

export function CollabCursor({ x, y, name, color }: CollabCursorProps) {
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                x,
                y,
                pointerEvents: 'none',
                zIndex: 9999,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 500 }}
        >
            {/* Cursor Arrow */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={color}
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
                <path d="M5.65376 12.456L2.00376 3.042C1.63576 2.076 2.65576 1.206 3.56676 1.706L21.3428 11.584C22.2518 12.082 22.1218 13.434 21.1318 13.748L14.0968 16.012C13.7508 16.124 13.4588 16.361 13.2778 16.678L9.70376 22.904C9.14376 23.886 7.66576 23.634 7.45576 22.522L5.65376 12.456Z" />
            </svg>

            {/* Name Tag */}
            <div
                className="absolute top-5 left-4 px-2 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-lg"
                style={{ backgroundColor: color }}
            >
                {name}
            </div>
        </motion.div>
    );
}
