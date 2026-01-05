/**
 * LYRA INPUT
 * Idle state input for freeform user requests
 */

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface LyraInputProps {
    onSubmit: (input: string) => void;
    placeholder?: string;
}

export function LyraInput({
    onSubmit,
    placeholder = "Enter prompt query",
}: LyraInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSubmit(input.trim());
            setInput('');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
        >
            {/* Idle Message */}
            <p className="text-sm text-zinc-500 text-center">
                Idle
            </p>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-zinc-700 focus:border-zinc-400 focus:outline-none text-zinc-300 placeholder:text-zinc-600 text-sm rounded-lg transition-colors"
                />
                <Button
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={16} />
                </Button>
            </form>
        </motion.div>
    );
}
