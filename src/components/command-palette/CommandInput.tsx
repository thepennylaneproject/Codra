
import React from 'react';
import { Search } from 'lucide-react';

interface CommandInputProps {
    value: string;
    onValueChange: (value: string) => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({ value, onValueChange }) => {
    return (
        <div className="flex items-center px-4 py-4 border-b border-white/5 bg-zinc-900/50">
            <Search className="w-5 h-5 text-zinc-500 mr-3" />
            <input
                type="text"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 outline-none text-base font-medium"
                autoFocus
                // Prevent auto-zoom on mobile
                style={{ fontSize: '16px' }}
            />
        </div>
    );
};
