/**
 * ANALYZE CANVAS
 * Adapted from DataAnalysisDeskCanvas
 * Research, metrics, and insights
 */

import { BarChart3, Database, PieChart, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AnalyzeCanvasProps {
    projectId: string;
    selectedModelId?: string;
    onSelectModel?: (modelId: string, providerId: string) => void;
}

export const AnalyzeCanvas: React.FC<AnalyzeCanvasProps> = ({ projectId }) => {
    void projectId;
    const upcomingFeatures = [
        { icon: BarChart3, label: 'Data visualization', description: 'Generate charts and graphs' },
        { icon: Database, label: 'Query builder', description: 'Natural language to SQL' },
        { icon: PieChart, label: 'Insight extraction', description: 'AI-powered data analysis' },
        { icon: TrendingUp, label: 'Trend detection', description: 'Identify patterns in data' },
    ];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center py-12 px-8">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-16 h-16 rounded-2xl bg-zinc-200/50 flex items-center justify-center mx-auto mb-6">
                    <BarChart3 size={32} className="text-zinc-500" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-3">Analyze Desk</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-xs font-semibold text-amber-600">Coming Soon</span>
                </div>
                <p className="text-text-secondary max-w-md">
                    Execute data analysis, generate visualizations, and surface trends with configured models.
                </p>
            </div>

            {/* Feature Preview Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-lg w-full mb-12">
                {upcomingFeatures.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                        <div
                            key={idx}
                            className="p-4 bg-white border border-[#1A1A1A]/10 rounded-xl opacity-60"
                        >
                            <Icon size={20} className="text-text-soft mb-3" />
                            <p className="text-sm font-semibold text-text-primary mb-1">{feature.label}</p>
                            <p className="text-xs text-text-soft">{feature.description}</p>
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            <div className="text-center">
                <p className="text-sm text-text-soft mb-4">
                    This desk is unavailable. Use the Code Desk for codebase analysis.
                </p>
                <Button className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 text-text-secondary rounded-xl font-semibold text-xs transition-colors mx-auto">
                    Open Code Desk
                    <ArrowRight size={14} />
                </Button>
            </div>
        </div>
    );
};
