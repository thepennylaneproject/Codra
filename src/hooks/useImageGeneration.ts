/**
 * src/hooks/useImageGeneration.ts
 * React hook for image generation requests
 */

import { useState, useCallback } from 'react';
import { ImageGenerationResult, ImageGenerationRequest, ImageGenerationResponse } from '@/lib/ai/types-image';

interface UseImageGenerationState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  result: ImageGenerationResult | null;
  jobId: string | null;
  cost: number;
  estimatedWaitTime: number | null;
}

export function useImageGeneration() {
  const [state, setState] = useState<UseImageGenerationState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    result: null,
    jobId: null,
    cost: 0,
    estimatedWaitTime: null,
  });

  const generate = useCallback(
    async (request: ImageGenerationRequest): Promise<ImageGenerationResponse | null> => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        result: null,
        jobId: null,
      }));

      try {
        const response = await fetch('/.netlify/functions/image-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Generation failed with status ${response.status}`);
        }

        const data: ImageGenerationResponse = await response.json();

        setState(prev => ({
          ...prev,
          isLoading: false,
          isProcessing: data.status === 'pending',
          jobId: data.jobId,
          result: data.result || null,
          cost: data.cost,
          estimatedWaitTime: data.estimatedWaitTime || null,
        }));

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      result: null,
      jobId: null,
      cost: 0,
      estimatedWaitTime: null,
    });
  }, []);

  return {
    ...state,
    generate,
    reset,
  };
}

