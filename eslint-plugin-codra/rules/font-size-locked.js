const ALLOWED_SIZES = new Set(['text-xs', 'text-sm', 'text-base', 'text-xl']);
const SIZE_TOKENS = new Set([
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
  'text-6xl',
  'text-7xl',
  'text-8xl',
  'text-9xl',
]);

function checkString(context, node, value) {
  const classes = value.split(/\s+/).filter(Boolean);
  for (const token of classes) {
    const isArbitrarySize = /^text-\[(\\d+(?:\\.\\d+)?)(px|rem|em)\\]$/.test(token);
    if (isArbitrarySize) {
      context.report({
        node,
        message: 'Font sizes are locked to text-xs/sm/base/xl. Avoid arbitrary values.',
      });
      return;
    }
    if (SIZE_TOKENS.has(token) && !ALLOWED_SIZES.has(token)) {
      context.report({
        node,
        message: 'Font sizes are locked to text-xs/sm/base/xl.',
      });
      return;
    }
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Restrict Tailwind font sizes to the locked scale' },
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
