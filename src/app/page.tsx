'use client';

import { SearchBar } from '@/components/shared/SearchBar';
import { MyStagePocket } from '@/components/my-pocket';
import { TrendingTours } from '@/components/trending-tours';
import { FestivalHubBanner } from '@/components/festival-card';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pt-10 pb-20 relative overflow-x-hidden bg-[#0D0E12]"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)',
      }}
    >
      {/* Hero Section & Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl mx-auto flex flex-col items-center text-center px-4 pt-4 pb-4 z-10"
      >
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 text-white">
          Prepare for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-amber-300">Show</span>.
        </h1>

        {/* Search Bar */}
        <div className="w-full mb-4">
          <SearchBar />
        </div>
      </motion.div>

      {/* 1. My Stage Pocket (Renders only if items exist) */}
      <MyStagePocket />

      {/* 2. Festival Pass VIP Banner */}
      <FestivalHubBanner />

      {/* 3. Trending Tours Visual Grid */}
      <TrendingTours />
    </div>
  );
}
