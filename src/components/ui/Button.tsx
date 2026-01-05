import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { radii, transitions } from '../../lib/design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, { classes: string; dataAttr?: string }> = {
  primary: {
    classes:
      'bg-[var(--button-primary-bg)] text-brand-ivory hover:bg-[var(--button-primary-bg-hover)] active:bg-[var(--button-primary-bg-active)]',
    dataAttr: 'primary-cta',
  },
  secondary: {
    classes:
      'bg-transparent text-text-primary border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-border-soft)]',
  },
  ghost: {
    classes: 'text-text-secondary hover:bg-[var(--color-border-soft)] hover:text-text-primary',
  },
  danger: {
    classes: 'bg-red-500 text-white hover:bg-red-600',
  },
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-xs gap-1',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant: variantProp,
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variant = variantProp ?? 'secondary';
    const variantConfig = VARIANT_STYLES[variant];
    const hasCustomStyles = /\b(bg-|border-|text-|ring-|shadow-)\b/.test(className);
    const shouldApplyVariant = variantProp !== undefined || !hasCustomStyles;
    const variantClasses = shouldApplyVariant ? variantConfig.classes : '';

    if (process.env.NODE_ENV === 'development' && className) {
      const hasColorOverride = /bg-\[|text-\[|border-\[/.test(className);
      if (hasColorOverride && variant === 'primary') {
        console.warn(
          '[Button] Overriding primary button colors violates accent governance. ' +
            'Use variant="secondary" or variant="ghost" instead.'
        );
      }
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        data-component="Button"
        data-accent-usage={shouldApplyVariant ? variantConfig.dataAttr : undefined}
        className={`
          inline-flex items-center justify-center font-semibold
          ${radii.md}
          ${transitions.fast}
          ${variantClasses}
          ${SIZE_STYLES[size]}
          focus-standard
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.98]
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  'aria-label': string;
}

const ICON_SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant: variantProp, size = 'md', className = '', children, ...props }, ref) => {
    const variant = variantProp ?? 'ghost';
    const variantConfig = VARIANT_STYLES[variant];
    const hasCustomStyles = /\b(bg-|border-|text-|ring-|shadow-)\b/.test(className);
    const shouldApplyVariant = variantProp !== undefined || !hasCustomStyles;
    const variantClasses = shouldApplyVariant ? variantConfig.classes : '';

    return (
      <button
        ref={ref}
        data-component="IconButton"
        data-accent-usage={shouldApplyVariant ? variantConfig.dataAttr : undefined}
        className={`
          inline-flex items-center justify-center
          ${radii.md}
          ${transitions.fast}
          ${variantClasses}
          ${ICON_SIZE_STYLES[size]}
          focus-standard
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.95]
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
