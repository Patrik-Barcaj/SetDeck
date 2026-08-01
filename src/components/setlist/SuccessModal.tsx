'use client';

import { ExternalLink, Share2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface SuccessModalProps {
  url: string;
  imageUrl?: string;
  onClose: () => void;
}

export function SuccessModal({ url, imageUrl, onClose }: SuccessModalProps) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl overflow-hidden border border-border shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full transition-colors z-10 text-white"
        >
          <span className="w-5 h-5 flex items-center justify-center font-bold">X</span>
        </button>
        
        <div className="w-full aspect-square bg-muted relative">
          {imageUrl ? (
            <Image src={imageUrl} alt="Playlist Cover" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-spotify-green/20">
              <span className="text-6xl">🎵</span>
            </div>
          )}
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center">Playlist Created!</h2>
          <p className="text-center text-muted-foreground mb-4">
            Your live warm-up playlist is ready on Spotify.
          </p>
          
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-spotify-green text-black font-bold rounded-full flex items-center justify-center gap-2 hover:bg-spotify-green/90 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Open in Spotify
          </a>
          
          <button
            onClick={copyLink}
            className="w-full py-3 bg-secondary text-foreground font-bold rounded-full flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share Link
          </button>
        </div>
      </div>
    </div>
  );
}
