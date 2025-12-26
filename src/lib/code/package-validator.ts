/**
 * PACKAGE VALIDATOR
 * src/lib/code/package-validator.ts
 * 
 * Validates npm packages to prevent "slopsquatting" attacks
 * where AI hallucinates non-existent packages that attackers register.
 */

export interface PackageValidation {
    name: string;
    exists: boolean;
    downloadCount?: number;
    lastPublished?: string;
    version?: string;
    description?: string;
    riskLevel: 'safe' | 'review' | 'suspicious' | 'dangerous';
    riskReasons: string[];
}

interface NpmRegistryResponse {
    name: string;
    version: string;
    description?: string;
    time?: {
        modified: string;
        created: string;
        [version: string]: string;
    };
}

interface NpmDownloadsResponse {
    downloads: number;
    package: string;
}

// Known trusted packages (high-traffic, well-established)
const TRUSTED_PACKAGES = new Set([
    'react', 'react-dom', 'next', 'vue', 'angular', 'svelte',
    'express', 'fastify', 'koa', 'hapi',
    'lodash', 'underscore', 'ramda',
    'axios', 'node-fetch', 'got', 'superagent',
    'typescript', 'ts-node', 'tslib',
    'tailwindcss', 'postcss', 'autoprefixer',
    'jest', 'mocha', 'vitest', 'playwright', 'cypress',
    'eslint', 'prettier', 'husky',
    'zod', 'yup', 'joi',
    'prisma', '@prisma/client', 'drizzle-orm', 'typeorm', 'sequelize',
    'mongoose', 'mongodb',
    '@supabase/supabase-js', 'firebase',
    'zustand', 'jotai', 'recoil', 'redux', '@reduxjs/toolkit',
    'framer-motion', 'react-spring', 'gsap',
    'lucide-react', '@heroicons/react', 'react-icons',
    'date-fns', 'dayjs', 'moment', 'luxon',
    'uuid', 'nanoid', 'cuid',
    'clsx', 'classnames', 'tailwind-merge',
    'shadcn-ui', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
]);

// Suspicious patterns that indicate potential typosquatting
const SUSPICIOUS_PATTERNS = [
    /^[a-z]+-[a-z]+[0-9]+$/, // e.g., "react-dom2"
    /^[a-z]+js$/, // e.g., "expressjs" (often fake)
    /lodash[^/]/, // lodash variants that aren't lodash
    /-fixed$/, // e.g., "some-package-fixed"
    /-fork$/, // e.g., "some-package-fork"
    /^@[a-z]+\//, // Scoped packages need extra scrutiny
];

/**
 * Validate a single package
 */
