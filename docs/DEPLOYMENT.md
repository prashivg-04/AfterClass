# Deployment Guide

AfterClass is deployed using **Vercel** (frontend) and **Supabase** (backend + database).

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account
- A [GitHub](https://github.com) account

---

## 1. Supabase Setup

### Create a Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in project name, database password, region
4. Wait for the project to finish provisioning (~2 minutes)

### Run the Database Schema
1. Go to **SQL Editor** in your Supabase project
2. Paste and run the full schema — see [API_REFERENCE.md](./API_REFERENCE.md) for all tables and structure
3. Verify all tables are created under **Table Editor**

### Configure Authentication
1. Go to **Authentication → Providers**
2. Enable **Email** provider — toggle on
3. Enable **Google** provider:
   - Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project → APIs & Services → Credentials → OAuth 2.0 Client ID
   - Set Authorized redirect URI to: `https://your-project.supabase.co/auth/v1/callback`
   - Paste **Client ID** and **Client Secret** into Supabase

### Enable Row Level Security
All tables have RLS enabled with policies configured. Verify by:
1. Go to **Authentication → Policies**
2. Every table should show a green **RLS Enabled** badge
3. Each table should have policies listed under it

> See [SECURITY.md](./SECURITY.md) for full details on the RLS model.

### Get Your API Keys
1. Go to **Settings → API**
2. Note down:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## 2. Local Setup

```bash
# Clone the repo
git clone https://github.com/your-username/AfterClass.git
cd AfterClass

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your Supabase URL and anon key in .env

# Start development server
npm run dev
```

---

## 3. Deploy to Vercel

### First Time Deploy
1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Click **Import** next to your AfterClass repository
4. Vercel will auto-detect Vite — no framework changes needed
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
6. Click **Deploy**

### Subsequent Deploys
Every push to `main` triggers an automatic redeploy on Vercel. No manual steps needed.

### Update Supabase Auth Redirect URLs
After your Vercel URL is live:
1. Go to **Supabase → Authentication → URL Configuration**
2. Set **Site URL** to your Vercel production URL (e.g. `https://afterclass.vercel.app`)
3. Under **Redirect URLs**, add:
   - `https://afterclass.vercel.app/**`
   - `http://localhost:5173/**` (for local dev)

---

## 4. Verify Deployment

After deploying, run through this checklist:

- [ ] App loads without errors
- [ ] Sign up with email works
- [ ] Sign up with Google works
- [ ] Teacher can create a tuition space
- [ ] Student can join via code
- [ ] Quiz creation and attempt works
- [ ] Payments tab loads correctly
- [ ] Discussion chat works in real time

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page after deploy | Check Vercel logs for build errors |
| Auth redirect not working | Update Site URL in Supabase Auth settings |
| Data not loading | Verify RLS policies are enabled on all tables |
| Google OAuth failing | Check redirect URI matches exactly in Google Console |
| Environment variables not working | Ensure all vars are prefixed with `VITE_` |