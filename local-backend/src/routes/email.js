const express = require('express');
const { query } = require('../database/client');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { requireAuth, requireAdmin } = require('../auth/middleware');

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
        // Get site URL from environment or use localhost for development
        const siteUrl = process.env.SITE_URL || 'http://localhost:8080';

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
            <div style="margin: 20px 0;">
              <a href="${siteUrl}/admin#contact" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                📧 Beantwoord dit bericht in de admin
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">
              Of ga direct naar: <a href="${siteUrl}/admin#contact" style="color: #007bff;">${siteUrl}/admin#contact</a>
            </p>
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

// Get contact messages with pagination, search and filtering (admin only)
router.get('/messages', requireAuth, requireAdmin, async (req, res) => {
  try {

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const filter = req.query.filter || 'all'; // all, unread, read
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'desc';

    const offset = (page - 1) * limit;

    // Build WHERE clause based on filters
    let whereClause = '1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR subject ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (filter === 'unread') {
      whereClause += ` AND is_read = false`;
    } else if (filter === 'read') {
      whereClause += ` AND is_read = true`;
    }

    // Get total count for pagination
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM contact_messages
      WHERE ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Get messages with pagination
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
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    // Get unread count for sidebar badge
    const unreadResult = await query('SELECT COUNT(*) as unread FROM contact_messages WHERE is_read = false');
    const unreadCount = parseInt(unreadResult.rows[0].unread);

    res.json({
      success: true,
      messages: messagesResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        unreadCount,
        totalCount: total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching contact messages:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Mark message as read (admin only)
router.patch('/messages/:id/read', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;

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

// Bulk mark messages as read (admin only)
router.patch('/messages/bulk/read', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { messageIds, markAsRead } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'messageIds array is required' });
    }

    // Build the update query for multiple IDs
    const placeholders = messageIds.map((_, index) => `$${index + 2}`).join(',');
    const updateResult = await query(`
      UPDATE contact_messages
      SET is_read = $1, updated_at = NOW()
      WHERE id IN (${placeholders})
      RETURNING id
    `, [markAsRead, ...messageIds]);

    res.json({
      success: true,
      updatedCount: updateResult.rows.length,
      messageIds: updateResult.rows.map(row => row.id)
    });

  } catch (error) {
    console.error('❌ Error bulk updating messages:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Reply to contact message (admin only)
router.post('/messages/:id/reply', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({
        error: 'Subject and message are required'
      });
    }

    // Get original message details
    const originalResult = await query(`
      SELECT name, email, subject as original_subject
      FROM contact_messages
      WHERE id = $1
    `, [id]);

    if (!originalResult.rows.length) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const original = originalResult.rows[0];

    // Get contact settings for email configuration
    const settingsResult = await query(`
      SELECT
        email_service_type,
        gmail_user,
        gmail_app_password,
        resend_api_key
      FROM site_settings
      LIMIT 1
    `);

    const settings = settingsResult.rows[0];

    if (!settings) {
      return res.status(500).json({ error: 'Email settings not configured' });
    }

    // Get email service configuration
    const serviceType = settings?.email_service_type || 'gmail';
    const GMAIL_USER = settings?.gmail_user || process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = settings?.gmail_app_password || process.env.GMAIL_APP_PASSWORD;
    const RESEND_API_KEY = settings?.resend_api_key || process.env.RESEND_API_KEY;

    if (!GMAIL_USER && !RESEND_API_KEY) {
      return res.status(500).json({
        error: 'Email service not configured. Please configure Gmail or Resend in contact settings.'
      });
    }

    // Create email transporter
    let transporter = null;
    let resend = null;

    if ((serviceType === 'gmail' && GMAIL_USER && GMAIL_APP_PASSWORD) || (!RESEND_API_KEY && GMAIL_USER && GMAIL_APP_PASSWORD)) {
      console.log('📧 Using Gmail SMTP for reply');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD
        }
      });
    } else if ((serviceType === 'resend' && RESEND_API_KEY) || (!GMAIL_USER && RESEND_API_KEY)) {
      console.log('📧 Using Resend for reply');
      const { Resend } = require('resend');
      resend = new Resend(RESEND_API_KEY);
    }

    // Send reply email
    const emailContent = {
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Antwoord op je bericht</h2>
          <p>Hallo ${original.name},</p>

          <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

          <div style="color: #666; font-size: 14px;">
            <p><strong>Je oorspronkelijke bericht:</strong></p>
            <p><em>Onderwerp: ${original.original_subject}</em></p>
          </div>

          <br>
          <p>Met vriendelijke groet,<br>Portfolio Team</p>
        </div>
      `
    };

    let emailResponse;

    if (transporter) {
      // Gmail SMTP
      emailResponse = await transporter.sendMail({
        from: `"Portfolio" <${GMAIL_USER}>`,
        to: original.email,
        ...emailContent
      });
    } else if (resend) {
      // Resend
      emailResponse = await resend.emails.send({
        from: "Portfolio <onboarding@resend.dev>",
        to: [original.email],
        ...emailContent
      });
    }

    // Mark original message as read
    await query(`
      UPDATE contact_messages
      SET is_read = true, updated_at = NOW()
      WHERE id = $1
    `, [id]);

    console.log(`✅ Reply sent to: ${original.email} for message ${id}`);

    res.json({
      success: true,
      message: 'Reply sent successfully',
      emailResponse
    });

  } catch (error) {
    console.error('❌ Error sending reply:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Delete contact message (admin only)
router.delete('/messages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the message
    const deleteResult = await query(`
      DELETE FROM contact_messages
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (!deleteResult.rows.length) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Debug route to test email functionality
router.post('/test-send', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Test send route hit with body:', req.body);

    // Try to send a simple test email
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Contact Form',
      message: 'This is a test message from the contact form debug route.'
    };

    // Get settings
    const settingsResult = await query(`
      SELECT
        notification_email,
        email_service_type,
        gmail_user,
        gmail_app_password,
        resend_api_key
      FROM site_settings
      LIMIT 1
    `);

    const settings = settingsResult.rows[0];
    console.log('📧 Email settings:', {
      hasGmailUser: !!settings?.gmail_user,
      hasGmailPassword: !!settings?.gmail_app_password,
      serviceType: settings?.email_service_type,
      notificationEmail: settings?.notification_email
    });

    res.json({
      success: true,
      message: 'Debug route working',
      settings: {
        hasGmailUser: !!settings?.gmail_user,
        hasGmailPassword: !!settings?.gmail_app_password,
        serviceType: settings?.email_service_type,
        notificationEmail: settings?.notification_email
      }
    });

  } catch (error) {
    console.error('❌ Error in test send route:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

module.exports = router;