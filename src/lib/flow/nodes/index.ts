import { NodeExecutor, AppNode } from '../types';
import { triggerExecutor } from './trigger';
import { outputExecutor } from './output';
import { transformExecutor } from './transform';
import { conditionExecutor } from './condition';
import { javascriptExecutor } from './javascript';
import { aiTextExecutor } from './ai-text';
import { aiImageExecutor } from './ai-image';

const registry = new Map<string, NodeExecutor<any>>();

export function registerNodeExecutor(type: string, executor: NodeExecutor<any>) {
    registry.set(type, executor);
}

// Register default executors
registerNodeExecutor('trigger', triggerExecutor);
registerNodeExecutor('output', outputExecutor);
registerNodeExecutor('transform', transformExecutor);
registerNodeExecutor('condition', conditionExecutor);
registerNodeExecutor('code', javascriptExecutor);
registerNodeExecutor('aiText', aiTextExecutor);
registerNodeExecutor('aiImage', aiImageExecutor);

export function getNodeExecutor(type: string): NodeExecutor<AppNode> | undefined {
    return registry.get(type);
}
