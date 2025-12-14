/**
 * Hook for executing flows and tracking execution state
 */

import { useState, useCallback, useRef } from 'react';
import { CodraFlowExecutor } from '../lib/flow/executor';
import type { Flow, ExecutionResult, StepResult } from '../lib/flow/types';

interface UseFlowExecutionOptions {
  onStepComplete?: (step: StepResult) => void;
  onComplete?: (result: ExecutionResult) => void;
  onError?: (error: Error) => void;
}

export function useFlowExecution(options: UseFlowExecutionOptions = {}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<StepResult[]>([]);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executorRef = useRef<CodraFlowExecutor | null>(null);

  const execute = useCallback(
    async (flow: Flow, inputs: Record<string, any> = {}) => {
      setIsExecuting(true);
      setCurrentStep(null);
      setCompletedSteps([]);
      setResult(null);
      setError(null);

      const executor = new CodraFlowExecutor();
      executorRef.current = executor;

      try {
        const executionResult = await executor.execute(flow, inputs, {
          onStep: (step: StepResult) => {
            setCurrentStep(step.nodeId);
            setCompletedSteps((prev) => [...prev, step]);
            options.onStepComplete?.(step);
          },
        });

        setResult(executionResult);
        setCompletedSteps(executionResult.steps);

        if (executionResult.success) {
          options.onComplete?.(executionResult);
        } else {
          const errorMsg = executionResult.error || 'Execution failed';
          setError(errorMsg);
          options.onError?.(new Error(errorMsg));
        }

        return executionResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        options.onError?.(
          err instanceof Error ? err : new Error(errorMessage)
        );
        throw err;
      } finally {
        setIsExecuting(false);
        executorRef.current = null;
      }
    },
    [options]
  );

  const pause = useCallback(() => {
    executorRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    executorRef.current?.resume();
  }, []);

  const cancel = useCallback(() => {
    executorRef.current?.cancel();
    setIsExecuting(false);
  }, []);

  const reset = useCallback(() => {
    setIsExecuting(false);
    setCurrentStep(null);
    setCompletedSteps([]);
    setResult(null);
    setError(null);
  }, []);

  return {
    isExecuting,
    currentStep,
    completedSteps,
    result,
    error,
    execute,
    pause,
    resume,
    cancel,
    reset,
  };
}
