// Register custom Codra ESLint plugin using CommonJS require
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
        'plugin:storybook/recommended',
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // React
        'react/react-in-jsx-scope': 'off',
        
        // TypeScript - keep as warnings for now
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',

        // NOTE: Codra accent governance rule requires ES module conversion
        // The custom plugin is currently in ES modules format which conflicts with .cjs config
        // For now, violations have been manually fixed. To enforce via ESLint:
        // 1. Either convert eslint-rules/ back to CommonJS
        // 2. Or migrate entire project to ESLint flat config (eslint.config.js)
        // Uncomment below when ready:
        // 'codra/no-hardcoded-accent': 'error',
    },
};
