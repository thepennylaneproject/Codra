const ALLOWED_FILES = [
  'Button.tsx',
  'SuccessCheckmark.tsx',
  'ProgressDot.tsx',
  'ActiveTab.tsx',
  'SelectedInspector.tsx',
  'design-tokens.ts',
  'accentAudit.ts',
];

const CORAL_PATTERNS = [/#FF6B6B/i, /rgb\(255,\s*107,\s*107\)/i, /--color-coral/i];

function checkString(context, node, value) {
  for (const pattern of CORAL_PATTERNS) {
    if (pattern.test(value)) {
      context.report({
        node,
        message: 'Coral accent (#FF6B6B) is restricted to primary CTA components only.',
      });
      return;
    }
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Restrict coral accent to approved components' },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    const isAllowed = ALLOWED_FILES.some((file) => filename.endsWith(file));

    if (isAllowed) {
      return {};
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkString(context, node, node.value);
        }
      },
      TemplateElement(node) {
        if (typeof node.value?.raw === 'string') {
          checkString(context, node, node.value.raw);
        }
      },
    };
  },
};
