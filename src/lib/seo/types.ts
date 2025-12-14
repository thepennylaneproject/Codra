export interface PageSEOConfig {
    title: string;
    description: string;
    canonical?: string;
    ogImage?: string;
    twitterCard?: 'summary' | 'summary_large_image';
    robots?: string; // e.g., 'index, follow'
    jsonLd?: Record<string, any>;
}
