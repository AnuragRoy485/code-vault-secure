# Deploying snip.ink to Vercel

This project is built for one-click deploys via **Lovable Publish**. A Vercel
config is also included for users who want to host on Vercel.

## Steps

1. Push the repo to GitHub.
2. Import the repo in Vercel ("New Project").
3. Set the framework preset to **Other** (we ship a `vercel.json` with the
   right build command).
4. Add the following Environment Variables (Project Settings → Environment
   Variables). Copy them from Lovable Cloud → Project Settings.

   | Name | Required | Notes |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | ✅ | Same as `SUPABASE_URL`. |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Public anon key. |
   | `SUPABASE_URL` | ✅ | Server-side. |
   | `SUPABASE_PUBLISHABLE_KEY` | ✅ | Server-side. |
   | `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Secret** — required for paste storage. |
   | `NITRO_PRESET` | optional | Already set to `vercel` in `vercel.json`. |

5. Click **Deploy**.

## Google sign-in on Vercel

The hosted Lovable Google OAuth broker only forwards back to `*.lovable.app`
domains. To enable Google sign-in on a Vercel domain you need to either:

- create your own Google OAuth client and configure it in Lovable Cloud →
  Auth Settings → Google, **or**
- continue using Lovable Publish for production (recommended).

Email/password auth works out of the box on Vercel.

## Notes & limitations

- Vercel is **not officially supported** by the underlying stack
  (TanStack Start + nitro on Cloudflare Workers preset). The `vercel.json`
  here switches nitro's preset at build time, which works in most cases but
  can break if upstream packages change.
- The published Lovable URL remains the most reliable target.
