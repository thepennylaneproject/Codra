/**
 * Thinking Workspace State Store
 *
 * The unified state for how Codra thinks alongside you.
 * Built with Zustand + Immer for immutable updates.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuid } from 'uuid';

import type {
  ThinkingWorkspaceState,
  ThinkingPhase,
  ThoughtFragment,
  FragmentType,
  FragmentStrength,
  ShadowProject,
  LyraMode,
  LyraObservation,
  ReflectiveIntervention,
  DebateRound,
  Proposal,
  ApprovalState,
  CostConsent,
  CostRange,
  PlacedDocument,
  VerificationResult,
  ChangeRequest,
  ChangeConsent,
  CompletionState,
} from '../thinking/types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ThinkingWorkspaceState = {
  // Phase
  currentPhase: 'arrival',
  phaseHistory: [{ phase: 'arrival', enteredAt: new Date() }],

  // Arrival
  fragments: [],
  shadowProject: null,

  // Lyra
  lyraMode: 'dormant',
  observations: [],
  interventions: [],

  // Debate
  debateInProgress: false,
  debateRounds: [],

  // Proposal
  proposal: null,
  moduleApprovals: new Map(),

  // Cost
  costConsents: [],
  totalEstimatedCost: null,
  totalActualCost: 0,

  // Execution
  documents: [],
  verifications: new Map(),

  // Changes
  pendingChanges: [],
  changeHistory: [],

  // Completion
  completion: null,
};


// ============================================================================
// STORE ACTIONS
// ============================================================================

interface ThinkingActions {
  // Phase transitions
  transitionToPhase: (phase: ThinkingPhase) => void;

  // Fragment management
  addFragment: (content: string, type?: FragmentType) => ThoughtFragment;
  updateFragmentStrength: (id: string, strength: FragmentStrength) => void;
  linkFragments: (id1: string, id2: string) => void;
  incrementMentionCount: (id: string) => void;

  // Shadow project
  updateShadowProject: (updates: Partial<ShadowProject>) => void;
  setReadinessScore: (score: number) => void;

  // Lyra
  setLyraMode: (mode: LyraMode) => void;
  addObservation: (observation: Omit<LyraObservation, 'id'>) => void;
  surfaceObservation: (id: string) => void;
  dismissObservation: (id: string) => void;
  addIntervention: (intervention: Omit<ReflectiveIntervention, 'id'>) => void;
  markInterventionDelivered: (id: string) => void;

  // Debate
  startDebate: () => void;
  addDebateRound: (round: DebateRound) => void;
  endDebate: () => void;

  // Proposal
  setProposal: (proposal: Proposal) => void;
  updateModuleApproval: (moduleId: string, state: ApprovalState) => void;
  approveAllModules: () => void;

  // Cost
  addCostConsent: (consent: Omit<CostConsent, 'id'>) => void;
  setTotalEstimatedCost: (cost: CostRange) => void;
  addActualCost: (amount: number) => void;

  // Execution
  placeDocument: (document: Omit<PlacedDocument, 'id' | 'placedAt'>) => void;
  updateDocumentState: (id: string, state: PlacedDocument['state']) => void;
  addVerification: (verification: VerificationResult) => void;

  // Changes
  requestChange: (change: Omit<ChangeRequest, 'id' | 'requestedAt'>) => void;
  approveChange: (id: string) => void;
  applyChange: (id: string) => void;

  // Completion
  markComplete: (state: Omit<CompletionState, 'id' | 'completedAt'>) => void;

  // Reset
  reset: () => void;
}


// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useThinkingStore = create<ThinkingWorkspaceState & ThinkingActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      // ========================================================================
      // Phase Transitions
      // ========================================================================

      transitionToPhase: (phase) => {
        set((state) => {
          state.currentPhase = phase;
          state.phaseHistory.push({ phase, enteredAt: new Date() });
        });
      },


      // ========================================================================
      // Fragment Management
      // ========================================================================

      addFragment: (content, type = 'statement') => {
        const fragment: ThoughtFragment = {
          id: uuid(),
          content: content.trim(),
          timestamp: new Date(),
          type,
          strength: 'passing',
          mentionCount: 1,
          relatedFragments: [],
          confidence: 0.5,
        };

        set((state) => {
          state.fragments.push(fragment);

          // Wake Lyra if dormant
          if (state.lyraMode === 'dormant' && state.fragments.length >= 2) {
            state.lyraMode = 'observing';
          }
        });

        return fragment;
      },

      updateFragmentStrength: (id, strength) => {
        set((state) => {
          const fragment = state.fragments.find((f) => f.id === id);
          if (fragment) {
            fragment.strength = strength;
            // Core fragments get higher confidence
            if (strength === 'core') {
              fragment.confidence = Math.max(fragment.confidence, 0.8);
            } else if (strength === 'recurring') {
              fragment.confidence = Math.max(fragment.confidence, 0.65);
            }
          }
        });
      },

      linkFragments: (id1, id2) => {
        set((state) => {
          const f1 = state.fragments.find((f) => f.id === id1);
          const f2 = state.fragments.find((f) => f.id === id2);
          if (f1 && f2) {
            if (!f1.relatedFragments.includes(id2)) {
              f1.relatedFragments.push(id2);
            }
            if (!f2.relatedFragments.includes(id1)) {
              f2.relatedFragments.push(id1);
            }
          }
        });
      },

      incrementMentionCount: (id) => {
        set((state) => {
          const fragment = state.fragments.find((f) => f.id === id);
          if (fragment) {
            fragment.mentionCount += 1;
            // Auto-upgrade strength based on mentions
            if (fragment.mentionCount >= 3 && fragment.strength !== 'core') {
              fragment.strength = 'core';
            } else if (fragment.mentionCount >= 2 && fragment.strength === 'passing') {
              fragment.strength = 'recurring';
            }
          }
        });
      },


      // ========================================================================
      // Shadow Project
      // ========================================================================

      updateShadowProject: (updates) => {
        set((state) => {
          if (!state.shadowProject) {
            state.shadowProject = {
              id: uuid(),
              inferredType: 'unknown',
              coreBeliefs: [],
              constraints: [],
              anxieties: [],
              aesthetics: [],
              antiPatterns: [],
              openQuestions: [],
              readinessScore: 0,
              confidenceMap: new Map(),
              lastUpdated: new Date(),
            };
          }

          Object.assign(state.shadowProject, updates, { lastUpdated: new Date() });
        });
      },

      setReadinessScore: (score) => {
        set((state) => {
          if (state.shadowProject) {
            state.shadowProject.readinessScore = Math.min(1, Math.max(0, score));
          }
        });
      },


      // ========================================================================
      // Lyra
      // ========================================================================

      setLyraMode: (mode) => {
        set((state) => {
          state.lyraMode = mode;
        });
      },

      addObservation: (observation) => {
        const newObservation: LyraObservation = {
          ...observation,
          id: uuid(),
        };

        set((state) => {
          state.observations.push(newObservation);

          // If this should surface, transition Lyra to reflecting
          if (observation.shouldSurface && state.lyraMode === 'observing') {
            state.lyraMode = 'reflecting';
          }
        });
      },

      surfaceObservation: (id) => {
        set((state) => {
          const observation = state.observations.find((o) => o.id === id);
          if (observation) {
            observation.surfacedAt = new Date();
          }
        });
      },

      dismissObservation: (id) => {
        set((state) => {
          const observation = state.observations.find((o) => o.id === id);
          if (observation) {
            observation.dismissedAt = new Date();
          }
        });
      },

      addIntervention: (intervention) => {
        const newIntervention: ReflectiveIntervention = {
          ...intervention,
          id: uuid(),
        };

        set((state) => {
          state.interventions.push(newIntervention);
        });
      },

      markInterventionDelivered: (id) => {
        set((state) => {
          const intervention = state.interventions.find((i) => i.id === id);
          if (intervention) {
            intervention.deliveredAt = new Date();
          }
        });
      },


      // ========================================================================
      // Debate
      // ========================================================================

      startDebate: () => {
        set((state) => {
          state.debateInProgress = true;
          state.debateRounds = [];
          state.currentPhase = 'debate';
          state.phaseHistory.push({ phase: 'debate', enteredAt: new Date() });
        });
      },

      addDebateRound: (round) => {
        set((state) => {
          state.debateRounds.push(round);
        });
      },

      endDebate: () => {
        set((state) => {
          state.debateInProgress = false;
        });
      },


      // ========================================================================
      // Proposal
      // ========================================================================

      setProposal: (proposal) => {
        set((state) => {
          state.proposal = proposal;
          state.currentPhase = 'proposal';
          state.phaseHistory.push({ phase: 'proposal', enteredAt: new Date() });

          // Initialize all modules as proposed
          state.moduleApprovals = new Map(
            proposal.modules.map((m) => [m.id, 'proposed'])
          );

          // Set total estimated cost
          state.totalEstimatedCost = proposal.estimatedCost;
        });
      },

      updateModuleApproval: (moduleId, approvalState) => {
        set((state) => {
          state.moduleApprovals.set(moduleId, approvalState);

          // Check if all modules are approved
          const allApproved = Array.from(state.moduleApprovals.values()).every(
            (s) => s === 'approved'
          );

          if (allApproved && state.currentPhase === 'proposal') {
            state.currentPhase = 'consent';
            state.phaseHistory.push({ phase: 'consent', enteredAt: new Date() });
          }
        });
      },

      approveAllModules: () => {
        set((state) => {
          if (state.proposal) {
            state.moduleApprovals = new Map(
              state.proposal.modules.map((m) => [m.id, 'approved'])
            );
            state.currentPhase = 'consent';
            state.phaseHistory.push({ phase: 'consent', enteredAt: new Date() });
          }
        });
      },


      // ========================================================================
      // Cost
      // ========================================================================

      addCostConsent: (consent) => {
        const newConsent: CostConsent = {
          ...consent,
          id: uuid(),
        };

        set((state) => {
          state.costConsents.push(newConsent);

          // If all modules have cost consent, transition to execution
          if (state.proposal) {
            const allConsented = state.proposal.modules.every((m) =>
              state.costConsents.some((c) => c.moduleId === m.id)
            );

            if (allConsented && state.currentPhase === 'consent') {
              state.currentPhase = 'execution';
              state.phaseHistory.push({ phase: 'execution', enteredAt: new Date() });
            }
          }
        });
      },

      setTotalEstimatedCost: (cost) => {
        set((state) => {
          state.totalEstimatedCost = cost;
        });
      },

      addActualCost: (amount) => {
        set((state) => {
          state.totalActualCost += amount;
        });
      },


      // ========================================================================
      // Execution
      // ========================================================================

      placeDocument: (document) => {
        const newDocument: PlacedDocument = {
          ...document,
          id: uuid(),
          placedAt: new Date(),
        };

        set((state) => {
          state.documents.push(newDocument);
        });
      },

      updateDocumentState: (id, documentState) => {
        set((state) => {
          const document = state.documents.find((d) => d.id === id);
          if (document) {
            document.state = documentState;
          }
        });
      },

      addVerification: (verification) => {
        set((state) => {
          state.verifications.set(verification.documentId, verification);

          // Update document state based on verification
          const document = state.documents.find((d) => d.id === verification.documentId);
          if (document) {
            document.state = verification.status === 'verified' ? 'verified' :
                            verification.status === 'attention' ? 'attention' :
                            verification.status === 'conflict' ? 'attention' :
                            'placed';
          }

          // Check if all documents are verified
          const allVerified = state.documents.every((d) => d.state === 'verified');
          if (allVerified && state.documents.length > 0 && state.currentPhase === 'execution') {
            state.currentPhase = 'verification';
            state.phaseHistory.push({ phase: 'verification', enteredAt: new Date() });
          }
        });
      },


      // ========================================================================
      // Changes
      // ========================================================================

      requestChange: (change) => {
        const newChange: ChangeRequest = {
          ...change,
          id: uuid(),
          requestedAt: new Date(),
        };

        set((state) => {
          state.pendingChanges.push(newChange);
        });
      },

      approveChange: (id) => {
        set((state) => {
          const change = state.pendingChanges.find((c) => c.id === id);
          if (change) {
            const consent: ChangeConsent = {
              id: uuid(),
              changeRequest: change,
              impactAnalysis: null as any, // Would be populated by impact analyzer
              approvedAt: new Date(),
              appliedAt: null,
            };
            state.changeHistory.push(consent);
          }
        });
      },

      applyChange: (id) => {
        set((state) => {
          const consent = state.changeHistory.find(
            (c) => c.changeRequest.id === id
          );
          if (consent) {
            consent.appliedAt = new Date();
          }
          // Remove from pending
          state.pendingChanges = state.pendingChanges.filter((c) => c.id !== id);
        });
      },


      // ========================================================================
      // Completion
      // ========================================================================

      markComplete: (completionState) => {
        const completion: CompletionState = {
          ...completionState,
          id: uuid(),
          completedAt: new Date(),
        };

        set((state) => {
          state.completion = completion;
          state.currentPhase = 'complete';
          state.phaseHistory.push({ phase: 'complete', enteredAt: new Date() });
        });
      },


      // ========================================================================
      // Reset
      // ========================================================================

      reset: () => {
        set(() => ({
          ...initialState,
          phaseHistory: [{ phase: 'arrival', enteredAt: new Date() }],
        }));
      },
    })),
    {
      name: 'codra-thinking-workspace',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential state
        currentPhase: state.currentPhase,
        fragments: state.fragments,
        shadowProject: state.shadowProject,
        lyraMode: state.lyraMode,
        observations: state.observations,
        proposal: state.proposal,
        documents: state.documents,
        totalActualCost: state.totalActualCost,
        completion: state.completion,
      }),
    }
  )
);


// ============================================================================
// SELECTORS
// ============================================================================

export const selectCoreFragments = (state: ThinkingWorkspaceState) =>
  state.fragments.filter((f) => f.strength === 'core');

export const selectRecurringFragments = (state: ThinkingWorkspaceState) =>
  state.fragments.filter((f) => f.strength === 'recurring' || f.strength === 'core');

export const selectAnxietyFragments = (state: ThinkingWorkspaceState) =>
  state.fragments.filter((f) => f.type === 'anxiety');

export const selectConstraintFragments = (state: ThinkingWorkspaceState) =>
  state.fragments.filter((f) => f.type === 'constraint');

export const selectUnsurfacedObservations = (state: ThinkingWorkspaceState) =>
  state.observations.filter((o) => o.shouldSurface && !o.surfacedAt && !o.dismissedAt);

export const selectPendingInterventions = (state: ThinkingWorkspaceState) =>
  state.interventions.filter((i) => !i.deliveredAt);

export const selectApprovedModules = (state: ThinkingWorkspaceState) =>
  state.proposal?.modules.filter((m) => state.moduleApprovals.get(m.id) === 'approved') ?? [];

export const selectVerifiedDocuments = (state: ThinkingWorkspaceState) =>
  state.documents.filter((d) => d.state === 'verified');

export const selectDocumentsNeedingAttention = (state: ThinkingWorkspaceState) =>
  state.documents.filter((d) => d.state === 'attention');

export const selectIsReadyForProposal = (state: ThinkingWorkspaceState) =>
  (state.shadowProject?.readinessScore ?? 0) >= 0.7 &&
  state.fragments.length >= 5 &&
  state.fragments.some((f) => f.strength === 'core');

export const selectCostVariance = (state: ThinkingWorkspaceState) => {
  if (!state.totalEstimatedCost) return 0;
  return state.totalActualCost - state.totalEstimatedCost.expected;
};

export const selectIsCostWithinBudget = (state: ThinkingWorkspaceState) => {
  if (!state.totalEstimatedCost) return true;
  return state.totalActualCost <= state.totalEstimatedCost.maximum;
};
