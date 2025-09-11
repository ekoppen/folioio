import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  targetLanguage: string;
  languageName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetLanguage, languageName }: TranslationRequest = await req.json();
    
    console.log(`Starting translation process for ${languageName} (${targetLanguage})`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key from site_settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('openai_api_key')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw new Error('Failed to fetch OpenAI API key');
    }

    const openaiApiKey = settingsData?.openai_api_key;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Define content sources to translate
    const contentSources = [
      {
        table: 'site_settings',
        fields: ['site_title', 'site_tagline', 'portfolio_title', 'portfolio_description']
      },
      {
        table: 'about_settings',
        fields: ['main_title', 'intro_text', 'description_text', 'quote_text', 'quote_author']
      },
      {
        table: 'albums',
        fields: ['name', 'description']
      },
      {
        table: 'slideshow',
        fields: ['title', 'description']
      },
      {
        table: 'photos',
        fields: ['alt_text', 'caption']
      }
    ];

    let translatedCount = 0;
    const totalItems = contentSources.length;

    // Process each content source
    for (const [index, source] of contentSources.entries()) {
      console.log(`Processing table: ${source.table}`);
      
      // Get all records from the table
      const { data: records, error: recordsError } = await supabase
        .from(source.table)
        .select('*');

      if (recordsError) {
        console.error(`Error fetching ${source.table}:`, recordsError);
        continue;
      }

      // Process each record
      for (const record of records || []) {
        for (const field of source.fields) {
          const originalText = record[field];
          
          if (!originalText || typeof originalText !== 'string' || originalText.trim() === '') {
            continue;
          }

          // Check if translation already exists
          const translationKey = `${source.table}.${field}`;
          const { data: existingTranslation } = await supabase
            .from('translations')
            .select('id')
            .eq('language_code', targetLanguage)
            .eq('translation_key', translationKey)
            .eq('table_name', source.table)
            .eq('record_id', record.id)
            .eq('field_name', field)
            .maybeSingle();

          if (existingTranslation) {
            console.log(`Translation already exists for ${translationKey} (${record.id})`);
            continue;
          }

          // Translate with OpenAI
          try {
            const translatedText = await translateText(originalText, targetLanguage, languageName, openaiApiKey);
            
            if (translatedText) {
              // Store translation
              const { error: insertError } = await supabase
                .from('translations')
                .upsert({
                  language_code: targetLanguage,
                  translation_key: translationKey,
                  translation_value: translatedText,
                  table_name: source.table,
                  record_id: record.id,
                  field_name: field
                });

              if (insertError) {
                console.error('Error saving translation:', insertError);
              } else {
                console.log(`Translated: ${originalText.substring(0, 50)}... -> ${translatedText.substring(0, 50)}...`);
              }
            }
          } catch (error) {
            console.error(`Error translating text "${originalText.substring(0, 50)}...":`, error);
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      translatedCount++;
      const progress = Math.round((translatedCount / totalItems) * 100);
      console.log(`Progress: ${progress}% (${translatedCount}/${totalItems} tables processed)`);
    }

    console.log(`Translation completed for ${languageName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Translation completed for ${languageName}`,
        translatedTables: translatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in translate-content function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Translation failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function translateText(
  text: string, 
  targetLanguage: string, 
  languageName: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${languageName} (${targetLanguage}). Maintain the tone, style, and meaning. Return only the translation without quotes or explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return null;
  }
}