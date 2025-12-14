import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export interface UserPresence {
    id: string;
    name: string;
    avatar: string;
    color: string;
    online_at: string;
    cursor?: { x: number; y: number };
    selection?: { nodeId: string } | { file: string; range: any };
}

export type PresenceEvent =
    | { type: 'join'; user: UserPresence }
    | { type: 'leave'; user: UserPresence }
    | { type: 'cursor'; userId: string; x: number; y: number }
    | { type: 'selection'; userId: string; selection: any }
    | { type: 'sync'; users: UserPresence[] };

export class PresenceManager {
    private channel: RealtimeChannel | null = null;
    private presenceState: Record<string, UserPresence> = {};
    private listeners: Set<(event: PresenceEvent) => void> = new Set();
    private projectId: string;
    private currentUser: UserPresence | null = null;

    public get currentUserState() {
        return this.currentUser;
    }

    constructor(projectId: string) {
        this.projectId = projectId;
    }

    public async join(user: Omit<UserPresence, 'online_at'>) {
        if (this.channel) return;

        this.currentUser = {
            ...user,
            online_at: new Date().toISOString(),
        };

        this.channel = supabase.channel(`project:${this.projectId}`, {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                const newState = this.channel?.presenceState() || {};
                const users: UserPresence[] = [];

                // Supabase returns an object where keys are user IDs and values are arrays of presence objects
                Object.values(newState).forEach((presences: any) => {
                    presences.forEach((presence: any) => {
                        if (presence.id) {
                            users.push(presence as UserPresence);
                        }
                    });
                });

                this.presenceState = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
                this.notify({ type: 'sync', users });
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                newPresences.forEach((p: any) => {
                    this.notify({ type: 'join', user: p as UserPresence });
                });
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                leftPresences.forEach((p: any) => {
                    this.notify({ type: 'leave', user: p as UserPresence });
                });
            })
            .on('broadcast', { event: 'cursor' }, (payload) => {
                this.notify({ type: 'cursor', userId: payload.payload.userId, x: payload.payload.x, y: payload.payload.y });
            })
            .on('broadcast', { event: 'selection' }, (payload) => {
                this.notify({ type: 'selection', userId: payload.payload.userId, selection: payload.payload.selection });
            });

        await this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await this.channel?.track(this.currentUser!);
            }
        });
    }

    public leave() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
    }

    public updateCursor(x: number, y: number) {
        if (!this.channel || !this.currentUser) return;

        // Broadcast is faster/cheaper for high frequency updates like cursors
        this.channel.send({
            type: 'broadcast',
            event: 'cursor',
            payload: { userId: this.currentUser.id, x, y },
        });
    }

    public async updateSelection(selection: any) {
        if (!this.channel || !this.currentUser) return;

        // Also broadcast selection
        this.channel.send({
            type: 'broadcast',
            event: 'selection',
            payload: { userId: this.currentUser.id, selection },
        });

        // Also update presence state so late joiners see it? 
        // Actually, stick to broadcast for ephemeral, track for persistent. 
        // Let's update track as well for selection so it persists.
        this.currentUser = { ...this.currentUser, selection };
        await this.channel.track(this.currentUser);
    }

    public subscribe(callback: (event: PresenceEvent) => void) {
        this.listeners.add(callback);
        // Send initial sync
        callback({ type: 'sync', users: Object.values(this.presenceState) });
        return () => this.listeners.delete(callback);
    }

    private notify(event: PresenceEvent) {
        this.listeners.forEach((l) => l(event));
    }
}
