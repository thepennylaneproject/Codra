/**
 * DESK CANVAS WRAPPER
 * Renders the active desk canvas with smooth transitions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductionDeskId } from '../../../domain/types';

// Import canvas components (we'll create these next)
import { WriteCanvas } from './WriteCanvas';
import { DesignCanvas } from './DesignCanvas';
import { CodeCanvas } from './CodeCanvas';
import { AnalyzeCanvas } from './AnalyzeCanvas';

interface DeskCanvasProps {
  activeDesk: ProductionDeskId;
  projectId: string;
}

export const DeskCanvas: React.FC<DeskCanvasProps> = ({ activeDesk, projectId }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeDesk}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="w-full h-full"
      >
        {activeDesk === 'write' && <WriteCanvas projectId={projectId} />}
        {activeDesk === 'design' && <DesignCanvas projectId={projectId} />}
        {activeDesk === 'code' && <CodeCanvas projectId={projectId} />}
        {activeDesk === 'analyze' && <AnalyzeCanvas projectId={projectId} />}
      </motion.div>
    </AnimatePresence>
  );
};
