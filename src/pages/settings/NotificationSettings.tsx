
import React, { useState } from 'react';

export const NotificationSettings: React.FC = () => {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);
    const [weeklyDigest, setWeeklyDigest] = useState(true);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-zinc-100">Notifications</h2>
                <p className="text-sm text-zinc-400">Control how and when you maintain updates.</p>
            </div>

            <div className="space-y-4 rounded-lg bg-zinc-900 border border-zinc-800 p-6">

                {/* Email Alerts */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h3 className="text-base font-medium text-zinc-100">Email Alerts</h3>
                        <p className="text-sm text-zinc-400">Receive emails for critical system events.</p>
                    </div>
                    <button
                        onClick={() => setEmailAlerts(!emailAlerts)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlerts ? 'bg-teal-600' : 'bg-zinc-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="h-px bg-zinc-800" />

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h3 className="text-base font-medium text-zinc-100">Push Notifications</h3>
                        <p className="text-sm text-zinc-400">Receive desktop notifications while in the app.</p>
                    </div>
                    <button
                        onClick={() => setPushNotifs(!pushNotifs)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifs ? 'bg-teal-600' : 'bg-zinc-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifs ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="h-px bg-zinc-800" />

                {/* Weekly Digest */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h3 className="text-base font-medium text-zinc-100">Weekly Digest</h3>
                        <p className="text-sm text-zinc-400">Summary of project activity and AI usage.</p>
                    </div>
                    <button
                        onClick={() => setWeeklyDigest(!weeklyDigest)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${weeklyDigest ? 'bg-teal-600' : 'bg-zinc-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${weeklyDigest ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

            </div>
        </div>
    );
};
