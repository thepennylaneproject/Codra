/**
 * TASK ARTIFACT PREVIEW
 * View the result of an executed task
 */

import React from 'react';
import Editor from '@monaco-editor/react';

interface TaskArtifactPreviewProps {
    content: string;
    type: string;
    isStreaming?: boolean;
}

export const TaskArtifactPreview: React.FC<TaskArtifactPreviewProps> = ({
    content,
    // type is passed but not currently used for logic, relying oncontent detection
    // type, 
    isStreaming = false
}) => {
    // Simple language detection based on type logic or content
    const language = React.useMemo(() => {
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) return 'json';
        if (content.includes('import React')) return 'typescript';
        if (content.includes('def ')) return 'python';
        return 'markdown';
    }, [content]);

    return (
        <div className="h-[500px] w-full border border-border-subtle rounded-lg overflow-hidden flex flex-col bg-background-default">
            <div className="px-4 py-2 bg-background-subtle border-b border-border-subtle flex items-center justify-between">
                <span className="text-label-sm text-text-muted uppercase tracking-wide">
                    Preview ({language})
                </span>
                {isStreaming && (
                    <span className="text-label-xs text-brand-teal animate-pulse">
                        Streaming...
                    </span>
                )}
            </div>
            <div className="flex-1 relative">
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    value={content}
                    theme="vs-dark"
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        wordWrap: 'on',
                    }}
                />
            </div>
        </div>
    );
};
