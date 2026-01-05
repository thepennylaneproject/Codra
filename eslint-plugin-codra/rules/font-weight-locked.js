const ALLOWED_WEIGHTS = new Set(['font-normal', 'font-medium', 'font-semibold']);
const WEIGHT_TOKENS = new Set([
  'font-thin',
  'font-extralight',
  'font-light',
  'font-normal',
  'font-medium',
  'font-semibold',
  'font-bold',
  'font-extrabold',
  'font-black',
]);

function checkString(context, node, value) {
  const classes = value.split(/\s+/).filter(Boolean);
  for (const token of classes) {
    if (WEIGHT_TOKENS.has(token) && !ALLOWED_WEIGHTS.has(token)) {
      context.report({
        node,
        message: 'Font weights are locked to font-normal/medium/semibold.',
      });
      return;
    }
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Restrict Tailwind font weights to the locked scale' },
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
