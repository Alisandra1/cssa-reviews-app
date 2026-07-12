# CSSA Client Review Platform

A client feedback tool for Charlie's Support Services Angels:

- **Public page (`/`)** — clients rate a staff member 1–10, leave comments, and give their name and email. No login required, anyone with the link can submit.
- **Staff login (`/login`)** — real email + password sign-in, created by you in the Supabase dashboard.
- **Staff dashboard (`/dashboard`)** — only visible to signed-in staff. Shows every review, stats, and lets you add/pause/remove staff members from the dropdown clients see.

The public form and the staff data are properly separated at the database level (Row Level Security), not just hidden in the page — a client cannot read review data even if they inspect the page or guess a URL.

This is a real Next.js app backed by [Supabase](https://supabase.com) (free tier is enough for this use case). You don't need to run a server yourself — Vercel hosts the app and Supabase hosts the database and login system.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → sign up (free) → **New project**.
2. Pick a name (e.g. `cssa-reviews`), a database password (save it somewhere safe), and a region close to Australia.
3. Once it's created, go to **SQL Editor** → **New query**, paste in the entire contents of `supabase/schema.sql` from this folder, and click **Run**. This creates the `staff` and `reviews` tables and locks them down so only signed-in staff can read reviews.
4. Go to **Project Settings → API**. You'll need two values from this page in step 3 below:
   - **Project URL**
   - **anon public** key

## 2. Create staff logins

Staff accounts are created by you, not by self sign-up (this keeps the dashboard genuinely internal).

1. In Supabase, go to **Authentication → Users → Add user**.
2. Enter each staff member's email and a temporary password. Untick "Auto Confirm User" is fine to leave ticked (so they can log in immediately).
3. Share the email/password with that staff member directly (e.g. in person or a private message) so they can sign in at `/login`. They can change their password later from Supabase if you enable that, or you can just re-set it for them in this same screen.

This is separate from the staff *list* clients pick from on the review form — that list is managed inside the app itself (under "Manage staff list" on the dashboard) and doesn't require anyone to have a login.

## 3. Deploy the app to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up (free) → **Add New → Project**.
2. Upload this folder (or push it to a GitHub repo first and import that repo — either works; GitHub makes future updates easier).
3. When Vercel asks for **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → the Project URL from step 1.4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → the anon public key from step 1.4
4. Click **Deploy**. In a minute or two you'll get a live URL like `cssa-reviews.vercel.app`.

That's it — the public review form is at the root URL, staff sign in at `/login`, and the dashboard is at `/dashboard`.

## 4. Add your staff to the client-facing dropdown

1. Sign in at `/login` with a staff account you created in step 2.
2. On the dashboard, open **Manage staff list** → **Edit**, and add each staff member's name (this is just the display name clients see — it's separate from login accounts).
3. Clients will now see them in the dropdown on the public form immediately.

## 5. Get an email the moment a review is submitted (optional)

By default, reviews are only visible by logging into `/dashboard`. To also get an instant email when someone submits a review:

1. Go to [resend.com](https://resend.com) → sign up (free — 3,000 emails/month is plenty for this).
2. Go to **API Keys** → **Create API Key**. Copy it.
3. In Vercel, go to **Settings → Environment Variables** and add two more:
   - `RESEND_API_KEY` → the key you just copied
   - `NOTIFY_EMAIL` → the email address that should receive the alerts (e.g. your office admin's inbox)
4. Go to **Deployments → (latest) → ⋯ → Redeploy**.

That's it — every new review will now land in that inbox within seconds, in addition to showing on the dashboard.

**A note on the "from" address:** by default, emails send from `onboarding@resend.dev`, which works immediately with no setup but looks generic. If you'd like it to send from something like `reviews@cssareviews.com.au` instead, you'll need to verify a domain you own in Resend (under **Domains**), then add a third Vercel variable: `NOTIFY_FROM_EMAIL` set to `CSSA Reviews <reviews@yourdomain.com>`. This step is optional — the default works fine to start.

---

## Running it locally (optional, for testing before you deploy)

You'll need [Node.js](https://nodejs.org) (v18+) installed.

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

Visit `http://localhost:3000`.

## How the security works

- The **anon key** is safe to expose publicly (it's designed to be) — it only grants what the database's Row Level Security policies allow, which is: anyone can submit a review and see the active staff list, and only signed-in staff can read review data or manage the staff list.
- Sessions are handled by Supabase Auth with secure cookies; the dashboard route is protected server-side, so there's no client-side code to bypass.
- If someone leaves CSSA, remove their user in **Authentication → Users** in Supabase and their access is revoked immediately.

## Making changes later

If you want new fields, a different rating scale, CSV export, or anything else, the code is plain Next.js/React under `src/` — bring the folder back to Claude and describe what you'd like changed.
