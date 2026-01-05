import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { costEngine } from '../lib/ai/cost';

export function useCostEstimate(modelId: string | undefined, taskType: string | undefined) {
    return useQuery({
        queryKey: ['costEstimate', modelId, taskType],
        queryFn: async () => {
            if (!modelId || !taskType) return null;

            // 1. Calculate Cost Estimate
            // For MVP, we assume a base context size (e.g., current prompt + 2k buffer)
            // In a more advanced version, we could pass the actual prompt length
            const estimatedTokens = costEngine.estimateTokens(taskType);
            const estimate = costEngine.estimateCost(modelId, estimatedTokens);

            // 2. Fetch Approval Rate
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // First, try user-specific data
            const { data: userData, error: userError } = await supabase
                .from('ai_runs')
                .select('satisfaction_score')
                .eq('model_id', modelId)
                .eq('task_type', taskType)
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (userError) throw userError;

            let finalRate: number | null = null;
            let totalCount = userData?.length || 0;

            if (totalCount >= 5) {
                const approvedCount = userData?.filter(r => r.satisfaction_score && r.satisfaction_score >= 4).length || 0;
                finalRate = Math.round((approvedCount / totalCount) * 100);
            } else {
                // Fallback to global data if user has < 5 runs
                const { data: globalData, error: globalError } = await supabase
                    .from('ai_runs')
                    .select('satisfaction_score')
                    .eq('model_id', modelId)
                    .eq('task_type', taskType)
                    .limit(100); // Sample of last 100 global runs

                if (!globalError && globalData && globalData.length >= 5) {
                    const approvedCount = globalData.filter(r => r.satisfaction_score && r.satisfaction_score >= 4).length || 0;
                    finalRate = Math.round((approvedCount / globalData.length) * 100);
                    totalCount = globalData.length;
                }
            }

            return {
                estimate,
                approvalRate: finalRate,
                totalCount,
                modelId,
                taskType
            };
        },
        enabled: !!modelId && !!taskType,
        staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    });
}
