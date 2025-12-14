/**
 * RAIL TOOLTIP
 * Simple tooltip for Icon Rail items in collapsed mode
 */

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface RailTooltipProps {
    children: React.ReactNode;
    content: string;
    shortcut?: string;
    side?: 'right' | 'top' | 'bottom' | 'left';
    disabled?: boolean;
}

export const RailTooltip: React.FC<RailTooltipProps> = ({
    children,
    content,
    shortcut,
    side = 'right',
    disabled = false,
}) => {
    if (disabled) return <>{children}</>;

    return (
        <Tooltip.Provider delayDuration={100}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side={side}
                        sideOffset={5}
                        className="z-50 px-3 py-1.5 text-xs font-medium text-background-default bg-text-primary rounded-md shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    >
                        <div className="flex items-center gap-2">
                            <span>{content}</span>
                            {shortcut && (
                                <span className="px-1 py-0.5 rounded bg-white/20 text-white/90 text-[10px] font-mono leading-none">
                                    {shortcut}
                                </span>
                            )}
                        </div>
                        <Tooltip.Arrow className="fill-text-primary" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
};
