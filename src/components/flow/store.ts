import { create } from 'zustand';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    Connection,
    EdgeChange,
    NodeChange,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from '@xyflow/react';
import { AppNode, AppEdge } from '../../types/flow';

interface FlowState {
    nodes: AppNode[];
    edges: AppEdge[];
    onNodesChange: OnNodesChange<AppNode>;
    onEdgesChange: OnEdgesChange<AppEdge>;
    onConnect: OnConnect;
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: AppEdge[]) => void;
    addNode: (node: AppNode) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [],
    edges: [],
    onNodesChange: (changes: NodeChange<AppNode>[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes: EdgeChange<AppEdge>[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },
    setNodes: (nodes: AppNode[]) => set({ nodes }),
    setEdges: (edges: AppEdge[]) => set({ edges }),
    addNode: (node: AppNode) => {
        set({ nodes: [...get().nodes, node] });
    },
}));
