-- Revoke any column-level access and lock down sensitive hash columns from public clients.
REVOKE SELECT ON public.pastes FROM anon, authenticated;

-- Re-grant SELECT only on non-sensitive columns (server uses service_role and is unaffected).
GRANT SELECT (id, title, content, language, is_listed, views, expires_at, created_at, updated_at, owner_id, visibility)
  ON public.pastes TO anon, authenticated;

-- Keep write paths working for signed-in owners (RLS still enforces ownership).
GRANT INSERT, UPDATE, DELETE ON public.pastes TO authenticated;