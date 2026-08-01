'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Library, Settings } from 'lucide-react';

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Search', href: '/', icon: Search },
    { name: 'Saved', href: '/saved', icon: Library },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-background/95 backdrop-blur-xl border-t border-border/30 z-[100] pb-safe flex justify-around items-center px-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? 'text-setdeck-gold' : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
