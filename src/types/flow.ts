import { Node, Edge, NodeProps } from '@xyflow/react';

export type FlowNodeType =
    | 'trigger'
    | 'aiText'
    | 'aiImage'
    | 'code'
    | 'condition'
    | 'transform'
    | 'output';

export interface FlowNodeData extends Record<string, unknown> {
    label?: string;
    [key: string]: unknown;
}

export type AppNode = Node<FlowNodeData, FlowNodeType>;
export type AppEdge = Edge;

export interface FlowState {
    nodes: AppNode[];
    edges: AppEdge[];
    onNodesChange: (changes: any) => void;
    onEdgesChange: (changes: any) => void;
    onConnect: (connection: any) => void;
    addNode: (node: AppNode) => void;
    updateNodeData: (id: string, data: Partial<FlowNodeData>) => void;
}

export type CustomNodeProps = NodeProps<AppNode>;
