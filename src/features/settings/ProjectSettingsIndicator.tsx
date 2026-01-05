/**
 * PROJECT SETTINGS INDICATOR
 * Shows in project header when custom settings are active
 */

import { Settings } from 'lucide-react';
import { useEffectiveSettings } from '../../lib/smart-defaults/hooks/useEffectiveSettings';

interface ProjectSettingsIndicatorProps {
    projectId: string;
}

export function ProjectSettingsIndicator({ projectId }: ProjectSettingsIndicatorProps) {
    const effectiveSettings = useEffectiveSettings(projectId);

    if (!effectiveSettings.hasOverrides) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-200/40 border border-zinc-300/60 rounded-full">
            <Settings size={12} className="text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-500">
                Using custom settings
            </span>
        </div>
    );
}
