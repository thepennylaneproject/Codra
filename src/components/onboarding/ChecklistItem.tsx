import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export interface ChecklistItemProps {
  id: string;
  title: string;
  completed: boolean;
  action?: () => void;
}

export function ChecklistItem({ title, completed, action }: ChecklistItemProps) {
  return (
    <motion.li
      initial={false}
      animate={{ opacity: completed ? 0.6 : 1 }}
      className="flex items-center gap-3 group"
    >
      {/* Checkbox */}
      <div
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
          ${completed
            ? 'bg-zinc-900 border-zinc-900'
            : 'bg-white border-zinc-300 group-hover:border-zinc-400'
          }
        `}
      >
        {completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check size={12} className="text-white" strokeWidth={3} />
          </motion.div>
        )}
      </div>

      {/* Title */}
      {action ? (
        <Button
          onClick={action}
          className={`
            text-sm text-left transition-colors
            ${completed
              ? 'text-text-soft line-through'
              : 'text-text-primary hover:text-zinc-600 hover:underline'
            }
          `}
        >
          {title}
        </Button>
      ) : (
        <span
          className={`
            text-sm transition-colors
            ${completed ? 'text-text-soft line-through' : 'text-text-primary'}
          `}
        >
          {title}
        </span>
      )}
    </motion.li>
  );
}
