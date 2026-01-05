/**
 * PROGRESS SEGMENT
 * Task progress or "Ready" status display
 */

import { ProgressStatus } from './hooks';

interface ProgressSegmentProps {
    progress: ProgressStatus;
}

export function ProgressSegment({ progress }: ProgressSegmentProps) {
    const { status, message } = progress;

    // Determine dot color and animation
    const dotClass =
        status === 'executing' ? 'bg-zinc-600 animate-pulse' :
        status === 'complete' ? 'bg-[#22C55E]' :
        status === 'error' ? 'bg-[#EF4444]' :
        'bg-[#8A8A9A]'; // idle

    return (
        <div className="flex items-center gap-2 px-4">
            <div className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className="text-sm text-zinc-300 font-medium">
                {message}
            </span>
        </div>
    );
}
