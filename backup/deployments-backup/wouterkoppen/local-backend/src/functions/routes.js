const express = require('express');
const { authenticateToken } = require('../auth/middleware');
const { query } = require('../database/client');
const OpenAI = require('openai');

const router = express.Router();

// Apply authentication middleware to all function routes
router.use(authenticateToken);

// Portfolio-specific functions (equivalent to Supabase Edge Functions)

// Send contact email function
router.post('/send-contact-email', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Store message in database
    await query(
      `INSERT INTO public.contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, phone, subject, message]
    );
    
    // In a real implementation, you would send email here
    console.log('Contact message received:', { name, email, subject });
    
    res.json({ 
      data: { 
        message: 'Contact message received successfully',
        success: true 
      }
    });
  } catch (error) {
    console.error('Send contact email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Translate content function with OpenAI
router.post('/translate-content', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'auto', saveTranslation = false, translationKey = null } = req.body;
    
    // Get OpenAI API key from database
    const apiKeyResult = await query(
      'SELECT openai_api_key FROM public.site_settings LIMIT 1'
    );
    
    if (!apiKeyResult.rows[0]?.openai_api_key) {
      // If no API key, return mock translation
      const translatedText = `[${targetLanguage.toUpperCase()}] ${text}`;
      return res.json({ 
        data: { 
          translatedText,
          sourceLanguage,
          targetLanguage,
          isMock: true
        }
      });
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKeyResult.rows[0].openai_api_key
    });
    
    // Map language codes to full names for better translation
    const languageNames = {
      'en': 'English',
      'nl': 'Dutch',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean'
    };
    
    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage === 'auto' ? 'the source language' : (languageNames[sourceLanguage] || sourceLanguage);
    
    // Translate using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. 
                   Maintain the original tone, style, and formatting. 
                   Only return the translated text, nothing else.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const translatedText = completion.choices[0].message.content.trim();
    
    // Save translation to database if requested
    if (saveTranslation && translationKey) {
      await query(
        `INSERT INTO public.translations (translation_key, language_code, translation_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (translation_key, language_code) 
         DO UPDATE SET translation_value = EXCLUDED.translation_value`,
        [translationKey, targetLanguage, translatedText]
      );
    }
    
    res.json({ 
      data: { 
        translatedText,
        sourceLanguage,
        targetLanguage,
        saved: saveTranslation
      }
    });
  } catch (error) {
    console.error('Translate content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add UI translations function
router.post('/add-ui-translations', async (req, res) => {
  try {
    const { translations } = req.body;
    
    if (!translations || !Array.isArray(translations)) {
      return res.status(400).json({ error: 'Translations array is required' });
    }
    
    // Insert translations into database
    for (const translation of translations) {
      const { key, languageCode, value } = translation;
      
      await query(
        `INSERT INTO public.translations (translation_key, language_code, translation_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (translation_key, language_code) 
         DO UPDATE SET translation_value = EXCLUDED.translation_value`,
        [key, languageCode, value]
      );
    }
    
    res.json({ 
      data: { 
        message: 'Translations added successfully',
        count: translations.length
      }
    });
  } catch (error) {
    console.error('Add UI translations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Translate album descriptions function
router.post('/translate-album-descriptions', async (req, res) => {
  try {
    const { albumId, targetLanguage } = req.body;
    
    // Get album description
    const albumResult = await query(
      'SELECT name, description FROM public.albums WHERE id = $1',
      [albumId]
    );
    
    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    const album = albumResult.rows[0];
    
    // Mock translation
    const translatedName = `[${targetLanguage.toUpperCase()}] ${album.name}`;
    const translatedDescription = album.description ? `[${targetLanguage.toUpperCase()}] ${album.description}` : null;
    
    // Store translation
    await query(
      `INSERT INTO public.translations (translation_key, language_code, translation_value, table_name, record_id, field_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (translation_key, language_code) 
       DO UPDATE SET translation_value = EXCLUDED.translation_value`,
      [`album_${albumId}_name`, targetLanguage, translatedName, 'albums', albumId, 'name']
    );
    
    if (translatedDescription) {
      await query(
        `INSERT INTO public.translations (translation_key, language_code, translation_value, table_name, record_id, field_name)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (translation_key, language_code) 
         DO UPDATE SET translation_value = EXCLUDED.translation_value`,
        [`album_${albumId}_description`, targetLanguage, translatedDescription, 'albums', albumId, 'description']
      );
    }
    
    res.json({ 
      data: { 
        albumId,
        targetLanguage,
        translatedName,
        translatedDescription
      }
    });
  } catch (error) {
    console.error('Translate album descriptions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk translate content with OpenAI
router.post('/bulk-translate', async (req, res) => {
  try {
    const { items, targetLanguage, sourceLanguage = 'auto' } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    
    // Get OpenAI API key from database
    const apiKeyResult = await query(
      'SELECT openai_api_key FROM public.site_settings LIMIT 1'
    );
    
    if (!apiKeyResult.rows[0]?.openai_api_key) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKeyResult.rows[0].openai_api_key
    });
    
    const results = [];
    const errors = [];
    
    // Map language codes to full names
    const languageNames = {
      'en': 'English',
      'nl': 'Dutch',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean'
    };
    
    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    
    // Process each item
    for (const item of items) {
      try {
        const { text, key, tableName, recordId, fieldName } = item;
        
        if (!text || text.trim() === '') {
          continue; // Skip empty texts
        }
        
        // Translate using OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate the following text to ${targetLangName}. 
                       Maintain the original tone, style, and formatting. 
                       Only return the translated text, nothing else.`
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });
        
        const translatedText = completion.choices[0].message.content.trim();
        
        // Save translation to database
        await query(
          `INSERT INTO public.translations (
            translation_key, 
            language_code, 
            translation_value,
            table_name,
            record_id,
            field_name
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (translation_key, language_code) 
          DO UPDATE SET 
            translation_value = EXCLUDED.translation_value,
            table_name = EXCLUDED.table_name,
            record_id = EXCLUDED.record_id,
            field_name = EXCLUDED.field_name`,
          [key, targetLanguage, translatedText, tableName, recordId, fieldName]
        );
        
        results.push({
          key,
          original: text,
          translated: translatedText,
          saved: true
        });
        
      } catch (itemError) {
        console.error(`Error translating item ${item.key}:`, itemError);
        errors.push({
          key: item.key,
          error: itemError.message
        });
      }
    }
    
    res.json({ 
      data: { 
        targetLanguage,
        totalItems: items.length,
        translated: results.length,
        errors: errors.length,
        results,
        errors
      }
    });
    
  } catch (error) {
    console.error('Bulk translate error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;