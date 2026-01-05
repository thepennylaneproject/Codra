import type { HTMLAttributes } from 'react';

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  meta?: string;
}

export function SectionHeader({ title, meta, className = '', ...props }: SectionHeaderProps) {
  return (
    <div className={`mt-6 mb-4 ${className}`} {...props}>
      <h3 className="text-section text-text-primary">{title}</h3>
      {meta && <p className="text-helper text-text-soft mt-1">{meta}</p>}
    </div>
  );
}
