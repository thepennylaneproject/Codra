import React from 'react';
import { TransformIcon } from '../../icons';
import { BaseNode } from './BaseNode';
import { CustomNodeProps } from '../../../types/flow';

export const TransformNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
    return (
        <BaseNode
            data={data}
            selected={selected}
            icon={<TransformIcon size={18} color="#F4D03F" />}
            color="gold"
            title="Data Transform"
            inputs={[{ id: 'in', label: 'Input' }]}
            outputs={[{ id: 'out', label: 'Output' }]}
        >
            <div className="text-body-xs text-text-muted mb-2">
                Extract or format data from the previous step.
            </div>
            <div className="flex gap-2">
                <select className="flex-1 bg-background-default border border-border-subtle rounded-lg px-2 py-1 text-body-xs text-text-primary">
                    <option value="json">JSON Path</option>
                    <option value="regex">Regex</option>
                </select>
            </div>
        </BaseNode>
    );
};
