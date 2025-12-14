import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export const CustomEdge: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <path
                id={id}
                style={{ ...style, strokeWidth: 2, stroke: '#3b82f6', strokeDasharray: 5, animation: 'dashdraw 0.5s linear infinite' }}
                className="react-flow__edge-path stroke-blue-500 opacity-50 animated"
                d={edgePath}
                fill="none"
            />
            <style>
                {`
          @keyframes dashdraw {
            from {
              stroke-dashoffset: 10;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
            </style>
        </>
    );
};
