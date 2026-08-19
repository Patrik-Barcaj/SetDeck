import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function GET(request: Request) {
  const host = request.headers.get('host') || '127.0.0.1:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
  const origin = `${proto}://${host}`;
  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
