'use client';

import { useState } from 'react';
import { ExternalLink, Share2, Check, Smartphone, Music, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SuccessModalProps {
  url: string;
  playlistId?: string;
  playlistName?: string;
  tracksCount?: number;
  imageUrl?: string;
  onClose: () => void;
}

export function SuccessModal({
  url,
  playlistId,
  playlistName,
  tracksCount,
  imageUrl,
  onClose,
}: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  // Derive deep link ID if not explicitly passed
  const extractedId = playlistId || url.split('/playlist/')[1]?.split('?')[0] || '';
  const appDeepLink = extractedId ? `spotify:playlist:${extractedId}` : url;

  const copyLink = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: playlistName || 'Live Warm-Up Setlist',
          text: `Check out my live warm-up setlist on Spotify: ${playlistName}`,
          url,
        });
        toast.success('Shared successfully!');
        return;
      } catch {
        // Fall back to clipboard if user dismissed or share failed
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Playlist link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md bg-card/95 backdrop-blur-xl border border-setdrift-gold/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(244,168,54,0.18)] overflow-hidden z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-setdrift-gold/15 text-setdrift-gold border border-setdrift-gold/30 shadow-[0_0_15px_rgba(244,168,54,0.2)]">
              <Sparkles className="w-3.5 h-3.5" />
              Playlist Created Successfully
            </span>
          </div>

          {/* Artwork & Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-border/80 mb-4 group">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={playlistName || 'Playlist Cover'}
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black text-setdrift-gold">
                  <Music className="w-12 h-12 mb-1 opacity-80" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-black tracking-tight text-white line-clamp-1">
              {playlistName || 'Live Warm-Up Setlist'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {tracksCount ? `${tracksCount} tracks exported` : 'Ready to stream'} • Synced to your Spotify account
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            {/* Primary CTA: Open in Spotify App */}
            <a
              href={appDeepLink}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all cursor-pointer active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open in Spotify App</span>
            </a>

            {/* Secondary CTA: Open in Web Player */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-5 bg-secondary/80 hover:bg-secondary text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-border/60 hover:border-border transition-all cursor-pointer active:scale-[0.98]"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Open in Web Player</span>
            </a>

            {/* Quick Action: Copy Share Link */}
            <button
              onClick={copyLink}
              type="button"
              className="w-full py-2.5 px-4 bg-transparent hover:bg-secondary/40 text-xs font-semibold text-muted-foreground hover:text-white rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Share Link</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

