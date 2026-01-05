/**
 * CANONICAL TYPOGRAPHY COMPONENTS
 * Enforces design system typography tokens.
 */

import React from 'react';

interface BaseProps {
    children: React.ReactNode;
    className?: string;
    as?: any;
}

/**
 * HEADING COMPONENT
 * For page titles and section headers.
 */
export const Heading: React.FC<BaseProps & { size?: 'sm' | 'lg' | 'xl' }> = ({
    children,
    size = 'lg',
    as: Tag = 'h2',
    className = '',
}) => {
    const sizeMap = {
        sm: 'text-sm',
        lg: 'text-base',
        xl: 'text-xl',
    };

    return (
        <Tag
            className={`font-display font-semibold tracking-tight ${sizeMap[size]} ${className}`}
        >
            {children}
        </Tag>
    );
};

/**
 * TEXT COMPONENT
 * For body copy, captions, and general text.
 */
export const Text: React.FC<BaseProps & { size?: 'xs' | 'sm' | 'base'; variant?: 'primary' | 'muted' | 'soft' }> = ({
    children,
    size = 'base',
    variant = 'primary',
    as: Tag = 'p',
    className = '',
}) => {
    const sizeMap = {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
    };

    const variantMap = {
        primary: 'text-text-primary',
        muted: 'text-text-secondary',
        soft: 'text-text-soft',
    };

    return (
        <Tag
            className={`font-sans ${sizeMap[size]} ${variantMap[variant]} ${className}`}
        >
            {children}
        </Tag>
    );
};

/**
 * LABEL COMPONENT
 * For metadata, tags, and small labels.
 */
export const Label: React.FC<BaseProps & { variant?: 'primary' | 'muted' }> = ({
    children,
    variant = 'primary',
    as: Tag = 'span',
    className = '',
}) => {
    const variantMap = {
        primary: 'text-text-primary',
        muted: 'text-text-soft',
    };

    return (
        <Tag
            className={`font-medium text-xs ${variantMap[variant]} ${className}`}
        >
            {children}
        </Tag>
    );
};
