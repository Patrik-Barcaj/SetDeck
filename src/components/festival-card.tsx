'use client';

import Link from 'next/link';
import { Tent, ArrowRight, Calendar, Users, Music } from 'lucide-react';
import { motion } from 'framer-motion';

export function FestivalHubBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-4xl mx-auto my-6 px-4"
    >
      <Link href="/festival" className="block group">
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-zinc-950 p-6 md:p-8 shadow-[0_0_40px_rgba(245,158,11,0.12)] hover:shadow-[0_0_60px_rgba(245,158,11,0.22)] hover:border-amber-400/50 transition-all duration-300">
          {/* Subtle decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-setdrift-gold/10 rounded-full blur-3xl pointer-events-none group-hover:bg-setdrift-gold/15 transition-all duration-500" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-setdrift-gold/15 text-setdrift-gold border border-setdrift-gold/30 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Tent className="w-3.5 h-3.5" />
                <span>Festival Hub • Multi-Artist Merge</span>
              </div>

              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors mb-2">
                Building Your Festival Timetable?
              </h3>
              
              <p className="text-xs md:text-sm text-zinc-300 max-w-xl font-medium leading-relaxed mb-4">
                Select multiple artists, set their stage times, and merge them into one chronological warm-up playlist on Spotify.
              </p>

              {/* Feature Highlights */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Multi-Artist Lineup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-setdrift-gold" />
                  <span>Chronological Stages</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span>~50 min Festival Slots</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="shrink-0 flex items-center">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-setdrift-gold to-amber-400 text-black font-black text-xs md:text-sm flex items-center gap-2 group-hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <span>Create Festival Timetable</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
