import React from 'react';
import { FolderOpen } from 'lucide-react';

interface DirectoryPickerProps {
    onOpen: () => void;
    isSupported: boolean;
}

export const DirectoryPicker: React.FC<DirectoryPickerProps> = ({ onOpen, isSupported }) => {
    if (!isSupported) {
        return (
            <div className="p-4 text-center text-sm text-red-400">
                Browser not supported. Please use Chrome or Edge.
            </div>
        );
    }

    return (
        <button
            onClick={onOpen}
            className="flex items-center gap-2 px-4 py-2 bg-[#4e808d] text-[#f3f4e6] rounded-md hover:bg-[#3d646e] transition-colors text-sm font-medium w-full justify-center"
        >
            <FolderOpen size={16} />
            Open Folder
        </button>
    );
};
