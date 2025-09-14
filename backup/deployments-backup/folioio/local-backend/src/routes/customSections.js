const express = require('express');
const { query, transaction } = require('../database/client');
const { requireAuth, requireAdmin } = require('../auth/middleware');

const router = express.Router();

// GET /api/custom-sections - Get all active custom sections (public)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, name, slug, title, is_active, show_in_navigation, 
        show_hero_button, menu_order, header_image_url, 
        content_left, content_right, button_text, button_link,
        created_at, updated_at
      FROM public.custom_sections 
      WHERE is_active = true 
      ORDER BY menu_order ASC, created_at ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching custom sections:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch custom sections' }
    });
  }
});

// GET /api/custom-sections/admin - Get all custom sections (admin only)
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, name, slug, title, is_active, show_in_navigation, 
        show_hero_button, menu_order, header_image_url, 
        content_left, content_right, button_text, button_link,
        created_at, updated_at
      FROM public.custom_sections 
      ORDER BY menu_order ASC, created_at ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching admin custom sections:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch custom sections' }
    });
  }
});

// GET /api/custom-sections/:id - Get single custom section
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id, name, slug, title, is_active, show_in_navigation, 
        show_hero_button, menu_order, header_image_url, 
        content_left, content_right, button_text, button_link,
        created_at, updated_at
      FROM public.custom_sections 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Custom section not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching custom section:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch custom section' }
    });
  }
});

// POST /api/custom-sections - Create new custom section
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      title,
      is_active = false,
      show_in_navigation = true,
      show_hero_button = false,
      menu_order = 0,
      header_image_url,
      content_left,
      content_right = [],
      button_text,
      button_link
    } = req.body;

    if (!name || !slug || !title) {
      return res.status(400).json({
        error: { message: 'Name, slug, and title are required' }
      });
    }

    // Check if slug already exists
    const existingSlug = await query(
      'SELECT id FROM public.custom_sections WHERE slug = $1',
      [slug]
    );

    if (existingSlug.rows.length > 0) {
      return res.status(400).json({
        error: { message: 'Slug already exists' }
      });
    }

    const result = await query(`
      INSERT INTO public.custom_sections (
        name, slug, title, is_active, show_in_navigation, 
        show_hero_button, menu_order, header_image_url, 
        content_left, content_right, button_text, button_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      name, slug, title, is_active, show_in_navigation,
      show_hero_button, menu_order, header_image_url,
      content_left, JSON.stringify(content_right), button_text, button_link
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating custom section:', error);
    if (error.constraint === 'custom_sections_slug_key') {
      return res.status(400).json({
        error: { message: 'Slug already exists' }
      });
    }
    res.status(500).json({
      error: { message: 'Failed to create custom section' }
    });
  }
});

// PUT /api/custom-sections/:id - Update custom section
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      title,
      is_active,
      show_in_navigation,
      show_hero_button,
      menu_order,
      header_image_url,
      content_left,
      content_right,
      button_text,
      button_link
    } = req.body;

    // Check if section exists
    const existing = await query(
      'SELECT id FROM public.custom_sections WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Custom section not found' }
      });
    }

    // Check if new slug conflicts with other sections
    if (slug) {
      const conflictingSlug = await query(
        'SELECT id FROM public.custom_sections WHERE slug = $1 AND id != $2',
        [slug, id]
      );

      if (conflictingSlug.rows.length > 0) {
        return res.status(400).json({
          error: { message: 'Slug already exists' }
        });
      }
    }

    const result = await query(`
      UPDATE public.custom_sections SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        title = COALESCE($3, title),
        is_active = COALESCE($4, is_active),
        show_in_navigation = COALESCE($5, show_in_navigation),
        show_hero_button = COALESCE($6, show_hero_button),
        menu_order = COALESCE($7, menu_order),
        header_image_url = COALESCE($8, header_image_url),
        content_left = COALESCE($9, content_left),
        content_right = COALESCE($10, content_right),
        button_text = COALESCE($11, button_text),
        button_link = COALESCE($12, button_link),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `, [
      name, slug, title, is_active, show_in_navigation,
      show_hero_button, menu_order, header_image_url,
      content_left, content_right ? JSON.stringify(content_right) : null,
      button_text, button_link, id
    ]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating custom section:', error);
    res.status(500).json({
      error: { message: 'Failed to update custom section' }
    });
  }
});

// DELETE /api/custom-sections/:id - Delete custom section
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM public.custom_sections WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Custom section not found' }
      });
    }

    res.json({
      success: true,
      message: 'Custom section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting custom section:', error);
    res.status(500).json({
      error: { message: 'Failed to delete custom section' }
    });
  }
});

// PUT /api/custom-sections/:id/toggle - Toggle section active status
router.put('/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE public.custom_sections 
      SET is_active = NOT is_active, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Custom section not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling custom section:', error);
    res.status(500).json({
      error: { message: 'Failed to toggle custom section' }
    });
  }
});

// PUT /api/custom-sections/reorder - Reorder sections
router.put('/reorder', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json({
        error: { message: 'Sections must be an array' }
      });
    }

    // Update all sections in a transaction
    await transaction(async (client) => {
      for (let i = 0; i < sections.length; i++) {
        const { id } = sections[i];
        await client.query(
          'UPDATE public.custom_sections SET menu_order = $1, updated_at = NOW() WHERE id = $2',
          [i, id]
        );
      }
    });

    res.json({
      success: true,
      message: 'Sections reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering sections:', error);
    res.status(500).json({
      error: { message: 'Failed to reorder sections' }
    });
  }
});

module.exports = router;