/**
 * EXPORT MODAL
 * UI for selecting export formats based on artifact type
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Image as ImageIcon, FileCode, Printer, Check } from 'lucide-react';
import { ArtifactExporter, ExportFormat } from '../../lib/export/ArtifactExporter';
import { analytics } from '@/lib/analytics';
import { useEffect } from 'react';
import { behaviorTracker } from '../../lib/smart-defaults/inference-engine';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/Button';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    artifactId: string;
    artifactType: string;
    content: string;
    filename?: string;
}

const FORMAT_CONFIG: Record<string, { format: ExportFormat; label: string; icon: any }[]> = {
    image: [
        { format: 'png', label: 'Portable Network Graphics', icon: ImageIcon },
        { format: 'jpg', label: 'Joint Photographic Experts Group', icon: ImageIcon },
        { format: 'webp', label: 'WebP Image Format', icon: ImageIcon },
    ],
    writing: [
        { format: 'md', label: 'Markdown Document', icon: FileText },
        { format: 'txt', label: 'Plain Text File', icon: FileText },
        { format: 'pdf', label: 'PDF Document', icon: Printer },
    ],
    copy: [
        { format: 'md', label: 'Markdown Document', icon: FileText },
        { format: 'txt', label: 'Plain Text File', icon: FileText },
        { format: 'pdf', label: 'PDF Document', icon: Printer },
    ],
    code: [
        { format: 'txt', label: 'Source Code File', icon: FileCode },
        { format: 'md', label: 'Markdown Documentation', icon: FileText },
    ],
    spread: [
        { format: 'pdf', label: 'Complete workspace PDF', icon: Printer },
        { format: 'md', label: 'Markdown Bundle', icon: FileText },
    ],
};

export function ExportModal({
    isOpen,
    onClose,
    artifactId,
    artifactType,
    content,
    filename = 'artifact-export'
}: ExportModalProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);

    useEffect(() => {
        if (isOpen) {
            analytics.track('flow_export_began', {
                outputId: artifactId,
                outputType: artifactType,
            });
        }
    }, [isOpen, artifactId, artifactType]);

    const formats = FORMAT_CONFIG[artifactType] || [
        { format: 'txt', label: 'Plain Text File', icon: FileText },
        { format: 'json', label: 'JSON Data', icon: FileCode },
    ];

    const handleExport = async (format: ExportFormat) => {
        setIsExporting(true);
        setSelectedFormat(format);
        const startTime = Date.now();

        const success = await ArtifactExporter.exportArtifact(content, artifactType, {
            filename,
            format
        });

        // Track for behavior learning
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                behaviorTracker.track({
                    userId: session.user.id,
                    timestamp: new Date(),
                    event: 'export_format_chosen',
                    metadata: {
                        artifactId,
                        artifactType,
                        format
                    }
                });
            }
        } catch (err) {
            console.error('Failed to track export behavior:', err);
        }

        if (success) {
            analytics.track('flow_export_completed', {
                outputId: artifactId,
                outputType: artifactType,
                format,
                durationMs: Date.now() - startTime,
                isDefaultFormat: true, // Simplified
            });
            // Briefly show success state before closing
            setTimeout(() => {
                setIsExporting(false);
                setSelectedFormat(null);
                onClose();
            }, 1000);
        } else {
            analytics.track('flow_export_failed', {
                outputId: artifactId,
                outputType: artifactType,
                format,
                error: 'Export failed via ArtifactExporter',
            });
            setIsExporting(false);
            setSelectedFormat(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 glass-panel border-0 rounded-none bg-zinc-950/40"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-2">
                            <Download size={18} className="text-indigo-500" />
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Export Artifact
                            </h3>
                        </div>
                        <Button
                            onClick={onClose}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X size={18} className="text-zinc-500" />
                        </Button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <p className="text-xs text-zinc-500 font-semibold mb-4">Select Format</p>

                        <div className="space-y-2">
                            {formats.map((config) => (
                                <Button
                                    key={config.format}
                                    onClick={() => handleExport(config.format)}
                                    disabled={isExporting}
                                    className={`
                                        w-full p-4 flex items-center gap-4 rounded-xl border text-left transition-all
                                        ${selectedFormat === config.format
                                            ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                                        }
                                        ${isExporting && selectedFormat !== config.format ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <div className={`
                                        p-2 rounded-lg 
                                        ${selectedFormat === config.format
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                        }
                                    `}>
                                        <config.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                            .{config.format}
                                        </div>
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {config.label}
                                        </div>
                                    </div>
                                    {selectedFormat === config.format && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-indigo-500"
                                        >
                                            {isExporting ? (
                                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Check size={18} />
                                            )}
                                        </motion.div>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center">
                        <p className="text-xs text-zinc-400 font-medium">Artifact ID: {artifactId.slice(0, 8)}...</p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
