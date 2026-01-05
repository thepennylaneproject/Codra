import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StudioCarouselProps {
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

const SLIDES = [
  {
    title: 'Studio workspace overview',
    description: 'Studio workspace supports focused execution. Switch desks without changing workspace state.',
  },
  {
    title: 'Desk functions',
    description: 'Each desk maps to a function: writing, design, planning, and more.',
  },
  {
    title: 'Switch desks',
    description: 'Switch desks without changing workspace state while iterating on artifacts.',
  },
];

export function StudioCarousel({ isOpen, onComplete, onDismiss }: StudioCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/40 p-6"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 10 }}
          className="w-full max-w-lg rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
            <h2 className="text-base font-semibold text-text-primary">Studio workspace overview</h2>
            <Button onClick={onDismiss} className="p-2 hover:bg-zinc-100 rounded-lg">
              <X size={16} className="text-zinc-500" />
            </Button>
          </div>

          <div className="px-6 py-6 space-y-3">
            <p className="text-xs text-zinc-400 font-semibold">
              {index + 1} of {SLIDES.length}
            </p>
            <h3 className="text-base font-semibold text-text-primary">{slide.title}</h3>
            <p className="text-sm text-text-soft leading-relaxed">{slide.description}</p>
          </div>

          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/60">
            <Button variant="ghost" onClick={onDismiss}>
              Close overview
            </Button>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button variant="ghost" onClick={() => setIndex((prev) => Math.max(0, prev - 1))}>
                  Open previous step
                </Button>
              )}
              <Button
                onClick={() => {
                  if (isLast) {
                    onComplete();
                  } else {
                    setIndex((prev) => Math.min(SLIDES.length - 1, prev + 1));
                  }
                }}
              >
                {isLast ? 'Close overview' : 'Open next step'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
