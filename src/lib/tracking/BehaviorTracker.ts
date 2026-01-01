/**
 * BEHAVIOR TRACKER
 * Tracks user behavior to improve Smart Defaults inference over time
 */

import { supabase } from '../supabase';
import type {
    BehaviorEvent,
    UserHistory,
    DeskId,
    ExportFormat,
} from '../../domain/smart-defaults-types';

/**
 * Behavior Tracker for learning user preferences
 */
export class BehaviorTracker {
    /**
     * Track a user behavior event
     */
    async track(event: BehaviorEvent): Promise<void> {
        try {
            const { error } = await supabase
                .from('behavior_events')
                .insert({
                    user_id: event.userId,
                    timestamp: event.timestamp.toISOString(),
                    event: event.event,
                    metadata: event.metadata,
                });

            if (error) {
                console.error('Failed to track behavior event:', error);
            }
        } catch (err) {
            console.error('Error tracking behavior:', err);
        }
    }

    /**
     * Get user history from recent behavior events
     */
    async getUserHistory(userId: string): Promise<UserHistory> {
        try {
            const { data: events, error } = await supabase
                .from('behavior_events')
                .select('*')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(100);

            if (error || !events) {
                console.error('Failed to fetch user history:', error);
                return {};
            }

            return {
                qualityPreference: this.inferQualityPreference(events),
                lastUsedDesk: this.getLastUsedDesk(events),
                preferredExportFormat: this.getPreferredFormat(events),
                settingOverrides: this.getCommonOverrides(events),
            };
        } catch (err) {
            console.error('Error fetching user history:', err);
            return {};
        }
    }

    /**
     * Infer quality preference from setting changes
     */
    private inferQualityPreference(
        events: Array<{ event: string; metadata: Record<string, unknown> }>
    ): 'high' | 'balanced' | 'low' | undefined {
        const qualityChanges = events.filter(
            (e) => e.event === 'setting_changed' && e.metadata.setting === 'qualityPriority'
        );

        if (qualityChanges.length === 0) return undefined;

        // Most recent preference wins
        const lastValue = qualityChanges[0].metadata.value as string;
        if (lastValue === 'quality') return 'high';
        if (lastValue === 'fast' || lastValue === 'cheap') return 'low';
        return 'balanced';
    }

    /**
     * Get last used desk from desk switches
     */
    private getLastUsedDesk(
        events: Array<{ event: string; metadata: Record<string, unknown> }>
    ): DeskId | undefined {
        const deskSwitch = events.find((e) => e.event === 'desk_switched');
        return deskSwitch?.metadata.deskId as DeskId | undefined;
    }

    /**
     * Get preferred export format from choices
     */
    private getPreferredFormat(
        events: Array<{ event: string; metadata: Record<string, unknown> }>
    ): ExportFormat | undefined {
        const formatChoices = events.filter((e) => e.event === 'export_format_chosen');

        if (formatChoices.length === 0) return undefined;

        // Count frequency of each format
        const counts: Record<string, number> = {};
        formatChoices.forEach((e) => {
            const format = e.metadata.format as string;
            counts[format] = (counts[format] || 0) + 1;
        });

        // Return most common format
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted[0]?.[0] as ExportFormat | undefined;
    }

    /**
     * Get common setting overrides
     */
    private getCommonOverrides(
        events: Array<{ event: string; metadata: Record<string, unknown> }>
    ): Record<string, unknown> {
        const settingChanges = events.filter((e) => e.event === 'setting_changed');

        const overrides: Record<string, unknown> = {};
        settingChanges.forEach((e) => {
            const setting = e.metadata.setting as string;
            const value = e.metadata.value;
            if (setting && value !== undefined) {
                overrides[setting] = value;
            }
        });

        return overrides;
    }
}

/**
 * Singleton instance
 */
export const behaviorTracker = new BehaviorTracker();
