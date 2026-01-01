import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, FileUpload } from '../hooks/useOnboarding';
import { Button } from '../../../components/Button';
import { ArrowLeft, ArrowRight, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { analytics } from '@/lib/analytics';

export const StepAddContext = () => {
    const navigate = useNavigate();
    const { data, addFile, removeFile } = useOnboarding();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        analytics.track('onboarding_step_viewed', { step: 2, stepName: 'context' });
    }, []);
    
    const handleBack = () => {
        navigate('/new');
    };
    
    const handleSkip = () => {
        analytics.track('onboarding_step_skipped', {
            step: 2,
            stepName: 'context',
            durationMs: Date.now() - startTime,
        });
        navigate('/new?step=generating');
    };
    
    const handleContinue = () => {
        analytics.track('onboarding_step_completed', {
            step: 2,
            stepName: 'context',
            durationMs: Date.now() - startTime,
            fileCount: data.contextFiles.length,
            fileTypes: data.contextFiles.map(f => f.type),
        });
        navigate('/new?step=generating');
    };
    
    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        
        Array.from(files).forEach((file) => {
            const fileUpload: FileUpload = {
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type,
                size: file.size,
                file: file,
            };
            
            // Generate preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileUpload.preview = e.target?.result as string;
                    addFile(fileUpload);
                };
                reader.readAsDataURL(file);
            } else {
                addFile(fileUpload);
            }
        });
    };
    
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
        handleFileSelect(e.dataTransfer.files);
    };
    
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    
    return (
        <div className="space-y-8">
            {/* Step Title */}
            <div className="space-y-2">
                <h1 className="text-2xl font-medium text-[#1A1A1A]">
                    Add Context (Optional)
                </h1>
                <p className="text-base text-[#5A5A5A]">
                    Upload files or docs to help us understand your project better. Or skip this step entirely.
                </p>
            </div>
            
            {/* File Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                    transition-all
                    ${isDragging
                        ? 'border-[#1A1A1A]/40 bg-[#1A1A1A]/[0.02]'
                        : 'border-[#1A1A1A]/20 bg-white hover:border-[#1A1A1A]/30 hover:bg-[#FFFAF0]/50'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />
                
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-[#1A1A1A]/5 rounded-full">
                            <Upload size={32} className="text-[#5A5A5A]" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-medium text-[#1A1A1A]">
                            Drop files here or click to browse
                        </p>
                        <p className="text-sm text-[#8A8A8A]">
                            Images, PDFs, and documents accepted
                        </p>
                    </div>
                </div>
            </div>
            
            {/* File List */}
            {data.contextFiles.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-[#5A5A5A]">
                        Uploaded Files ({data.contextFiles.length})
                    </h3>
                    <div className="space-y-2">
                        {data.contextFiles.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-3 bg-white border border-[#1A1A1A]/10 rounded-lg"
                            >
                                {/* File Icon/Preview */}
                                <div className="flex-shrink-0 w-10 h-10 rounded bg-[#1A1A1A]/5 flex items-center justify-center overflow-hidden">
                                    {file.preview ? (
                                        <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                                    ) : file.type.startsWith('image/') ? (
                                        <ImageIcon size={20} className="text-[#5A5A5A]" />
                                    ) : (
                                        <FileText size={20} className="text-[#5A5A5A]" />
                                    )}
                                </div>
                                
                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#1A1A1A] truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-[#8A8A8A]">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                
                                {/* Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(file.id);
                                    }}
                                    className="flex-shrink-0 p-1.5 hover:bg-[#1A1A1A]/5 rounded transition-colors"
                                >
                                    <X size={16} className="text-[#8A8A8A]" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
                {/* Back Button */}
                <Button
                    onClick={handleBack}
                    variant="ghost"
                    size="lg"
                    leftIcon={<ArrowLeft size={20} />}
                    className="text-[#5A5A5A]"
                >
                    Back
                </Button>
                
                <div className="flex-1" />
                
                {/* Skip Button */}
                <Button
                    onClick={handleSkip}
                    variant="ghost"
                    size="lg"
                    className="border border-[#1A1A1A]/20 text-[#1A1A1A]"
                >
                    Skip
                </Button>
                
                {/* Continue Button */}
                <Button
                    onClick={handleContinue}
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight size={20} />}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};
