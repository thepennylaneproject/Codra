import { useState, useEffect } from 'react';

export interface MetricsData {
  decisionCount: {
    current: number;
    target: number;
  };
  onboardingFunnel: {
    step1: number;
    step2: number;
    step3: number;
    completed: number;
  };
  accentViolations: {
    count: number;
  };
  flowMetrics: {
    avgTimeToFirstSpread: number;
    startCompletion: number;
    taskCompletion: number;
    exportCompletion: number;
  };
  isLoading: boolean;
}

export function useMetrics(): MetricsData {
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for initial implementation
  const [data] = useState<MetricsData>({
    decisionCount: {
      current: 4,
      target: 10,
    },
    onboardingFunnel: {
      step1: 1250,
      step2: 980,
      step3: 850,
      completed: 780,
    },
    accentViolations: {
      count: 2,
    },
    flowMetrics: {
      avgTimeToFirstSpread: 48,
      startCompletion: 82,
      taskCompletion: 94,
      exportCompletion: 98,
    },
    isLoading: false
  });

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { ...data, isLoading };
}
