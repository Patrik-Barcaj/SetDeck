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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
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
