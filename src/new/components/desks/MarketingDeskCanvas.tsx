/**
 * MARKETING DESK CANVAS
 * Placeholder implementation with clear "coming soon" messaging
 */

import React from 'react';
import { Megaphone, TrendingUp, Users, Target, Sparkles, ArrowRight } from 'lucide-react';

interface MarketingDeskCanvasProps {
    selectedModelId?: string;
    onSelectModel?: (modelId: string, providerId: string) => void;
}

export const MarketingDeskCanvas: React.FC<MarketingDeskCanvasProps> = () => {
    const upcomingFeatures = [
        { icon: Target, label: 'Campaign briefs', description: 'Generate strategic marketing briefs' },
        { icon: TrendingUp, label: 'Ad copy generator', description: 'Create compelling ad variations' },
        { icon: Users, label: 'Audience targeting', description: 'AI-powered persona development' },
        { icon: Megaphone, label: 'Content calendar', description: 'Plan and schedule content' },
    ];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center py-16 px-8">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-16 h-16 rounded-2xl bg-[#FF4D4D]/10 flex items-center justify-center mx-auto mb-6">
                    <Megaphone size={32} className="text-[#FF4D4D]" />
                </div>
                <h2 className="text-2xl font-black text-[#1A1A1A] mb-3">Marketing Desk</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Coming Soon</span>
                </div>
                <p className="text-[#5A5A5A] max-w-md">
                    Strategic marketing tools powered by AI. Generate campaigns, optimize messaging, and reach your audience effectively.
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
                            <Icon size={20} className="text-[#8A8A8A] mb-3" />
                            <p className="text-sm font-bold text-[#1A1A1A] mb-1">{feature.label}</p>
                            <p className="text-xs text-[#8A8A8A]">{feature.description}</p>
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            <div className="text-center">
                <p className="text-sm text-[#8A8A8A] mb-4">
                    While we build this desk, try the Writing Desk for copy creation.
                </p>
                <button className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 text-[#5A5A5A] rounded-xl font-bold text-xs uppercase tracking-widest transition-colors mx-auto">
                    Explore Writing Desk
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};
