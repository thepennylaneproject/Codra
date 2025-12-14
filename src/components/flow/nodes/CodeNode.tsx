import React from 'react';
import { CodeNodeIcon } from '../../icons';
import { BaseNode } from './BaseNode';
import { CustomNodeProps } from '../../../types/flow';

export const CodeNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
    return (
        <BaseNode
            data={data}
            selected={selected}
            icon={<CodeNodeIcon size={18} color="#00D9D9" />}
            color="teal"
            title="Run Code"
            inputs={[{ id: 'in', label: 'Input' }]}
            outputs={[{ id: 'out', label: 'Output' }]}
        >
            <div className="space-y-2">
                <div className="text-body-xs text-text-muted font-mono bg-background-default/50 p-2 rounded-lg border border-border-subtle">
                    <span className="text-brand-magenta">async function</span> <span className="text-brand-teal">run</span>(input) {'{'}
                    <br />
                    &nbsp;&nbsp;<span className="text-text-muted">// Your code here</span>
                    <br />
                    {'}'}
                </div>
                <button className="w-full text-body-xs bg-background-elevated hover:bg-background-subtle text-text-primary py-1.5 rounded-lg border border-border-subtle transition-colors">
                    Open Editor
                </button>
            </div>
        </BaseNode>
    );
};
