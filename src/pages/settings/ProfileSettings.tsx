
import React from 'react';

export const ProfileSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-zinc-100">Profile</h2>
                <p className="text-sm text-zinc-400">Manage your public profile and account details.</p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-zinc-500 italic">Profile settings form goes here.</p>
                <div className="mt-4 grid gap-4 max-w-md">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Full Name</label>
                        <input type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100" placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email Address</label>
                        <input type="email" className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100" placeholder="jane@example.com" disabled />
                    </div>
                </div>
            </div>
        </div>
    );
};
