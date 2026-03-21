import { Flow, FlowExecutor, ExecutionContext, ExecutionResult, StepResult } from './types';
import { VariableSystem } from './variables';
import { getNodeExecutor } from './nodes';
import { AppNode } from '../../types/flow';

export class CodraFlowExecutor implements FlowExecutor {
    private paused = false;
    private cancelled = false;
    private _context: ExecutionContext | null = null;

    async execute(flow: Flow, inputs: Record<string, any> = {}, options: { onStep?: (step: StepResult) => void } = {}): Promise<ExecutionResult> {
        this.cancelled = false;
        this.paused = false;

        const startTime = Date.now();
        const steps: StepResult[] = [];

        // Initialize context
        this._context = {
            variables: new Map(Object.entries(inputs)),
            nodeOutputs: new Map(),
            currentNode: '',
            status: 'running'
        };

        // Find start nodes (triggers or nodes with no incoming edges if strictly DAG, but usually Triggers)
        // For now, looking for nodes of type 'trigger'
        const startNodes = flow.nodes.filter(node => node.type === 'trigger');

        if (startNodes.length === 0) {
            return {
                success: false,
                outputs: {},
                steps: [],
                duration: 0,
                cost: 0,
                error: 'No trigger node found'
            };
        }

        // We'll execute strictly BFS or just follow edges from triggers.
        // Handling multiple triggers in one flow is complex; assuming single trigger for this phase 
        // or parallel execution branches.

        const queue: AppNode[] = [...startNodes];
        const visited = new Set<string>();

        try {
            while (queue.length > 0) {
                if (this.cancelled) {
                    this._context.status = 'completed'; // or cancelled
                    break;
                }

                if (this.paused) {
                    // simple spin wait or better async wait
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                }

                const node = queue.shift()!;

                // Execute step
                const result = await this.executeStep(flow, node.id, this._context);
                steps.push(result);

                if (options.onStep) {
                    options.onStep(result);
                }

                if (!result.success) {
                    throw new Error(`Node ${node.id} failed: ${result.error}`);
                }

                // Determine next nodes
                // Logic depends on edges and potentially node output (e.g. condition nodes)
                const outgoingEdges = flow.edges.filter(edge => edge.source === node.id);

                // Filter edges if the node was a condition node that returned a specific path
                // Convention: Condition nodes return a 'port' or 'handle' that matches edge sourceHandle
                let activeEdges = outgoingEdges;
                if (result.outputs && result.outputs._nextHandle) {
                    activeEdges = outgoingEdges.filter(edge => edge.sourceHandle === result.outputs._nextHandle);
                }

                for (const edge of activeEdges) {
                    const targetNode = flow.nodes.find(node => node.id === edge.target);
                    if (targetNode) {
                        // Avoid infinite loops for now with visited check, 
                        // though loops might be valid in advanced flows.
                        // For this phase, strict DAG-ish behavior on node-execution-instance basis?
                        // But standard visited check prevents loops.
                        // In a real engine, we track execution *instances* of nodes, not just nodes.
                        // For simplicity: specific node ID only runs once per execution here.
                        if (!visited.has(targetNode.id)) {
                            visited.add(targetNode.id);
                            queue.push(targetNode);
                        }
                    }
                }
            }

            this._context.status = 'completed';

            // Collect outputs from 'output' nodes
            const outputNodes = flow.nodes.filter(node => node.type === 'output');
            const finalOutputs: Record<string, any> = {};
            for (const node of outputNodes) {
                // merge outputs
                const nodeOut = this._context.nodeOutputs.get(node.id);
                if (nodeOut) {
                    Object.assign(finalOutputs, nodeOut);
                }
            }

            return {
                success: true,
                outputs: finalOutputs,
                steps,
                duration: Date.now() - startTime,
                cost: 0
            };

        } catch (error: any) {
            this._context.status = 'error';
            return {
                success: false,
                outputs: {},
                steps,
                duration: Date.now() - startTime,
                cost: 0,
                error: error.message
            };
        }
    }

    async executeStep(flow: Flow, nodeId: string, context: ExecutionContext): Promise<StepResult> {
        const node = flow.nodes.find(node => node.id === nodeId);
        if (!node) {
            return { nodeId, success: false, duration: 0, timestamp: Date.now(), error: 'Node not found' };
        }

        context.currentNode = nodeId;
        const startTime = Date.now();

        const executor = getNodeExecutor(node.type || 'default');
        if (!executor) {
            return { nodeId, success: false, duration: 0, timestamp: Date.now(), error: `No executor for type ${node.type}` };
        }

        try {
            // Resolve inputs variables
            // We merge global variables + outputs from previous nodes that connect to this node
            // Actually, usually we resolve the *node's data configuration* against variables.
            // inputs passed to execute() usually mean "intermediate data"

            // 1. Gather inputs from incoming edges
            const incomingEdges = flow.edges.filter(edge => edge.target === nodeId);
            const incomingData: Record<string, any> = {};
            for (const edge of incomingEdges) {
                const sourceKey = edge.source;
                const sourceOutput = context.nodeOutputs.get(sourceKey);
                if (sourceOutput) {
                    // If specific handle mapping execution, handle here. 
                    // For now, merge all upstream definitions.
                    Object.assign(incomingData, sourceOutput);
                }
            }

            // 2. Resolve template strings in node.data
            const nodeData = (node as any).data || {};
            const resolvedData = this.resolveNodeData(nodeData, context.variables, context);

            // 3. Execute
            // merging incomingData and resolvedData as inputs is node-specific, 
            // usually we pass them separately or merged.
            // Executor signature: execute(node, inputs, context)
            // Let's pass incomingData as 'inputs'. node.data is in the node object.

            const output = await executor.execute({ ...node, data: resolvedData }, incomingData, context);

            // Store output
            context.nodeOutputs.set(nodeId, output);

            // Update global variables if this node sets any? 
            // Usually nodes output data, they don't mutate global scope unless explicitly 'Set Variable' node.
            // We'll trust node executor to handle side effects if any, but main data flow is output.

            return {
                nodeId,
                success: true,
                outputs: output,
                duration: Date.now() - startTime,
                timestamp: Date.now()
            };

        } catch (error: any) {
            return {
                nodeId,
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                timestamp: Date.now()
            };
        }
    }

    pause() { this.paused = true; if (this._context) this._context.status = 'paused'; }
    resume() { this.paused = false; if (this._context) this._context.status = 'running'; }
    cancel() { this.cancelled = true; }

    private resolveNodeData(data: Record<string, any>, variables: Map<string, any>, context?: ExecutionContext): Record<string, any> {
        // Create combined scope if context is provided
        let scope = variables;
        if (context) {
            scope = new Map([...context.variables, ...context.nodeOutputs]);
        }

        const resolved: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                resolved[key] = VariableSystem.resolve(value, scope);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                resolved[key] = this.resolveNodeData(value as Record<string, any>, scope); // Use cached scope
            } else {
                resolved[key] = value;
            }
        }
        return resolved;
    }
}
