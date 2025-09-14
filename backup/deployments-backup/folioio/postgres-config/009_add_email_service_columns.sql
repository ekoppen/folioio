-- Migration: Add email service configuration columns
-- Description: Adds email service type and credentials columns for Gmail/Resend integration

-- Add email service configuration columns to site_settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS email_service_type VARCHAR(20) DEFAULT 'gmail',
ADD COLUMN IF NOT EXISTS gmail_user VARCHAR(255),
ADD COLUMN IF NOT EXISTS gmail_app_password VARCHAR(255),
ADD COLUMN IF NOT EXISTS resend_api_key VARCHAR(255);

-- Set safe defaults for existing records
UPDATE site_settings 
SET email_service_type = 'gmail'
WHERE email_service_type IS NULL;