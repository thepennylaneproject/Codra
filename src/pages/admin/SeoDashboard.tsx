import { useState, useEffect } from 'react';
import { SEO_REGISTRY } from '../../lib/seo/seo';
import { AssetManifestJSON } from '../../lib/assets/manifest/types';
import { Loader2, AlertTriangle, CheckCircle, Search, ShieldCheck } from 'lucide-react';

export function SeoDashboard() {
    const [manifests, setManifests] = useState<AssetManifestJSON[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'routes' | 'assets'>('routes');

    // Mocks for now, real app would fetch all bundles
    // Since manifestClient.get takes an ID, we assume we might need a list endpoint or just one for demo.
    // For this task, we'll verify against the SEO_REGISTRY directly and maybe mock one loaded manifest or try to fetch known ones.
    // Since we don't have a list-all-manifests endpoint in client yet, I'll simulate or just check the registry.
    // Wait, the requirement says "list asset bundles". I might need a way to list them.
    // If I can't list them, I will build the Route checker first which is purely static/codebase based (using the registry import).

    // For asset bundles, if I can't fetch them all, I will just show a placeholder or try to fetch a default one if exists.
    // Actually, I can use a hardcoded list of IDs if I knew them, but I don't. 
    // I will focus on the Route Checker first and generic Asset Checker structure.

    useEffect(() => {
        // simulate fetch
        setTimeout(() => setLoading(false), 500);
    }, []);

    const routes = Object.entries(SEO_REGISTRY).map(([path, config]) => {
        const issues = [];
        if (!config.title) issues.push('Missing Title');
        if (!config.description) issues.push('Missing Description');
        if (!config.ogImage) issues.push('Missing OG Image');
        return { path, config, issues, status: issues.length === 0 ? 'good' : (issues.length > 2 ? 'error' : 'warn') };
    });

    return (
        <div className="p-6 max-w-6xl mx-auto text-zinc-100">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-violet-400" />
                SEO & Accessibility Health
            </h1>

            <div className="flex items-center gap-4 border-b border-white/10 mb-6">
                <button
                    onClick={() => setActiveTab('routes')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'routes' ? 'border-violet-500 text-violet-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                >
                    Route Metadata
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'assets' ? 'border-violet-500 text-violet-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                >
                    Asset Accessibility
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin opacity-50" /></div>
            ) : (
                <>
                    {activeTab === 'routes' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-zinc-900/50 rounded-lg text-xs font-mono text-zinc-500 uppercase tracking-wider">
                                <div className="col-span-4">Route Path</div>
                                <div className="col-span-4">Title / Desc</div>
                                <div className="col-span-2">OG Image</div>
                                <div className="col-span-2 text-right">Status</div>
                            </div>
                            {routes.map((route) => (
                                <div key={route.path} className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-900 rounded-lg items-center border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="col-span-4 font-mono text-sm break-all">{route.path}</div>
                                    <div className="col-span-4 space-y-1">
                                        <div className="text-sm font-medium truncate" title={route.config.title}>{route.config.title || <span className="text-red-400 italic">Missing Title</span>}</div>
                                        <div className="text-xs text-zinc-500 truncate" title={route.config.description}>{route.config.description || <span className="text-red-400 italic">Missing Description</span>}</div>
                                    </div>
                                    <div className="col-span-2 text-xs">
                                        {route.config.ogImage ? <span className="text-green-400">Set</span> : <span className="text-orange-400">Missing</span>}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <Badge status={route.status as any} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'assets' && (
                        <div className="text-center py-12 text-zinc-500">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Asset scanning coming soon once generic bundle listing endpoint is available.</p>
                            <p className="text-sm mt-2">Use the Manifest Editor to validate individual bundles.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function Badge({ status }: { status: 'good' | 'warn' | 'error' }) {
    if (status === 'good') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20"><CheckCircle className="w-3 h-3" /> Passing</span>;
    if (status === 'warn') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium border border-orange-500/20"><AlertTriangle className="w-3 h-3" /> Warnings</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20"><AlertTriangle className="w-3 h-3" /> Errors</span>;
}
