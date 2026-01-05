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
        'codra',
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

        // Codra design system warnings
        'codra/no-arbitrary-tailwind': 'warn',
        'codra/coral-restricted': 'error',
        'codra/font-size-locked': 'error',
        'codra/font-weight-locked': 'error',
        'codra/spacing-locked': 'warn',
        'codra/button-usage': 'warn',
    },
    overrides: [
        {
            files: ['**/generated-*.css', '**/generated-*.js'],
            rules: {
                'codra/no-arbitrary-tailwind': 'off',
                'codra/coral-restricted': 'off',
                'codra/font-size-locked': 'off',
                'codra/font-weight-locked': 'off',
                'codra/spacing-locked': 'off',
            },
        },
    ],
};
