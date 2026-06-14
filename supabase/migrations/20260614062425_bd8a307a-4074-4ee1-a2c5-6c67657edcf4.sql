CREATE TABLE public.anon_paste_events (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.anon_paste_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.anon_paste_events_id_seq TO service_role;

ALTER TABLE public.anon_paste_events ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only service_role (server) may access.

CREATE INDEX anon_paste_events_ip_created_idx ON public.anon_paste_events (ip, created_at DESC);
CREATE INDEX anon_paste_events_hash_created_idx ON public.anon_paste_events (content_hash, created_at DESC);