// src/components/codra/NextStepCTA.tsx
import { useState } from 'react';
import '../../styles/next-step-cta.css';

interface NextStepCTAProps {
  onSelectWorkspace: (workspace: string) => void;
}

const workspaces = [
  { id: 'art-design', name: 'Art & Design', icon: '🎨', desc: 'Generate images, mood boards, visual assets' },
  { id: 'engineering', name: 'Engineering', icon: '⚙️', desc: 'Generate code, architecture, APIs' },
  { id: 'writing', name: 'Copywriting', icon: '✍️', desc: 'Generate copy, messaging, docs' },
  { id: 'workflow', name: 'Workflow', icon: '⚡', desc: 'Orchestrate tasks, manage automation' }
];

export function NextStepCTA({ onSelectWorkspace }: NextStepCTAProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="next-step-section">
        <p className="success-message">
          <span className="checkmark">✓</span> Brief complete
        </p>
        <button
          className="btn-primary btn-lg"
          onClick={() => setShowModal(true)}
        >
          Create Your First Task →
        </button>
      </div>

      {showModal && (
        <div className="workspace-modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Where would you like to start?</h2>
            <p>Choose a workspace to create your first task.</p>

            <div className="workspace-grid">
              {workspaces.map(ws => (
                <button
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
                </button>
              ))}
            </div>

            <button
              className="close-modal"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
