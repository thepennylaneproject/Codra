import React from 'react';
import { TriggerIcon } from '../../icons';
import { BaseNode } from './BaseNode';
import { CustomNodeProps } from '../../../types/flow';

export const TriggerNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
    return (
        <BaseNode
            data={data}
            selected={selected}
            icon={<TriggerIcon size={18} color="#D81159" />}
            color="magenta"
            title="Trigger"
            outputs={[{ id: 'out' }]}
        >
            <div className="text-body-sm text-text-muted">
                Starts the workflow when an event occurs.
            </div>
            <select
                className="w-full bg-background-default border border-border-subtle rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20"
                defaultValue="manual"
            >
                <option value="manual">Manual Trigger</option>
                <option value="webhook">Webhook</option>
                <option value="schedule">Schedule</option>
            </select>
        </BaseNode>
    );
};
