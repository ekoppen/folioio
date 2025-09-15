import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';

interface SEOMetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
  keywords?: string;
}

export const SEOMetaTags: React.FC<SEOMetaTagsProps> = ({
  title,
  description,
  image,
  type,
  url,
  keywords
}) => {
  const { settings, generateTitle, generateDescription, shouldIndex, getCanonicalUrl } = useSEO();
  const location = useLocation();

  useEffect(() => {
    const pageTitle = generateTitle(title);
    const pageDescription = generateDescription(description);
    const pageUrl = url || getCanonicalUrl(location.pathname);
    const pageImage = image || settings.og_image_url;
    const pageKeywords = keywords || settings.site_keywords;

    // Update document title
    document.title = pageTitle;

    // Remove existing meta tags
    const existingTags = document.querySelectorAll(
      'meta[data-seo="true"], link[data-seo="true"]'
    );
    existingTags.forEach(tag => tag.remove());

    // Basic meta tags
    const metaTags: Array<{ name?: string; property?: string; content: string; rel?: string; href?: string }> = [];

    // Description
    metaTags.push({ name: 'description', content: pageDescription });

    // Keywords
    if (pageKeywords && settings.seo_enabled) {
      metaTags.push({ name: 'keywords', content: pageKeywords });
    }

    // Robots meta tag
    if (!shouldIndex()) {
      metaTags.push({ name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet' });
    } else {
      metaTags.push({ name: 'robots', content: 'index, follow' });
    }

    // Canonical URL
    if (pageUrl && settings.canonical_urls_enabled && settings.seo_enabled) {
      metaTags.push({ rel: 'canonical', href: pageUrl });
    }

    // Open Graph tags
    if (settings.og_enabled && settings.seo_enabled) {
      metaTags.push(
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDescription },
        { property: 'og:type', content: type || settings.og_type },
        { property: 'og:site_name', content: settings.og_site_name }
      );

      if (pageImage) {
        metaTags.push({ property: 'og:image', content: pageImage });
      }

      if (pageUrl) {
        metaTags.push({ property: 'og:url', content: pageUrl });
      }
    }

    // Twitter Card tags
    if (settings.twitter_enabled && settings.seo_enabled) {
      metaTags.push(
        { name: 'twitter:card', content: settings.twitter_card_type },
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: pageDescription }
      );

      if (settings.twitter_site) {
        metaTags.push({ name: 'twitter:site', content: settings.twitter_site });
      }

      if (settings.twitter_creator) {
        metaTags.push({ name: 'twitter:creator', content: settings.twitter_creator });
      }

      if (pageImage) {
        metaTags.push({ name: 'twitter:image', content: pageImage });
      }
    }

    // Create and append meta tags
    const head = document.head;

    metaTags.forEach(tag => {
      if (tag.rel) {
        // Link element for canonical URL
        const linkElement = document.createElement('link');
        linkElement.rel = tag.rel;
        linkElement.href = tag.href!;
        linkElement.setAttribute('data-seo', 'true');
        head.appendChild(linkElement);
      } else {
        // Meta element
        const metaElement = document.createElement('meta');
        if (tag.name) {
          metaElement.name = tag.name;
        }
        if (tag.property) {
          metaElement.setAttribute('property', tag.property);
        }
        metaElement.content = tag.content;
        metaElement.setAttribute('data-seo', 'true');
        head.appendChild(metaElement);
      }
    });

    // Schema.org structured data
    if (settings.schema_enabled && settings.seo_enabled) {
      const existingSchema = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
      if (existingSchema) {
        existingSchema.remove();
      }

      const schemaData = {
        '@context': 'https://schema.org',
        '@type': settings.schema_type,
        name: settings.schema_name,
        description: settings.schema_description,
        ...(settings.schema_url && { url: settings.schema_url }),
        ...(settings.schema_same_as.length > 0 && { sameAs: settings.schema_same_as }),
        ...(pageImage && { image: pageImage })
      };

      // Add page-specific schema data
      if (type === 'article') {
        schemaData['@type'] = 'Article';
        schemaData['headline'] = pageTitle;
        schemaData['description'] = pageDescription;
      }

      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.textContent = JSON.stringify(schemaData);
      schemaScript.setAttribute('data-seo', 'true');
      head.appendChild(schemaScript);
    }
  }, [
    settings,
    title,
    description,
    image,
    type,
    url,
    keywords,
    location.pathname,
    generateTitle,
    generateDescription,
    shouldIndex,
    getCanonicalUrl
  ]);

  // This component doesn't render anything visible
  return null;
};