'use client';

import { useSession, signIn, signOut } from '@/lib/auth-client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, LogOut, Disc, LogIn } from 'lucide-react';

export function TopHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === '/';
  const title = isHome ? 'SetDeck' : pathname.startsWith('/setlist/') ? 'Setlist Studio' : pathname === '/saved' ? 'Saved Setlists' : pathname === '/settings' ? 'Settings' : 'SetDeck';

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-background/90 backdrop-blur-lg border-b border-border/40 z-50 flex items-center justify-between px-4">
      <div className="flex items-center w-1/3">
        {!isHome ? (
          <button onClick={() => router.back()} className="p-2 -ml-2 text-muted-foreground hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2 text-setdeck-gold font-bold">
            <Disc className="w-5 h-5 animate-[spin_4s_linear_infinite]" />
          </Link>
        )}
      </div>

      <div className="flex-1 flex justify-center text-center w-1/3">
        <h1 className="text-sm font-bold tracking-wider truncate">{title}</h1>
      </div>

      <div className="flex justify-end w-1/3 items-center gap-2">
        {session ? (
          <div className="flex items-center gap-3 group relative cursor-pointer">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="absolute right-0 top-10 bg-destructive text-destructive-foreground text-xs px-3 py-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity whitespace-nowrap flex items-center gap-2"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
            {session.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center border border-border">
                <span className="text-[10px] font-bold">{session.user?.name?.[0] || 'U'}</span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn('spotify')}
            className="text-xs font-semibold text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
}
