import { loader } from '@monaco-editor/react';
import designTokens from '../../lib/design-tokens';

// Define the custom Codra theme
const defineCodraTheme = (monaco: any) => {
    monaco.editor.defineTheme('codra-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6b7280', fontStyle: 'italic' }, // TEXT.soft
            { token: 'keyword', foreground: '7a77ff' }, // BRAND.violet
            { token: 'string', foreground: 'c7a76a' }, // BRAND.gold
            { token: 'number', foreground: '4e808d' }, // BRAND.teal
            { token: 'regexp', foreground: 'f97373' }, // STATE.error (often used for regexp)
            { token: 'type', foreground: '4e808d' }, // BRAND.teal
            { token: 'class', foreground: '4e808d' }, // BRAND.teal
            { token: 'function', foreground: '7a77ff' }, // BRAND.violet
            { token: 'variable', foreground: 'f3f4e6' }, // TEXT.primary
            { token: 'delimiter', foreground: '9ca3af' }, // TEXT.muted
        ],
        colors: {
            'editor.background': designTokens.BACKGROUND.default, // #0f1214
            'editor.foreground': designTokens.TEXT.primary, // #f3f4e6
            'editor.lineHighlightBackground': designTokens.SURFACE.glassSoft, // using glassSoft for highlight
            'editorCursor.foreground': designTokens.BRAND.teal, // #4e808d
            'editorWhitespace.foreground': '#374151', // dimmed
            'editorIndentGuide.background': designTokens.BORDER.subtle,
            'editorIndentGuide.activeBackground': designTokens.BORDER.accent,
            'editor.selectionBackground': '#4e808d40', // Teal with opacity
            'editorLineNumber.foreground': designTokens.TEXT.soft,
            'editorLineNumber.activeForeground': designTokens.TEXT.primary,
        },
    });
};

// Configure the loader
export const configureMonaco = () => {
    loader.init().then((monaco) => {
        defineCodraTheme(monaco);
    });
};
