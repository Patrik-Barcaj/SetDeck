import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SetDrift',
  description: 'Convert Setlist.fm concerts to Spotify playlists.',
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/logo.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', url: '/icon-192.svg' },
  ],
  themeColor: '#0D0E12',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <Providers>
          <TopHeader />
          <main className="pt-14 pb-[80px] min-h-screen">
            {children}
          </main>
          <BottomNavigation />
          <Toaster theme="dark" position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