export async function validatePackage(packageName: string): Promise<PackageValidation> {
    const riskReasons: string[] = [];

    // Check if it's a known trusted package
    if (TRUSTED_PACKAGES.has(packageName)) {
        return {
            name: packageName,
            exists: true,
            riskLevel: 'safe',
            riskReasons: [],
        };
    }

    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(packageName)) {
            riskReasons.push(`Name matches suspicious pattern: ${pattern.toString()}`);
        }
    }

    try {
        // Fetch package info from npm registry
        const registryResponse = await fetch(
            `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
            { headers: { Accept: 'application/json' } }
        );

        if (!registryResponse.ok) {
            if (registryResponse.status === 404) {
                return {
                    name: packageName,
                    exists: false,
                    riskLevel: 'dangerous',
                    riskReasons: ['Package does not exist on npm - possible AI hallucination'],
                };
            }
            throw new Error(`Registry returned ${registryResponse.status}`);
        }

        const packageInfo: NpmRegistryResponse = await registryResponse.json();

        // Fetch download counts
        let downloadCount = 0;
        try {
            const downloadsResponse = await fetch(
                `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`
            );
            if (downloadsResponse.ok) {
                const downloadsData: NpmDownloadsResponse = await downloadsResponse.json();
                downloadCount = downloadsData.downloads;
            }
        } catch {
            // Download count is optional, don't fail if we can't get it
        }

        // Risk assessment
        let riskLevel: PackageValidation['riskLevel'] = 'safe';

        // Low downloads = suspicious
        if (downloadCount < 100) {
            riskReasons.push(`Very low download count: ${downloadCount}/week`);
            riskLevel = 'suspicious';
        } else if (downloadCount < 1000) {
            riskReasons.push(`Low download count: ${downloadCount}/week`);
            if (riskLevel === 'safe') riskLevel = 'review';
        }

        // Check publish date
        if (packageInfo.time?.created) {
            const createdDate = new Date(packageInfo.time.created);
            const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceCreation < 30) {
                riskReasons.push(`Recently created: ${Math.round(daysSinceCreation)} days ago`);
                if (riskLevel !== 'suspicious') riskLevel = 'review';
            }
        }

        // Check for suspicious description
        if (!packageInfo.description || packageInfo.description.length < 20) {
            riskReasons.push('No description or very short description');
            if (riskLevel === 'safe') riskLevel = 'review';
        }

        return {
            name: packageName,
            exists: true,
            downloadCount,
            lastPublished: packageInfo.time?.modified,
            version: packageInfo.version,
            description: packageInfo.description,
            riskLevel,
            riskReasons,
        };
    } catch (error) {
        return {
            name: packageName,
            exists: false,
            riskLevel: 'dangerous',
            riskReasons: [`Failed to validate: ${error instanceof Error ? error.message : 'Unknown error'}`],
        };
    }
}

/**
 * Validate multiple packages
 */
export async function validatePackages(packageNames: string[]): Promise<PackageValidation[]> {
    return Promise.all(packageNames.map(validatePackage));
}

/**
 * Extract package names from code snippet
 */
export function extractPackageNames(code: string): string[] {
    const packages = new Set<string>();
    
    // Match import statements
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"./][^'"]*)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
        packages.add(match[1].split('/').slice(0, match[1].startsWith('@') ? 2 : 1).join('/'));
    }

    // Match require statements
    const requireRegex = /require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;
    while ((match = requireRegex.exec(code)) !== null) {
        packages.add(match[1].split('/').slice(0, match[1].startsWith('@') ? 2 : 1).join('/'));
    }

    // Match package.json dependencies
    const depsRegex = /"([^"]+)":\s*"[\^~]?[\d.]+"/g;
    while ((match = depsRegex.exec(code)) !== null) {
        if (!match[1].startsWith('@types/')) {
            packages.add(match[1]);
        }
    }

    return Array.from(packages);
}

/**
 * Validate code and return any risky packages
 */
export async function validateCodePackages(code: string): Promise<{
    safe: PackageValidation[];
    review: PackageValidation[];
    suspicious: PackageValidation[];
    dangerous: PackageValidation[];
}> {
    const packageNames = extractPackageNames(code);
    const validations = await validatePackages(packageNames);

    return {
        safe: validations.filter(v => v.riskLevel === 'safe'),
        review: validations.filter(v => v.riskLevel === 'review'),
        suspicious: validations.filter(v => v.riskLevel === 'suspicious'),
        dangerous: validations.filter(v => v.riskLevel === 'dangerous'),
    };
}

/**
 * Get risk badge color
 */
export function getRiskColor(riskLevel: PackageValidation['riskLevel']): string {
    switch (riskLevel) {
        case 'safe': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        case 'review': return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'suspicious': return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'dangerous': return 'text-red-600 bg-red-50 border-red-200';
    }
}

/**
 * Get risk icon
 */
export function getRiskIcon(riskLevel: PackageValidation['riskLevel']): string {
    switch (riskLevel) {
        case 'safe': return '✓';
        case 'review': return '⚠️';
        case 'suspicious': return '🔶';
        case 'dangerous': return '🚫';
    }
}
