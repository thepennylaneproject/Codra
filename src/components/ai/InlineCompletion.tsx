import React from 'react';

interface InlineCompletionProps {
    suggestion: string;
    isVisible: boolean;
    position?: { top: number; left: number }; // For absolute positioning if overlaying
    onAccept: () => void;
    onReject: () => void;
}

export const InlineCompletion: React.FC<InlineCompletionProps> = ({
    suggestion,
    isVisible,
    position,
    onAccept,
    onReject
}) => {
    if (!isVisible || !suggestion) return null;

    return (
        <div
            className="absolute z-50 pointer-events-none"
            style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0
            }}
        >
            <div className="relative">
                {/* Ghost text display - simulated */}
                <span className="font-mono text-zinc-500 opacity-60">
                    {suggestion}
                </span>

                {/* Hint tooltip */}
                <div className="absolute top-full left-0 mt-1 flex items-center gap-2 px-2 py-1 bg-indigo-600/90 text-white text-[10px] rounded shadow-lg backdrop-blur pointer-events-auto">
                    <span className="font-bold cursor-pointer hover:underline" onClick={onAccept}>Tab to accept</span>
                    <span className="w-px h-3 bg-white/20"></span>
                    <span className="font-bold cursor-pointer hover:underline" onClick={onReject}>Esc to reject</span>
                </div>
            </div>
        </div>
    );
};
