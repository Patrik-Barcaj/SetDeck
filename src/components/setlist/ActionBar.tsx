'use client';

import { useSetlistStore } from '@/hooks/useSetlistStore';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { SuccessModal } from './SuccessModal';

export function ActionBar() {
  const { data, tracks } = useSetlistStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [successData, setSuccessData] = useState<{ url: string; imageUrl?: string } | null>(null);

  const handleExport = async () => {
    if (!data || tracks.length === 0) return;
    setIsExporting(true);
    
    try {
      const res = await fetch('/api/setlist/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: data.artistName,
          tourName: data.tourName,
          tracks: tracks,
          isPublic,
        }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          // Need to sign in
          toast.error("Please sign in to Spotify first");
          signIn('spotify');
          return;
        }
        throw new Error('Export failed');
      }
      
      const result = await res.json();
      setSuccessData({
        url: result.url,
        imageUrl: result.imageUrl
      });
      toast.success("Playlist created successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export playlist");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-[90px] left-0 right-0 p-4 md:p-6 z-40 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-center justify-center md:justify-end gap-4 pointer-events-auto">
          <div className="hidden md:flex flex-col gap-1 text-right mr-4 bg-background/80 p-2 rounded-lg backdrop-blur-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{tracks.length}</span> tracks ready
            </p>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-setdeck-gold"
              />
              Make playlist public
            </label>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || tracks.length === 0}
            className="flex-1 md:flex-none w-full md:w-96 bg-gradient-to-r from-setdeck-gold to-amber-400 text-black font-extrabold text-lg py-4 px-8 rounded-full hover:from-amber-400 hover:to-amber-300 transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(244,168,54,0.4)] hover:shadow-[0_0_50px_rgba(244,168,54,0.6)] animate-glow-pulse"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                EXPORTING...
              </>
            ) : (
              'EXPORT TO SPOTIFY'
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
