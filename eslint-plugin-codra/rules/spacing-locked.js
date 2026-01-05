const ALLOWED_VALUES = new Set([
  '0',
  '1',
  '2',
  '3',
  '4',
  '6',
  '8',
  '12',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
]);

const SPACING_PREFIXES = [
  'p',
  'px',
  'py',
  'pt',
  'pr',
  'pb',
  'pl',
  'm',
  'mx',
  'my',
  'mt',
  'mr',
  'mb',
  'ml',
  'gap',
  'space-x',
  'space-y',
];

function checkString(context, node, value) {
  const classes = value.split(/\s+/).filter(Boolean);
  for (const token of classes) {
    const match = token.match(/^([a-z-]+)-(.+)$/);
    if (!match) continue;

    const [, prefix, scale] = match;
    if (!SPACING_PREFIXES.includes(prefix)) continue;

    if (scale.startsWith('[')) {
      context.report({
        node,
        message: 'Spacing must use the locked scale. Avoid arbitrary values.',
      });
      return;
    }

    if (!ALLOWED_VALUES.has(scale)) {
      context.report({
        node,
        message: 'Spacing must use the locked scale (0,1,2,3,4,6,8,12,xs,sm,md,lg,xl,2xl,3xl).',
      });
      return;
    }
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Restrict Tailwind spacing to the locked scale' },
    schema: [],
  },
  create(context) {
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
