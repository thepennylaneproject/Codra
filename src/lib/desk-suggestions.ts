/**
 * DESK SUGGESTION LOGIC
 * Recommends follow-up tasks in other desks based on approved artifacts.
 */

import { ProjectToolId } from '../domain/types';

export interface DeskSuggestion {
  deskId: ProjectToolId;
  title: string;
  description: string;
  relevance: number; // 0-1
}

const SUGGESTION_MAP: Record<ProjectToolId, Record<string, DeskSuggestion[]>> = {
  'copy': {
    'copy': [
      {
        deskId: 'design',
        title: 'Create visuals for Copy',
        description: 'Generate hero images or illustrations that match the new copy.',
        relevance: 0.9,
      },
      {
        deskId: 'code',
        title: 'Implement Content',
        description: 'Create the UI components needed to display this content.',
        relevance: 0.7,
      }
    ],
    'resume': [
      {
        deskId: 'design',
        title: 'Portfolio Layout',
        description: 'Design a portfolio page that showcases this resume experience.',
        relevance: 0.8,
      }
    ]
  },
  'design': {
    'visual-direction': [
      {
        deskId: 'copy',
        title: 'Write Taglines',
        description: 'Craft headlines that resonate with the new visual mood.',
        relevance: 0.9,
      },
      {
        deskId: 'code',
        title: 'Design System Implementation',
        description: 'Translate these visuals into CSS variables and theme tokens.',
        relevance: 0.8,
      }
    ],
    'logo': [
      {
        deskId: 'copy',
        title: 'Brand Story',
        description: 'Develop a narrative around the new logo and identity.',
        relevance: 0.7,
      }
    ]
  },
  'code': {
    'component': [
      {
        deskId: 'copy',
        title: 'Component Documentation',
        description: 'Write usage guidelines and API documentation for this component.',
        relevance: 0.8,
      }
    ],
    'api-integration': [
      {
        deskId: 'data',
        title: 'Performance Audit',
        description: 'Test the new API integration for latency and reliability.',
        relevance: 0.9,
      }
    ]
  },
  'data': {
    'research-summary': [
      {
        deskId: 'copy',
        title: 'Strategic Brief',
        description: 'Convert these insights into a high-level project strategy.',
        relevance: 0.9,
      },
      {
        deskId: 'design',
        title: 'Insight Visualizations',
        description: 'Create charts or infographics representing the data.',
        relevance: 0.8,
      }
    ]
  }
};

/**
 * Get desk suggestions based on approved work
 */
export function getDeskSuggestions(
  sourceDesk: ProjectToolId,
  artifactType: string,
  _content: string // Could be used for AI-driven refinement
): DeskSuggestion[] {
  // Normalize artifact type
  const typeKey = artifactType.toLowerCase().replace(/_/g, '-');
  
  // Find fixed suggestions
  const deskMap = SUGGESTION_MAP[sourceDesk] || {};
  let suggestions = deskMap[typeKey] || [];

  // Fallback to generic desk suggestions if type is unknown
  if (suggestions.length === 0) {
    if (sourceDesk === 'copy') {
      suggestions = deskMap['copy'] || [];
    } else if (sourceDesk === 'design') {
      suggestions = deskMap['visual-direction'] || [];
    } else if (sourceDesk === 'code') {
      suggestions = deskMap['component'] || [];
    } else if (sourceDesk === 'data') {
      suggestions = deskMap['research-summary'] || [];
    }
  }

  return suggestions;
}
