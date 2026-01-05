const ARBITRARY_CLASS_PATTERN = /^(text|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|w|h)-\[[^\]]+\]$/;

function checkString(context, node, value) {
  const classes = value.split(/\s+/).filter(Boolean);
  for (const token of classes) {
    if (ARBITRARY_CLASS_PATTERN.test(token)) {
      context.report({
        node,
        message: 'Arbitrary Tailwind values are not allowed. Use design tokens.',
      });
      return;
    }
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow arbitrary Tailwind values' },
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
