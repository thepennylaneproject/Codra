import React from 'react';
import { UserPresence } from '../../lib/collab/presence';
import { useReactFlow } from '@xyflow/react';

interface CursorOverlayProps {
    others: UserPresence[];
}

// Simple cursor SVG icon
const CursorIcon = ({ color }: { color: string }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
    >
        <path
            d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L11.7841 12.3673H5.65376Z"
            fill={color}
            stroke="white"
            strokeWidth="1"
        />
    </svg>
);

export const CursorOverlay: React.FC<CursorOverlayProps> = ({ others }) => {
    // We need to map cursor coordinates (world/canvas space or relative?)
    // Assuming 'x' and 'y' are absolute pixels relative to the container for now,
    // or meaningful coordinates that the parent component handles.
    // Actually, standard practice for canvas overlay:
    // If inside ReactFlow, the coords should probably be flow coordinates.
    // If so, we need ReactFlow instance to project them to screen or render inside the ZoomPane.

    // For this generic component, let's assume {x,y} are css 'left/top' values 
    // passed relatively or we just render them absolutely.
    // Ideally, this component is placed INSIDE the relative container.

    const { flowToScreenPosition } = useReactFlow();

    return (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
            {others.map((user) => {
                if (!user.cursor) return null;

                const screenPos = flowToScreenPosition({ x: user.cursor.x, y: user.cursor.y });

                return (
                    <div
                        key={user.id}
                        className="absolute transition-transform duration-100 ease-linear will-change-transform"
                        style={{
                            transform: `translate(${screenPos.x}px, ${screenPos.y}px)`,
                            left: 0,
                            top: 0,
                        }}
                    >
                        <CursorIcon color={user.color} />
                        <div
                            className="ml-4 -mt-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white shadow-sm"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
