'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSetlistStore } from '@/hooks/useSetlistStore';
import { getOfflineSetlist } from '@/utils/offlineStorage';
import { SetlistHeader } from '@/components/setlist/SetlistHeader';
import { TrackList } from '@/components/setlist/TrackList';
import { ActionBar } from '@/components/setlist/ActionBar';
import { TrackSkeleton } from '@/components/shared/TrackSkeleton';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SetlistStudio() {
  const params = useParams();
  const searchParams = useSearchParams();
  const mbid = params.mbid as string;
  const artistNameParam = searchParams.get('artistName') || searchParams.get('artist') || '';
  const { setData } = useSetlistStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    async function loadSetlist() {
      if (!mbid) return;

      // Check offline cache first for instant responsiveness
      const offlineCached = getOfflineSetlist(mbid);
      if (offlineCached) {
        setData(offlineCached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const query = artistNameParam ? `?artistName=${encodeURIComponent(artistNameParam)}` : '';
        const res = await fetch(`/api/setlist/${mbid}${query}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to load setlist data');
        }
        const data = await res.json();
        setData(data);
        setIsOfflineMode(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (offlineCached) {
          setIsOfflineMode(true);
          toast.info('Using offline cached setlist', {
            icon: <WifiOff className="w-4 h-4 text-amber-400" />,
          });
        } else {
          setError(message);
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadSetlist();
  }, [mbid, artistNameParam, setData]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background relative">
      {isLoading ? (
        <div className="w-full max-w-4xl mx-auto px-6 py-16">
          <div className="h-32 bg-muted rounded-3xl mb-8 animate-pulse"></div>
          {Array.from({ length: 15 }).map((_, i) => (
            <TrackSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {isOfflineMode && (
            <div className="w-full max-w-4xl mx-auto px-6 pt-3">
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl px-4 py-2 flex items-center justify-between text-amber-300 text-xs">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Offline Mode • Viewing locally saved warm-up setlist</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">Offline</span>
              </div>
            </div>
          )}
          <SetlistHeader />
          <TrackList />
          <ActionBar />
        </>
      )}
    </div>
  );
}

