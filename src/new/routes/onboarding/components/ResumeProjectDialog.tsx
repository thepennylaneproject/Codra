import { Button } from '@/components/ui/Button';

interface ResumeProjectDialogProps {
    projectName: string;
    onResume: () => void;
    onCreate: () => void;
}

export const ResumeProjectDialog = ({
    projectName,
    onResume,
    onCreate,
}: ResumeProjectDialogProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-text-primary">
                        Resume your project?
                    </h2>
                    <p className="text-sm text-text-secondary">
                        We found an in-progress project from your last session.
                    </p>
                </div>

                {/* Project Info */}
                <div className="p-4 bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded-lg">
                    <p className="text-sm text-text-soft">Project</p>
                    <p className="text-base font-medium text-text-primary truncate">
                        {projectName}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={onCreate}
                        variant="ghost"
                        size="lg"
                        className="flex-1 border border-[#1A1A1A]/20"
                    >
                        Create New
                    </Button>
                    <Button
                        onClick={onResume}
                        variant="primary"
                        size="lg"
                        className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800"
                    >
                        Resume
                    </Button>
                </div>
            </div>
        </div>
    );
};
