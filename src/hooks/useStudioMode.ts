import { useCallback, useEffect, useState } from 'react';
import { useFlowStore } from '@/lib/store/useFlowStore';

const STUDIO_CAROUSEL_KEY = 'codra-studio-carousel-seen';

export function useStudioMode() {
  const studioEnabled = useFlowStore((state) => state.studioEnabled);
  const setStudioEnabled = useFlowStore((state) => state.setStudioEnabled);
  const [showCarousel, setShowCarousel] = useState(false);

  useEffect(() => {
    if (!studioEnabled) {
      setShowCarousel(false);
      return;
    }
    const seen = localStorage.getItem(STUDIO_CAROUSEL_KEY);
    if (!seen) {
      setShowCarousel(true);
    }
  }, [studioEnabled]);

  const dismissCarousel = useCallback(() => {
    localStorage.setItem(STUDIO_CAROUSEL_KEY, 'true');
    setShowCarousel(false);
  }, []);

  return {
    studioEnabled,
    setStudioEnabled,
    showCarousel,
    dismissCarousel,
  };
}
