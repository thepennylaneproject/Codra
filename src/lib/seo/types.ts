/**
 * SEO TIER SYSTEM
 * 
 * Tier-gated SEO features for subscription management.
 * 
 * Free: Basic metadata (title, description, robots)
 * Pro: Full metadata + social previews + sitemap inclusion
 * Premium: Structured data + audits + search console integration
 */

export type SEOTier = 'free' | 'pro' | 'premium';

/** Basic metadata - available to all tiers */
export interface BasicSEOConfig {
    title: string;
    description: string;
    robots?: string;
    canonical?: string;
}

/** Social preview metadata - Pro tier */
export interface SocialSEOConfig {
    ogImage?: string;
    ogType?: 'website' | 'article' | 'product';
    ogSiteName?: string;
    twitterCard?: 'summary' | 'summary_large_image' | 'player';
    twitterSite?: string;
    keywords?: string[];
}

/** Structured data - Premium tier */
export interface StructuredDataConfig {
    '@type': 'WebApplication' | 'Product' | 'Article' | 'Organization' | 'BreadcrumbList';
    name: string;
    description: string;
    [key: string]: unknown;
}

export interface BreadcrumbItem {
    name: string;
    url: string;
    position?: number;
}

/** Full page SEO configuration */
export interface PageSEOConfig extends BasicSEOConfig, Partial<SocialSEOConfig> {
    /** Structured data for rich snippets (Premium) */
    structuredData?: StructuredDataConfig;
    /** Breadcrumb trail for navigation (Premium) */
    breadcrumbs?: BreadcrumbItem[];
    /** Sitemap priority 0.0-1.0 (Pro) */
    sitePriority?: number;
    /** JSON-LD data (Premium) */
    jsonLd?: Record<string, unknown>;
}

/**
 * Feature tier requirements
 */
const FEATURE_TIERS: Record<string, SEOTier> = {
    basic: 'free',
    social: 'pro',
    structured: 'premium',
    breadcrumbs: 'premium',
    sitemap: 'pro',
    audit: 'premium',
};

const TIER_RANKS: Record<SEOTier, number> = {
    free: 0,
    pro: 1,
    premium: 2,
};

/**
 * Check if a feature is available for a given tier
 */
export function isSEOFeatureAvailable(
    feature: keyof typeof FEATURE_TIERS,
    userTier: SEOTier
): boolean {
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) return false;
    return TIER_RANKS[userTier] >= TIER_RANKS[requiredTier];
}

/**
 * Get the required tier for a feature
 */
export function getRequiredTier(feature: keyof typeof FEATURE_TIERS): SEOTier {
    return FEATURE_TIERS[feature] || 'free';
}

/**
 * Filter SEO config based on user tier
 * Returns only the fields the user has access to
 */
export function filterSEOConfigByTier(
    config: PageSEOConfig,
    userTier: SEOTier
): Partial<PageSEOConfig> {
    const result: Partial<PageSEOConfig> = {
        title: config.title,
        description: config.description,
        robots: config.robots,
        canonical: config.canonical,
    };

    // Pro tier additions
    if (isSEOFeatureAvailable('social', userTier)) {
        result.ogImage = config.ogImage;
        result.ogType = config.ogType;
        result.twitterCard = config.twitterCard;
        result.keywords = config.keywords;
        result.sitePriority = config.sitePriority;
    }

    // Premium tier additions
    if (isSEOFeatureAvailable('structured', userTier)) {
        result.structuredData = config.structuredData;
        result.breadcrumbs = config.breadcrumbs;
        result.jsonLd = config.jsonLd;
    }

    return result;
}

/**
 * Build JSON-LD structured data from config
 */
export function buildJsonLd(config: StructuredDataConfig): string {
    return JSON.stringify({
        '@context': 'https://schema.org',
        ...config,
    });
}

/**
 * Build breadcrumb JSON-LD
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): string {
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: item.position ?? index + 1,
            name: item.name,
            item: item.url,
        })),
    });
}
