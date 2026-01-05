import React from 'react';

const variants = {
  pageTitle: 'text-xl font-semibold',
  sectionHeading: 'text-base font-semibold',
  body: 'text-sm font-normal',
  meta: 'text-xs font-medium text-zinc-500',
} as const;

interface TypographyProps {
  variant: keyof typeof variants;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  children: React.ReactNode;
}

export function Typography({ variant, as: Tag = 'p', className = '', children }: TypographyProps) {
  return <Tag className={`${variants[variant]} ${className}`}>{children}</Tag>;
}
