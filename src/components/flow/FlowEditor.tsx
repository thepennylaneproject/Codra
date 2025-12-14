import React, { useCallback, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from './store';
import { FlowNodeType } from '../../types/flow';
import { FlowToolbar } from './FlowToolbar';
import { usePresence } from '../../lib/collab/usePresence';
import { CursorOverlay } from '../collab/CursorOverlay';
import { AvatarStack } from '../collab/AvatarStack';

import {
    TriggerNode,
    AITextNode,
    AIImageNode,
    CodeNode,
    ConditionNode,
    TransformNode,
    OutputNode,
} from './nodes';

import { CustomEdge } from './edges/CustomEdge';

import { CodraFlowExecutor } from '../../lib/flow/executor';
import { ExecutionResult, StepResult } from '../../lib/flow/types';
import { FlowExecutionPanel } from './FlowExecutionPanel';

const nodeTypes = {
    trigger: TriggerNode,
    aiText: AITextNode,
    aiImage: AIImageNode,
    code: CodeNode,
    condition: ConditionNode,
    transform: TransformNode,
    output: OutputNode,
};

const edgeTypes = {
    default: CustomEdge,
};

const executor = new CodraFlowExecutor();

const Flow: React.FC = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useFlowStore();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    // Execution State
    const [executionStatus, setExecutionStatus] = React.useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');
    const [steps, setSteps] = React.useState<StepResult[]>([]);
    const [result, setResult] = React.useState<ExecutionResult | null>(null);

    const handleRunFlow = useCallback(async () => {
        if (executionStatus === 'running') return;

        setExecutionStatus('running');
        setSteps([]);
        setResult(null);

        try {
            const flow = { nodes, edges };
            const execResult = await executor.execute(flow, {}, {
                onStep: (step) => {
                    setSteps(prev => [...prev, step]);
                }
            });

            setResult(execResult);
            setExecutionStatus(execResult.success ? 'completed' : 'error');
        } catch (error) {
            console.error('Execution failed:', error);
            setExecutionStatus('error');
        }
    }, [nodes, edges, executionStatus]);


    // Presence integration
    const { others, updateCursor } = usePresence('codra-flow-room'); // Hardcoded room for now

    // Simple throttle implementation
    const lastUpdate = useRef<number>(0);
    const handleMouseMove = useCallback(
        (event: React.MouseEvent) => {
            const now = Date.now();
            if (now - lastUpdate.current > 50) {
                const position = screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                });
                updateCursor(position.x, position.y);
                lastUpdate.current = now;
            }
        },
        [screenToFlowPosition, updateCursor]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow') as FlowNodeType;

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: crypto.randomUUID(),
                type,
                position,
                data: { label: `${type} node` },
            };

            addNode(newNode);
        },
        [screenToFlowPosition, addNode],
    );

    return (
        <div className="w-full h-full" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ type: 'default', animated: true, style: { stroke: '#52525b', strokeWidth: 2 } }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onPaneMouseMove={handleMouseMove}
                fitView
                className="bg-zinc-900"
            >
                <Background gap={12} size={1} />
                <Controls />
                <MiniMap />
                <FlowToolbar>
                    <AvatarStack users={others} />
                </FlowToolbar>
                <CursorOverlay others={others} />

                {(executionStatus !== 'idle' || result) && (
                    <FlowExecutionPanel
                        status={executionStatus}
                        steps={steps}
                        result={result}
                        onClose={() => {
                            setExecutionStatus('idle');
                            setSteps([]);
                            setResult(null);
                        }}
                        onRunAgain={handleRunFlow}
                    />
                )}
            </ReactFlow>
        </div>
    );
};

export const FlowEditor: React.FC = () => {
    return (
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    );
};
