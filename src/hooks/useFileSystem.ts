import { useState, useEffect } from 'react';
import { localFS, FileEntry } from '../lib/fs/local';
import { EditorFile } from '../components/editor/types';
// I will implement raw IDB to avoid adding dependencies if possible, or assume simple IDB usage.
// Actually, raw IDB is verbose. I'll use a simple wrapper.

// Simple IDB wrapper since we can't easily install packages without user permission and it's cleaner.
const DB_NAME = 'codra-fs';
const STORE_NAME = 'handles';

const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

async function saveHandle(key: string, handle: FileSystemHandle) {
    const db = await dbPromise;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(handle, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function getHandle(key: string): Promise<FileSystemHandle | undefined> {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export type FileSystemNode = FileEntry & {
    children?: FileSystemNode[];
    isOpen?: boolean; // For directory expansion state in UI
};

export const useFileSystem = () => {
    const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [fileSystemTree, setFileSystemTree] = useState<FileSystemNode[]>([]);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (!('showDirectoryPicker' in window)) {
            setIsSupported(false);
        } else {
            // personalized restore
            restoreHandle();
        }
    }, []);

    const restoreHandle = async () => {
        try {
            const handle = await getHandle('root') as FileSystemDirectoryHandle;
            if (handle) {
                // We need to re-verify permission
                const hasPermission = await localFS.verifyPermission(handle, 'read');
                if (hasPermission) {
                    console.log('[useFileSystem] Restored handle with valid permissions');
                    setRootHandle(handle);
                    await loadDirectory(handle, '', true); // Pass isRoot=true
                } else {
                    // Permission not granted - don't set rootHandle
                    // This will show the "Open Folder" dialog instead
                    console.log('[useFileSystem] Stored handle has no permissions, showing picker');
                    // Optionally clear the stored handle since it's unusable
                    // We don't set rootHandle, so the "Open Local Project" dialog will appear
                }
            }
        } catch (e) {
            console.error("Failed to restore handle", e);
        }
    };

    const loadDirectory = async (handle: FileSystemDirectoryHandle, parentPath: string = '', isRoot: boolean = false): Promise<FileSystemNode[]> => {
        try {
            // Verify permission before listing if it's the root or we encountered it
            if (isRoot && (await localFS.verifyPermission(handle, 'read')) === false) {
                // Try requesting?
                const granted = await localFS.requestPermission(handle, 'read');
                if (!granted) return [];
            }

            const entries = await localFS.listDirectory(handle);
            const nodes: FileSystemNode[] = entries.map(entry => ({
                ...entry,
                path: parentPath ? `${parentPath}/${entry.name}` : entry.name,
                children: undefined // Lazy load
            }));

            if (isRoot) {
                console.log('[useFileSystem] Setting file system tree with', nodes.length, 'entries');
                setFileSystemTree(nodes);
            }
            return nodes;
        } catch (error) {
            console.error("Error loading directory", error);
            return [];
        }
    };

    const openRootDirectory = async () => {
        try {
            const handle = await localFS.openDirectory();
            console.log('[useFileSystem] Directory handle received, setting state');
            setRootHandle(handle);
            await saveHandle('root', handle);
            await loadDirectory(handle, '', true); // Pass isRoot=true
        } catch (error) {
            if ((error as any).name !== 'AbortError') {
                console.error("Error opening directory", error);
            }
        }
    };

    const readFileContent = async (fileNode: FileEntry): Promise<EditorFile> => {
        const content = await localFS.readFile(fileNode.handle as FileSystemFileHandle);
        return {
            id: fileNode.path, // Use path as ID
            name: fileNode.name,
            path: fileNode.path,
            language: getLanguageFromExtension(fileNode.name),
            content,
            isDirty: false
        };
    };

    const saveFileContent = async (fileNode: FileEntry, content: string) => {
        await localFS.writeFile(fileNode.handle as FileSystemFileHandle, content);
    };

    // Helper to toggle directory expansion (fetch children if needed)
    const toggleDirectory = async (path: string, currentTree: FileSystemNode[]): Promise<FileSystemNode[]> => {
        // Recursive search to find the node
        return Promise.all(currentTree.map(async (node) => {
            if (node.path === path && node.kind === 'directory') {
                if (node.isOpen) {
                    return { ...node, isOpen: false };
                } else {
                    // Load children if not present
                    const children = node.children || await loadDirectory(node.handle as FileSystemDirectoryHandle, node.path);
                    return { ...node, children, isOpen: true };
                }
            } else if (node.kind === 'directory' && node.children && path.startsWith(node.path + '/')) {
                // If path is inside this directory, go deeper
                return { ...node, children: await toggleDirectory(path, node.children) };
            }
            return node;
        }));
    };

    const onToggleDirectory = async (path: string) => {
        const newTree = await toggleDirectory(path, fileSystemTree);
        setFileSystemTree(newTree);
    };

    return {
        isSupported,
        rootHandle,
        fileSystemTree,
        openRootDirectory,
        readFileContent,
        saveFileContent,
        onToggleDirectory,
        refreshDirectory: () => rootHandle && loadDirectory(rootHandle)
    };
};

function getLanguageFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'js': return 'javascript';
        case 'jsx': return 'javascript';
        case 'css': return 'css';
        case 'html': return 'html';
        case 'json': return 'json';
        case 'md': return 'markdown';
        default: return 'plaintext';
    }
}
