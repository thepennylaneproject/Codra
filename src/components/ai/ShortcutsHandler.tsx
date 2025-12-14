import React, { useEffect } from 'react';

interface ShortcutsHandlerProps {
    onOpenChat: () => void;
    onSendSelectionToChat: () => void;
    onTriggerCompletion: () => void;
    onReviewFile: () => void;
}

export const ShortcutsHandler: React.FC<ShortcutsHandlerProps> = ({
    onOpenChat,
    onSendSelectionToChat,
    onTriggerCompletion,
    onReviewFile
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCmdOrCtrl = e.metaKey || e.ctrlKey;

            if (!isCmdOrCtrl) return;

            switch (e.key.toLowerCase()) {
                case 'k':
                    e.preventDefault();
                    onOpenChat();
                    break;
                case 'l':
                    e.preventDefault();
                    onSendSelectionToChat();
                    break;
                case 'i':
                    e.preventDefault();
                    onTriggerCompletion();
                    break;
                case 'r':
                    if (e.shiftKey) {
                        e.preventDefault();
                        onReviewFile();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpenChat, onSendSelectionToChat, onTriggerCompletion, onReviewFile]);

    return null;
};
