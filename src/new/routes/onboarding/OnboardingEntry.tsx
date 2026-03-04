import { useSearchParams } from 'react-router-dom';
import { OnboardingFlow } from './OnboardingFlow';
import { NewProjectOnboarding } from './NewProjectOnboarding';

export const OnboardingEntry = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'quick';

  if (mode === 'detailed') {
    return <NewProjectOnboarding />;
  }

  return <OnboardingFlow />;
};
