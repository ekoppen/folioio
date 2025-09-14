-- Migration 008: Add contact settings columns to site_settings
-- Adds contact-related columns that were missing from site_settings table

-- Add contact settings columns to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT 'contact@example.com',
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) DEFAULT '+31 6 1234 5678',
ADD COLUMN IF NOT EXISTS contact_address VARCHAR(255) DEFAULT 'Nederland',
ADD COLUMN IF NOT EXISTS form_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_reply_subject VARCHAR(255) DEFAULT 'Bedankt voor je bericht',
ADD COLUMN IF NOT EXISTS auto_reply_message TEXT DEFAULT 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.',
ADD COLUMN IF NOT EXISTS notification_email VARCHAR(255);

-- Update existing rows to have default values ONLY if they are NULL
UPDATE site_settings 
SET 
    contact_email = 'contact@example.com'
WHERE contact_email IS NULL;

UPDATE site_settings 
SET 
    contact_phone = '+31 6 1234 5678'
WHERE contact_phone IS NULL;

UPDATE site_settings 
SET 
    contact_address = 'Nederland'
WHERE contact_address IS NULL;

UPDATE site_settings 
SET 
    form_enabled = true
WHERE form_enabled IS NULL;

UPDATE site_settings 
SET 
    auto_reply_enabled = true
WHERE auto_reply_enabled IS NULL;

UPDATE site_settings 
SET 
    auto_reply_subject = 'Bedankt voor je bericht'
WHERE auto_reply_subject IS NULL;

UPDATE site_settings 
SET 
    auto_reply_message = 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.'
WHERE auto_reply_message IS NULL;

-- Create contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);