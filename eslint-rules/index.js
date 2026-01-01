/**
 * Codra ESLint Plugin
 * Custom rules for design system governance
 */

import noHardcodedAccent from './no-hardcoded-accent.js';

export default {
    rules: {
        'no-hardcoded-accent': noHardcodedAccent,
    },
};
