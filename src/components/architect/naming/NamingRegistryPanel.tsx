/**
 * NAMING REGISTRY PANEL
 * Panel to view and manage registered names
 */

import React, { useEffect, useState } from 'react';
import { namingRegistry } from '../../../lib/naming/naming-registry';
import { NameRecord, NamingScope, NamingTargetType } from '../../../types/architect';
import { Search, Trash2, Copy } from 'lucide-react';

interface NamingRegistryPanelProps {
    projectId: string;
}

export const NamingRegistryPanel: React.FC<NamingRegistryPanelProps> = ({ projectId }) => {
    const [names, setNames] = useState<NameRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterScope, setFilterScope] = useState<NamingScope | 'all'>('all');
    const [filterKind, setFilterKind] = useState<NamingTargetType | 'all'>('all');
    const [search, setSearch] = useState('');

    const loadNames = async () => {
        setLoading(true);
        const results = await namingRegistry.getProjectNames(projectId, {
            scope: filterScope === 'all' ? undefined : filterScope,
            kind: filterKind === 'all' ? undefined : filterKind,
        });
        setNames(results);
        setLoading(false);
    };

    useEffect(() => {
        loadNames();
    }, [projectId, filterScope, filterKind]);

    // Client-side search for smoother experience
    const filteredNames = names.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (name: string, kind: NamingTargetType) => {
        if (confirm(`Are you sure you want to unregister "${name}"?`)) {
            await namingRegistry.unregister(projectId, name, kind);
            loadNames();
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-default border border-border-subtle rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle bg-background-subtle">
                <h2 className="text-label-md font-semibold text-text-primary mb-4">Naming Registry</h2>

                <div className="flex flex-col gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search names..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-background-default border border-border-subtle rounded-md text-body-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <select
                            value={filterScope}
                            onChange={(e) => setFilterScope(e.target.value as any)}
                            className="px-3 py-1.5 bg-background-default border border-border-subtle rounded-md text-body-xs"
                        >
                            <option value="all">All Scopes</option>
                            <option value="code">Code</option>
                            <option value="product">Product</option>
                            <option value="marketing">Marketing</option>
                            <option value="internal">Internal</option>
                        </select>

                        <select
                            value={filterKind}
                            onChange={(e) => setFilterKind(e.target.value as any)}
                            className="px-3 py-1.5 bg-background-default border border-border-subtle rounded-md text-body-xs"
                        >
                            <option value="all">All Types</option>
                            <option value="component">Component</option>
                            <option value="file">File</option>
                            <option value="route">Route</option>
                            <option value="db_table">DB Table</option>
                            <option value="feature">Feature</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredNames.length === 0 ? (
                    <div className="text-center py-8 text-text-muted text-body-sm">
                        No names registered yet.
                    </div>
                ) : (
                    <table className="w-full text-left text-body-sm">
                        <thead className="text-label-xs text-text-muted bg-background-subtle sticky top-0">
                            <tr>
                                <th className="px-3 py-2 rounded-l-md">Name</th>
                                <th className="px-3 py-2">Type</th>
                                <th className="px-3 py-2">Scope</th>
                                <th className="px-3 py-2">Review</th>
                                <th className="px-3 py-2 rounded-r-md"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {filteredNames.map((record) => (
                                <tr key={record.id} className="group hover:bg-background-subtle/50 transition-colors">
                                    <td className="px-3 py-3 font-mono text-brand-teal">{record.name}</td>
                                    <td className="px-3 py-3 capitalize">{record.kind.replace('_', ' ')}</td>
                                    <td className="px-3 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-label-xs
                      ${record.scope === 'code' ? 'bg-blue-100 text-blue-700' : ''}
                      ${record.scope === 'product' ? 'bg-purple-100 text-purple-700' : ''}
                      ${record.scope === 'marketing' ? 'bg-orange-100 text-orange-700' : ''}
                      ${record.scope === 'internal' ? 'bg-gray-100 text-gray-700' : ''}
                    `}>
                                            {record.scope}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-text-muted truncate max-w-[150px]">
                                        {record.description || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(record.name)}
                                                className="p-1 hover:bg-background-hover rounded"
                                                title="Copy"
                                            >
                                                <Copy className="w-3.5 h-3.5 text-text-muted" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.name, record.kind)}
                                                className="p-1 hover:bg-red-50 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-state-error" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
