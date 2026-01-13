import { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboarding, FileUpload, OnboardingProjectState } from '../hooks/useOnboarding';
import { ArrowLeft, ArrowRight, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { SimilarProjectsList, type ImportedContext } from '@/components/onboarding/SimilarProjectsList';
import { ImportContextModal, type EditedContext } from '@/components/onboarding/ImportContextModal';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

const ONBOARDING_PROJECT_KEY = 'codra:onboardingProject';

export const StepAddContext = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');
    const { data, addFile, removeFile, updateData } = useOnboarding();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startTime] = useState(Date.now());
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [selectedContext, setSelectedContext] = useState<ImportedContext | null>(null);
    const showSmartImport = useFeatureFlag(FEATURE_FLAGS.SMART_CONTEXT_IMPORT);

    useEffect(() => {
        analytics.track('onboarding_step_viewed', { step: 2, stepName: 'context', projectId });
    }, [projectId]);
    
    // Update localStorage step when landing on this page
    useEffect(() => {
        if (projectId) {
            try {
                const saved = localStorage.getItem(ONBOARDING_PROJECT_KEY);
                if (saved) {
                    const projectState: OnboardingProjectState = JSON.parse(saved);
                    if (projectState.projectId === projectId) {
                        projectState.step = 'context';
                        localStorage.setItem(ONBOARDING_PROJECT_KEY, JSON.stringify(projectState));
                    }
                }
            } catch {
                // Ignore localStorage errors
            }
        }
    }, [projectId]);
    
    const handleBack = () => {
        navigate('/new');
    };
    
    const handleSkip = () => {
        analytics.track('onboarding_step_skipped', {
            step: 2,
            stepName: 'context',
            durationMs: Date.now() - startTime,
            projectId,
        });
        // Update localStorage to generating step
        updateLocalStorageStep('generating');
        navigate(`/new?step=generating&projectId=${projectId}`);
    };
    
    const handleContinue = () => {
        analytics.track('onboarding_step_completed', {
            step: 2,
            stepName: 'context',
            durationMs: Date.now() - startTime,
            fileCount: data.contextFiles.length,
            fileTypes: data.contextFiles.map(f => f.type),
            projectId,
        });
        // Update localStorage to generating step
        updateLocalStorageStep('generating');
        navigate(`/new?step=generating&projectId=${projectId}`);
    };
    
    const updateLocalStorageStep = (step: OnboardingProjectState['step']) => {
        try {
            const saved = localStorage.getItem(ONBOARDING_PROJECT_KEY);
            if (saved) {
                const projectState: OnboardingProjectState = JSON.parse(saved);
                projectState.step = step;
                localStorage.setItem(ONBOARDING_PROJECT_KEY, JSON.stringify(projectState));
            }
        } catch {
            // Ignore localStorage errors
        }
    };
    
    const handleImportClick = (context: ImportedContext) => {
        setSelectedContext(context);
        setImportModalOpen(true);
        
        analytics.track('context_import_clicked', {
            sourceProjectId: context.projectId,
            matchScore: context.matchScore,
            matchReason: '', // Will be set from similarity data
        });
    };
    
    const handleImportConfirm = (editedContext: EditedContext) => {
        if (!selectedContext) return;
        
        // Track which fields were edited
        const fieldsEdited: string[] = [];
        if (editedContext.description !== selectedContext.description) fieldsEdited.push('description');
        if (editedContext.audience !== selectedContext.audience) fieldsEdited.push('audience');
        if (JSON.stringify(editedContext.goals) !== JSON.stringify(selectedContext.goals)) fieldsEdited.push('goals');
        
        // Update onboarding state with imported context
        updateData({
            description: editedContext.description,
            // Note: Store goals/audience in context for later use in generation
        });
        
        analytics.track('context_import_confirmed', {
            sourceProjectId: selectedContext.projectId,
            matchScore: selectedContext.matchScore,
            matchReason: '',
            fieldsEdited,
        });
        
        setImportModalOpen(false);
        setSelectedContext(null);
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
                <h1 className="text-xl font-medium text-text-primary">
                    Add Context (Optional)
                </h1>
                <p className="text-base text-text-secondary">
                    Upload files or docs to attach project context. This step is optional.
                </p>
            </div>
            
            {/* Similar Projects Import */}
            {showSmartImport && user && (
                <SimilarProjectsList
                    newProject={{
                        name: data.projectName,
                        type: data.projectType,
                        description: data.description,
                    }}
                    onImport={handleImportClick}
                />
            )}
            
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
                            <Upload size={32} className="text-text-secondary" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-medium text-text-primary">
                            Drop files here or click to browse
                        </p>
                        <p className="text-sm text-text-soft">
                            Images, PDFs, and documents accepted
                        </p>
                    </div>
                </div>
            </div>
            
            {/* File List */}
            {data.contextFiles.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-secondary">
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
                                        <ImageIcon size={20} className="text-text-secondary" />
                                    ) : (
                                        <FileText size={20} className="text-text-secondary" />
                                    )}
                                </div>
                                
                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-text-soft">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                
                                {/* Remove Button */}
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(file.id);
                                    }}
                                    className="flex-shrink-0 p-1 hover:bg-[#1A1A1A]/5 rounded transition-colors"
                                >
                                    <X size={16} className="text-text-soft" />
                                </Button>
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
                    className="text-text-secondary"
                >
                    Open previous step
                </Button>
                
                <div className="flex-1" />
                
                {/* Skip Button */}
                <Button
                    onClick={handleSkip}
                    variant="ghost"
                    size="lg"
                    className="border border-[#1A1A1A]/20 text-text-primary"
                >
                    Open next step
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
            
            {/* Import Context Modal */}
            {selectedContext && (
                <ImportContextModal
                    isOpen={importModalOpen}
                    onClose={() => {
                        setImportModalOpen(false);
                        setSelectedContext(null);
                    }}
                    onConfirm={handleImportConfirm}
                    sourceContext={selectedContext}
                />
            )}
        </div>
    );
};
