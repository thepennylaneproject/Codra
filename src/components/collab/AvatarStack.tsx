import React from 'react';
import { UserPresence } from '../../lib/collab/presence';

interface AvatarStackProps {
    users: UserPresence[];
    max?: number;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({ users, max = 5 }) => {
    const visibleUsers = users.slice(0, max);
    const remaining = users.length - max;

    return (
        <div className="flex -space-x-2 overflow-hidden">
            {visibleUsers.map((user) => (
                <div
                    key={user.id}
                    className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800"
                    title={user.name}
                >
                    {user.avatar ? (
                        <img
                            className="h-full w-full rounded-full object-cover"
                            src={user.avatar}
                            alt={user.name}
                        />
                    ) : (
                        <div
                            className="flex h-full w-full items-center justify-center rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white" />
                </div>
            ))}
            {remaining > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white dark:bg-gray-700 dark:ring-gray-800">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-300">
                        +{remaining}
                    </span>
                </div>
            )}
        </div>
    );
};
