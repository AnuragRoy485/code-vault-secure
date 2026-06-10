
-- 1) Extend pastes
ALTER TABLE public.pastes
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS delete_token_hash text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Constrain visibility
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pastes_visibility_check') THEN
    ALTER TABLE public.pastes
      ADD CONSTRAINT pastes_visibility_check
      CHECK (visibility IN ('public','unlisted','private'));
  END IF;
END $$;

-- Backfill visibility from existing is_listed
UPDATE public.pastes SET visibility = CASE WHEN is_listed THEN 'public' ELSE 'unlisted' END
  WHERE visibility IS NULL OR visibility = 'public';

CREATE INDEX IF NOT EXISTS pastes_owner_id_idx ON public.pastes(owner_id);
CREATE INDEX IF NOT EXISTS pastes_visibility_idx ON public.pastes(visibility);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS pastes_touch_updated_at ON public.pastes;
CREATE TRIGGER pastes_touch_updated_at BEFORE UPDATE ON public.pastes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable RLS on pastes (was previously open via service role only)
ALTER TABLE public.pastes ENABLE ROW LEVEL SECURITY;

-- Policies: owners full access; anonymous can read non-private rows by id (server fn enforces id-lookup)
DROP POLICY IF EXISTS "pastes_select_public_or_owner" ON public.pastes;
CREATE POLICY "pastes_select_public_or_owner" ON public.pastes
  FOR SELECT USING (
    visibility IN ('public','unlisted') OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "pastes_insert_any" ON public.pastes;
CREATE POLICY "pastes_insert_any" ON public.pastes
  FOR INSERT WITH CHECK (
    owner_id IS NULL OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "pastes_update_owner" ON public.pastes;
CREATE POLICY "pastes_update_owner" ON public.pastes
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "pastes_delete_owner" ON public.pastes;
CREATE POLICY "pastes_delete_owner" ON public.pastes
  FOR DELETE USING (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pastes TO authenticated;
GRANT SELECT, INSERT ON public.pastes TO anon;
GRANT ALL ON public.pastes TO service_role;

-- 2) paste_versions
CREATE TABLE IF NOT EXISTS public.paste_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paste_id text NOT NULL REFERENCES public.pastes(id) ON DELETE CASCADE,
  version int NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  language text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paste_id, version)
);

GRANT SELECT, INSERT ON public.paste_versions TO authenticated;
GRANT ALL ON public.paste_versions TO service_role;

ALTER TABLE public.paste_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "versions_select_owner" ON public.paste_versions;
CREATE POLICY "versions_select_owner" ON public.paste_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pastes p WHERE p.id = paste_versions.paste_id AND p.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "versions_insert_owner" ON public.paste_versions;
CREATE POLICY "versions_insert_owner" ON public.paste_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pastes p WHERE p.id = paste_versions.paste_id AND p.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS paste_versions_paste_id_idx ON public.paste_versions(paste_id);
