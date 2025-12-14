/**
 * useNavPreference
 * Hook to persist sidebar state (pinned/unpinned)
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'codra-nav-preference';

export function useNavPreference() {
    const [isPinned, setIsPinned] = useState<boolean>(true);
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    // Load persistence
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setIsPinned(parsed.isPinned);
                setIsExpanded(parsed.isPinned); // expanded by default if pinned
            } catch (e) {
                console.error('Failed to parse nav preference', e);
            }
        }
    }, []);

    // Save persistence
    const setPinned = (pinned: boolean) => {
        setIsPinned(pinned);
        // If pinning, force expand. If unpinning, likely want to collapse or stay capable of hover.
        if (pinned) setIsExpanded(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ isPinned: pinned }));
    };

    return {
        isPinned,
        setPinned,
        isExpanded,
        setIsExpanded,
    };
}
