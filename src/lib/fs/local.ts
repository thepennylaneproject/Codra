export interface FileSystemAdapter {
    // Directory operations
    openDirectory(): Promise<FileSystemDirectoryHandle>;
    listDirectory(handle: FileSystemDirectoryHandle): Promise<FileEntry[]>;
    createDirectory(parent: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle>;

    // File operations
    readFile(handle: FileSystemFileHandle): Promise<string>;
    writeFile(handle: FileSystemFileHandle, content: string): Promise<void>;
    createFile(parent: FileSystemDirectoryHandle, name: string): Promise<FileSystemFileHandle>;
    deleteFile(parent: FileSystemDirectoryHandle, name: string): Promise<void>; // Modified signature to standard API usage
    deleteDirectory(parent: FileSystemDirectoryHandle, name: string): Promise<void>;

    // Permissions
    verifyPermission(handle: FileSystemHandle, mode: 'read' | 'readwrite'): Promise<boolean>;
    requestPermission(handle: FileSystemHandle, mode: 'read' | 'readwrite'): Promise<boolean>;
}

export interface FileEntry {
    name: string;
    kind: 'file' | 'directory';
    handle: FileSystemHandle;
    path: string; // Relative path from root
    children?: FileEntry[]; // For recursive structures if needed, though we might lazy load
}

export class LocalFileSystemAdapter implements FileSystemAdapter {
    async openDirectory(): Promise<FileSystemDirectoryHandle> {
        console.log('[LocalFS] openDirectory called');
        // @ts-expect-error - File System Access API
        console.log('[LocalFS] showDirectoryPicker available?', typeof window.showDirectoryPicker);

        // @ts-expect-error - File System Access API
        if (!window.showDirectoryPicker) {
            console.error('[LocalFS] window.showDirectoryPicker is not available');
            throw new Error('File System Access API not supported');
        }

        try {
            console.log('[LocalFS] Calling showDirectoryPicker...');
            // @ts-expect-error - File System Access API
            const handle = await window.showDirectoryPicker();
            console.log('[LocalFS] Directory handle received:', handle);
            return handle;
        } catch (error) {
            console.error('[LocalFS] Error in showDirectoryPicker:', error);
            throw error;
        }
    }

    async listDirectory(handle: FileSystemDirectoryHandle): Promise<FileEntry[]> {
        const entries: FileEntry[] = [];
        // @ts-expect-error - TS might not have full File System Access types by default
        for await (const [name, entry] of handle.entries()) {
            // Filter .DS_Store and standard hidden files/folders if needed
            if (name === '.DS_Store' || name === '.git' || name === 'node_modules') continue;

            entries.push({
                name,
                kind: entry.kind,
                handle: entry,
                path: name, // Note: This is just name, path construction usually happens in the consumer or via recursion
            });
        }
        return entries.sort((a, b) => {
            if (a.kind === b.kind) return a.name.localeCompare(b.name);
            return a.kind === 'directory' ? -1 : 1;
        });
    }

    async createDirectory(parent: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle> {
        return parent.getDirectoryHandle(name, { create: true });
    }

    async readFile(handle: FileSystemFileHandle): Promise<string> {
        const file = await handle.getFile();
        return file.text();
    }

    async writeFile(handle: FileSystemFileHandle, content: string): Promise<void> {
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    async createFile(parent: FileSystemDirectoryHandle, name: string): Promise<FileSystemFileHandle> {
        return parent.getFileHandle(name, { create: true });
    }

    async deleteFile(parent: FileSystemDirectoryHandle, name: string): Promise<void> {
        return parent.removeEntry(name);
    }

    async deleteDirectory(parent: FileSystemDirectoryHandle, name: string): Promise<void> {
        return parent.removeEntry(name, { recursive: true });
    }

    async verifyPermission(handle: FileSystemHandle, mode: 'read' | 'readwrite'): Promise<boolean> {
        // @ts-expect-error - File System Access API
        if ((await handle.queryPermission({ mode })) === 'granted') {
            return true;
        }
        // @ts-expect-error - File System Access API
        if ((await handle.requestPermission({ mode })) === 'granted') {
            return true;
        }
        return false;
    }

    async requestPermission(handle: FileSystemHandle, mode: 'read' | 'readwrite'): Promise<boolean> {
        // @ts-expect-error - File System Access API
        const status = await handle.requestPermission({ mode });
        return status === 'granted';
    }
}

export const localFS = new LocalFileSystemAdapter();
