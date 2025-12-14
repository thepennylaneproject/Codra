/**
 * STUDIO PAGE
 * Main page for the creative automation studio
 * Integrates the three-panel layout (Architect | Canvas | Forge)
 */

import React from 'react';
import { StudioLayout } from '../components/studio/StudioLayout';

export const StudioPage: React.FC = () => {
  return (
    <StudioLayout
      projectName="My First Workflow"
      onProjectChange={(projectId) => console.log('Project changed:', projectId)}
    />
  );
};

export default StudioPage;
