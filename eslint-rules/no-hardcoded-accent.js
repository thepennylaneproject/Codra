/**
 * ESLint Rule: no-hardcoded-accent
 * =================================================
 * Enforces accent color governance by detecting hardcoded coral colors.
 *
 * DETECTS:
 * - Hardcoded #FF6B6B, #FF5252, #E64848, #FF4D4D in className
 * - Tailwind arbitrary values like bg-[#FF6B6B]
 * - Inline style objects with coral colors
 *
 * APPROVED COMPONENTS (allowed to use accent):
 * - Button with variant="primary"
 * - Components with data-accent-usage attribute
 * - ProgressDot, ProgressSpinner, TabIndicator (when marked)
 *
 * Usage in .eslintrc.cjs:
 * ```js
 * module.exports = {
 *   plugins: ['@codra'],
 *   rules: {
 *     '@codra/no-hardcoded-accent': 'error'
 *   }
 * }
 * ```
 */

const CORAL_PATTERNS = [
    /#FF6B6B/i,              // Primary coral
    /#FF5252/i,              // Hover state
    /#E64848/i,              // Active state
    /#FF4D4D/i,              // Old coral (migration target)
    /rgb\(255,\s*107,\s*107/i, // RGB coral
    /rgb\(255,\s*82,\s*82/i,   // RGB hover
    /rgb\(230,\s*72,\s*72/i,   // RGB active
    /rgb\(255,\s*77,\s*77/i,   // RGB old coral
    /rgba\(255,\s*107,\s*107/i, // RGBA coral
    /rgba\(255,\s*82,\s*82/i,   // RGBA hover
    /rgba\(230,\s*72,\s*72/i,   // RGBA active
    /rgba\(255,\s*77,\s*77/i,   // RGBA old coral
];

const APPROVED_COMPONENTS = [
    'Button',
    'PrimaryButton',
    'TabIndicator',
    'ProgressDot',
    'ProgressSpinner',
    'ProgressBar',
    'SuccessToast',
    'OutputItemSelected',
];

/**
 * Check if a string contains coral color
 */
function containsCoralColor(str) {
    return CORAL_PATTERNS.some(pattern => pattern.test(str));
}

/**
 * Check if component is approved for accent usage
 */
function isApprovedComponent(node, context) {
    // Check if parent is an approved component
    let current = node.parent;
    while (current) {
        if (current.type === 'JSXElement' && current.openingElement.name) {
            const componentName = current.openingElement.name.name;

            // Check if it's an approved component
            if (APPROVED_COMPONENTS.includes(componentName)) {
                // For Button, check if variant="primary"
                if (componentName === 'Button') {
                    const variantAttr = current.openingElement.attributes.find(
                        attr => attr.type === 'JSXAttribute' && attr.name.name === 'variant'
                    );

                    if (variantAttr && variantAttr.value) {
                        const value = variantAttr.value.value || variantAttr.value.expression?.value;
                        return value === 'primary';
                    }
                    return false; // Button without variant="primary" is not approved
                }

                // Check for data-accent-usage attribute
                const accentUsageAttr = current.openingElement.attributes.find(
                    attr => attr.type === 'JSXAttribute' && attr.name.name === 'data-accent-usage'
                );

                if (accentUsageAttr) {
                    return true;
                }

                return true; // Other approved components are allowed
            }
        }
        current = current.parent;
    }

    return false;
}

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow hardcoded coral accent colors outside approved components',
            category: 'Design System',
            recommended: true,
        },
        messages: {
            hardcodedAccent: 'Hardcoded coral accent color detected: "{{value}}". Use design tokens instead (--color-accent, --button-primary-bg, etc.)',
            useApprovedComponent: 'Coral accent should only be used in approved components (Button with variant="primary", TabIndicator, ProgressDot, etc.)',
            useDesignToken: 'Use semantic design tokens: --button-primary-bg, --progress-active, --tab-active-border, --success-icon, or --output-selected-border',
        },
        schema: [],
        fixable: null,
    },

    create(context) {
        return {
            // Check JSX className attribute
            JSXAttribute(node) {
                if (node.name.name === 'className') {
                    let classValue = '';

                    if (node.value && node.value.type === 'Literal') {
                        classValue = node.value.value;
                    } else if (node.value && node.value.type === 'JSXExpressionContainer') {
                        const expr = node.value.expression;

                        // Handle string literals in template expressions
                        if (expr.type === 'Literal') {
                            classValue = expr.value;
                        } else if (expr.type === 'TemplateLiteral') {
                            classValue = expr.quasis.map(q => q.value.raw).join('');
                        }
                    }

                    if (containsCoralColor(classValue)) {
                        const isApproved = isApprovedComponent(node, context);

                        if (!isApproved) {
                            context.report({
                                node,
                                messageId: 'hardcodedAccent',
                                data: {
                                    value: classValue.match(CORAL_PATTERNS.find(p => p.test(classValue)))?.[0] || 'coral color',
                                },
                            });
                        }
                    }
                }
            },

            // Check style attribute (inline styles)
            JSXAttribute(node) {
                if (node.name.name === 'style' && node.value) {
                    if (node.value.type === 'JSXExpressionContainer') {
                        const expr = node.value.expression;

                        if (expr.type === 'ObjectExpression') {
                            expr.properties.forEach(prop => {
                                if (prop.value && prop.value.type === 'Literal') {
                                    const value = String(prop.value.value);

                                    if (containsCoralColor(value)) {
                                        const isApproved = isApprovedComponent(node, context);

                                        if (!isApproved) {
                                            context.report({
                                                node: prop.value,
                                                messageId: 'hardcodedAccent',
                                                data: {
                                                    value: value.match(CORAL_PATTERNS.find(p => p.test(value)))?.[0] || value,
                                                },
                                            });
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            },
        };
    },
};
