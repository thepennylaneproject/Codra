import { z } from 'zod';
import { AssetManifestJSON } from './types';

// Helper Regex
const PATH_REGEX = /^[a-zA-Z0-9_\-./]+$/;
const SYMBOL_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

// 1. File Schema
export const AssetFileSchema = z.object({
    path: z.string().regex(PATH_REGEX, "Path must strictly contain alphanumeric, dash, dot, slash"),
    format: z.enum(['svg', 'png', 'webp', 'jpg', 'jpeg', 'other']),
    mimeType: z.string().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    scale: z.number().int().min(1).max(5).default(1),
});

// 2. Placement Schema
export const AssetPlacementSchema = z.object({
    kind: z.enum(['import', 'copy', 'reference']),
    file: z.string().min(1, "Target file path is required"),
    usage: z.string().optional(),
    symbol: z.string().regex(SYMBOL_REGEX, "Symbol must be a valid JS identifier").optional()
        .refine((val: string | undefined) => !val || /^[A-Z]/.test(val), { message: "Symbol should typically start with Uppercase (React component convention)" }),
});

// 3. Asset Schema
export const ManifestAssetSchema = z.object({
    name: z.string().min(2, "Asset name too short"),
    type: z.enum(['image', 'video', 'audio', 'doc', 'other']),
    description: z.string().optional(),
    purpose: z.string().optional(),
    variant: z.string().optional(),
    status: z.enum(['draft', 'ready', 'archived']).default('draft'),

    // A11Y & SEO Validation
    a11y: z.object({
        decorative: z.boolean(),
        alt: z.string().default(''),
        longDescription: z.string().optional(),
        ariaLabel: z.string().optional(),
    }).optional().refine((data) => {
        if (!data) return true; // Optional, so check parent requirement if needed, but here checking consistency if present
        if (!data.decorative && !data.alt) {
            return false;
        }
        return true;
    }, { message: "Alt text is required for non-decorative assets" }),

    seo: z.object({
        caption: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        subject: z.string().optional(),
    }).optional(),

    files: z.array(AssetFileSchema).min(1, "At least one file definition required"),
    placements: z.array(AssetPlacementSchema).optional(),
}).refine((asset) => {
    // Top level check: If it's an image and not decorative, it needs a11y block with alt
    if (asset.type === 'image') {
        if (!asset.a11y) return false;
        if (!asset.a11y.decorative && !asset.a11y.alt) return false;
    }
    return true;
}, { message: "Images must have accessibility configuration (alt text or decorative=true)", path: ['a11y'] });

// 4. Bundle Schema (Top Level)
export const AssetManifestSchema = z.object({
    version: z.literal('1.0.0'),
    bundle: z.object({
        name: z.string().min(3, "Bundle name required"),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
    }),
    assets: z.array(ManifestAssetSchema),
});

// Validation Helper
export function validateManifest(json: unknown): { success: boolean; data?: AssetManifestJSON; errors?: z.ZodError } {
    const result = AssetManifestSchema.safeParse(json);
    if (result.success) {
        return { success: true, data: result.data as AssetManifestJSON };
    }
    return { success: false, errors: result.error };
}

export function formatValidationErrors(error: z.ZodError<any>): string[] {
    return error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
    });
}
