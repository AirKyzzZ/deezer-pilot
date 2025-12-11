# Deezer Pilot 🎵

An AI-powered music concierge that uses Deezer API to create personalized playlists based on your mood and vibe.

## 🚀 Getting Started

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

**Important:** Update `NEXTAUTH_URL` based on your environment:
- **Local Development:** `NEXTAUTH_URL=http://localhost:3000`
- **Production:** `NEXTAUTH_URL=https://your-domain.vercel.app`

### 2. Deezer App Configuration

1. Go to [Deezer Developers](https://developers.deezer.com/myapps) and create an app
2. Set the **Redirect URI** to match your `NEXTAUTH_URL`:
   - Local: `http://localhost:3000/api/auth/callback/deezer`
   - Production: `https://your-domain.vercel.app/api/auth/callback/deezer`
3. Copy your `DEEZER_CLIENT_ID` and `DEEZER_CLIENT_SECRET` to `.env.local`

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📋 Environment Variables

See `ENV_SETUP.md` for detailed instructions on setting up environment variables and switching between local and production environments.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Components
- **Animations:** Framer Motion
- **AI/LLM:** Vercel AI SDK with Google Gemini (Free Tier)
- **Database:** Supabase
- **Auth:** NextAuth.js v5 with Custom Deezer Provider

## 📝 Switching Between Local and Production

When deploying to production:

1. Update `NEXTAUTH_URL` in your `.env.local` (or Vercel environment variables)
2. Update the redirect URI in your Deezer app settings to match
3. Redeploy

See `ENV_SETUP.md` for more details.

## 🚢 Deploy on Vercel

1. Push your code to GitHub
2. Import your repository to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel's dashboard
4. Set `NEXTAUTH_URL` to your Vercel domain
5. Update Deezer app redirect URI to match
6. Deploy!
