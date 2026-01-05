// src/components/codra/NextStepCTA.tsx
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface NextStepCTAProps {
  onSelectWorkspace: (workspace: string) => void;
}

const workspaces = [
  { id: 'design', name: 'Art & Design', icon: '🎨', desc: 'Generate images, mood boards, visual assets' },
  { id: 'code', name: 'Engineering', icon: '⚙️', desc: 'Generate code, architecture, APIs' },
  { id: 'write', name: 'Copywriting', icon: '✍️', desc: 'Generate copy, messaging, docs' },
  { id: 'analyze', name: 'Analyze', icon: '📊', desc: 'Turn data into insights and research summaries' }
];

export function NextStepCTA({ onSelectWorkspace }: NextStepCTAProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="next-step-section">
        <p className="success-message">
          <span className="checkmark">✓</span> Brief status: complete
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowModal(true)}
        >
          Create task →
        </Button>
      </div>

      {showModal && (
        <div className="workspace-modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Select a workspace</h2>
            <p>Select a workspace to create a task.</p>

            <div className="workspace-grid">
              {workspaces.map(ws => (
                <Button
                  key={ws.id}
                  className="workspace-card"
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setShowModal(false);
                  }}
                >
                  <div className="workspace-icon">{ws.icon}</div>
                  <div className="workspace-name">{ws.name}</div>
                  <div className="workspace-desc">{ws.desc}</div>
                </Button>
              ))}
            </div>

            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
              className="absolute top-3 right-3"
            >
              <X size={16} />
            </IconButton>
          </div>
        </div>
      )}
    </>
  );
}
