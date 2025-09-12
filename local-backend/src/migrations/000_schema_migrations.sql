-- Create schema_migrations table for tracking applied migrations
-- This must run before all other migrations

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  checksum VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON public.schema_migrations(applied_at);

-- Add comment
COMMENT ON TABLE public.schema_migrations IS 'Tracks which database migrations have been applied';
COMMENT ON COLUMN public.schema_migrations.version IS 'Migration version identifier';
COMMENT ON COLUMN public.schema_migrations.applied_at IS 'Timestamp when migration was applied';