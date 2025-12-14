import React from 'react';
import { BranchIcon } from '../../icons';
import { BaseNode } from './BaseNode';
import { CustomNodeProps } from '../../../types/flow';

export const ConditionNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
    return (
        <BaseNode
            data={data}
            selected={selected}
            icon={<BranchIcon size={18} color="#F4D03F" />}
            color="gold"
            title="Condition"
            inputs={[{ id: 'in', label: 'Input' }]}
            outputs={[
                { id: 'true', label: 'True' },
                { id: 'false', label: 'False' }
            ]}
        >
            <div className="space-y-2">
                <select className="w-full bg-background-default border border-border-subtle rounded-lg px-2 py-1 text-body-xs text-text-primary">
                    <option value="contains">Contains text</option>
                    <option value="equals">Equals</option>
                    <option value="greater">Greater than</option>
                </select>
                <input
                    type="text"
                    placeholder="Value to check..."
                    className="w-full bg-background-default border border-border-subtle rounded-lg px-2 py-1 text-body-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                />
            </div>
        </BaseNode>
    );
};
