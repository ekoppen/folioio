import React, { createContext, useContext, useEffect, useState } from 'react';

interface SEOSettings {
  id?: string;
  // General SEO
  seo_enabled: boolean;
  site_description: string;
  site_keywords: string;
  // Meta Tags
  title_pattern: string;
  default_title: string;
  default_description: string;
  // Open Graph
  og_enabled: boolean;
  og_type: string;
  og_image_url: string;
  og_site_name: string;
  // Twitter Cards
  twitter_enabled: boolean;
  twitter_card_type: string;
  twitter_site: string;
  twitter_creator: string;
  twitter_image_url: string;
  // Anti-Crawling Protection
  crawling_protection_enabled: boolean;
  block_ai_training: boolean;
  custom_robots_txt: string;
  allowed_crawlers: string[];
  blocked_crawlers: string[];
  // Schema.org
  schema_enabled: boolean;
  schema_type: string;
  schema_name: string;
  schema_description: string;
  schema_url: string;
  schema_same_as: string[];
  // Advanced
  canonical_urls_enabled: boolean;
  sitemap_enabled: boolean;
  noindex_when_disabled: boolean;
}

interface SEOContextType {
  settings: SEOSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  generateTitle: (pageTitle?: string) => string;
  generateDescription: (pageDescription?: string) => string;
  shouldIndex: () => boolean;
  getCanonicalUrl: (path: string) => string;
}

const defaultSettings: SEOSettings = {
  seo_enabled: true,
  site_description: 'Creatieve portfolio met fotografie, digitale kunst en ontwerpen. Bekijk mijn nieuwste projecten en verhalen.',
  site_keywords: 'portfolio, fotografie, digitale kunst, creatief ontwerp, grafisch design',
  title_pattern: '%page% | %site%',
  default_title: 'Creatieve Portfolio',
  default_description: 'Professioneel creatief portfolio met fotografie, digitale kunst en ontwerpen.',
  og_enabled: true,
  og_type: 'website',
  og_image_url: '/placeholder.svg',
  og_site_name: 'Portfolio',
  twitter_enabled: true,
  twitter_card_type: 'summary_large_image',
  twitter_site: '@portfolio',
  twitter_creator: '@portfolio',
  twitter_image_url: '/placeholder.svg',
  crawling_protection_enabled: false,
  block_ai_training: false,
  custom_robots_txt: '',
  allowed_crawlers: ['googlebot', 'bingbot'],
  blocked_crawlers: ['gptbot', 'google-extended', 'ccbot', 'anthropic-ai', 'claude-web'],
  schema_enabled: true,
  schema_type: 'Person',
  schema_name: 'Portfolio',
  schema_description: 'Creative professional specializing in photography and digital art',
  schema_url: '',
  schema_same_as: [],
  canonical_urls_enabled: true,
  sitemap_enabled: true,
  noindex_when_disabled: true
};

const SEOContext = createContext<SEOContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refreshSettings: async () => {},
  generateTitle: () => '',
  generateDescription: () => '',
  shouldIndex: () => true,
  getCanonicalUrl: () => ''
});

export const SEOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SEOSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/seo');
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data) {
        setSettings({
          ...result.data,
          allowed_crawlers: result.data.allowed_crawlers || ['googlebot', 'bingbot'],
          blocked_crawlers: result.data.blocked_crawlers || ['gptbot', 'google-extended', 'ccbot', 'anthropic-ai', 'claude-web'],
          schema_same_as: result.data.schema_same_as || []
        });
      } else {
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error('Error fetching SEO settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const generateTitle = (pageTitle?: string): string => {
    if (!settings.seo_enabled) {
      return settings.default_title;
    }

    if (!pageTitle) {
      return settings.default_title;
    }

    return settings.title_pattern
      .replace('%page%', pageTitle)
      .replace('%site%', settings.default_title);
  };

  const generateDescription = (pageDescription?: string): string => {
    if (!settings.seo_enabled) {
      return settings.default_description;
    }

    return pageDescription || settings.default_description;
  };

  const shouldIndex = (): boolean => {
    if (!settings.seo_enabled && settings.noindex_when_disabled) {
      return false;
    }

    if (settings.crawling_protection_enabled) {
      return false;
    }

    return settings.seo_enabled;
  };

  const getCanonicalUrl = (path: string): string => {
    if (!settings.canonical_urls_enabled || !settings.seo_enabled) {
      return '';
    }

    const baseUrl = settings.schema_url || window.location.origin;
    return `${baseUrl}${path}`;
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const contextValue: SEOContextType = {
    settings,
    loading,
    error,
    refreshSettings,
    generateTitle,
    generateDescription,
    shouldIndex,
    getCanonicalUrl
  };

  return (
    <SEOContext.Provider value={contextValue}>
      {children}
    </SEOContext.Provider>
  );
};

export const useSEO = (): SEOContextType => {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error('useSEO must be used within a SEOProvider');
  }
  return context;
};