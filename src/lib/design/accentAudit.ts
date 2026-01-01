/**
 * ACCENT AUDIT UTILITY
 * =====================================================
 * Scans component tree and codebases for coral accent violations.
 *
 * Usage:
 * ```ts
 * import { auditAccentUsage, isAccentColorValue } from '@/lib/design/accentAudit';
 *
 * // Check if a color value is coral
 * if (isAccentColorValue('#FF6B6B')) {
 *   console.warn('Direct coral usage detected');
 * }
 *
 * // Audit component tree
 * const report = auditAccentUsage(document.body);
 * console.log(report);
 * ```
 */

import { ACCENT_CORAL, type AccentCoralUsage } from '../design-tokens';

/**
 * Coral color variants to detect (case-insensitive)
 */
const CORAL_PATTERNS = [
  /^#?FF6B6B$/i,              // Exact coral
  /^#?FF5252$/i,              // Hover state
  /^#?E64848$/i,              // Active state
  /^#?FF4D4D$/i,              // Old coral (migration target)
  /rgba?\(255,\s*107,\s*107/i, // RGB coral
  /rgba?\(255,\s*82,\s*82/i,   // RGB hover
  /rgba?\(230,\s*72,\s*72/i,   // RGB active
  /rgba?\(255,\s*77,\s*77/i,   // RGB old coral
];

/**
 * Approved components that may use coral accent
 */
const APPROVED_COMPONENTS = [
  'PrimaryButton',
  'Button[variant="primary"]',
  'ActiveTabIndicator',
  'TabIndicator[active]',
  'ProgressDot[active]',
  'ProgressSpinner',
  'SuccessToast',
  'SuccessCheckmark',
  'OutputItemSelected',
  'InspectorItemSelected',
];

/**
 * Check if a color value matches coral accent patterns
 */
export function isAccentColorValue(value: string): boolean {
  return CORAL_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Extract color values from a style string or CSSStyleDeclaration
 */
function extractColors(styles: string | CSSStyleDeclaration): string[] {
  const colorValues: string[] = [];
  const styleString = typeof styles === 'string' ? styles : styles.cssText;

  // Match hex colors
  const hexMatches = styleString.match(/#[0-9A-Fa-f]{6}/g) || [];
  colorValues.push(...hexMatches);

  // Match rgb/rgba colors
  const rgbMatches = styleString.match(/rgba?\([^)]+\)/g) || [];
  colorValues.push(...rgbMatches);

  // Match CSS variable references
  const varMatches = styleString.match(/var\(--[^)]+\)/g) || [];
  colorValues.push(...varMatches);

  return colorValues;
}

/**
 * Check if element is an approved component
 */
function isApprovedComponent(element: Element): boolean {
  const dataComponent = element.getAttribute('data-component');
  const dataAccentUsage = element.getAttribute('data-accent-usage');
  const className = element.className;

  // Check data attributes
  if (dataAccentUsage) {
    return ['primary-cta', 'active-progress', 'success-state', 'active-tab', 'selected-output'].includes(
      dataAccentUsage
    );
  }

  if (dataComponent && APPROVED_COMPONENTS.some((c) => dataComponent.includes(c))) {
    return true;
  }

  // Check class names (less reliable)
  if (typeof className === 'string') {
    return APPROVED_COMPONENTS.some((c) => className.includes(c.toLowerCase()));
  }

  return false;
}

/**
 * Violation found during audit
 */
export interface AccentViolation {
  element: Element;
  colorValue: string;
  source: 'inline' | 'class' | 'computed';
  location: string; // CSS selector path
  approved: boolean;
}

/**
 * Audit report
 */
export interface AccentAuditReport {
  violations: AccentViolation[];
  approvedUsages: AccentViolation[];
  summary: {
    totalViolations: number;
    totalApproved: number;
    violationRate: number;
  };
}

/**
 * Generate CSS selector path for an element
 */
function getElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ').filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes.slice(0, 2).join('.')}`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Audit accent usage in DOM tree
 */
export function auditAccentUsage(root: Element = document.body): AccentAuditReport {
  const violations: AccentViolation[] = [];
  const approvedUsages: AccentViolation[] = [];

  function scanElement(element: Element) {
    const isApproved = isApprovedComponent(element);

    // Check inline styles
    if (element.hasAttribute('style')) {
      const inlineStyle = element.getAttribute('style') || '';
      const colors = extractColors(inlineStyle);

      colors.forEach((color) => {
        if (isAccentColorValue(color)) {
          const violation: AccentViolation = {
            element,
            colorValue: color,
            source: 'inline',
            location: getElementPath(element),
            approved: isApproved,
          };

          if (isApproved) {
            approvedUsages.push(violation);
          } else {
            violations.push(violation);
          }
        }
      });
    }

    // Check class names for hardcoded colors (Tailwind arbitrary values)
    if (element.className && typeof element.className === 'string') {
      const classList = element.className;
      const arbitraryColorMatches = classList.match(/\[(#[0-9A-Fa-f]{6}|rgba?\([^)]+\))\]/g) || [];

      arbitraryColorMatches.forEach((match) => {
        const color = match.slice(1, -1); // Remove [ ]
        if (isAccentColorValue(color)) {
          const violation: AccentViolation = {
            element,
            colorValue: color,
            source: 'class',
            location: getElementPath(element),
            approved: isApproved,
          };

          if (isApproved) {
            approvedUsages.push(violation);
          } else {
            violations.push(violation);
          }
        }
      });
    }

    // Check computed styles (slower, but thorough)
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const computed = window.getComputedStyle(element);
      const relevantProps = ['backgroundColor', 'color', 'borderColor', 'fill', 'stroke'];

      relevantProps.forEach((prop) => {
        const value = computed.getPropertyValue(prop);
        if (value && isAccentColorValue(value)) {
          const violation: AccentViolation = {
            element,
            colorValue: value,
            source: 'computed',
            location: getElementPath(element),
            approved: isApproved,
          };

          if (isApproved) {
            approvedUsages.push(violation);
          } else {
            violations.push(violation);
          }
        }
      });
    }

    // Recursively scan children
    Array.from(element.children).forEach(scanElement);
  }

  scanElement(root);

  const totalViolations = violations.length;
  const totalApproved = approvedUsages.length;
  const total = totalViolations + totalApproved;
  const violationRate = total > 0 ? (totalViolations / total) * 100 : 0;

  return {
    violations,
    approvedUsages,
    summary: {
      totalViolations,
      totalApproved,
      violationRate,
    },
  };
}

/**
 * Log audit report to console with formatting
 */
export function logAuditReport(report: AccentAuditReport): void {
  console.group('🎨 Coral Accent Audit Report');

  console.log('\n📊 Summary:');
  console.log(`  Total Violations: ${report.summary.totalViolations}`);
  console.log(`  Total Approved: ${report.summary.totalApproved}`);
  console.log(`  Violation Rate: ${report.summary.violationRate.toFixed(1)}%`);

  if (report.violations.length > 0) {
    console.warn('\n⚠️  Violations Found:');
    report.violations.forEach((v, i) => {
      console.warn(`  ${i + 1}. ${v.location}`);
      console.warn(`     Color: ${v.colorValue} (${v.source})`);
    });
  } else {
    console.log('\n✅ No violations found!');
  }

  if (report.approvedUsages.length > 0) {
    console.log('\n✓ Approved Usages:');
    report.approvedUsages.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.location}`);
      console.log(`     Color: ${a.colorValue} (${a.source})`);
    });
  }

  console.groupEnd();
}

/**
 * Development-only audit on mount (React hook)
 */
export function useAccentAudit(enabled: boolean = process.env.NODE_ENV === 'development') {
  if (typeof window === 'undefined' || !enabled) return;

  // Run audit after render
  setTimeout(() => {
    const report = auditAccentUsage();
    if (report.summary.totalViolations > 0) {
      logAuditReport(report);
    }
  }, 1000);
}

/**
 * Validate accent usage at build time (for static analysis)
 */
export function validateAccentUsage(usage: string): usage is AccentCoralUsage {
  const permitted: AccentCoralUsage[] = [
    'primary-cta',
    'active-progress',
    'success-state',
    'active-tab',
    'selected-output',
  ];

  return permitted.includes(usage as AccentCoralUsage);
}

/**
 * Get permitted accent styles for a usage
 */
export function getAccentStyles(usage: AccentCoralUsage): React.CSSProperties {
  switch (usage) {
    case 'primary-cta':
      return {
        backgroundColor: ACCENT_CORAL.permitted.primaryCta.bg,
        color: ACCENT_CORAL.permitted.primaryCta.text,
      };
    case 'active-progress':
      return {
        fill: ACCENT_CORAL.permitted.activeProgress.fill,
      };
    case 'success-state':
      return {
        fill: ACCENT_CORAL.permitted.success.fill,
        borderColor: ACCENT_CORAL.permitted.success.border,
      };
    case 'active-tab':
      return {
        borderBottom: ACCENT_CORAL.permitted.activeTab.borderBottom,
      };
    case 'selected-output':
      return {
        borderLeft: ACCENT_CORAL.permitted.selectedOutput.borderLeft,
      };
    default:
      return {};
  }
}

export default {
  isAccentColorValue,
  auditAccentUsage,
  logAuditReport,
  useAccentAudit,
  validateAccentUsage,
  getAccentStyles,
};
