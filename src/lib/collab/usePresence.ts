import { useEffect, useState, useCallback, useRef } from 'react';
import { PresenceManager, UserPresence, PresenceEvent } from './presence';
import { getCurrentUser } from '../supabase';

export function usePresence(projectId: string) {
    const [others, setOthers] = useState<UserPresence[]>([]);
    const [currentUser, setCurrentUser] = useState<UserPresence | null>(null);
    const managerRef = useRef<PresenceManager | null>(null);

    // Initialize manager
    useEffect(() => {
        const manager = new PresenceManager(projectId);
        managerRef.current = manager;

        const init = async () => {
            const { user } = await getCurrentUser();

            if (user) {
                // Generate a random color for the user if they don't have one
                const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', '#33FFF5'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                const presenceUser: Omit<UserPresence, 'online_at'> = {
                    id: user.id,
                    name: user.email?.split('@')[0] || 'Anonymous', // Fallback name
                    avatar: user.user_metadata?.avatar_url || '',
                    color: user.user_metadata?.color || randomColor,
                };

                await manager.join(presenceUser);
                setCurrentUser({ ...presenceUser, online_at: new Date().toISOString() });
            }
        };

        init();

        const unsubscribe = manager.subscribe((event: PresenceEvent) => {
            if (event.type === 'sync') {
                // Filter out self from others
                setOthers(() => {
                    // We get the full list from sync, but we want to filter out self.
                    // Since manager.currentUser might not be set yet during initial sync, we rely on the list.
                    // Actually, the sync event gives us the full state. 
                    // We'll filter in the render or derived state if needed, but 'others' usually implies not self.
                    // Let's filter if we know our ID.
                    const myId = manager.currentUserState?.id;
                    console.log('Syncing presence, my ID:', myId);
                    if (!myId) return event.users;
                    return event.users.filter(u => u.id !== myId);
                });
            } else if (event.type === 'join') {
                setOthers(prev => [...prev, event.user]);
            } else if (event.type === 'leave') {
                setOthers(prev => prev.filter(u => u.id !== event.user.id));
            } else if (event.type === 'cursor') {
                setOthers(prev => prev.map(u => {
                    if (u.id === event.userId) {
                        return { ...u, cursor: { x: event.x, y: event.y } };
                    }
                    return u;
                }));
            } else if (event.type === 'selection') {
                setOthers(prev => prev.map(u => {
                    if (u.id === event.userId) {
                        return { ...u, selection: event.selection };
                    }
                    return u;
                }));
            }
        });

        return () => {
            manager.leave();
            unsubscribe();
        };
    }, [projectId]);

    const updateCursor = useCallback((x: number, y: number) => {
        managerRef.current?.updateCursor(x, y);
    }, []);

    const updateSelection = useCallback((selection: any) => {
        managerRef.current?.updateSelection(selection);
    }, []);

    return {
        others,
        currentUser,
        updateCursor,
        updateSelection,
    };
}
