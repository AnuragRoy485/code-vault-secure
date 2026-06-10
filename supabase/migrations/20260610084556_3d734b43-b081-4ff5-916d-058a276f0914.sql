
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.pastes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'plaintext',
  password_hash TEXT,
  is_listed BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.pastes TO service_role;

ALTER TABLE public.pastes ENABLE ROW LEVEL SECURITY;

CREATE INDEX pastes_created_at_idx ON public.pastes (created_at DESC);
CREATE INDEX pastes_title_trgm_idx ON public.pastes USING GIN (title gin_trgm_ops);
