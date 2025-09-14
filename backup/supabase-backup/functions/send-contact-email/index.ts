import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message }: ContactEmailRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Save message to database
    const { error: insertError } = await supabaseClient
      .from('contact_messages')
      .insert({
        name,
        email,
        phone,
        subject,
        message
      });

    if (insertError) {
      console.error('Error saving contact message:', insertError);
      throw new Error('Failed to save contact message');
    }

    // Get contact settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('contact_settings')
      .select('*')
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching contact settings:', settingsError);
      throw new Error('Failed to fetch contact settings');
    }

    const responses = [];

    // Send notification email to admin if configured
    if (settings?.notification_email) {
      const notificationResponse = await resend.emails.send({
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: [settings.notification_email],
        subject: `Nieuw contactbericht van ${name}`,
        html: `
          <h2>Nieuw contactbericht ontvangen</h2>
          <p><strong>Naam:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          ${phone ? `<p><strong>Telefoon:</strong> ${phone}</p>` : ''}
          ${subject ? `<p><strong>Onderwerp:</strong> ${subject}</p>` : ''}
          <p><strong>Bericht:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });
      responses.push(notificationResponse);
    }

    // Send auto-reply if enabled
    if (settings?.auto_reply_enabled) {
      const autoReplyResponse = await resend.emails.send({
        from: "Portfolio <onboarding@resend.dev>",
        to: [email],
        subject: settings.auto_reply_subject || "Bedankt voor je bericht",
        html: `
          <h2>Bedankt voor je bericht, ${name}!</h2>
          <p>${settings.auto_reply_message || 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.'}</p>
          <br>
          <p>Met vriendelijke groet,<br>Portfolio Team</p>
        `,
      });
      responses.push(autoReplyResponse);
    }

    console.log("Emails sent successfully:", responses);

    return new Response(JSON.stringify({ success: true, responses }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);