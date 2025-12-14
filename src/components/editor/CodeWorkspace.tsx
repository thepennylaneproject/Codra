import React, { useState } from 'react';
import { useFileSystem, FileSystemNode } from '../../hooks/useFileSystem';
import { CodeEditor } from './CodeEditor';
import { DirectoryPicker } from './DirectoryPicker';
import { EditorFile } from './types';
import { AlertCircle } from 'lucide-react';

export const CodeWorkspace: React.FC = () => {
    const {
        isSupported,
        rootHandle,
        fileSystemTree,
        openRootDirectory,
        readFileContent,
        saveFileContent,
        onToggleDirectory
    } = useFileSystem();

    const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string>('');

    const handleFileSelect = async (fileOrId: any) => {
        if (typeof fileOrId === 'string') {
            // Tab selection
            setActiveFileId(fileOrId);
        } else {
            // Tree selection
            const node = fileOrId as FileSystemNode;

            // Check if already open
            const existing = openFiles.find(f => f.path === node.path);
            if (existing) {
                setActiveFileId(existing.id);
                return;
            }

            try {
                const file = await readFileContent(node);
                setOpenFiles([...openFiles, file]);
                setActiveFileId(file.id);
            } catch (err) {
                console.error("Failed to read file", err);
                // Could show toast error here
            }
        }
    };

    const handleFileChange = (fileId: string, content: string) => {
        setOpenFiles(prev => prev.map(f => {
            if (f.id === fileId) {
                return { ...f, content, isDirty: true };
            }
            return f;
        }));
    };

    const handleFileSave = async (fileId: string) => {
        const file = openFiles.find(f => f.id === fileId);
        if (!file) return;

        // We need the original node or just use path to write?
        // Our hook's saveFileContent currently takes a FileEntry (FileSystemNode).
        // But we only have EditorFile here. 
        // We can reconstruct a minimal FileEntry with the handle if we kept it, 
        // OR we can improve saveFileContent to take path if we can lookup the handle.
        // But handles are in the tree.
        // It's better if we store the handle in EditorFile too! 
        // But EditorFile is serializable-ish.
        // Let's modify saveFileContent to find the handle or we update EditorFile to hold the handle (non-serializable part).
        // Let's assume for now we look it up in the tree or we updated EditorFile type?

        // Wait, EditorFile in types.ts doesn't have the handle.
        // I should stick handle into EditorFile or look it up.
        // Looking up in the tree recursively is possible but O(N).
        // Let's look up.

        const findNode = (nodes: FileSystemNode[], path: string): FileSystemNode | undefined => {
            for (const node of nodes) {
                if (node.path === path) return node;
                if (node.children) {
                    const found = findNode(node.children, path);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const node = findNode(fileSystemTree, file.path);
        if (node) {
            try {
                await saveFileContent(node, file.content);
                setOpenFiles(prev => prev.map(f => {
                    if (f.id === fileId) {
                        return { ...f, isDirty: false };
                    }
                    return f;
                }));
            } catch (err) {
                console.error("Failed to save", err);
            }
        } else {
            console.error("Could not find file handle for saving");
        }
    };

    const handleFileClose = (fileId: string) => {
        const newFiles = openFiles.filter(f => f.id !== fileId);
        setOpenFiles(newFiles);

        if (activeFileId === fileId) {
            // Activate the last opened file or empty
            if (newFiles.length > 0) {
                setActiveFileId(newFiles[newFiles.length - 1].id);
            } else {
                setActiveFileId('');
            }
        }
    };

    // If browser not supported
    if (!isSupported) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center h-screen w-screen bg-zinc-950 text-[#9ca3af] gap-6 p-8 z-50">
                <div className="flex flex-col items-center gap-2">
                    <AlertCircle size={48} className="text-red-400" />
                    <h2 className="text-xl font-semibold text-[#f3f4e6]">Browser Not Supported</h2>
                    <p className="text-center max-w-sm">
                        The Native File System API is required to edit local directories directly.
                        Please use Chrome, Edge, or Opera.
                    </p>
                </div>

                <div className="w-full max-w-sm border-t border-[rgba(243,244,230,0.09)] pt-6 flex flex-col items-center gap-3">
                    <p className="text-sm">Alternatively, you can edit a single file:</p>
                    <label className="flex items-center gap-2 px-4 py-2 bg-[#1f2937] text-[#f3f4e6] rounded-md hover:bg-[#374151] transition-colors cursor-pointer text-sm font-medium">
                        Open Single File
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const content = ev.target?.result as string;
                                        setOpenFiles([...openFiles, {
                                            id: `memory://${file.name}`,
                                            name: file.name,
                                            path: `memory://${file.name}`,
                                            language: 'typescript', // simplistic inference
                                            content,
                                            isDirty: false
                                        }]);
                                        setActiveFileId(`memory://${file.name}`);
                                    };
                                    reader.readAsText(file);
                                }
                            }}
                        />
                    </label>
                </div>
            </div>
        );
    }

    if (!rootHandle) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center h-screen w-screen bg-[#0f1214] z-50">
                <div className="max-w-md text-center space-y-6 p-8 bg-[#0f1214] border border-[rgba(243,244,230,0.09)] rounded-xl">
                    <h2 className="text-2xl font-bold text-[#f3f4e6]">Open Local Project</h2>
                    <p className="text-[#9ca3af]">
                        Select a local directory to start editing. Your changes will be saved directly to your disk.
                    </p>
                    <DirectoryPicker onOpen={openRootDirectory} isSupported={isSupported} />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 h-screen w-screen bg-zinc-950 z-50">
            <CodeEditor
                files={openFiles}
                activeFileId={activeFileId}
                fileSystemTree={fileSystemTree}
                onFileChange={handleFileChange}
                onFileSelect={handleFileSelect}
                onFileSave={handleFileSave}
                onFileClose={handleFileClose}
                onToggleDirectory={onToggleDirectory}
            />
        </div>
    );
};
