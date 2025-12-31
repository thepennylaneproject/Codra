# CODRA Coherence Fixes: Self-Contained Agent Tasks

This file contains 10 independent agent prompts to implement the Product Coherence Audit fixes. Each task is self-contained and can be run by Claude or another AI agent on your local machine.

**Prerequisites**:
- Access to the CODRA codebase (running at localhost:4444)
- Ability to read/edit TypeScript/React files
- Git access to push changes to `claude/product-coherence-audit-2Ipsb` branch

**How to use**:
1. Copy the prompt for the task you want to implement
2. Paste it into Claude or your preferred AI agent
3. The agent will find the relevant files, implement the changes, and commit them
4. Run tasks in order (1-10) or in parallel based on dependencies

---

## TASK 1: Add Mission Statement Banner

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Add a mission statement banner to the top of the "AI Playground" page.

CONTEXT:
- CODRA is an AI-powered project builder
- The app is running at localhost:4444
- We need to communicate the core purpose: "Build coherent AI projects. Capture intent. Create prompts. Deploy with guardrails."

REQUIREMENTS:
1. Find the "AI Playground" page component in the codebase
2. Create a new component called `<MissionBanner>`
3. Add it to the top of the AI Playground page, above the form title
4. Use the exact styling and copy provided below

IMPLEMENTATION SPECS:

**Component Code**:
```tsx
// Create file: src/components/codra/MissionBanner.tsx

export function MissionBanner() {
  return (
    <div className="mission-banner">
      <p className="mission-text">
        Build coherent AI projects. Capture intent. Create prompts. Deploy with guardrails.
      </p>
    </div>
  )
}
```

**Styling**:
```css
/* Add to src/styles/mission-banner.css or inline in component */

.mission-banner {
  background: linear-gradient(135deg, rgba(255, 240, 240, 0.8) 0%, rgba(255, 248, 248, 0.5) 100%);
  border: 1px solid #f0d0d0;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 32px;
}

.mission-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  text-align: center;
  color: #1a1a1a;
  margin: 0;
}
```

**Integration**:
- Find the AI Playground page component
- Import the MissionBanner component
- Add `<MissionBanner />` as the first child of the page container, before the form

TESTING:
- Load the AI Playground page
- Verify the banner appears at the top with correct styling
- Verify the text is centered and reads: "Build coherent AI projects. Capture intent. Create prompts. Deploy with guardrails."

DELIVERABLES:
- MissionBanner component file
- Styling file or integrated CSS
- AI Playground page updated to import and render the banner
- Git commit with message: "feat(codra): add mission statement banner to AI Playground"
```

---

## TASK 2: Enforce Required Fields in Project Setup

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Add form validation to enforce required fields in the project setup flow.

CONTEXT:
- Users can currently skip critical fields (Target Audience, Brand Constraints, Success Criteria, Guardrails)
- This defeats the "project coherence" premise
- We need to make these fields required and show validation errors

REQUIREMENTS:
1. Find the "AI Playground" form component
2. Implement form validation logic
3. Add visual indicators (red asterisks) for required fields
4. Show error messages when validation fails
5. Prevent form submission if validation fails

IMPLEMENTATION SPECS:

**Validation Logic** (add to src/lib/validation/projectBrief.ts or similar):
```typescript
interface ProjectBriefFormState {
  primarySegment: string
  voiceTone: string
  definitionOfDone: string
  guardrails: string[]
}

