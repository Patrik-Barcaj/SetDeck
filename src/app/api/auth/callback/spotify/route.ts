import { NextRequest, NextResponse } from 'next/server';
import { encodeSession, COOKIE_NAME, SetDriftSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateParam = searchParams.get('state');

  // Parse returnTo from OAuth state
  let returnTo = '/';
  if (stateParam) {
    try {
      const decoded = Buffer.from(stateParam, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (parsed.returnTo && typeof parsed.returnTo === 'string') {
        returnTo = parsed.returnTo;
      }
    } catch {
      // Invalid state, default to home
    }
  }

  const host = request.headers.get('host') || '127.0.0.1:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
  const origin = `${proto}://${host}`;


  if (error || !code) {
    console.error('Spotify OAuth callback error:', error);
    return NextResponse.redirect(`${origin}/?error=${error || 'no_code'}`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI || `${origin}/api/auth/callback/spotify`;


  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Spotify token exchange failed:', errText);
      return NextResponse.redirect(`${origin}/?error=token_failed`);
    }

    const tokenData = await tokenRes.json();
    console.log('[Spotify Auth] Granted scopes:', tokenData.scope);

    // Fetch Spotify profile
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileRes.ok) {
      console.error('Spotify profile fetch failed:', await profileRes.text());
      return NextResponse.redirect(`${origin}/?error=profile_failed`);
    }

    const profile = await profileRes.json();

    const session: SetDriftSession = {
      user: {
        id: profile.id,
        name: profile.display_name || 'Spotify User',
        email: profile.email || '',
        image: profile.images?.[0]?.url || undefined,
      },
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      providerAccountId: profile.id,
    };

    const encoded = encodeSession(session);
    const response = NextResponse.redirect(`${origin}${returnTo}`);

    response.cookies.set({
      name: COOKIE_NAME,
      value: encoded,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    console.error('Spotify Auth Callback Exception:', err);
    return NextResponse.redirect(`${origin}/?error=auth_exception`);
  }
}
