import React from 'react';
import { FileSystemNode } from '../../hooks/useFileSystem';
import { FileIcon, FileCode, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';

interface FileTreeProps {
    nodes: FileSystemNode[];
    activeFileId: string; // This matches the path usually
    onSelect: (node: FileSystemNode) => void;
    onToggle: (path: string) => void;
    level?: number;
}

// Simple helper to get icon based on extension
const getFileIcon = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return <FileCode size={14} className="text-[#4e808d]" />; // Brand teal
    if (filename.endsWith('.css')) return <FileIcon size={14} className="text-[#7a77ff]" />; // Brand violet
    if (filename.endsWith('.json')) return <FileIcon size={14} className="text-[#c7a76a]" />; // Brand gold
    return <FileIcon size={14} className="text-[#9ca3af]" />;
};

export const FileTree: React.FC<FileTreeProps> = ({ nodes, activeFileId, onSelect, onToggle, level = 0 }) => {
    return (
        <div className="flex-1 overflow-y-auto select-none">
            {nodes.map((node) => {
                const isDirectory = node.kind === 'directory';
                const isSelected = node.path === activeFileId;

                return (
                    <div key={node.path}>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isDirectory) {
                                    onToggle(node.path);
                                } else {
                                    onSelect(node);
                                }
                            }}
                            style={{ paddingLeft: `${level * 12 + 12}px` }}
                            className={`
                                group flex items-center gap-1.5 py-1.5 cursor-pointer text-[13px] transition-colors
                                ${isSelected
                                    ? 'bg-[rgba(78,128,141,0.15)] text-[#f3f4e6] border-l-2 border-[#4e808d]'
                                    : 'text-[#9ca3af] hover:text-[#f3f4e6] hover:bg-[rgba(243,244,230,0.05)] border-l-2 border-transparent'}
                            `}
                        >
                            {isDirectory && (
                                <span className="text-[#6b7280]">
                                    {node.isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </span>
                            )}

                            {!isDirectory && <span className="w-3" />} {/* Spacer for alignment with folders */}

                            {isDirectory ? (
                                node.isOpen ?
                                    <FolderOpen size={14} className="text-[#c7a76a]" /> :
                                    <Folder size={14} className="text-[#c7a76a]" />
                            ) : (
                                getFileIcon(node.name)
                            )}

                            <span className="truncate flex-1">{node.name}</span>
                        </div>

                        {isDirectory && node.isOpen && node.children && (
                            <FileTree
                                nodes={node.children}
                                activeFileId={activeFileId}
                                onSelect={onSelect}
                                onToggle={onToggle}
                                level={level + 1}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
