import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/';

  const host = request.headers.get('host') || '127.0.0.1:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI || `${origin}/api/auth/callback/spotify`;

  if (!clientId) {
    return NextResponse.json({ error: 'Missing SPOTIFY_CLIENT_ID' }, { status: 500 });
  }

  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'playlist-read-collaborative',
  ].join(' ');

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('scope', scopes);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('show_dialog', 'true');
  authUrl.searchParams.append('state', Buffer.from(JSON.stringify({ returnTo })).toString('base64'));

  return NextResponse.redirect(authUrl.toString());
}
