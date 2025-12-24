// src/lib/flow/store.ts

import { create } from "zustand";
import type { CodraFlow, FlowNode } from "./types";

interface FlowState {
    flow: CodraFlow;
    selectedNodeId: string | null;
    setFlow: (flow: CodraFlow) => void;
    selectNode: (id: string | null) => void;
    updateNode: (id: string, patch: Partial<FlowNode>) => void;
}

const defaultFlow: CodraFlow = {
    id: "default",
    name: "Default flow",
    nodes: [],
    edges: [],
};

export const useFlowStore = create<FlowState>((set) => ({
    flow: defaultFlow,
    selectedNodeId: null,

    setFlow: (flow) => set({ flow }),

    selectNode: (id) => set({ selectedNodeId: id }),

    updateNode: (id, patch) =>
        set((state) => ({
            flow: {
                ...state.flow,
                nodes: state.flow.nodes.map((node) => {
                    if (node.id !== id) return node;

                    // Use any for deep merging properties like meta
                    const updatedNode = { ...node, ...patch } as any;

                    if (node && (node as any).meta && (patch as any).meta) {
                        updatedNode.meta = { ...(node as any).meta, ...(patch as any).meta };
                    }

                    return updatedNode;
                }),
            },
        })),
}));
