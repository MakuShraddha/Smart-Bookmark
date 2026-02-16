# Smart Bookmark

Simple private bookmark manager built with:

- Next.js (App Router)
- Supabase (Google OAuth, Postgres, Realtime)
- Tailwind CSS

## Features

- Google-only login (no email/password flow)
- Add bookmark (`title` + `url`)
- Per-user privacy with Row Level Security (RLS)
- Real-time bookmark list updates across tabs
- Delete own bookmarks

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill values:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. In Supabase SQL editor, run:

`supabase/schema.sql`

4. In Supabase Auth settings:

- Enable `Google` provider
- Add redirect URL(s):
  - `http://localhost:3000/auth/callback`
  - `https://<your-vercel-domain>/auth/callback`

5. Run app:

```bash
npm run dev
```

## Database and Security

The `bookmarks` table includes `user_id` that references `auth.users(id)`.

RLS policies enforce:

- `select`: user can read only rows where `auth.uid() = user_id`
- `insert`: user can insert only rows with own `user_id`
- `delete`: user can delete only own rows

Realtime is enabled on `public.bookmarks` via publication.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import repo in Vercel.
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy.
5. Add the final Vercel URL callback in Supabase Google auth settings.

## Problems Faced and How They Were Solved

1. OAuth callback session handling:
   - Problem: after Google login, session was not guaranteed to be exchanged on server.
   - Solution: added `src/app/auth/callback/route.ts` to exchange OAuth code and redirect cleanly.

2. Data isolation per user:
   - Problem: frontend filtering alone is not secure.
   - Solution: enforced RLS policies at DB level with `auth.uid() = user_id` checks.

3. Realtime updates not scoped:
   - Problem: realtime events can be noisy if not filtered.
   - Solution: subscribed with filter `user_id=eq.<current_user_id>` and refetched list on changes.

4. Folder naming issue during scaffolding:
   - Problem: `create-next-app` rejected uppercase directory name.
   - Solution: scaffolded in a temporary lowercase folder and moved files to repo root.

## Submission Info

- Live Vercel URL: `<add-after-deploy>`
- Public GitHub repo: `<add-after-push>`
