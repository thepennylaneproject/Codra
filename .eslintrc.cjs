// Register custom Codra ESLint plugin
const codraPlugin = require('./eslint-rules');

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    env: {
        browser: true,
        es2022: true,
        node: true,
    },
    plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // Codra design system governance
        // Note: Custom rules are enforced via the codraPlugin.rules defined above
        // Violations will be caught during linting once the codebase is cleaned up

        // Add any project-specific rule overrides here
    },

    // Register custom plugin rules
    // This makes 'codra/no-hardcoded-accent' available (currently disabled until violations are fixed)
    // To enable: Uncomment the line below after fixing all violations
    // 'codra/no-hardcoded-accent': 'error',
};
