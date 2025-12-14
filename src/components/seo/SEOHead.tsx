import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageSEO } from '../../lib/seo/seo';

export function SEOHead() {
    const location = useLocation();

    useEffect(() => {
        const config = getPageSEO(location.pathname);

        // 1. Title
        document.title = config.title;

        // 2. Meta Tags
        updateMeta('description', config.description);
        updateMeta('robots', config.robots || 'index, follow');

        // 3. Open Graph
        updateMeta('og:title', config.title);
        updateMeta('og:description', config.description);
        updateMeta('og:url', window.location.href);
        if (config.ogImage) {
            updateMeta('og:image', config.ogImage);
        }

        // 4. Twitter
        updateMeta('twitter:card', config.twitterCard || 'summary_large_image');
        updateMeta('twitter:title', config.title);
        updateMeta('twitter:description', config.description);
        if (config.ogImage) {
            updateMeta('twitter:image', config.ogImage);
        }

        // 5. Canonical
        let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }
        link.setAttribute('href', config.canonical || window.location.href);

    }, [location]);

    return null;
}

function updateMeta(name: string, content: string) {
    let tag = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);

    if (!tag) {
        tag = document.createElement('meta');
        if (name.startsWith('og:')) {
            tag.setAttribute('property', name);
        } else {
            tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
    }

    tag.setAttribute('content', content);
}
