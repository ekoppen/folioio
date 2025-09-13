# Email Service Setup Guide

## Email Configuration Explained

Your portfolio uses a local email service that can work with Gmail SMTP or Resend. Here's how to configure it:

## Email Fields Overview

### 📧 **Contact Information** (Public)
- **Contact Email**: The email address visitors see on your website
- **Contact Phone**: Your public phone number (optional)
- **Contact Address**: Your public address/location (optional)

### 🔔 **Email Service Settings** (Private)
- **Email Service Type**: Choose between Gmail or Resend
- **Notification Email**: Where YOU receive emails when someone contacts you

### ⚙️ **Gmail SMTP Configuration**
- **Gmail User**: The Gmail account that sends emails on behalf of your site
- **Gmail App Password**: Special password for your Gmail account (not your regular password)

## How Email Flow Works

```
1. Visitor fills contact form on your website
   ↓
2. Site sends email via your Gmail account
   ↓
3. You receive notification at your Notification Email
   ↓
4. Visitor receives auto-reply (if enabled)
```

## Example Configuration

```
Contact Email: info@yourdomain.com (what visitors see)
Notification Email: your.personal@gmail.com (where YOU get emails)
Gmail User: info.yourdomain@gmail.com (sends on behalf of site)
Gmail App Password: xxxx xxxx xxxx xxxx (from Gmail security settings)
```

## Setting Up Gmail

1. **Create/Use Gmail Account**
   - Use your domain email or create dedicated account
   - Example: `info.yourdomain@gmail.com`

2. **Enable 2-Factor Authentication**
   - Go to Google Account Settings
   - Security → 2-Step Verification → Turn On

3. **Generate App Password**
   - Security → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password (use spaces or not)

4. **Configure in Admin Panel**
   - Go to Admin → Contact
   - Select "Gmail" as Email Service Type
   - Fill in Gmail User and App Password
   - Set Notification Email (where you want to receive messages)
   - Test by sending yourself a message

## Where Do You Receive Emails?

- **If Notification Email is set**: You receive emails there
- **If Notification Email is empty**: You receive emails at Contact Email
- **Auto-replies**: Sent to the person who contacted you

## Testing Your Setup

1. Fill out your own contact form
2. Check if you receive the notification email
3. Check if auto-reply works (if enabled)
4. Verify sender shows your Gmail account

## Troubleshooting

**Not receiving emails?**
- Check Notification Email is correct
- Verify Gmail App Password is correct
- Check spam folder
- Ensure Gmail account has sufficient quota

**Auto-reply not working?**
- Check "Auto Reply Enabled" is turned on
- Verify auto-reply message is filled in
- Check visitor's spam folder

**Authentication errors?**
- Regenerate Gmail App Password
- Ensure 2-Factor Auth is enabled on Gmail
- Double-check Gmail User email is correct

## Alternative: Resend Service

Instead of Gmail, you can use Resend:
1. Sign up at resend.com
2. Get your API key
3. Select "Resend" as Email Service Type
4. Enter your Resend API key

Note: Resend requires domain verification for production use.