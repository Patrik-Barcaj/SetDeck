import { Redis } from '@upstash/redis';

function getClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || !url.startsWith('https')) {
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (e) {
    console.warn('Failed to initialize Upstash Redis:', e);
    return null;
  }
}

export const redis = {
  get: async <T = unknown>(key: string): Promise<T | null> => {
    const client = getClient();
    if (!client) return null;
    try {
      return await client.get<T>(key);
    } catch (err) {
      console.warn('Redis GET error:', err);
      return null;
    }
  },
  set: async (key: string, value: unknown, opts?: { ex?: number }): Promise<unknown> => {
    const client = getClient();
    if (!client) return null;
    try {
      if (opts?.ex) {
        return await client.set(key, value, { ex: opts.ex });
      }
      return await client.set(key, value);
    } catch (err) {
      console.warn('Redis SET error:', err);
      return null;
    }
  },
};

