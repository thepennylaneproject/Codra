
import { describe, it, expect } from 'vitest';
import { CodraFlowExecutor } from '../executor';
import { VariableSystem } from '../variables';
import { AppNode, AppEdge } from '../../../types/flow';
import '../nodes'; // Register nodes

describe('Flow Execution Engine', () => {
    const executor = new CodraFlowExecutor();

    it('should execute a simple linear flow', async () => {
        const flow = {
            id: 'test-flow',
            name: 'Test Flow',
            nodes: [
                { id: '1', type: 'trigger', data: { label: 'Start' }, position: { x: 0, y: 0 } },
                { id: '2', type: 'transform', data: { label: 'Transform', output: { msg: 'Hello {{1.name}}' } }, position: { x: 100, y: 0 } },
                { id: '3', type: 'output', data: { label: 'Output' }, position: { x: 200, y: 0 } }
            ] as AppNode[],
            edges: [
                { id: 'e1', source: '1', target: '2' },
                { id: 'e2', source: '2', target: '3' }
            ] as AppEdge[]
        };

        const result = await executor.execute(flow, { name: 'World' });

        expect(result.success).toBe(true);
        expect(result.steps.length).toBe(3);
        expect(result.outputs.msg).toBe('Hello World');
    });

    it('should handle conditions', async () => {
        const flow = {
            id: 'condition-flow',
            name: 'Condition Flow',
            nodes: [
                { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
                { id: '2', type: 'condition', data: { operator: 'equals', left: '{{1.value}}', right: '10' }, position: { x: 100, y: 0 } },
                { id: '3', type: 'output', data: { mappings: { result: 'Correct' } }, position: { x: 200, y: 0 } },
                { id: '4', type: 'output', data: { mappings: { result: 'Incorrect' } }, position: { x: 200, y: 100 } }
            ] as AppNode[],
            edges: [
                { id: 'e1', source: '1', target: '2' },
                { id: 'e2', source: '2', target: '3', sourceHandle: 'true' },
                { id: 'e3', source: '2', target: '4', sourceHandle: 'false' }
            ] as AppEdge[]
        };

        const resultTrue = await executor.execute(flow, { value: 10 });
        expect(resultTrue.outputs.result).toBe('Correct');

        const resultFalse = await executor.execute(flow, { value: 5 });
        expect(resultFalse.outputs.result).toBe('Incorrect');
    });

    it('should resolve built-in variables', () => {
        const vars = new Map();
        const uuid = VariableSystem.resolve('{{$uuid}}', vars);
        expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    });
});
