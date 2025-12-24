/**
 * ALT TEXT GENERATOR
 * 
 * Generates accessible alt text for images based on context.
 * Decorative backgrounds return empty alt (aria-hidden).
 * 
 * Part of the Visual Design System's accessibility integration.
 */

export type ImageContext =
    | 'background'    // Decorative, no alt needed
    | 'content'       // Informational image
    | 'icon'          // UI icon
    | 'avatar'        // User avatar
    | 'logo'          // Brand logo
    | 'product'       // Product image
    | 'illustration'; // Decorative illustration

export interface AltTextOptions {
    /** Image context determines alt text strategy */
    context?: ImageContext;
    /** Whether the image is purely decorative */
    isDecorative?: boolean;
    /** Entity name to include in alt text */
    entityName?: string;
    /** Action being performed (for icons) */
    action?: string;
}

/**
 * Generate alt text for an image
 * 
 * @param imagePath - Path or URL to the image
 * @param options - Options for generating alt text
 * @returns Generated alt text string (empty for decorative images)
 */
export function generateAltText(
    imagePath: string,
    options: AltTextOptions = {}
): string {
    const { context = 'content', isDecorative, entityName, action } = options;

    // Decorative images should have empty alt
    if (isDecorative || context === 'background') {
        return '';
    }

    // Icons with actions
    if (context === 'icon' && action) {
        return action;
    }

    // Avatars
    if (context === 'avatar') {
        return entityName ? `${entityName}'s avatar` : 'User avatar';
    }

    // Logos
    if (context === 'logo') {
        return entityName ? `${entityName} logo` : 'Logo';
    }

    // Products
    if (context === 'product') {
        if (entityName) return entityName;
        return parseFilenameForAlt(imagePath, 'Product image');
    }

    // Illustrations (usually decorative but can be informational)
    if (context === 'illustration') {
        return parseFilenameForAlt(imagePath, 'Illustration');
    }

    // Default: parse filename for semantic meaning
    return parseFilenameForAlt(imagePath, '');
}

/**
 * Parse filename for semantic alt text
 */
function parseFilenameForAlt(path: string, fallback: string): string {
    const filename = path.split('/').pop() || '';

    // Remove file extension
    const baseName = filename.replace(/\.[^.]+$/, '');

    // Parse common naming patterns
    const parts = baseName
        .split(/[_-]/)
        .filter(p => !isNoisyPart(p));

    if (parts.length === 0) {
        return fallback;
    }

    // Build descriptive text
    const descriptive = parts
        .map(p => p.replace(/([A-Z])/g, ' $1').trim()) // CamelCase to spaces
        .join(' ')
        .toLowerCase()
        .replace(/bg/g, 'background')
        .replace(/img/g, 'image');

    // Capitalize first letter
    return descriptive.charAt(0).toUpperCase() + descriptive.slice(1);
}

/**
 * Check if a filename part is noise (version numbers, technical terms)
 */
function isNoisyPart(part: string): boolean {
    const noisePatterns = [
        /^v\d+$/i,           // v1, v2, etc.
        /^MASTER$/i,         // MASTER
        /^MONO$/i,           // MONO
        /^\d+$/,             // Pure numbers
        /^(sm|md|lg|xl)$/i,  // Size suffixes
        /^(16|9|4|3|1)$/,    // Aspect ratio parts
        /^x$/i,              // Separator
    ];

    return noisePatterns.some(pattern => pattern.test(part));
}

/**
 * Get aria attributes for decorative elements
 */
export function getDecorativeAriaProps(): Record<string, string | boolean> {
    return {
        'aria-hidden': true,
        role: 'presentation',
        alt: '',
    };
}

/**
 * Get aria attributes for informational images
 */
export function getImageAriaProps(
    imagePath: string,
    options: AltTextOptions = {}
): Record<string, string> {
    const altText = generateAltText(imagePath, options);

    if (!altText) {
        return {
            'aria-hidden': 'true',
            role: 'presentation',
            alt: '',
        };
    }

    return {
        alt: altText,
        role: 'img',
    };
}

/**
 * Check if an image should be treated as decorative
 */
export function isDecorativeImage(
    imagePath: string,
    context?: ImageContext
): boolean {
    // Explicit decorative contexts
    if (context === 'background') return true;

    // Check filename patterns
    const filename = imagePath.toLowerCase();
    const decorativePatterns = [
        /background/,
        /pattern/,
        /texture/,
        /overlay/,
        /grain/,
        /noise/,
        /_bg_/,
        /_bg\./,
    ];

    return decorativePatterns.some(pattern => pattern.test(filename));
}
