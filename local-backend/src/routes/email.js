const express = require('express');
const { query } = require('../database/client');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email service that replicates the Supabase Edge Function functionality
router.post('/send-contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, and message are required'
      });
    }

    // Save message to database
    const insertResult = await query(`
      INSERT INTO contact_messages (name, email, phone, subject, message, is_read)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING id, created_at
    `, [name, email, phone, subject, message]);

    if (!insertResult.rows.length) {
      throw new Error('Failed to save contact message');
    }

    // Get contact settings from site_settings
    const settingsResult = await query(`
      SELECT 
        contact_email, 
        notification_email,
        auto_reply_enabled,
        auto_reply_subject,
        auto_reply_message,
        form_enabled,
        email_service_type,
        gmail_user,
        gmail_app_password,
        resend_api_key
      FROM site_settings 
      LIMIT 1
    `);

    const settings = settingsResult.rows[0];

    if (!settings?.form_enabled) {
      return res.status(403).json({
        error: 'Contact form is currently disabled'
      });
    }

    const responses = [];

    // Get email service configuration from database or environment
    const dbGmailUser = settings?.gmail_user;
    const dbGmailPassword = settings?.gmail_app_password;
    const dbResendKey = settings?.resend_api_key;
    const serviceType = settings?.email_service_type || 'gmail';
    
    // Fallback to environment variables if not set in database
    const GMAIL_USER = dbGmailUser || process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = dbGmailPassword || process.env.GMAIL_APP_PASSWORD;
    const RESEND_API_KEY = dbResendKey || process.env.RESEND_API_KEY;
    
    if (!GMAIL_USER && !RESEND_API_KEY) {
      console.log('⚠️ No email service configured in database or environment, skipping email sending');
      return res.status(200).json({
        success: true,
        message: 'Contact message saved successfully. Email service not configured.',
        messageId: insertResult.rows[0].id,
        responses: []
      });
    }

    // Create email transporter based on database preference or available credentials
    let transporter = null;
    let resend = null;
    
    if ((serviceType === 'gmail' && GMAIL_USER && GMAIL_APP_PASSWORD) || (!RESEND_API_KEY && GMAIL_USER && GMAIL_APP_PASSWORD)) {
      console.log('📧 Using Gmail SMTP for email service');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD
        }
      });
    } else if ((serviceType === 'resend' && RESEND_API_KEY) || (!GMAIL_USER && RESEND_API_KEY)) {
      console.log('📧 Using Resend for email service');
      const { Resend } = require('resend');
      resend = new Resend(RESEND_API_KEY);
    }

    // Send notification email to admin if configured
    if (settings?.notification_email) {
      try {
        const emailContent = {
          subject: `Nieuw contactbericht van ${name}`,
          html: `
            <h2>Nieuw contactbericht ontvangen</h2>
            <p><strong>Naam:</strong> ${name}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            ${phone ? `<p><strong>Telefoon:</strong> ${phone}</p>` : ''}
            ${subject ? `<p><strong>Onderwerp:</strong> ${subject}</p>` : ''}
            <p><strong>Bericht:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Bericht ontvangen via portfolio contactformulier op ${new Date().toLocaleString('nl-NL')}
            </p>
          `
        };

        let notificationResponse;
        
        if (transporter) {
          // Gmail SMTP
          notificationResponse = await transporter.sendMail({
            from: `"Portfolio Contact" <${GMAIL_USER}>`,
            to: settings.notification_email,
            ...emailContent
          });
        } else if (resend) {
          // Resend
          notificationResponse = await resend.emails.send({
            from: "Portfolio Contact <onboarding@resend.dev>",
            to: [settings.notification_email],
            ...emailContent
          });
        }
        
        responses.push({
          type: 'notification',
          ...notificationResponse
        });
        
        console.log('✅ Notification email sent to:', settings.notification_email);
      } catch (error) {
        console.error('❌ Failed to send notification email:', error);
        responses.push({
          type: 'notification',
          error: error.message
        });
      }
    }

    // Send auto-reply if enabled
    if (settings?.auto_reply_enabled) {
      try {
        const autoReplyContent = {
          subject: settings.auto_reply_subject || "Bedankt voor je bericht",
          html: `
            <h2>Bedankt voor je bericht, ${name}!</h2>
            <p>${settings.auto_reply_message || 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.'}</p>
            <br>
            <p>Met vriendelijke groet,<br>Portfolio Team</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Dit is een automatisch gegenereerd bericht. Reageer niet op deze e-mail.
            </p>
          `
        };

        let autoReplyResponse;
        
        if (transporter) {
          // Gmail SMTP
          autoReplyResponse = await transporter.sendMail({
            from: `"Portfolio" <${GMAIL_USER}>`,
            to: email,
            ...autoReplyContent
          });
        } else if (resend) {
          // Resend
          autoReplyResponse = await resend.emails.send({
            from: "Portfolio <onboarding@resend.dev>",
            to: [email],
            ...autoReplyContent
          });
        }
        
        responses.push({
          type: 'auto_reply',
          ...autoReplyResponse
        });
        
        console.log('✅ Auto-reply email sent to:', email);
      } catch (error) {
        console.error('❌ Failed to send auto-reply email:', error);
        responses.push({
          type: 'auto_reply',
          error: error.message
        });
      }
    }

    console.log(`📧 Contact form submission processed: ${name} (${email})`);

    res.status(200).json({
      success: true,
      message: 'Contact message processed successfully',
      messageId: insertResult.rows[0].id,
      responses
    });

  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

// Get contact messages (admin only)
router.get('/messages', async (req, res) => {
  try {
    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    const userResult = await query('SELECT role FROM profiles WHERE id = $1', [decoded.sub]);
    if (!userResult.rows.length || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get contact messages
    const messagesResult = await query(`
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        subject, 
        message, 
        is_read, 
        created_at,
        updated_at
      FROM contact_messages 
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      messages: messagesResult.rows
    });

  } catch (error) {
    console.error('❌ Error fetching contact messages:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Mark message as read (admin only)
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;

    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    const userResult = await query('SELECT role FROM profiles WHERE id = $1', [decoded.sub]);
    if (!userResult.rows.length || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Update message read status
    const updateResult = await query(`
      UPDATE contact_messages 
      SET is_read = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [is_read, id]);

    if (!updateResult.rows.length) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({
      success: true,
      message: updateResult.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating message:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;