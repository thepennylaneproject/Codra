import React from 'react';
import { AITextNodeIcon } from '../../icons';
import { BaseNode } from './BaseNode';
import { CustomNodeProps } from '../../../types/flow';

export const AITextNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
    return (
        <BaseNode
            data={data}
            selected={selected}
            icon={<AITextNodeIcon size={18} color="#F4D03F" />}
            color="gold"
            title="AI Text"
            inputs={[{ id: 'in', label: 'Prompt' }]}
            outputs={[{ id: 'result', label: 'Text' }]}
        >
            <div className="space-y-2">
                <label className="text-label-xs text-text-muted">System Message</label>
                <textarea
                    className="w-full h-16 bg-background-default border border-border-subtle rounded-lg px-2 py-1.5 text-body-xs text-text-primary resize-none focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 placeholder-text-muted"
                    placeholder="You are a helpful assistant..."
                />

                <div className="flex items-center justify-between text-body-xs text-text-muted pt-1 border-t border-border-subtle">
                    <span>Model: GPT-4o</span>
                    <span>~0.5s</span>
                </div>
            </div>
        </BaseNode>
    );
};
