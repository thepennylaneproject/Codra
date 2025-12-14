import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ManifestEditor } from '../components/assets/manifest/ManifestEditor';
import { AssetBundle } from '../lib/assets/manifest/types';
import { Loader2, Plus } from 'lucide-react';

export function AssetsManifestPage() {
    const [bundles, setBundles] = useState<AssetBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Auth context (mocked for now, assumes user is logged in)
    // In real app use useAuth()
    const [userId, setUserId] = useState<string | null>(null);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    useEffect(() => {
        // Bootstrap auth
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                // Get first project as workspace
                const { data: projects } = await supabase.from('projects').select('id').limit(1);
                if (projects && projects[0]) {
                    setWorkspaceId(projects[0].id);
                }
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        if (workspaceId) {
            fetchBundles();
        }
    }, [workspaceId]);

    const fetchBundles = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('asset_bundles')
            .select('*')
            .eq('workspace_id', workspaceId!)
            .order('created_at', { ascending: false });

        if (data) setBundles(data as AssetBundle[]);
        setLoading(false);
    };

    const handleCreate = () => {
        setSelectedBundleId(null);
        setIsCreating(true);
    };

    const handleSelect = (id: string) => {
        setSelectedBundleId(id);
        setIsCreating(false);
    };

    const handleBack = () => {
        setSelectedBundleId(null);
        setIsCreating(false);
        fetchBundles(); // Refresh list
    };

    if (!workspaceId) return <div className="p-8 text-center">Loading Workspace...</div>;

    if (selectedBundleId || isCreating) {
        return (
            <div className="h-full flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center gap-4">
                    <button onClick={handleBack} className="text-zinc-400 hover:text-white">
                        &larr; Back to Bundles
                    </button>
                    <h1 className="text-xl font-bold">
                        {isCreating ? 'New Manifest' : 'Edit Manifest'}
                    </h1>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ManifestEditor
                        bundleId={selectedBundleId}
                        workspaceId={workspaceId}
                        userId={userId!}
                        onSaved={handleBack}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Asset Manifests</h1>
                    <p className="text-zinc-400">Manage asset bundles, definitions, and codebase placements.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Manifest
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            ) : bundles.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-white/10 rounded-xl">
                    <p className="text-zinc-500">No asset bundles found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bundles.map(bundle => (
                        <div
                            key={bundle.id}
                            onClick={() => handleSelect(bundle.id)}
                            className="group p-6 bg-zinc-900/50 border border-white/10 hover:border-violet-500/50 rounded-xl cursor-pointer transition-all"
                        >
                            <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 mb-2">
                                {bundle.name}
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                                {bundle.description || "No description"}
                            </p>
                            <div className="flex items-center gap-2">
                                {bundle.tags?.map(tag => (
                                    <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
