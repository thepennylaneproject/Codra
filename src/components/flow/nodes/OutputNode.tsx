import React from 'react';
import { OutputIcon } from '../../icons';
import { BaseNode } from './BaseNode';
import { CustomNodeProps } from '../../../types/flow';

export const OutputNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
    return (
        <BaseNode
            data={data}
            selected={selected}
            icon={<OutputIcon size={18} color="#00D9D9" />}
            color="teal"
            title="Workflow Output"
            inputs={[{ id: 'in', label: 'Final Result' }]}
        >
            <div className="text-body-xs text-text-muted">
                Displays the final result of the workflow execution.
            </div>
        </BaseNode>
    );
};
