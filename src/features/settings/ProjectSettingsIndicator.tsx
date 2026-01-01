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
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FF4D4D]/5 border border-[#FF4D4D]/10 rounded-full">
            <Settings size={12} className="text-[#FF4D4D]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#FF4D4D]">
                Using custom settings
            </span>
        </div>
    );
}
