# Pi Light — Family Calendar

A Skylight-inspired family calendar web app built with Next.js, TypeScript, Tailwind CSS, and Supabase. Designed for wall-mounted monitors and touchscreens that stay on all day.

## Features

- **Google Calendar integration** — connect multiple Google accounts and merge calendars into one unified view
- **Week / Month / Day views** — week view is the default
- **Household sharing** — multiple family members can contribute calendars to the same dashboard
- **Wall display mode** — visit `/display` for a fullscreen-optimized layout
- **Customizable** — calendar colors, theme, week start, widget toggles
- **Auto-refresh** — events refresh every 5 minutes (3 minutes on display mode)
- **AI summaries** — daily / weekly / monthly overview generated locally with Ollama
- **Keyboard shortcuts** — `T` today, `←/→` navigate, `F` fullscreen, `W/M/D` switch views

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) project with Calendar API enabled

## Supabase Setup

1. Create a new Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard).

2. Enable Google Auth:
   - Go to **Authentication → Providers → Google**
   - Enable Google provider
   - Add your Google OAuth Client ID and Secret (from Google Cloud Console — see below)
   - Set redirect URL to `https://<your-project-ref>.supabase.co/auth/v1/callback`

3. Run the database migration:
   ```bash
   # Option A: Supabase CLI
   supabase link --project-ref <your-project-ref>
   supabase db push

   # Option B: Copy SQL manually
   # Paste contents of supabase/migrations/20260820000000_initial_schema.sql
   # into the Supabase SQL Editor and run it
   ```

4. Copy your project credentials from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-only)

## Google Cloud / Calendar API Setup

You need **two** OAuth configurations: one for Supabase login, one for Calendar API access.

### 1. Enable APIs

In [Google Cloud Console](https://console.cloud.google.com):
- Enable **Google Calendar API**
- Enable **Google People API** (for user info during calendar connect)

### 2. OAuth Consent Screen

- Configure the OAuth consent screen (External or Internal)
- Add scopes: `email`, `profile`, `https://www.googleapis.com/auth/calendar.readonly`
- While in testing mode, add test users who can sign in

### 3. OAuth Credentials

Create an **OAuth 2.0 Client ID** (Web application):

**Authorized redirect URIs:**
```
https://<your-project-ref>.supabase.co/auth/v1/callback
http://localhost:3000/api/google/callback
```

Use the same Client ID/Secret for both Supabase Google provider and the app env vars.

### 4. Generate encryption key

```bash
openssl rand -hex 32
```

This becomes `GOOGLE_TOKEN_ENCRYPTION_KEY`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/google/callback` |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | 32-byte hex string for token encryption |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (or production URL) |
| `WEATHER_LAT` / `WEATHER_LON` | Optional default weather location |
| `OLLAMA_HOST` | Ollama base URL (default `http://127.0.0.1:11434`) |
| `OLLAMA_MODEL` | Model name for calendar summaries (default `llama3.2`) |

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Sign in with Google
2. Go to **Settings → Connect Google Account** to grant calendar access
3. Enable the calendars you want on the dashboard
4. Visit `/display` for wall mode

### Ollama summaries

Pi Light calls a local Ollama instance to write a short family-calendar summary for the current day, week, or month (whichever view is selected).

1. Install and run [Ollama](https://ollama.com) on the same machine (or another host on your LAN).
2. Pull a model, for example: `ollama pull llama3.2`
3. Set `OLLAMA_HOST` and `OLLAMA_MODEL` if you are not using the defaults.

The dashboard sidebar and wall display both show the summary. The first load (or Refresh) generates one with Ollama and stores it in Supabase; later visits reuse the saved text.

## Deploying

### Vercel (recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables
4. Update Google OAuth redirect URIs with your production domain:
   ```
   https://your-domain.com/api/google/callback
   ```
5. Update Supabase Auth redirect URLs in Supabase dashboard

### Other platforms

Any Node.js host that supports Next.js 16 works. Run `npm run build && npm start`.

## Project Structure

```
app/
  (app)/          # Authenticated dashboard + settings
  (auth)/         # Login page
  display/        # Wall display mode
  api/            # Server API routes
components/
  calendar/       # Week/Month/Day views
  dashboard/      # Header, widgets, legend
  settings/       # Settings UI
lib/
  calendar/       # Event normalization, overlap layout
  google/         # OAuth + Calendar API (server-side)
  supabase/       # SSR clients
  household/      # Household context + provisioning
supabase/
  migrations/     # Database schema
```

## Architecture Notes

- **Two-layer auth**: Supabase Google OAuth for app login; separate Google OAuth flow with `calendar.readonly` scope for calendar access with offline refresh tokens
- **Server-side tokens**: Google refresh tokens are encrypted (AES-256-GCM) and never sent to the browser
- **Normalized events**: Google API responses are mapped to an internal `CalendarEvent` type before reaching the UI
- **Household model**: Shared calendars and settings via Postgres RLS policies

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `T` | Go to today |
| `←` / `→` | Previous / next period |
| `F` | Toggle fullscreen |
| `W` / `M` / `D` | Week / Month / Day view |

## License

MIT
