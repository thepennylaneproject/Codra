
import React from 'react';

export const UsersPage: React.FC = () => {
    // Mock user data
    const users = [
        { id: 1, name: 'Sarah Sahl', email: 'sarah@example.com', role: 'Admin', plan: 'Team', status: 'Active' },
        { id: 2, name: 'John Doe', email: 'john@example.com', role: 'User', plan: 'Pro', status: 'Active' },
        { id: 3, name: 'Jane Smith', email: 'jane@example.com', role: 'User', plan: 'Free', status: 'Inactive' },
        { id: 4, name: 'Mike Johnson', email: 'mike@example.com', role: 'User', plan: 'Pro', status: 'Active' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">User Management</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Export Users
                </button>
            </div>

            <div className="bg-surface-glass border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-background-subtle text-text-muted border-b border-border-subtle">
                        <tr>
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">Email</th>
                            <th className="px-6 py-3 font-medium">Role</th>
                            <th className="px-6 py-3 font-medium">Plan</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-background-subtle/30 transition">
                                <td className="px-6 py-4 font-medium text-text-primary">{user.name}</td>
                                <td className="px-6 py-4 text-text-soft">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'Admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-text-soft">{user.plan}</td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 ${user.status === 'Active' ? 'text-green-400' : 'text-gray-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-400 hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
