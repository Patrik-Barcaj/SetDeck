'use client';

import { useState } from 'react';
import { AlbumBreakdownItem, EraBreakdownItem } from '@/types';
import { Disc3, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AlbumEraBreakdownProps {
  albumBreakdown?: AlbumBreakdownItem[];
  eraBreakdown?: EraBreakdownItem[];
}

export function AlbumEraBreakdown({
  albumBreakdown = [],
  eraBreakdown = [],
}: AlbumEraBreakdownProps) {
  const [viewMode, setViewMode] = useState<'era' | 'album'>('era');

  if (albumBreakdown.length === 0 && eraBreakdown.length === 0) {
    return null;
  }

  const items = viewMode === 'era' ? eraBreakdown : albumBreakdown;

  return (
    <div className="w-full bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-4 my-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-setdrift-gold/15 border border-setdrift-gold/30 flex items-center justify-center text-setdrift-gold">
            {viewMode === 'era' ? <Sparkles className="w-3.5 h-3.5" /> : <Disc3 className="w-3.5 h-3.5" />}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {viewMode === 'era' ? 'Era & Catalog Distribution' : 'Album Breakdown'}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {viewMode === 'era'
                ? 'Balanced blend of new material, classics, and rarities'
                : 'Share of setlist per studio album'}
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-secondary/80 p-0.5 rounded-xl border border-border/40 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('era')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewMode === 'era'
                ? 'bg-setdrift-gold text-black font-bold shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            By Era
          </button>
          <button
            type="button"
            onClick={() => setViewMode('album')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewMode === 'album'
                ? 'bg-setdrift-gold text-black font-bold shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            By Album
          </button>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="w-full h-3 bg-secondary/80 rounded-full overflow-hidden flex gap-0.5 p-0.5 shadow-inner mb-3">
        {items.map((item, idx) => (
          <motion.div
            key={item.name}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(item.percentage, 4)}%` }}
            transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
            className="h-full rounded-full relative group cursor-pointer"
            style={{ backgroundColor: item.color }}
            title={`${item.name}: ${item.percentage}% (${item.count} songs)`}
          />
        ))}
      </div>

      {/* Legend & Details */}
      <div className="flex flex-wrap gap-2 pt-1">
        {items.map((item) => (
          <div
            key={item.name}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/40 border border-border/30 text-xs hover:bg-secondary/70 transition-colors"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-white max-w-[140px] truncate">
              {item.name}
            </span>
            {'year' in item && item.year && (
              <span className="text-[10px] text-muted-foreground">({item.year})</span>
            )}
            <span className="text-[11px] font-bold text-muted-foreground">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
