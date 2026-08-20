'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface ClientSession {
  user: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
  accessToken: string | null;
  providerAccountId: string | null;
}

interface AuthContextType {
  data: ClientSession | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  update: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  data: null,
  status: 'loading',
  update: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [status, setStatus] = useState<'authenticated' | 'unauthenticated' | 'loading'>('loading');

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.accessToken) {
          setSession(data);
          setStatus('authenticated');
          return;
        }
      }
      setSession(null);
      setStatus('unauthenticated');
    } catch (e) {
      console.error('Session fetch error:', e);
      setSession(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <AuthContext.Provider value={{ data: session, status, update: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  return context;
}

export function signIn(provider?: string, returnTo?: string) {
  const currentPath = returnTo || window.location.pathname + window.location.search;
  window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(currentPath)}`;
}

export async function signOut(options?: { callbackUrl?: string }) {
  const target = options?.callbackUrl ? `?returnTo=${encodeURIComponent(options.callbackUrl)}` : '';
  window.location.href = `/api/auth/signout${target}`;
}
