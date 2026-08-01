import { cookies } from 'next/headers';

export interface SetDeckSession {
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

const COOKIE_NAME = 'setdeck_session';

export async function auth(): Promise<SetDeckSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as SetDeckSession;
    return session;
  } catch (err) {
    console.error('Failed to parse session cookie:', err);
    return null;
  }
}

export function encodeSession(session: SetDeckSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

export { COOKIE_NAME };
