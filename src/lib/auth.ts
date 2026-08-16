import { cookies } from 'next/headers';

export interface SetDriftSession {
  user: {
    id: string;
    name: string;
    email?: string;
    image?: string;
  };
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  providerAccountId: string;
}

const COOKIE_NAME = 'setdrift_session';

export async function refreshSpotifyToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number; refreshToken?: string } | null> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      console.warn('Failed to refresh Spotify token:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
      refreshToken: data.refresh_token || refreshToken,
    };
  } catch (err) {
    console.error('refreshSpotifyToken exception:', err);
    return null;
  }
}

export async function auth(): Promise<SetDriftSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as SetDriftSession;

    // Auto-refresh expired or nearly expired tokens
    if (session.refreshToken && session.expiresAt && Date.now() > session.expiresAt - 60000) {
      const refreshed = await refreshSpotifyToken(session.refreshToken);
      if (refreshed) {
        session.accessToken = refreshed.accessToken;
        session.expiresAt = Date.now() + refreshed.expiresIn * 1000;
        if (refreshed.refreshToken) {
          session.refreshToken = refreshed.refreshToken;
        }
        try {
          cookieStore.set({
            name: COOKIE_NAME,
            value: encodeSession(session),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
          });
        } catch {
          // May throw if called from read-only server component render context
        }
      }
    }

    return session;
  } catch (err) {
    console.error('Failed to parse session cookie:', err);
    return null;
  }
}

export function encodeSession(session: SetDriftSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

export { COOKIE_NAME };
