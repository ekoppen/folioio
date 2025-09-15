-- SEO Settings Migration
-- Comprehensive SEO configuration with anti-crawling protection

-- Create SEO settings table
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- General SEO Settings
  seo_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  site_description TEXT DEFAULT 'Creatieve portfolio met fotografie, digitale kunst en ontwerpen. Bekijk mijn nieuwste projecten en verhalen.',
  site_keywords TEXT DEFAULT 'portfolio, fotografie, digitale kunst, creatief ontwerp, grafisch design',

  -- Meta Tag Settings
  title_pattern TEXT DEFAULT '%page% | %site%',
  default_title TEXT DEFAULT 'Creatieve Portfolio',
  default_description TEXT DEFAULT 'Professioneel creatief portfolio met fotografie, digitale kunst en ontwerpen.',

  -- Open Graph Settings
  og_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  og_type TEXT DEFAULT 'website',
  og_image_url TEXT DEFAULT '/placeholder.svg',
  og_site_name TEXT DEFAULT 'Portfolio',

  -- Twitter Card Settings
  twitter_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  twitter_card_type TEXT DEFAULT 'summary_large_image',
  twitter_site TEXT DEFAULT '@portfolio',
  twitter_creator TEXT DEFAULT '@portfolio',
  twitter_image_url TEXT DEFAULT '/placeholder.svg',

  -- Anti-Crawling & Protection Settings
  crawling_protection_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  block_ai_training BOOLEAN NOT NULL DEFAULT FALSE,
  custom_robots_txt TEXT DEFAULT '',
  allowed_crawlers TEXT[] DEFAULT ARRAY['googlebot', 'bingbot'],
  blocked_crawlers TEXT[] DEFAULT ARRAY['gptbot', 'google-extended', 'ccbot', 'anthropic-ai', 'claude-web'],

  -- Schema.org Settings
  schema_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  schema_type TEXT DEFAULT 'Person',
  schema_name TEXT DEFAULT 'Portfolio',
  schema_description TEXT DEFAULT 'Creative professional specializing in photography and digital art',
  schema_url TEXT DEFAULT '',
  schema_same_as TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Advanced Settings
  canonical_urls_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sitemap_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  noindex_when_disabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_seo_settings_enabled ON public.seo_settings(seo_enabled);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_seo_settings_updated_at ON public.seo_settings;
CREATE TRIGGER update_seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default SEO settings if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.seo_settings) THEN
    INSERT INTO public.seo_settings DEFAULT VALUES;
  END IF;
END $$;