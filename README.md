# Zakat & Sadqa Register

A simple receipt register for a teacher who collects Zakat, Sadqa, and general
donations in person. He enters the donor's name and amount, gets an instant
printable receipt, and can see all receipts + totals on a dashboard.

## What it does

- **New Receipt** (`/`) — enter donor name, phone, category, amount, method, note.
  Saves it and generates a unique receipt number.
- **Receipt view** (`/receipt/[id]`) — a clean printable slip. "Print / Save as PDF"
  button uses the browser's print dialog, which lets you print on paper or save
  as a PDF file.
- **Dashboard** (`/dashboard`) — table of every receipt, totals by category,
  search, filter, CSV export, a database connection check, and a confirmed
  clear-all action for receipts and expenses.
- A daily Vercel cron calls `/api/keepalive` to keep the Supabase project active.
- Protected by a simple shared passcode (not full user accounts — this is a
  single-user tool for the teacher).
- Configured as a PWA so it can be added to a phone's home screen and opens
  like a native app.

## 1. Set up Supabase (free)

1. Go to https://supabase.com and create a free account + new project.
2. In your project, open **SQL Editor** → **New query**, paste the contents of
   `supabase-schema.sql`, and run it. This creates/updates the receipt tables,
   adds the received-by field, and installs the dashboard clear-all action.
   Re-run this script after pulling schema updates.
3. Go to **Project Settings → API**. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_PASSCODE=your-chosen-passcode
```

`NEXT_PUBLIC_APP_PASSCODE` is the passcode your teacher will type once on his
phone/browser to unlock the app (it's remembered after that). Pick something
simple he'll remember — this is a convenience gate, not bank-grade security,
since only he will be using it.

## 3. Run locally to test

```bash
npm install
npm run dev
```

Open http://localhost:3000, try creating a receipt, then check
http://localhost:3000/dashboard.

## 4. Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com, sign in with GitHub, click **Add New → Project**,
   and import the repo.
3. In the Vercel project settings, add the same three environment variables
   from `.env.local` (Settings → Environment Variables).
4. Deploy. Vercel gives you a URL like `zakat-app.vercel.app`.
5. (Optional) Add a custom domain under Settings → Domains if you bought one.

## 5. Add to home screen (the "app" experience)

On the teacher's phone:
- **Android (Chrome):** open the site → menu (⋮) → "Add to Home screen" /
  "Install app".
- **iPhone (Safari):** open the site → Share button → "Add to Home Screen".

It will then appear as an app icon and open full-screen, without a browser
address bar.

## Notes / things to double check with your teacher

- The current icons (`icon-192.png`, `icon-512.png` referenced in
  `manifest.json`) are placeholders — add real image files in `/public` with
  those exact names so the home screen icon looks right.
- Zakat, Sadqa, and general donations are stored with the same structure but
  tagged by category, so totals are always split correctly for his records.
- If he ever wants multiple people entering receipts (e.g. an assistant), the
  single shared passcode can be upgraded to real per-person accounts using
  Supabase Auth — that's a bigger change, but the data model won't need to.
