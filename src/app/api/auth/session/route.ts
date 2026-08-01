import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  return NextResponse.json({
    user: session?.user || null,
    accessToken: session?.accessToken || null,
    providerAccountId: session?.providerAccountId || null,
    expires: session?.expiresAt ? new Date(session.expiresAt).toISOString() : null,
  });
}
