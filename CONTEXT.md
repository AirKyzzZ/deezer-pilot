# Project Name: Deezer Pilot
# Type: "Killer Feature" Portfolio Project
# Target Audience: Deezer Engineering & Product Teams
# Author: Maxime Mansiet

---

## 1. THE CONTEXT (Crucial for AI Persona)

### About the Author
**Maxime Mansiet** is a 19-year-old software engineering student at **EPSI Bordeaux** (2nd year).
- **Profile:** Entrepreneurial (Founder of Klyx agency, VertiFlow) & Tech-savvy (Exp at 2060.io on AI Agents, Verana on Verifiable Credentials).
- **Key Strengths:** Next.js Ecosystem, UI/UX Design, AI Integration, Product Vision.

### The Ultimate Goal
This project is NOT just a school assignment. It is a **strategic tool** to secure a specific **Apprenticeship (Alternance)** at **Deezer** starting **September 2026** (for his 3rd year).
- **The Strategy:** Demonstrate to Deezer recruiters that Maxime is "plug-and-play": he understands their stack, their brand identity, and can ship complex AI features that bring value to their product.
- **Tone of Code:** Professional, clean, well-commented, handling edge cases (Rate Limits, Errors) gracefully.

---

## 2. PROJECT VISION: "Deezer Pilot"

**Concept:** An AI-powered "Vibe Agent" that extends the Deezer experience.
Instead of searching for "Rock music", the user talks to the Pilot: *"It's midnight, I'm coding in VS Code, I need focus music with a dark synthwave vibe, no lyrics."*
The Pilot uses an LLM to translate this intent into specific Deezer API parameters and generates a playlist that can be saved directly to the user's account.

---

## 3. TECH STACK (Strict Constraints)

### Frontend & Framework
- **Framework:** Next.js 15 (App Router).
- **Language:** TypeScript (Strict Mode).
- **Styling:** Tailwind CSS (v3.4+).
- **UI Library:** Shadcn/UI (Radix Primitives) + Lucid React (Icons).
- **Animations:** Framer Motion (Targeting a "Native App" feel).

### Backend & Database (Supabase Only)
- **BaaS:** **Supabase** (Auth, Database, Realtime).
- **Auth:** Supabase Auth with **Deezer Provider** (OAuth 2.0).
- **Database:** PostgreSQL (managed by Supabase).
- **ORM/Query:** Supabase JS Client (`@supabase/ssr` for Next.js 15 server components). NO Prisma.

### Artificial Intelligence
- **Orchestration:** Vercel AI SDK (`npm i ai`).
- **Model:** OpenAI `gpt-4o-mini` (via API Key).

---

## 4. DESIGN SYSTEM (The "Deezer 2025" Identity)

**Visual Target:** Mimic the recent Deezer rebrand. Bold, Bubbly, Organic, Purple.

### 🎨 Colors
- **Main Background:** `#000000` (Pure Black). **Never** use dark gray for the full page background.
- **Brand Accent:** `#8f00fe` (Deezer Purple). Used for primary buttons, active states, and "Glow" effects.
- **Surface/Cards:** `#191919` (Dark Gray).
- **Text:** White (`#ffffff`) for headings, Gray (`#a1a1a1`) for metadata.

### 📐 Shape Language (Critical)
- **Roundness:** "Extreme Roundness".
  - **Buttons:** Always `rounded-full`.
  - **Cards:** `rounded-[2rem]` (32px) or `rounded-3xl`.
  - **Inputs:** Capsule shaped (`rounded-full`).
- **Typography:** Bold, modern Sans-serif (Geist or Inter). Headings should be Heavy/Black weight.

---

## 5. DATABASE SCHEMA (Supabase SQL)

*Do not use Prisma schema. Use SQL definitions for Supabase.*

### Table: `profiles` (Public user data)
- `id` (uuid, references auth.users)
- `deezer_id` (text, unique)
- `full_name` (text)
- `avatar_url` (text)
- `updated_at` (timestamp)

### Table: `generated_playlists` (History)
- `id` (uuid, default gen_random_uuid())
- `user_id` (uuid, references auth.users)
- `prompt` (text) - *The user's original request*
- `ai_analysis` (jsonb) - *The technical parameters extracted by AI*
- `tracks` (jsonb) - *Snapshot of the tracks found*
- `deezer_playlist_id` (text, nullable) - *If saved to Deezer account*
- `created_at` (timestamp)

---

## 6. FUNCTIONAL WORKFLOWS

### A. Authentication (Supabase + Deezer)
1.  User clicks "Connect with Deezer".
2.  Redirect to Supabase OAuth (`provider: 'deezer'`).
3.  **Scopes:** Must request `basic_access`, `email`, `manage_library`, `delete_library`.
4.  **Token Management:** Store the `provider_token` (Deezer Access Token) securely in the session to make API calls on behalf of the user later.

### B. The "Vibe" Generation (Server Action)
1.  **Input:** User Prompt via Chat UI.
2.  **AI Step:** Call OpenAI with system prompt:
    > "You are a music curator. Convert this prompt into a JSON object with: BPM range, Genre ID (Deezer standard), Keywords, and Acoustic settings."
3.  **Deezer API Step:** Use the JSON to query `https://api.deezer.com/search`.
    * *Optimization:* Filter results to ensure valid audio previews.
4.  **UI Step:** Stream results to the client using Vercel AI SDK `streamUI` or return data.

### C. The "Save" Feature
1.  User clicks "Add to my Deezer".
2.  Backend calls `POST https://api.deezer.com/user/me/playlists` using the user's `provider_token`.
3.  Backend calls `POST https://api.deezer.com/playlist/{id}/tracks`.
4.  Backend inserts a record into Supabase `generated_playlists`.
5.  Frontend shows a Success Toast with a link to open the playlist in Deezer.

---

## 7. CODING GUIDELINES (For the AI Assistant)

1.  **Deezer API Respect:** Always handle Rate Limits (50 req/5sec). Implement retry logic or throttling if necessary.
2.  **Type Safety:** Use strict TypeScript interfaces for all API responses (Deezer Track, Playlist, User).
3.  **Comments:** Add "Educational Comments".
    * *Bad:* `// Fetch data`
    * *Good:* `// We fetch 25 tracks instead of 10 to filter out those without previews later.`
    * *Why:* This shows Maxime's thought process to future reviewers.
4.  **Supabase SSR:** Use `createClient` from `@supabase/ssr` for all server-side data fetching.

---

## 8. PROMPT ENGINEERING (Internal AI Logic)

**System Prompt for the Vibe Agent:**
```text
You are Deezer Pilot, an expert music supervisor.
Your goal is to translate abstract human feelings into technical search queries.
Users will give you prompts like: "I want to feel like a villain in a cyberpunk movie."
You must output a JSON object containing:
- q: A constructed search query (e.g., 'synthwave dark cinematic')
- bpm_min / bpm_max: (e.g., 90-110)
- genre_id: (Map to closest Deezer genre ID)
- mood_explanation: A short sentence explaining why you chose these parameters.