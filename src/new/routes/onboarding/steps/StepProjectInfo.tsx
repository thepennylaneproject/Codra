import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { Button } from '../../../components/Button';
import { ArrowRight } from 'lucide-react';

const PROJECT_TYPE_OPTIONS = [
    { id: 'campaign' as const, label: 'Campaign', description: 'Full-funnel campaign production', icon: '🚀' },
    { id: 'product' as const, label: 'Product', description: 'Product or SaaS experience', icon: '🎨' },
    { id: 'content' as const, label: 'Content', description: 'Content creation project', icon: '📝' },
    { id: 'custom' as const, label: 'Custom', description: 'Bespoke production work', icon: '✨' },
];

export const StepProjectInfo = () => {
    const navigate = useNavigate();
    const { data, updateData, canProceedFromProjectInfo } = useOnboarding();
    const nameInputRef = useRef<HTMLInputElement>(null);
    
    // Auto-focus project name input on mount
    useEffect(() => {
        nameInputRef.current?.focus();
    }, []);
    
    const handleContinue = () => {
        if (canProceedFromProjectInfo()) {
            navigate('/new?step=context');
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && canProceedFromProjectInfo()) {
            handleContinue();
        }
    };
    
    return (
        <div className="space-y-8">
            {/* Step Title */}
            <div className="space-y-2">
                <h1 className="text-2xl font-medium text-[#1A1A1A]">
                    What are you making?
                </h1>
                <p className="text-base text-[#5A5A5A]">
                    Tell us about your project. We'll set up everything else.
                </p>
            </div>
            
            {/* Project Name Input */}
            <div className="space-y-2">
                <label 
                    htmlFor="project-name" 
                    className="block text-sm font-medium text-[#5A5A5A]"
                >
                    Project Name *
                </label>
                <input
                    ref={nameInputRef}
                    id="project-name"
                    type="text"
                    value={data.projectName}
                    onChange={(e) => updateData({ projectName: e.target.value })}
                    onKeyPress={handleKeyPress}
                    placeholder="My Awesome Project"
                    className="w-full px-4 py-3 text-base text-[#1A1A1A] bg-white border border-[#1A1A1A]/10 rounded-lg focus:outline-none focus:border-[#1A1A1A]/30 transition-colors"
                />
            </div>
            
            {/* Project Type Selector */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-[#5A5A5A]">
                    Project Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {PROJECT_TYPE_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => updateData({ projectType: option.id })}
                            className={`
                                relative p-4 text-left rounded-lg border-2 transition-all
                                ${data.projectType === option.id
                                    ? 'border-[#1A1A1A] bg-[#1A1A1A]/[0.02]'
                                    : 'border-[#1A1A1A]/10 bg-white hover:border-[#1A1A1A]/20'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{option.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-[#1A1A1A] mb-0.5">
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-[#5A5A5A]">
                                        {option.description}
                                    </div>
                                </div>
                            </div>
                            {data.projectType === option.id && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Optional Description */}
            <div className="space-y-2">
                <label 
                    htmlFor="description" 
                    className="block text-sm font-medium text-[#5A5A5A]"
                >
                    Description (Optional)
                </label>
                <textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => updateData({ description: e.target.value })}
                    placeholder="A one-sentence description of your project..."
                    rows={2}
                    className="w-full px-4 py-3 text-base text-[#1A1A1A] bg-white border border-[#1A1A1A]/10 rounded-lg focus:outline-none focus:border-[#1A1A1A]/30 transition-colors resize-none"
                />
            </div>
            
            {/* Continue Button */}
            <div className="pt-4">
                <Button
                    onClick={handleContinue}
                    disabled={!canProceedFromProjectInfo()}
                    variant="primary"
                    className="w-full"
                    size="lg"
                    rightIcon={<ArrowRight size={20} />}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};
