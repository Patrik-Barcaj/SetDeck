# SetDrift

> Convert Setlist.fm concert setlists into Spotify playlists seamlessly.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **Auth**: NextAuth.js (Spotify OAuth)
- **Database / Cache**: Prisma (PostgreSQL / Neon), Upstash Redis
- **State & Data Fetching**: Zustand, TanStack React Query
- **Testing**: Vitest, MSW, Playwright

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   SPOTIFY_CLIENT_ID="..."
   SPOTIFY_CLIENT_SECRET="..."
   SETLISTFM_API_KEY="..."
   DATABASE_URL="..."
   UPSTASH_REDIS_REST_URL="..."
   UPSTASH_REDIS_REST_TOKEN="..."
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="..."
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm run test
   ```

