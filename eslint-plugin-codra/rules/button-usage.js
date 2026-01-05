module.exports = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Enforce use of canonical Button component' },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    if (filename.endsWith('/src/components/ui/Button.tsx')) {
      return {};
    }

    return {
      JSXOpeningElement(node) {
        if (node.name && node.name.name === 'button') {
          context.report({
            node,
            message: 'Use <Button> component instead of <button>.',
          });
        }
      },
      Literal(node) {
        if (typeof node.value === 'string' && /\\bbtn-\\w+/.test(node.value)) {
          context.report({
            node,
            message: 'Legacy btn-* classes are not allowed. Use <Button> component.',
          });
        }
      },
      TemplateElement(node) {
        if (typeof node.value?.raw === 'string' && /\\bbtn-\\w+/.test(node.value.raw)) {
          context.report({
            node,
            message: 'Legacy btn-* classes are not allowed. Use <Button> component.',
          });
        }
      },
    };
  },
};
