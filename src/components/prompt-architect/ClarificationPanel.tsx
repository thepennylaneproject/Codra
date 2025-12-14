/**
 * PROMPT ARCHITECT - Clarification Panel
 * src/components/prompt-architect/ClarificationPanel.tsx
 * 
 * Displays clarification questions when intent needs more detail
 */

import React from 'react';
import { HelpCircle, Check } from 'lucide-react';
import { usePromptArchitectStore } from '../../lib/prompt-architect';
import { ClarificationQuestion } from '../../lib/prompt-architect/types';
import { cn } from '../../lib/utils';

// ============================================================
// Component
// ============================================================

export const ClarificationPanel: React.FC = () => {
    const questions = usePromptArchitectStore(state => state.clarificationQuestions);
    const answers = usePromptArchitectStore(state => state.clarificationAnswers);
    const answerClarification = usePromptArchitectStore(state => state.answerClarification);

    if (questions.length === 0) return null;

    return (
        <div className="p-4 border-b border-glass-edge bg-energy-gold/5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-energy-gold" />
                <span className="text-xs font-medium text-energy-gold uppercase tracking-wide">
                    Quick Clarification
                </span>
            </div>

            {/* Questions */}
            <div className="space-y-4">
                {questions.map((question) => (
                    <QuestionItem
                        key={question.id}
                        question={question}
                        answer={answers[question.id] || ''}
                        onAnswer={(answer) => answerClarification(question.id, answer)}
                    />
                ))}
            </div>
        </div>
    );
};

// ============================================================
// Question Item
// ============================================================

interface QuestionItemProps {
    question: ClarificationQuestion;
    answer: string;
    onAnswer: (answer: string) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question, answer, onAnswer }) => {
    const isAnswered = answer.trim() !== '';

    return (
        <div className="space-y-2">
            {/* Question Text */}
            <div className="flex items-start gap-2">
                <span className={cn(
                    'text-sm',
                    isAnswered ? 'text-stardust-muted' : 'text-stardust'
                )}>
                    {question.question}
                    {question.required && <span className="text-energy-rose ml-0.5">*</span>}
                </span>
                {isAnswered && (
                    <Check className="w-4 h-4 text-state-success flex-shrink-0" />
                )}
            </div>

            {/* Quick Options */}
            {question.options && question.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => onAnswer(option)}
                            className={cn(
                                'px-2.5 py-1 text-xs rounded-md border transition-all',
                                answer === option
                                    ? 'bg-energy-teal/20 border-energy-teal/50 text-energy-teal'
                                    : 'bg-void-soft border-glass-edge text-stardust-muted hover:text-stardust hover:border-glass-edge-bright'
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}

            {/* Free-text Input (for questions without options or custom answer) */}
            {(!question.options || question.options.length === 0) && (
                <input
                    type="text"
                    value={answer}
                    onChange={(e) => onAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className={cn(
                        'w-full bg-void-soft border border-glass-edge rounded-md px-3 py-2',
                        'text-sm text-stardust placeholder:text-stardust-dim',
                        'focus:outline-none focus:border-energy-teal/50 focus:ring-1 focus:ring-energy-teal/20',
                        'transition-all'
                    )}
                />
            )}

            {/* Custom input when option selected */}
            {question.options && question.options.length > 0 && !question.options.includes(answer) && answer && (
                <input
                    type="text"
                    value={answer}
                    onChange={(e) => onAnswer(e.target.value)}
                    placeholder="Or type a custom answer..."
                    className={cn(
                        'w-full bg-void-soft border border-glass-edge rounded-md px-3 py-2',
                        'text-sm text-stardust placeholder:text-stardust-dim',
                        'focus:outline-none focus:border-energy-teal/50',
                        'transition-all'
                    )}
                />
            )}
        </div>
    );
};

export default ClarificationPanel;