export function validateProjectBrief(data: ProjectBriefFormState): {
  isValid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  // Check Target Audience
  if (!data.primarySegment || data.primarySegment === 'Self') {
    errors.primarySegment = 'Please specify your target audience'
  }

  // Check Brand Constraints
  if (!data.voiceTone || data.voiceTone === 'N/A') {
    errors.voiceTone = 'Please define your brand voice and tone'
  }

  // Check Success Criteria
  if (!data.definitionOfDone || data.definitionOfDone === 'None defined') {
    errors.definitionOfDone = 'Please define how you\'ll know this project succeeded'
  }

  // Check Guardrails
  if (!data.guardrails || data.guardrails.length === 0) {
    errors.guardrails = 'Please add at least one guardrail or confirm "No guardrails needed"'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
```

**CSS Styling** (add to src/styles/form-validation.css):
```css
.required {
  color: #d32f2f;
  font-weight: bold;
  margin-left: 4px;
}

.field-error {
  border-color: #d32f2f;
  background-color: rgba(211, 47, 47, 0.05);
}

.error-message {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

**Form Field Template** (how to render fields):
```tsx
{errors.primarySegment && (
  <div className="error-message">
    <span>⚠️</span>
    <span>{errors.primarySegment}</span>
  </div>
)}
```

**Integration**:
1. Find the AI Playground form component
2. Import the validation function
3. Add required field indicators (red asterisks) to: Target Audience, Brand Constraints, Success Criteria, Guardrails
4. In the form submit handler:
   - Call validateProjectBrief(formData)
   - If validation fails, set error state and display error messages
   - Prevent navigation to next step until all errors are cleared
5. Apply the .field-error class to fields with errors

TESTING:
- Try to submit the form with empty/default values
- Verify error messages appear for each missing required field
- Verify fields are highlighted in red
- Fill in all required fields and verify the form can be submitted

DELIVERABLES:
- Validation function file
- Updated form component with validation logic and error display
- CSS styling for errors and required indicators
- Git commit with message: "feat(codra): enforce required fields in project setup with validation"
```

---

## TASK 3: Add Clear "Next Step" CTA After Setup

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Add a clear "Next Step" call-to-action after the project setup is complete.

CONTEXT:
- Users complete the AI Playground form but don't know what to do next
- The transition to Workspaces is unclear
- We need to show a prominent CTA that guides users to create their first task

REQUIREMENTS:
1. Find the AI Playground page component
2. Add a section at the bottom of the form showing "Brief Complete"
3. Add a button to "Create Your First Task" with workspace selection
4. Optionally, show a modal with workspace options (Art & Design, Engineering, Copywriting, Workflow)

IMPLEMENTATION SPECS:

**Component Code**:
```tsx
// Create file: src/components/codra/NextStepCTA.tsx

interface NextStepCTAProps {
  onSelectWorkspace: (workspace: string) => void
}

export function NextStepCTA({ onSelectWorkspace }: NextStepCTAProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="next-step-section">
        <p className="success-message">
          <span className="checkmark">✓</span> Brief complete
        </p>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => setShowModal(true)}
        >
          Create Your First Task →
        </button>
      </div>

      {showModal && (
        <div className="workspace-modal">
          <div className="modal-content">
            <h2>Where would you like to start?</h2>
            <p>Choose a workspace to create your first task.</p>

            <div className="workspace-grid">
              {[
                { id: 'art-design', name: 'Art & Design', icon: '🎨', desc: 'Generate images, mood boards, visual assets' },
                { id: 'engineering', name: 'Engineering', icon: '⚙️', desc: 'Generate code, architecture, APIs' },
                { id: 'copywriting', name: 'Copywriting', icon: '✍️', desc: 'Generate copy, messaging, docs' },
                { id: 'workflow', name: 'Workflow', icon: '⚡', desc: 'Orchestrate tasks, manage automation' }
              ].map(ws => (
                <button
                  key={ws.id}
                  className="workspace-card"
                  onClick={() => {
                    onSelectWorkspace(ws.id)
                    setShowModal(false)
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
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
```

**CSS Styling**:
```css
.next-step-section {
  margin-top: 48px;
  padding: 32px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  text-align: center;
}

.success-message {
  font-size: 16px;
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.checkmark {
  font-size: 24px;
}

.btn-primary {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #b71c1c;
}

.workspace-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.workspace-modal .modal-content {
  background: white;
  border-radius: 8px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  position: relative;
}

.workspace-modal h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.workspace-modal p {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.workspace-card {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.workspace-card:hover {
  border-color: #d32f2f;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.1);
}

.workspace-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.workspace-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.workspace-desc {
  font-size: 12px;
  color: #999;
}

.close-modal {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}
```

**Integration**:
1. Create the NextStepCTA component
2. Add it to the bottom of the AI Playground form (after all form fields)
3. Only show it after form validation passes (see Task 2)
4. Wire up the onSelectWorkspace callback to navigate to the selected workspace

TESTING:
- Complete the AI Playground form
- Verify the "Brief Complete" message appears at the bottom
- Click "Create Your First Task" button
- Verify the workspace selection modal opens
- Click a workspace and verify navigation happens

DELIVERABLES:
- NextStepCTA component file
- CSS styling file
- AI Playground page updated to import and render the component
- Navigation logic to handle workspace selection
- Git commit with message: "feat(codra): add next step CTA and workspace selection after setup"
```

---

## TASK 4: Standardize Terminology (Desk → Workspace)

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Replace inconsistent terminology ("Desk", "Studio", "Workspace") with a single term: "Workspace"

CONTEXT:
- CODRA uses "PRODUCTION DESKS", "WORKFLOW STUDIO", and "Workspace" interchangeably
- This causes confusion
- We need to standardize on "Workspace" (or "Task Workspace")

REQUIREMENTS:
1. Find all occurrences of the following terms in the codebase
2. Replace them with the correct terminology
3. Update both TypeScript code and CSS/styling

SEARCH AND REPLACE TABLE:

| Search Term | Replace With | File Types | Priority |
|-------------|--------------|-----------|----------|
| PRODUCTION DESKS | Task Workspaces | .tsx, .ts, .css | High |
| WORKFLOW STUDIO | Workflow Workspace | .tsx, .ts, .css | High |
| DESK | Workspace | .tsx, .ts, .css (when referring to a workspace) | High |
| EDITORIAL INTENT | Prompt Input | .tsx, .ts | Medium |
| EDITORIAL SPREAD | Project | .tsx, .ts | Medium |

IMPLEMENTATION:
1. Use Find & Replace in your editor or IDE
2. For each term, search across the entire codebase
3. Review each match carefully to ensure context is correct
4. Update related copy/labels to match the new terminology

BASH COMMANDS (if running from terminal):
```bash
# Replace in all TypeScript and CSS files
find ./src -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \\) \\
  -exec sed -i 's/PRODUCTION DESKS/Task Workspaces/g' {} \\;

find ./src -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \\) \\
  -exec sed -i 's/WORKFLOW STUDIO/Workflow Workspace/g' {} \\;

find ./src -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \\) \\
  -exec sed -i 's/"Desk "/"Workspace "/g' {} \\;
```

COPY UPDATES:
Also update related copy and labels:
- "View all production desks" → "Browse all workspaces"
- "Switch to a different desk" → "Choose a workspace"
- "This desk contains..." → "This workspace contains..."

TESTING:
- Search the codebase for any remaining instances of "desk", "studio", or "EDITORIAL INTENT"
- Review all updated pages in the browser
- Verify navigation, labels, and section titles use consistent terminology
- Ensure no broken references or syntax errors

DELIVERABLES:
- All occurrences of old terminology replaced
- Git commit with message: "refactor(codra): standardize terminology - desk/studio → workspace"
```

---

## TASK 5: Add Lyra Chat Affordance (Prompt Architect)

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Enhance the Lyra Assistant to be a "Prompt Architect" with clear chat affordances.

CONTEXT:
- Lyra is an AI assistant that helps refine prompts for coherence
- Currently, her interaction model is unclear (is it a chatbot? suggestions only?)
- Users don't know how to engage with her
- We need to make her purpose and interaction clear

REQUIREMENTS:
1. Find the Lyra Assistant component in the codebase
2. Add quick-action buttons for common prompt refinement tasks
3. Add a text input field for custom questions
4. Display a chat history of interactions
5. Add loading and error states

IMPLEMENTATION SPECS:

**Component Structure**:
```tsx
// File: src/components/codra/LyraAssistant.tsx

import { useState } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isError?: boolean
}

interface LyraChatProps {
  currentPrompt?: string
  projectBrief: ProjectBrief
  onPromptRefined?: (refinedPrompt: string) => void
}

export function LyraAssistant({ currentPrompt, projectBrief, onPromptRefined }: LyraChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'online' | 'offline' | 'thinking'>('online')

  const quickActions = [
    { label: '📝 Review this prompt', action: 'review', requiresPrompt: true },
    { label: '✨ Improve coherence', action: 'improve-coherence', requiresPrompt: true },
    { label: `⚡ Refine for ${projectBrief?.preferredModel || 'best model'}`, action: 'refine-model', requiresPrompt: true }
  ]

  async function handleQuickAction(action: string) {
    if (!currentPrompt) {
      alert('Write a prompt first')
      return
    }

    setIsLoading(true)
    setStatus('thinking')

    try {
      // Call your AI API to refine the prompt
      const response = await refinePromptViaLyra({
        currentPrompt,
        projectBrief,
        action
      })

      const newMessage: ChatMessage = {
        role: 'assistant',
        content: response.suggestion,
        timestamp: Date.now()
      }

      setMessages([...messages, newMessage])
      setStatus('online')

      if (response.refinedPrompt && onPromptRefined) {
        onPromptRefined(response.refinedPrompt)
      }
    } catch (error) {
      setStatus('offline')
      setMessages([...messages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Try again?',
        timestamp: Date.now(),
        isError: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    }

    setMessages([...messages, userMessage])
    setInputValue('')
    setIsLoading(true)
    setStatus('thinking')

    try {
      const response = await chatWithLyra({
        message: inputValue,
        currentPrompt,
        projectBrief
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now()
      }])

      setStatus('online')
    } catch (error) {
      setStatus('offline')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        timestamp: Date.now(),
        isError: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="lyra-assistant">
      <div className="lyra-header">
        <h3>LYRA ASSISTANT</h3>
        <div className={`status-indicator ${status}`}>
          <span className="dot"></span>
          <span className="label">
            {status === 'online' ? 'ONLINE' : status === 'thinking' ? 'THINKING' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <p className="lyra-intro">
        I can help you refine your prompts to ensure coherence with your brief.
      </p>

      {/* Quick Actions */}
      <div className="quick-actions">
        <label>Quick Actions:</label>
        {quickActions.map(action => (
          <button
            key={action.action}
            className="quick-action-btn"
            onClick={() => handleQuickAction(action.action)}
            disabled={isLoading || (action.requiresPrompt && !currentPrompt)}
            title={!currentPrompt && action.requiresPrompt ? 'Write a prompt first' : ''}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat History */}
      {messages.length > 0 && (
        <div className="chat-history">
          <label>Recent conversation:</label>
          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                <strong>{msg.role === 'user' ? 'You' : 'Lyra'}:</strong>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="lyra-input-form">
        <label>Ask Lyra:</label>
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="How can I make this more coherent?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-btn"
            title="Send message"
          >
            {isLoading ? '...' : '⏎'}
          </button>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <span className="spinner"></span>
          <p>Lyra is refining your prompt...</p>
        </div>
      )}
    </div>
  )
}

// Stub functions (replace with actual API calls)
async function refinePromptViaLyra(params: any) {
  // Call your backend AI API
  return { suggestion: 'Try adding more specific details...', refinedPrompt: '' }
}

async function chatWithLyra(params: any) {
  // Call your backend AI API
  return { message: 'Good idea! Here\'s what I suggest...' }
}
```

**CSS Styling** (add to src/styles/lyra-assistant.css):
```css
.lyra-assistant {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 14px;
  max-height: 600px;
  overflow-y: auto;
}

.lyra-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.lyra-header h3 {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: 0.5px;
  color: #333;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-indicator.online .dot {
  background: #4caf50;
}

.status-indicator.thinking .dot {
  background: #ff9800;
}

.status-indicator.offline .dot {
  background: #999;
}

.status-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.lyra-intro {
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  margin: 0;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-actions label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #999;
  margin: 0;
}

.quick-action-btn {
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.quick-action-btn:hover:not(:disabled) {
  background: #efefef;
  border-color: #d32f2f;
}

.quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.chat-history label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #999;
  margin: 0;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message {
  font-size: 12px;
  line-height: 1.4;
  padding: 8px;
  background: #f9f9f9;
  border-left: 3px solid #ddd;
  border-radius: 2px;
}

.message.assistant {
  border-left-color: #d32f2f;
}

.message.user {
  border-left-color: #2196f3;
}

.message.error {
  border-left-color: #d32f2f;
  background: rgba(211, 47, 47, 0.05);
  color: #d32f2f;
}

.message strong {
  display: block;
  margin-bottom: 4px;
  color: #333;
}

.message p {
  margin: 0;
}

.lyra-input-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.lyra-input-form label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #999;
  margin: 0;
}

.input-wrapper {
  display: flex;
  gap: 6px;
}

.lyra-input-form input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}

.lyra-input-form input:focus {
  outline: none;
  border-color: #d32f2f;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
}

.send-btn {
  padding: 8px 12px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #b71c1c;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #f0f0f0;
  border-top-color: #d32f2f;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Integration**:
1. Create the LyraAssistant component file
2. Add the CSS styling file
3. Find the Workspace pages (Art & Design, Engineering, Workflow, etc.)
4. Replace the current Lyra sidebar with this new enhanced component
5. Wire up the API calls to your backend

TESTING:
- Load a workspace with the updated Lyra Assistant
- Verify the intro text appears
- Verify quick action buttons appear (if a prompt is entered)
- Click a quick action and verify loading state, then response
- Type a message in the input and verify it sends
- Verify error states show with retry options

DELIVERABLES:
- LyraAssistant component file
- CSS styling file
- Workspace pages updated to use the new component
- Backend API stubs (or full implementation if you have the backend code)
- Git commit with message: "feat(codra): enhance Lyra Assistant with chat affordances and prompt refinement"
```

---

## TASK 6: Clearer Setup Field Labels

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Replace vague field descriptions with concrete, example-driven labels.

CONTEXT:
- Current field labels are confusing and use jargon
- Users don't know what to enter
- We need to provide clear descriptions with concrete examples

REQUIREMENTS:
1. Find the AI Playground form component
2. Update field labels and descriptions with the new text provided
3. Apply consistent formatting

FIELD UPDATES:

| Current | New | Context |
|---------|-----|---------|
| "The key segments and motivations defining the audience." | "Who will use your final product? (E.g., solo indie developers, large teams, non-technical founders)" | Target Audience field help text |
| "Voice & Tone: N/A" | "How should your project speak? (E.g., friendly & approachable, professional & authoritative, playful & casual)" | Brand Constraints field |
| "Definition of Done: None defined" | "How will you know this succeeded? (E.g., ships on time, users understand core value, integrates with existing tools)" | Success Criteria field |
| "Must Avoid: None defined" | "What rules should the AI follow? (E.g., always use brand colors, never generate NSFW content, keep everything under 500 tokens)" | Guardrails field |

IMPLEMENTATION:

Create a constants file with field metadata (optional but recommended):

```typescript
// File: src/lib/codra/formFields.ts

export const CODRA_FIELD_DESCRIPTIONS = {
  targetAudience: {
    label: 'Target Audience',
    description: 'Who will use your final product?',
    placeholder: 'E.g., solo indie developers, large teams, non-technical founders',
    required: true
  },
  brandConstraints: {
    label: 'Brand Constraints',
    description: 'How should your project speak?',
    placeholder: 'E.g., friendly & approachable, professional & authoritative, playful & casual',
    required: true
  },
  successCriteria: {
    label: 'Success Criteria',
    description: 'How will you know this succeeded?',
    placeholder: 'E.g., ships on time, users understand core value, integrates with existing tools',
    required: true
  },
  guardrails: {
    label: 'Guardrails',
    description: 'What rules should the AI follow?',
    placeholder: 'E.g., always use brand colors, never generate NSFW content, keep everything under 500 tokens',
    required: true
  }
}
```

Then use it in your form:

```tsx
import { CODRA_FIELD_DESCRIPTIONS } from '@/lib/codra/formFields'

function FormField({ fieldKey, value, onChange }) {
  const config = CODRA_FIELD_DESCRIPTIONS[fieldKey]

  return (
    <div className="form-field">
      <label>
        {config.label} {config.required && <span className="required">*</span>}
      </label>
      <p className="field-help">{config.description}</p>
      <input
        placeholder={config.placeholder}
        value={value}
        onChange={onChange}
        type="text"
      />
    </div>
  )
}
```

CSS for the help text:

```css
.field-help {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 4px 0 8px 0;
  font-weight: 500;
}

label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 4px;
}
```

**Integration**:
1. Find the AI Playground form component
2. Either create the constants file (recommended) or update the field descriptions inline
3. Add the help text descriptions below each field label
4. Update placeholder text if applicable
5. Apply consistent styling

TESTING:
- Load the AI Playground page
- Verify each field has a clear description above it
- Verify placeholder text appears in each input field
- Ensure the descriptions are understandable to a new user

DELIVERABLES:
- Form field descriptions constants file (optional)
- AI Playground form component updated with new descriptions
- CSS styling for help text
- Git commit with message: "refactor(codra): clarify project setup field labels with concrete examples"
```

---

## TASK 7: Layout Page Landing (Instead of Demo Project)

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Create a "Project Layout" page that educates first-time users about the CODRA project structure.

CONTEXT:
- First-time users need to understand how CODRA projects work
- Rather than a pre-filled demo project, we'll show the structure/flow
- Users can then click "Start My Project" to begin
- This page should be the landing page for new users

REQUIREMENTS:
1. Create a new page component called "ProjectLayoutPage" or "ProjectOnboarding"
2. Show a visual diagram of the three phases: Brief → Workspaces → Execution
3. Explain what happens in each phase
4. Add a "Start My Project" button at the bottom
5. Optionally, add a link to explore an example

IMPLEMENTATION SPECS:

**Component Code**:
```tsx
// File: src/pages/ProjectLayoutPage.tsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProjectLayoutPage() {
  const navigate = useNavigate()

  return (
    <div className="layout-page">
      <header className="layout-header">
        <h1>How CODRA Projects Work</h1>
        <p>Every project starts with a clear brief, then splits into focused workspaces.</p>
      </header>

      <div className="layout-diagram">
        {/* Phase 1: Brief */}
        <section className="phase">
          <div className="phase-header">
            <h2>1. Project Brief</h2>
            <p>Define your "North Star"</p>
          </div>
          <div className="brief-preview">
            <div className="field">Target Audience</div>
            <div className="field">Brand Constraints</div>
            <div className="field">Success Criteria</div>
            <div className="field">Guardrails</div>
          </div>
          <p className="phase-explain">
            Your brief ensures every AI task stays coherent and on-brand.
          </p>
        </section>

        <div className="flow-arrow">↓</div>

        {/* Phase 2: Workspaces */}
        <section className="phase">
          <div className="phase-header">
            <h2>2. Task Workspaces</h2>
            <p>Segregate work by type</p>
          </div>
          <div className="workspace-preview">
            <WorkspacePreview name="Art & Design" icon="🎨" tasks={3} />
            <WorkspacePreview name="Engineering" icon="⚙️" tasks={5} />
            <WorkspacePreview name="Copywriting" icon="✍️" tasks={2} />
            <WorkspacePreview name="Workflow" icon="⚡" tasks={1} />
          </div>
          <p className="phase-explain">
            Each workspace is a contained studio for a specific type of output.
          </p>
        </section>

        <div className="flow-arrow">↓</div>

        {/* Phase 3: Execution */}
        <section className="phase">
          <div className="phase-header">
            <h2>3. Execute & Deploy</h2>
            <p>Run, refine, deploy</p>
          </div>
          <div className="execution-preview">
            <ExecutionOption type="Manual" desc="Run prompts + customize in real-time" icon="👤" />
            <ExecutionOption type="Autonomous" desc="Set boundaries + AI deploys automatically" icon="🤖" />
          </div>
          <p className="phase-explain">
            You stay in control. Lyra helps refine. Guardrails prevent drift.
          </p>
        </section>
      </div>

      <footer className="layout-footer">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/playground')}
        >
          Start My Project →
        </button>
        <p className="optional-text">Or <a href="#example">explore an example</a></p>
      </footer>
    </div>
  )
}

function WorkspacePreview({ name, icon, tasks }: { name: string; icon: string; tasks: number }) {
  return (
    <div className="workspace-card">
      <div className="workspace-icon">{icon}</div>
      <div className="workspace-name">{name}</div>
      <div className="workspace-tasks">{tasks} tasks</div>
    </div>
  )
}

function ExecutionOption({ type, desc, icon }: { type: string; desc: string; icon: string }) {
  return (
    <div className="execution-card">
      <div className="execution-icon">{icon}</div>
      <div className="execution-type">{type}</div>
      <div className="execution-desc">{desc}</div>
    </div>
  )
}
```

**CSS Styling** (add to src/styles/project-layout.css):
```css
.layout-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 24px;
}

.layout-header {
  text-align: center;
  margin-bottom: 64px;
}

.layout-header h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #333;
}

.layout-header p {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.layout-diagram {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 48px;
}

.phase {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
}

.phase-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #333;
}

.phase-header p {
  font-size: 13px;
  color: #999;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.brief-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
}

.brief-preview .field {
  background: white;
  border: 1px solid #ddd;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.workspace-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
}

.workspace-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.workspace-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.workspace-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.workspace-tasks {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.execution-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
}

.execution-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  text-align: center;
}

.execution-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.execution-type {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.execution-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.flow-arrow {
  text-align: center;
  font-size: 24px;
  color: #ddd;
}

.phase-explain {
  font-size: 13px;
  color: #666;
  margin-top: 12px;
  line-height: 1.6;
}

.layout-footer {
  text-align: center;
  padding: 32px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.layout-footer .btn-lg {
  padding: 14px 28px;
  font-size: 16px;
  margin-bottom: 16px;
}

.optional-text {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.optional-text a {
  color: #d32f2f;
  text-decoration: none;
}

.optional-text a:hover {
  text-decoration: underline;
}
```

**Integration**:
1. Create the ProjectLayoutPage component
2. Create the CSS styling file
3. Add a route in App.tsx: `<Route path="/project-layout" element={<ProjectLayoutPage />} />`
4. Update the login/signup redirect to send new users to `/project-layout` instead of directly to `/playground`
5. Alternatively, make this the default landing for authenticated users who have no projects

TESTING:
- Load the /project-layout page
- Verify all three phases are visible with clear explanations
- Click "Start My Project" and verify navigation to AI Playground
- Ensure the page is responsive (mobile + desktop)

DELIVERABLES:
- ProjectLayoutPage component file
- CSS styling file
- App.tsx updated with new route
- Git commit with message: "feat(codra): add project layout onboarding page for first-time users"
```

---

## TASK 8: Loading States & Error Recovery for Lyra

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Add visual feedback for Lyra's loading, success, and error states.

CONTEXT:
- Users don't know if Lyra is thinking or if the app has frozen
- Errors don't provide clear recovery options
- We need to add loading spinners, success confirmations, and error handling

REQUIREMENTS:
1. Find the Lyra Assistant component (from Task 5)
2. Add loading state with spinner
3. Add success state confirmation
4. Add error state with retry/alternative options
5. Add offline state indicator

IMPLEMENTATION SPECS:

**Loading State HTML**:
```tsx
{isLoading && (
  <div className="lyra-message thinking">
    <span className="spinner"></span>
    <p>Lyra is refining your prompt...</p>
  </div>
)}
```

**Success State HTML**:
```tsx
{lastSuccess && (
  <div className="lyra-message success">
    <p>✓ Prompt refined to improve coherence.</p>
    {lastSuccess.preview && (
      <details className="refined-preview">
        <summary>View refined prompt</summary>
        <pre>{lastSuccess.preview}</pre>
      </details>
    )}
  </div>
)}
```

**Error State HTML**:
```tsx
{lastError && (
  <div className="lyra-message error">
    <p>⚠️ {lastError.message}</p>
    <div className="error-actions">
      <button onClick={() => retryLastAction()}>Retry</button>
      <button onClick={() => showAlternative()}>Try a different approach</button>
    </div>
  </div>
)}
```

**Offline State HTML**:
```tsx
{status === 'offline' && (
  <div className="lyra-message offline">
    <p>🔌 Lyra is temporarily offline. Your edits are saved locally.</p>
  </div>
)}
```

**CSS for States** (add to lyra-assistant.css):
```css
.lyra-message {
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
}

.lyra-message.thinking {
  background: #e3f2fd;
  color: #1565c0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lyra-message.success {
  background: #e8f5e9;
  color: #2e7d32;
  border-left: 3px solid #4caf50;
}

.lyra-message.error {
  background: #ffebee;
  color: #c62828;
  border-left: 3px solid #d32f2f;
}

.lyra-message.offline {
  background: #f5f5f5;
  color: #666;
  border-left: 3px solid #999;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(21, 101, 192, 0.2);
  border-top-color: #1565c0;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.refined-preview {
  margin-top: 8px;
}

.refined-preview summary {
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  font-size: 12px;
}

.refined-preview pre {
  background: white;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 3px;
  font-size: 11px;
  overflow-x: auto;
  margin: 8px 0 0 0;
}

.error-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.error-actions button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  color: inherit;
  transition: background 0.2s;
}

.error-actions button:hover {
  background: rgba(198, 40, 40, 0.1);
}
```

**Integration**:
1. Update the LyraAssistant component (from Task 5) to store loading, success, and error states
2. Add state variables:
   - `isLoading` (boolean)
   - `lastError` (Error object with message and recovery options)
   - `lastSuccess` (Success object with preview)
   - `status` ('online' | 'offline' | 'thinking')
3. Update the render logic to show these states
4. Add error handling to the API calls (wrap in try/catch)
5. Add retry logic and alternative suggestions for errors

TESTING:
- Click a quick action and watch the loading state appear
- Wait for the response and verify success state
- Simulate an error (e.g., turn off internet) and verify error state appears with retry button
- Click retry and verify it attempts again
- Simulate offline state and verify the indicator

DELIVERABLES:
- Updated LyraAssistant component with state management
- CSS styling for all states
- Error recovery logic and retry handlers
- Git commit with message: "feat(codra): add loading, success, and error states to Lyra Assistant"
```

---

## TASK 9: Standardize Card/Component Styles

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Create consistent card component styling across all workspaces.

CONTEXT:
- Art & Design workspace has different styling than Workflow Studio
- Task cards, resource cards, and output previews look inconsistent
- We need to standardize on a flat design (no shadows, clean borders)

REQUIREMENTS:
1. Find all card-like components in the codebase (task cards, resource cards, output previews)
2. Create a shared Card component
3. Standardize styling: flat design with 1px borders
4. Apply to all workspaces consistently
5. Remove any shadow-based elevation in favor of flat design

IMPLEMENTATION SPECS:

**Shared Card Component**:
```tsx
// File: src/components/codra/Card.tsx

interface CardProps {
  variant?: 'default' | 'highlight' | 'error' | 'success'
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function Card({
  variant = 'default',
  children,
  className = '',
  onClick,
  disabled = false
}: CardProps) {
  return (
    <div
      className={`card card-${variant} ${className} ${disabled ? 'disabled' : ''}`}
      onClick={!disabled ? onClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {children}
    </div>
  )
}
```

**CSS Styling** (create src/styles/cards.css):
```css
.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.card:not(.disabled) {
  cursor: pointer;
}

.card:not(.disabled):hover {
  border-color: #d32f2f;
  box-shadow: 0 1px 4px rgba(211, 47, 47, 0.1);
}

.card.card-highlight {
  border-color: #d32f2f;
  background: rgba(211, 47, 47, 0.02);
}

.card.card-highlight:hover {
  box-shadow: 0 1px 6px rgba(211, 47, 47, 0.15);
}

.card.card-error {
  border-color: #d32f2f;
  background: rgba(211, 47, 47, 0.05);
}

.card.card-success {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.02);
}

.card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Task Card Styling */
.task-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.task-card p {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.task-card .meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
  color: #999;
}

.task-card .priority {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
}

.task-card .priority.high {
  background: rgba(211, 47, 47, 0.1);
  color: #d32f2f;
}

.task-card .priority.medium {
  background: rgba(255, 152, 0, 0.1);
  color: #f57c00;
}

.task-card .priority.low {
  background: rgba(76, 175, 80, 0.1);
  color: #388e3c;
}

.task-card .assignee {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-card .assignee-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ddd;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* Resource Card Styling */
.resource-card {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.resource-card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.resource-card .resource-meta {
  padding: 8px 12px;
  font-size: 12px;
  color: #666;
  background: #f9f9f9;
}

.resource-card .resource-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.resource-card .resource-source {
  font-size: 11px;
  color: #999;
}

/* Kanban Card (In Progress, Done) */
.kanban-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
}

.kanban-card .title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.kanban-card .description {
  font-size: 12px;
  color: #666;
  flex-grow: 1;
}

.kanban-card .footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #999;
}
```

**Usage Examples**:

```tsx
// Task Card
<Card className="task-card">
  <h3>Task Title</h3>
  <p>Short description of the task</p>
  <div className="meta">
    <span className="priority high">HIGH</span>
    <span className="assignee">
      <span className="assignee-avatar">LY</span>
      Lyra
    </span>
  </div>
</Card>

// Resource Card
<Card className="resource-card">
  <img src="/image.jpg" alt="Resource" />
  <div className="resource-meta">
    <div className="resource-name">Brand Logo</div>
    <div className="resource-source">Uploaded 2 days ago</div>
  </div>
</Card>

// Highlight Card
<Card variant="highlight">
  <h3>Important Task</h3>
  <p>This needs immediate attention</p>
</Card>

// Error Card
<Card variant="error">
  <p>⚠️ Something went wrong. [Retry]</p>
</Card>
```

**Integration**:
1. Create the Card component file
2. Create the CSS styling file
3. Find all card-like components in Workflow Studio, Art & Design, and other workspaces
4. Replace them with the new `<Card>` component (or update them to use the shared CSS classes)
5. Audit all pages to ensure consistency
6. Remove any shadow-based styling in favor of the flat design

TESTING:
- Load each workspace (Art & Design, Engineering, Workflow)
- Verify all task cards, resource cards have consistent styling
- Hover over cards and verify the hover state (red border)
- Test different card variants (highlight, error, success)
- Verify cards look good on mobile and desktop

DELIVERABLES:
- Shared Card component file
- CSS styling file
- All workspace components updated to use the Card component
- Git commit with message: "refactor(codra): standardize card component styling across workspaces"
```

---

## TASK 10: Cost/Model Routing Dashboard (Full)

**Agent Prompt**:

```
You are implementing a Product Coherence fix for the CODRA application.

OBJECTIVE: Create a comprehensive Cost & Model Routing Dashboard.

CONTEXT:
- CODRA's key differentiator is cost-aware model routing
- Currently, users can't see costs or compare models
- We need to surface this prominently and allow model switching with cost comparison

REQUIREMENTS:
1. Create a Cost Dashboard component
2. Add a mini cost card in the top-right of workspaces
3. Add a full dashboard modal showing:
   - Current model pricing
   - Project cost breakdown
   - Cost trend chart
   - Model comparison table
   - ROI estimates (if applicable)
4. Allow users to switch models and see immediate cost impact
5. Show cost per task, per project, and over time

IMPLEMENTATION SPECS:

**Types/Interfaces**:
```typescript
// File: src/types/codra-cost.ts

export interface ModelOption {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'other'
  costPerTask: number
  pricingPerMtoken: {
    input: number
    output: number
  }
  speed: 'fast' | 'medium' | 'slow'
  quality: 'basic' | 'good' | 'great' | 'best'
  contextWindow: number
}

export interface CostData {
  total: number
  averagePerTask: number
  taskCount: number
  trend: TrendPoint[]
}

export interface TrendPoint {
  date: string
  amount: number
  taskCount: number
}
```

**Mini Cost Card Component**:
```tsx
// File: src/components/codra/CostCard.tsx

interface CostCardProps {
  projectId: string
  currentModel: string
  costPerTask: number
  onOpenDashboard: () => void
  onModelChange: (modelId: string) => void
}

export function CostCard({
  projectId,
  currentModel,
  costPerTask,
  onOpenDashboard,
  onModelChange
}: CostCardProps) {
  const [models, setModels] = useState<ModelOption[]>([])

  useEffect(() => {
    // Fetch available models
    fetchModels()
  }, [])

  async function fetchModels() {
    // Call API to get available models
    const data = await api.getAvailableModels()
    setModels(data)
  }

  return (
    <div className="cost-card">
      <div className="cost-card-item">
        <label>Model</label>
        <div className="model-selector">
          <select
            value={currentModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="cost-card-item">
        <label>Cost</label>
        <div className="cost-amount">
          ${costPerTask.toFixed(3)}/task
        </div>
      </div>

      <button
        className="cost-card-btn"
        onClick={onOpenDashboard}
        title="Open full cost dashboard"
      >
        📊 Dashboard
      </button>
    </div>
  )
}
```

**Full Dashboard Modal Component**:
```tsx
// File: src/components/codra/CostDashboard.tsx

interface CostDashboardProps {
  isOpen: boolean
  projectId: string
  onClose: () => void
  onModelChange: (modelId: string) => void
}

export function CostDashboard({
  isOpen,
  projectId,
  onClose,
  onModelChange
}: CostDashboardProps) {
  const [costData, setCostData] = useState<CostData | null>(null)
  const [models, setModels] = useState<ModelOption[]>([])
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, timeRange])

  async function loadData() {
    setIsLoading(true)
    try {
      const [costBreakdown, modelComparison] = await Promise.all([
        api.getCostBreakdown(projectId, timeRange),
        api.compareModels(projectId)
      ])
      setCostData(costBreakdown)
      setModels(modelComparison)
    } catch (error) {
      console.error('Failed to load cost data', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentModelData = models.find(m => m.id === currentModel)

  if (!isOpen) return null

  return (
    <div className="cost-dashboard-modal">
      <div className="modal-overlay" onClick={onClose}></div>

      <div className="modal-content">
        <div className="modal-header">
          <h2>Cost & Model Dashboard</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {isLoading ? (
          <div className="loading">Loading cost data...</div>
        ) : (
          <>
            {/* Current Model Details */}
            <section className="section">
              <h3>Current Model: {currentModelData?.name}</h3>
              <div className="model-details">
                <div className="detail-row">
                  <span>Input Cost</span>
                  <code>${currentModelData?.pricingPerMtoken.input}</code>
                </div>
                <div className="detail-row">
                  <span>Output Cost</span>
                  <code>${currentModelData?.pricingPerMtoken.output}</code>
                </div>
                <div className="detail-row highlight">
                  <span>Est. Cost per Task</span>
                  <code>${currentModelData?.costPerTask.toFixed(4)}</code>
                </div>
              </div>
            </section>

            {/* Project Cost Breakdown */}
            {costData && (
              <section className="section">
                <h3>Project Cost Breakdown</h3>
                <div className="breakdown">
                  <div className="breakdown-item">
                    <span>Total spent ({timeRange})</span>
                    <span className="amount">${costData.total.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Average cost per task</span>
                    <span className="amount">${costData.averagePerTask.toFixed(3)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Tasks completed</span>
                    <span className="amount">{costData.taskCount}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Cost Trend Chart */}
            {costData && (
              <section className="section">
                <h3>Cost Trend</h3>
                <div className="time-selector">
                  {(['week', 'month', 'year'] as const).map(range => (
                    <button
                      key={range}
                      className={`time-btn ${timeRange === range ? 'active' : ''}`}
                      onClick={() => setTimeRange(range)}
                    >
                      {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'Year'}
                    </button>
                  ))}
                </div>
                <CostChart data={costData.trend} />
              </section>
            )}

            {/* Model Comparison Table */}
            <section className="section">
              <h3>Compare Models</h3>
              <table className="model-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Cost/Task</th>
                    <th>Speed</th>
                    <th>Quality</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {models.map(model => (
                    <tr key={model.id}>
                      <td className="model-name">{model.name}</td>
                      <td className="cost">${model.costPerTask.toFixed(3)}</td>
                      <td><Badge text={model.speed} /></td>
                      <td><Badge text={model.quality} /></td>
                      <td>
                        <button
                          className="switch-btn"
                          disabled={model.id === currentModel}
                          onClick={() => {
                            setCurrentModel(model.id)
                            onModelChange(model.id)
                          }}
                        >
                          {model.id === currentModel ? '✓ Current' : 'Switch'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Actions */}
            <div className="modal-actions">
              <button className="btn btn-secondary">View Full Report</button>
              <button className="btn btn-secondary">Export CSV</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CostChart({ data }: { data: TrendPoint[] }) {
  // Simple chart visualization (can use a charting library like recharts)
  return (
    <div className="cost-chart">
      {/* Implement chart here */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return <span className={`badge badge-${text.toLowerCase()}`}>{text}</span>
}
```

**CSS Styling** (add to src/styles/cost-dashboard.css):
```css
.cost-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
}

.cost-card-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cost-card-item label {
  font-size: 10px;
  text-transform: uppercase;
  color: #999;
  font-weight: 700;
}

.model-selector select {
  background: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}

.cost-amount {
  font-weight: 600;
  color: #d32f2f;
}

.cost-card-btn {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.cost-card-btn:hover {
  background: #b71c1c;
}

/* Modal */
.cost-dashboard-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
}

.modal-content {
  position: relative;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.section {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.section:last-of-type {
  border-bottom: none;
}

.section h3 {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #333;
}

.model-details {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 13px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.highlight {
  background: rgba(211, 47, 47, 0.05);
  padding: 8px;
  border-radius: 4px;
  font-weight: 600;
  color: #d32f2f;
}

.detail-row code {
  font-family: 'Monaco', 'Courier New', monospace;
  background: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.breakdown {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
}

.breakdown-item span:first-child {
  color: #666;
  font-weight: 500;
}

.breakdown-item .amount {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.time-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.time-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.time-btn.active {
  background: #d32f2f;
  color: white;
  border-color: #d32f2f;
}

.cost-chart {
  min-height: 200px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
}

.model-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.model-table th {
  text-align: left;
  padding: 8px;
  border-bottom: 2px solid #e0e0e0;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
}

.model-table td {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.model-table .model-name {
  font-weight: 600;
  color: #333;
}

.model-table .cost {
  font-weight: 600;
  color: #d32f2f;
}

.switch-btn {
  padding: 4px 8px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 600;
}

.switch-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.switch-btn:hover:not(:disabled) {
  background: #b71c1c;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.badge-fast {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-medium {
  background: #fff3e0;
  color: #e65100;
}

.badge-slow {
  background: #fce4ec;
  color: #c2185b;
}

.badge-basic {
  background: #f5f5f5;
  color: #666;
}

.badge-good {
  background: #e3f2fd;
  color: #1565c0;
}

.badge-great {
  background: #f3e5f5;
  color: #6a1b9a;
}

.badge-best {
  background: #fff9c4;
  color: #fbc02d;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #ddd;
  background: white;
  flex: 1;
}

.btn:hover {
  background: #f9f9f9;
}

.btn-secondary {
  border-color: #ddd;
  color: #333;
}
```

**Integration**:
1. Create the CostCard and CostDashboard components
2. Create the types file for cost-related interfaces
3. Add the CSS styling file
4. Find the Workspace pages (Art & Design, Engineering, etc.)
5. Add the CostCard to the top-right of each workspace (near the settings)
6. Add state management to handle model switching and cost updates
7. Wire up API calls to fetch cost data and model options
8. Implement the chart visualization (can use recharts or a simple custom implementation)

BACKEND REQUIREMENTS:
You'll need API endpoints like:
- `/api/cost/breakdown?projectId=X&timeRange=month` → Returns CostData
- `/api/models/available` → Returns ModelOption[]
- `/api/models/switch` (POST) → Updates active model

TESTING:
- Load a workspace and verify the cost card appears in top-right
- Verify model dropdown works and shows available models
- Click "Dashboard" button and verify the modal opens
- Check that cost breakdown, trend chart, and model comparison all appear
- Switch models and verify costs update
- Test on mobile and desktop

DELIVERABLES:
- CostCard component file
- CostDashboard component file
- Types/interfaces file
- CSS styling file
- Workspace pages updated to include CostCard
- API integration (stubs or full implementation)
- Git commit with message: "feat(codra): add comprehensive cost and model routing dashboard"
```

---

## SUMMARY: 10 AGENT TASK PROMPTS

You now have **10 independent, self-contained agent prompts** that can be run on your local machine. Each prompt:

✅ Includes complete context and requirements
✅ Provides exact code/CSS specs
✅ Specifies file paths and integration points
✅ Includes testing instructions
✅ Defines git commit messages

**How to proceed**:

1. **Copy Task 1** → Paste into Claude
2. **Claude reads the spec** → Finds the relevant files → Makes changes → Commits
3. **Repeat for Tasks 2-10** (or run in parallel)

Alternatively, you can run all 10 prompts in parallel by giving them to multiple agent instances.

Would you like me to:
- **A)** Batch these into a single script/document you can feed to agents?
- **B)** Commit this document to the branch so your team can reference it?
- **C)** Start implementing one or more tasks now?

