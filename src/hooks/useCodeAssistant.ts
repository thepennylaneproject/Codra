import { useState, useCallback } from 'react';
import { CodraAssistant, CodeContext, CodeReview } from '../lib/ai/code';
import { AIRouter } from '../lib/ai/router';

// Mock router setup for now, or import singleton if available
const router = new AIRouter({
    primaryProvider: 'deepseek',
    fallbackProviders: ['openai']
});

const assistant = new CodraAssistant(router);

export function useCodeAssistant() {
    const [chatOpen, setChatOpen] = useState(false);
    const [activeContext, setActiveContext] = useState<CodeContext | null>(null);
    const [reviewResult, setReviewResult] = useState<CodeReview | null>(null);

    const sendMessage = useCallback(async (message: string) => {
        // In a real app, we'd gather all open contexts
        const contexts = activeContext ? [activeContext] : [];
        return await assistant.chat(contexts, message);
    }, [activeContext]);

    const runReview = useCallback(async () => {
        if (!activeContext) return;
        const review = await assistant.review(activeContext);
        setReviewResult(review);
    }, [activeContext]);

    return {
        chatOpen,
        setChatOpen,
        activeContext,
        setActiveContext,
        sendMessage,
        runReview,
        reviewResult,
        setReviewResult
    };
}
