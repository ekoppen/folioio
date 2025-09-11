import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    console.log('Starting album description translation...');

    // Get all albums
    const { data: albums, error: albumsError } = await supabaseClient
      .from('albums')
      .select('id, name, description')
      .neq('slug', 'home');

    if (albumsError) {
      console.error('Error fetching albums:', albumsError);
      throw albumsError;
    }

    console.log(`Found ${albums?.length || 0} albums`);

    // Add English translations for each album
    const translations = [];
    
    for (const album of albums || []) {
      if (album.name) {
        translations.push({
          translation_key: `albums.name.${album.id}`,
          language_code: 'en',
          translation_value: album.name // Default to same name for now
        });
      }
      
      if (album.description) {
        // Simple translation mapping - in a real app you'd use a translation service
        const englishDescription = album.description
          .replace(/Ontdek/gi, 'Discover')
          .replace(/foto's/gi, 'photos')
          .replace(/foto/gi, 'photo')
          .replace(/collectie/gi, 'collection')
          .replace(/prachtige/gi, 'beautiful')
          .replace(/momenten/gi, 'moments')
          .replace(/vastgelegd/gi, 'captured')
          .replace(/dit album/gi, 'this album')
          .replace(/bevat/gi, 'contains')
          .replace(/verschillende/gi, 'various')
          .replace(/beelden/gi, 'images')
          .replace(/verhalen/gi, 'stories')
          .replace(/creatieve/gi, 'creative')
          .replace(/projecten/gi, 'projects')
          .replace(/Portfolio/gi, 'Portfolio')
          .replace(/Bekijk de/gi, 'View the')
          .replace(/in dit album/gi, 'in this album');

        translations.push({
          translation_key: `albums.description.${album.id}`,
          language_code: 'en', 
          translation_value: englishDescription
        });
      }
    }

    console.log(`Prepared ${translations.length} translations`);

    // Insert translations if they don't exist
    for (const translation of translations) {
      const { error: insertError } = await supabaseClient
        .from('translations')
        .upsert(translation, { onConflict: 'translation_key,language_code' });

      if (insertError) {
        console.error('Error inserting translation:', insertError);
      } else {
        console.log(`Added translation for key: ${translation.translation_key}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${translations.length} album translations`,
        translations: translations.length
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in translate-album-descriptions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});