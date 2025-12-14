import React from 'react';
import { EditorFile } from './types';
import { X } from 'lucide-react';

interface EditorTabsProps {
    files: EditorFile[];
    activeFileId: string;
    onSelect: (fileId: string) => void;
    onClose: (fileId: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({ files, activeFileId, onSelect, onClose }) => {
    return (
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
            {files.map((file) => {
                const isActive = file.id === activeFileId;
                return (
                    <div
                        key={file.id}
                        onClick={() => onSelect(file.id)}
                        className={`
              group flex items-center min-w-[120px] max-w-[200px] h-[36px] px-3 border-r border-[rgba(243,244,230,0.09)] cursor-pointer select-none text-[13px] transition-colors relative
              ${isActive
                                ? 'bg-[#0f1214] text-[#f3f4e6] border-t-2 border-t-[#4e808d]'
                                : 'bg-[#070a0e] text-[#6b7280] hover:bg-[rgba(243,244,230,0.02)] border-t-2 border-t-transparent'}
            `}
                    >
                        <span className="truncate flex-1 mr-2">{file.name}</span>

                        {/* Dirty indicator or Close button */}
                        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                            {file.isDirty ? (
                                <div className="w-2 h-2 rounded-full bg-[#c7a76a] group-hover:hidden" />
                            ) : null}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose(file.id);
                                }}
                                className={`
                        opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-[rgba(243,244,230,0.1)] transition-all
                        ${file.isDirty ? 'hidden group-hover:flex' : 'flex'}
                    `}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
