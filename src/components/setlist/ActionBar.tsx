'use client';

import { useSetlistStore } from '@/hooks/useSetlistStore';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useSession, signIn } from '@/lib/auth-client';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SuccessModal } from './SuccessModal';

export function ActionBar() {
  const { data, tracks } = useSetlistStore();
  const activeTracks = tracks.filter((t) => !t.excluded);
  const { settings } = useAppSettings();
  const { addSearch } = useRecentSearches();
  const { data: session } = useSession();

  const [isExporting, setIsExporting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [successData, setSuccessData] = useState<{ url: string; imageUrl?: string } | null>(null);

  useEffect(() => {
    if (settings?.playlistVisibility) {
      setIsPublic(settings.playlistVisibility === 'public');
    }
  }, [settings?.playlistVisibility]);

  const handleExport = async () => {
    if (!data || activeTracks.length === 0) {
      toast.error('No tracks available to export');
      return;
    }

    if (!session?.accessToken) {
      toast.info('Please sign in to Spotify to create playlists');
      signIn('spotify');
      return;
    }

    setIsExporting(true);
    
    try {
      const res = await fetch('/api/setlist/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: data.artistName,
          tourName: data.tourName,
          tracks: activeTracks,
          isPublic,
        }),
      });
      
      const resData = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || resData.needReauth) {
          toast.error('Spotify write permissions needed. Reconnecting Spotify...', {
            action: {
              label: 'Grant Access',
              onClick: () => signIn('spotify'),
            },
          });
          setTimeout(() => signIn('spotify'), 1500);
          return;
        }
        throw new Error(resData.error || 'Failed to export playlist to Spotify');
      }

      // Save to recent setlists
      addSearch({
        id: data.mbid,
        name: data.artistName,
        imageUrl: resData.imageUrl,
      });

      setSuccessData({
        url: resData.url,
        imageUrl: resData.imageUrl,
      });

      toast.success('Playlist successfully created on Spotify!', {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      });
    } catch (e: unknown) {
      console.error('Export error:', e);
      const errMsg = e instanceof Error ? e.message : 'Failed to export playlist';
      toast.error(errMsg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-[90px] left-0 right-0 p-4 md:p-6 z-40 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-center justify-center md:justify-end gap-4 pointer-events-auto">
          <div className="hidden md:flex flex-col gap-1 text-right mr-4 bg-background/90 p-2.5 rounded-xl border border-border/50 backdrop-blur-md shadow-lg">
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{activeTracks.length}</span> tracks ready
            </p>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-setdrift-gold cursor-pointer"
              />
              Make playlist public
            </label>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || activeTracks.length === 0}
            className="flex-1 md:flex-none w-full md:w-96 bg-gradient-to-r from-setdrift-gold via-amber-400 to-amber-300 text-black font-black text-sm md:text-base py-4 px-8 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(244,168,54,0.35)] hover:shadow-[0_0_50px_rgba(244,168,54,0.6)] cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>GENERATING PLAYLIST...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>EXPORT TO SPOTIFY</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {successData && (
        <SuccessModal 
          url={successData.url} 
          imageUrl={successData.imageUrl} 
          onClose={() => setSuccessData(null)} 
        />
      )}
    </>
  );
}
