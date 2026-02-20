# Priority Survey App

A single-page drag-and-drop ranking survey built with Next.js, Supabase, and deployed on Vercel.

Users enter their name and email, then drag-and-drop items to rank them by priority. Each email can only submit once. Items change from yellow (needs arranging) to green (set) as the user moves them.

---

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project (or use an existing one)
2. Open the **SQL Editor** in your Supabase dashboard
3. Paste and run the contents of `supabase-setup.sql`
4. Go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://abc123.supabase.co`)
   - **Service Role Key** (the `service_role` key, NOT the `anon` key)

### 2. Customize Survey Options

Open `components/Survey.tsx` and edit the `SURVEY_OPTIONS` array near the top:

```ts
const SURVEY_OPTIONS = [
  { id: "lead-gen", label: "Lead Generation" },
  { id: "client-retention", label: "Client Retention" },
  // ... add, remove, or rename as needed
];
```

Each item needs a unique `id` (used in the database) and a `label` (shown to the user).

### 3. Local Development

```bash
# Install dependencies
npm install

# Create your env file
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and service role key

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variables:
   - `SUPABASE_URL` → your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → your service role key
4. Click **Deploy**

That's it. Vercel auto-detects Next.js and handles everything.

---

## Viewing Results

### In Supabase Dashboard

Go to **Table Editor → survey_responses** to see raw submissions.

Or run this query in the SQL Editor for a clean ranked view:

```sql
SELECT * FROM survey_results ORDER BY email, rank;
```

### Export to CSV

In the Supabase Table Editor, click the **Export** button to download results as CSV.

---

## Site Map

### Pages

| Path | Description |
|------|-------------|
| `/` | Main survey — select top 5 problems, rank them, enter contact info, submit |
| `/results` | Public results dashboard |
| `/admin` | Password-protected admin panel (reset data, seed responses, view partials) |

### API Routes

| Path | Method | Description |
|------|--------|-------------|
| `/api/submit` | POST | Submit a completed survey response |
| `/api/partial` | POST | Save/upsert a partial (in-progress) survey response |
| `/api/partial` | DELETE | Delete a partial response (cleanup after submission) |
| `/api/results` | GET | Fetch survey results for the dashboard |
| `/api/admin/login` | POST | Authenticate admin credentials |
| `/api/admin/reset` | POST | Delete all survey responses and partials |
| `/api/admin/seed` | POST | Generate fake survey responses for testing |
| `/api/admin/partials` | POST | List all partial responses (admin only) |

---

## How It Works

- **Drag & Drop**: Uses [@dnd-kit](https://dndkit.com/) which supports mouse, touch, and keyboard — works on all modern browsers including mobile
- **Duplicate Prevention**: Email uniqueness enforced at both the API level (check before insert) and database level (unique constraint)
- **Visual Feedback**: Unmoved items are yellow with "Arrange me" badge; moved items turn green with "✓ Set" badge
- **Progress Indicator**: Shows count of arranged items (e.g. "3/7 items arranged")

---

## Tech Stack

- **Next.js 14** (App Router)
- **@dnd-kit** (accessible drag-and-drop)
- **Supabase** (PostgreSQL database)
- **Vercel** (hosting)
