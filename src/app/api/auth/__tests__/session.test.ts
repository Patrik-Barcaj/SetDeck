import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../session/route';
import * as authLib from '@/lib/auth';
import type { SetDeckSession } from '@/lib/auth';

vi.mock('@/lib/auth');

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns null fields when user is not authenticated', async () => {
    vi.mocked(authLib.auth).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      user: null,
      accessToken: null,
      providerAccountId: null,
      expires: null,
    });
  });

  it('returns user session details when authenticated', async () => {
    const expiresAt = Date.now() + 3600 * 1000;
    const mockSession: SetDeckSession = {
      user: { id: 'u1', name: 'John Doe', email: 'john@example.com' },
      accessToken: 'access_token_xyz',
      providerAccountId: 'spotify_user_999',
      expiresAt,
    };
    vi.mocked(authLib.auth).mockResolvedValue(mockSession);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.name).toBe('John Doe');
    expect(json.accessToken).toBe('access_token_xyz');
    expect(json.providerAccountId).toBe('spotify_user_999');
    expect(json.expires).toBe(new Date(expiresAt).toISOString());
  });
});
