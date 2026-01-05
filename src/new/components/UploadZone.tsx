import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
    onUpload: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in bytes
    className?: string;
}

export function UploadZone({
    onUpload,
    accept = "image/*,.pdf,.doc,.docx,.txt",
    multiple = true,
    maxSize = 10 * 1024 * 1024, // 10MB default
    className
}: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const files = Array.from(e.dataTransfer.files);
        validateAndUpload(files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        validateAndUpload(files);
    };

    const validateAndUpload = (files: File[]) => {
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                setError(`File ${file.name} is too large (max ${maxSize / (1024 * 1024)}MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            onUpload(validFiles);
        }
    };

    return (
        <div className={className}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 
                    transition-all duration-300 flex flex-col items-center justify-center gap-3
                    ${isDragging
                        ? "border-rose-500 bg-rose-500/5 shadow-2xl scale-[1.02]"
                        : "border-[var(--color-border)] bg-white/50 hover:border-[var(--color-border-strong)] hover:bg-white"
                    }
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    accept={accept}
                    multiple={multiple}
                    className="hidden"
                />

                <div className={`p-4 rounded-full bg-zinc-50 transition-colors ${isDragging ? "bg-rose-100 text-rose-500" : "text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-600"}`}>
                    <Upload size={24} />
                </div>

                <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-900 mb-1">
                        {isDragging ? "Release to upload" : "Click or drag files here"}
                    </p>
                    <p className="text-xs font-semibold text-zinc-400">
                        Images, Docs, or PDF • Max {maxSize / (1024 * 1024)}MB
                    </p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-2 text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100"
                        >
                            <X size={12} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
