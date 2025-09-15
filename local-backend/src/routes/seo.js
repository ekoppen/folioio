const express = require('express');
const { query } = require('../database/client');
const { authenticateToken } = require('../auth/middleware');

const router = express.Router();

// GET /seo - Get SEO settings
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM public.seo_settings ORDER BY updated_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Create default SEO settings if none exist
      const defaultResult = await query(`
        INSERT INTO public.seo_settings DEFAULT VALUES
        RETURNING *
      `);
      return res.json({
        data: defaultResult.rows[0],
        error: null
      });
    }

    res.json({
      data: result.rows[0],
      error: null
    });
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    res.status(500).json({
      data: null,
      error: { message: 'Failed to fetch SEO settings' }
    });
  }
});

// GET /seo/robots - Get dynamic robots.txt content
router.get('/robots', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM public.seo_settings ORDER BY updated_at DESC LIMIT 1'
    );

    const seoSettings = result.rows[0] || {};

    let robotsContent = '';

    // If SEO is disabled or crawling protection is enabled
    if (!seoSettings.seo_enabled || seoSettings.crawling_protection_enabled) {
      if (seoSettings.custom_robots_txt && seoSettings.custom_robots_txt.trim()) {
        robotsContent = seoSettings.custom_robots_txt;
      } else {
        // Default blocking configuration
        robotsContent = `# Block all crawlers
User-agent: *
Disallow: /

# Specifically block AI training bots
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

# No sitemap when protection is enabled`;
      }
    } else {
      // Generate robots.txt based on settings
      if (seoSettings.custom_robots_txt && seoSettings.custom_robots_txt.trim()) {
        robotsContent = seoSettings.custom_robots_txt;
      } else {
        robotsContent = `# Allow search engine crawlers
User-agent: *
Allow: /

# Block AI training bots if requested
${seoSettings.block_ai_training ? `
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /
` : ''}

# Block specific crawlers if configured
${seoSettings.blocked_crawlers && seoSettings.blocked_crawlers.length > 0
  ? seoSettings.blocked_crawlers.map(bot => `
User-agent: ${bot}
Disallow: /`).join('')
  : ''
}

# Sitemap location
${seoSettings.sitemap_enabled ? 'Sitemap: /sitemap.xml' : ''}`;
      }
    }

    res.set('Content-Type', 'text/plain');
    res.send(robotsContent.trim());
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.set('Content-Type', 'text/plain');
    res.send(`# Error generating robots.txt
User-agent: *
Disallow: /`);
  }
});

// Protected routes - require authentication
router.use(authenticateToken);

// PUT /seo - Update SEO settings
router.put('/', async (req, res) => {
  try {
    const {
      seo_enabled,
      site_description,
      site_keywords,
      title_pattern,
      default_title,
      default_description,
      og_enabled,
      og_type,
      og_image_url,
      og_site_name,
      twitter_enabled,
      twitter_card_type,
      twitter_site,
      twitter_creator,
      twitter_image_url,
      crawling_protection_enabled,
      block_ai_training,
      custom_robots_txt,
      allowed_crawlers,
      blocked_crawlers,
      schema_enabled,
      schema_type,
      schema_name,
      schema_description,
      schema_url,
      schema_same_as,
      canonical_urls_enabled,
      sitemap_enabled,
      noindex_when_disabled
    } = req.body;

    // Check if settings exist
    const existingResult = await query(
      'SELECT id FROM public.seo_settings ORDER BY updated_at DESC LIMIT 1'
    );

    let result;
    if (existingResult.rows.length === 0) {
      // Create new settings
      result = await query(`
        INSERT INTO public.seo_settings (
          seo_enabled, site_description, site_keywords, title_pattern, default_title, default_description,
          og_enabled, og_type, og_image_url, og_site_name,
          twitter_enabled, twitter_card_type, twitter_site, twitter_creator, twitter_image_url,
          crawling_protection_enabled, block_ai_training, custom_robots_txt, allowed_crawlers, blocked_crawlers,
          schema_enabled, schema_type, schema_name, schema_description, schema_url, schema_same_as,
          canonical_urls_enabled, sitemap_enabled, noindex_when_disabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        RETURNING *
      `, [
        seo_enabled, site_description, site_keywords, title_pattern, default_title, default_description,
        og_enabled, og_type, og_image_url, og_site_name,
        twitter_enabled, twitter_card_type, twitter_site, twitter_creator, twitter_image_url,
        crawling_protection_enabled, block_ai_training, custom_robots_txt, allowed_crawlers, blocked_crawlers,
        schema_enabled, schema_type, schema_name, schema_description, schema_url, schema_same_as,
        canonical_urls_enabled, sitemap_enabled, noindex_when_disabled
      ]);
    } else {
      // Update existing settings
      result = await query(`
        UPDATE public.seo_settings SET
          seo_enabled = $1, site_description = $2, site_keywords = $3, title_pattern = $4, default_title = $5, default_description = $6,
          og_enabled = $7, og_type = $8, og_image_url = $9, og_site_name = $10,
          twitter_enabled = $11, twitter_card_type = $12, twitter_site = $13, twitter_creator = $14, twitter_image_url = $15,
          crawling_protection_enabled = $16, block_ai_training = $17, custom_robots_txt = $18, allowed_crawlers = $19, blocked_crawlers = $20,
          schema_enabled = $21, schema_type = $22, schema_name = $23, schema_description = $24, schema_url = $25, schema_same_as = $26,
          canonical_urls_enabled = $27, sitemap_enabled = $28, noindex_when_disabled = $29,
          updated_at = NOW()
        WHERE id = $30
        RETURNING *
      `, [
        seo_enabled, site_description, site_keywords, title_pattern, default_title, default_description,
        og_enabled, og_type, og_image_url, og_site_name,
        twitter_enabled, twitter_card_type, twitter_site, twitter_creator, twitter_image_url,
        crawling_protection_enabled, block_ai_training, custom_robots_txt, allowed_crawlers, blocked_crawlers,
        schema_enabled, schema_type, schema_name, schema_description, schema_url, schema_same_as,
        canonical_urls_enabled, sitemap_enabled, noindex_when_disabled,
        existingResult.rows[0].id
      ]);
    }

    res.json({
      data: result.rows[0],
      error: null
    });
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    res.status(500).json({
      data: null,
      error: { message: 'Failed to update SEO settings' }
    });
  }
});

module.exports = router;