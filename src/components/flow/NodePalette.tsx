import React from 'react';
import { FlowNodeType } from '../../types/flow';
import {
    Bot,
    Code,
    GitBranch,
    Image as ImageIcon,
    MousePointer2,
    Play,
    FileOutput
} from 'lucide-react';

export const NodePalette: React.FC = () => {
    const onDragStart = (event: React.DragEvent, nodeType: FlowNodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const nodeTypes: { type: FlowNodeType; label: string; icon: React.ReactNode }[] = [
        { type: 'trigger', label: 'Trigger', icon: <Play className="w-4 h-4" /> },
        { type: 'aiText', label: 'AI Text', icon: <Bot className="w-4 h-4" /> },
        { type: 'aiImage', label: 'AI Image', icon: <ImageIcon className="w-4 h-4" /> },
        { type: 'code', label: 'Code', icon: <Code className="w-4 h-4" /> },
        { type: 'condition', label: 'Condition', icon: <GitBranch className="w-4 h-4" /> },
        { type: 'transform', label: 'Transform', icon: <MousePointer2 className="w-4 h-4" /> },
        { type: 'output', label: 'Output', icon: <FileOutput className="w-4 h-4" /> },
    ];

    return (
        <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-4">
            <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Nodes</h3>
                <div className="flex flex-col gap-2">
                    {nodeTypes.map((node) => (
                        <div
                            key={node.type}
                            className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg cursor-grab hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                            onDragStart={(event) => onDragStart(event, node.type)}
                            draggable
                        >
                            <div className="text-zinc-400">{node.icon}</div>
                            <span className="text-sm text-zinc-200">{node.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                    Drag nodes to the canvas to build your workflow.
                </div>
            </div>
        </aside>
    );
};
