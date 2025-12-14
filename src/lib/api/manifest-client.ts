import { AssetManifestJSON } from '../assets/manifest/types';

const API_BASE = '/.netlify/functions';

export const manifestClient = {
    validate: async (manifest: unknown) => {
        const res = await fetch(`${API_BASE}/asset_manifest_validate`, {
            method: 'POST',
            body: JSON.stringify(manifest),
        });
        return res.json();
    },

    save: async (manifest: AssetManifestJSON, workspaceId: string, userId: string) => {
        const res = await fetch(`${API_BASE}/asset_manifest_save`, {
            method: 'POST',
            body: JSON.stringify({ manifest, workspaceId, userId }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to save manifest');
        }
        return res.json();
    },

    get: async (bundleId: string) => {
        const res = await fetch(`${API_BASE}/asset_manifest_get?bundleId=${bundleId}`);
        if (!res.ok) {
            throw new Error('Failed to fetch manifest');
        }
        return res.json() as Promise<AssetManifestJSON>;
    }
};
