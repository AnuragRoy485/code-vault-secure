## What I'll build

### 1. Database changes (one migration)
- Add `owner_id uuid` (nullable, FK to `auth.users`), `visibility text` (`public` | `unlisted` | `private`, default `public`), `delete_token text` (hashed), `updated_at` to `pastes`.
- Backfill `visibility` from existing `is_listed` (true → `public`, false → `unlisted`), keep `is_listed` for compat.
- Create `paste_versions` table (paste_id, version, title, content, language, created_at) for edit history.
- RLS: anonymous can read public/unlisted by id; owner can read own private; owner can update/delete own; service role for admin paths.
- GRANTs for `anon` (SELECT on pastes id-lookup via server fn only) and `authenticated`.

### 2. Auth
- Enable Google via `supabase--configure_social_auth` (keep email/password).
- New `/auth` route: tabs for Sign in / Sign up, "Continue with Google" using `lovable.auth.signInWithOAuth("google", …)`.
- Header: show user avatar + dropdown (My Pastes, Sign out) when signed in; "Sign in" button otherwise.
- Integration-managed `_authenticated` layout (created by the migration tool if not present).

### 3. Paste creation tiers
- Anonymous: max 100K chars, max expiration 1 month, visibility `public`/`unlisted` only. On create, **show one-time delete token + URL** in a copy-to-clipboard card; the token is the only way to delete later.
- Signed in: full 1M chars, "Never expire" option, all three visibilities (public/unlisted/private), pastes auto-linked to account.
- Hero shows "Sign in for more" hint when anonymous.

### 4. Paste view (`/p/$id`)
- Owner sees Edit + Delete buttons.
- Anonymous creator can paste their delete token into a confirm dialog to delete.
- Editing creates a new row in `paste_versions` and updates `pastes`. Version dropdown lets owner view past versions.

### 5. My Pastes (`/_authenticated/my`)
- Lists user's pastes with search, view count, visibility badge, expiry, edit/delete actions.

### 6. Server functions / API
- `createPaste` returns `{ id, delete_token }` (token only for anonymous creators).
- `deletePaste({ id, token? })` — accepts owner JWT or delete token.
- `updatePaste` (owner only) writes a version snapshot.
- `getMyPastes` (owner only).
- Public REST endpoints (`/api/public/v1/paste`) mirror the visibility/delete-token model.

### 7. Vercel deployment
- Keep Lovable Publish working (default Cloudflare target stays the build target on Lovable).
- Add a `vercel.json` + `.vercelignore`, and a small `nitro` override in `vite.config.ts` that switches to `vercel-edge` preset when `VERCEL=1` is set. Docs in `DEPLOY_VERCEL.md` list the env vars to copy (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Note: Vercel deploys won't have access to Lovable's auto-injected `LOVABLE_API_KEY` / managed Google OAuth — the README documents how to BYO Google credentials there.

### 8. Responsiveness polish
- Header collapses cleanly on mobile, dashboard table → cards, dialogs full-screen on small viewports.

## Files

New: `src/routes/auth.tsx`, `src/routes/_authenticated/route.tsx`, `src/routes/_authenticated/my.tsx`, `src/routes/_authenticated/edit.$id.tsx`, `src/components/user-menu.tsx`, `src/components/delete-paste-dialog.tsx`, `vercel.json`, `.vercelignore`, `DEPLOY_VERCEL.md`.

Edited: `src/lib/paste.functions.ts`, `src/lib/paste-constants.ts`, `src/routes/index.tsx`, `src/routes/p.$id.tsx`, `src/components/site-header.tsx`, `src/routes/api/public/v1/paste.ts`, `src/routes/api/public/v1/paste.$id.ts`, `vite.config.ts`.

## Heads up
- Vercel is **not officially supported** for this stack. The config I add is best-effort using nitro's `vercel-edge` preset — it should work, but if Vercel's build fails on platform-specific reasons I may need a follow-up. Lovable Publish remains the reliable path.
- The DB migration adds columns and a new table; you'll see a review prompt before it runs. Code that depends on the new schema is written after you approve it.
