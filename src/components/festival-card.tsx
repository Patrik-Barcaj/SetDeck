'use client';

import Link from 'next/link';
import { Tent, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function FestivalHubBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="w-full max-w-4xl mx-auto my-6 px-4"
    >
      <Link href="/festival" className="block group">
        <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#161820] to-[#0D0E12] p-6 shadow-[0_0_40px_rgba(245,158,11,0.1)] hover:shadow-[0_0_50px_rgba(245,158,11,0.2)] hover:border-amber-400/50 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left side */}
            <div className="flex flex-col gap-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 w-fit shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Tent className="w-3 h-3" />
                <span>Festival Mode</span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors">
                Festival Timetable Merge
              </h3>
            </div>

            {/* Right side CTA Button */}
            <div className="shrink-0">
              <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-setdrift-gold to-amber-400 text-black font-black text-xs md:text-sm flex items-center gap-2 group-hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <span>Create Timetable</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
