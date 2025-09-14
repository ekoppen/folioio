import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Define all UI translations needed
    const uiTranslations = [
      // Navigation
      { key: 'nav.home', nl: 'Home', en: 'Home' },
      { key: 'nav.portfolio', nl: 'Portfolio', en: 'Portfolio' },
      { key: 'nav.about', nl: 'About', en: 'About' },
      { key: 'nav.contact', nl: 'Contact', en: 'Contact' },
      { key: 'nav.login', nl: 'Login', en: 'Login' },
      { key: 'nav.logout', nl: 'Logout', en: 'Logout' },
      { key: 'nav.admin', nl: 'Admin Dashboard', en: 'Admin Dashboard' },

      // Hero section
      { key: 'hero.view_portfolio', nl: 'Bekijk Portfolio', en: 'View Portfolio' },
      { key: 'hero.learn_more', nl: 'Meer Over Mij', en: 'Learn More About Me' },

      // About section
      { key: 'about.expertise', nl: 'Expertise', en: 'Expertise' },
      { key: 'about.contact_button', nl: 'Neem Contact Op', en: 'Get In Touch' },
      { key: 'about.contact_subtitle', nl: 'Klaar om samen aan je volgende project te werken?', en: 'Ready to work together on your next project?' },

      // Portfolio section
      { key: 'portfolio.view_album', nl: 'Bekijk Album', en: 'View Album' },
      { key: 'portfolio.photos', nl: "foto's", en: 'photos' },
      { key: 'portfolio.loading', nl: 'Portfolio laden...', en: 'Loading portfolio...' },
      { key: 'portfolio.no_albums', nl: 'Nog geen zichtbare albums met foto\'s gevonden.', en: 'No visible albums with photos found yet.' },
      { key: 'portfolio.no_albums_category', nl: 'Geen albums gevonden in de opgegeven categorie.', en: 'No albums found in the specified category.' },
      { key: 'portfolio.default_description', nl: 'Bekijk de foto\'s in dit album', en: 'View the photos in this album' },

      // Contact section
      { key: 'contact.title', nl: 'Neem Contact Op', en: 'Get In Touch' },
      { key: 'contact.subtitle', nl: 'Heb je een vraag of wil je samenwerken? Stuur me een bericht!', en: 'Have a question or want to collaborate? Send me a message!' },
      { key: 'contact.take', nl: 'Neem', en: 'Get' },
      { key: 'contact.contact', nl: 'Contact', en: 'In' },
      { key: 'contact.up', nl: 'Op', en: 'Touch' },
      { key: 'contact.contact_info', nl: 'Contactgegevens', en: 'Contact Information' },
      { key: 'contact.name', nl: 'Naam', en: 'Name' },
      { key: 'contact.email', nl: 'E-mail', en: 'Email' },
      { key: 'contact.phone', nl: 'Telefoon', en: 'Phone' },
      { key: 'contact.subject', nl: 'Onderwerp', en: 'Subject' },
      { key: 'contact.message', nl: 'Bericht', en: 'Message' },
      { key: 'contact.address', nl: 'Adres', en: 'Address' },
      { key: 'contact.name_placeholder', nl: 'Je naam', en: 'Your name' },
      { key: 'contact.email_placeholder', nl: 'je@email.com', en: 'you@email.com' },
      { key: 'contact.phone_placeholder', nl: '06 12 34 56 78', en: '+1 (555) 123-4567' },
      { key: 'contact.subject_placeholder', nl: 'Onderwerp van je bericht', en: 'Subject of your message' },
      { key: 'contact.message_placeholder', nl: 'Vertel me over je project of vraag...', en: 'Tell me about your project or question...' },
      { key: 'contact.cancel', nl: 'Annuleren', en: 'Cancel' },
      { key: 'contact.send_message', nl: 'Bericht Verzenden', en: 'Send Message' },
      { key: 'contact.send_message_title', nl: 'Stuur een bericht', en: 'Send a message' },
      { key: 'contact.sending', nl: 'Verzenden...', en: 'Sending...' },
      { key: 'contact.required_fields', nl: 'Vereiste velden', en: 'Required fields' },
      { key: 'contact.fill_required', nl: 'Vul alle vereiste velden in.', en: 'Please fill in all required fields.' },
      { key: 'contact.message_sent', nl: 'Bericht verzonden!', en: 'Message sent!' },
      { key: 'contact.thank_you', nl: 'Bedankt voor je bericht. We nemen zo spoedig mogelijk contact met je op.', en: 'Thank you for your message. We will get back to you as soon as possible.' },
      { key: 'contact.error', nl: 'Er is iets misgegaan', en: 'Something went wrong' },
      { key: 'contact.try_again', nl: 'Het bericht kon niet worden verzonden. Probeer het later opnieuw.', en: 'The message could not be sent. Please try again later.' },
    ];

    // Insert all translations for both Dutch and English
    for (const translation of uiTranslations) {
      // Insert Dutch (fallback - usually not needed since Dutch is default)
      await supabaseClient
        .from('translations')
        .upsert({
          translation_key: translation.key,
          language_code: 'nl',
          translation_value: translation.nl
        }, {
          onConflict: 'translation_key,language_code'
        });

      // Insert English
      await supabaseClient
        .from('translations')
        .upsert({
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en
        }, {
          onConflict: 'translation_key,language_code'
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Added ${uiTranslations.length} UI translations for both Dutch and English` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error adding UI translations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});