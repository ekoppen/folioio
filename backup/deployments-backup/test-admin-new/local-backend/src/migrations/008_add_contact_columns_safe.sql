-- Migration 008 SAFE: Add contact settings columns WITHOUT default data
-- This version ONLY adds columns and does NOT set any default values
-- User data is preserved and not overwritten

-- Add contact settings columns to site_settings table (NO DEFAULTS TO PREVENT OVERWRITE)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS form_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS auto_reply_subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS auto_reply_message TEXT,
ADD COLUMN IF NOT EXISTS notification_email VARCHAR(255);

-- IMPORTANT: NO UPDATE STATEMENTS
-- This prevents overwriting existing user data
-- Columns will be NULL for existing records, which is safe
-- The application will handle NULL values with appropriate defaults

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);