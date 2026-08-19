'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConcertEvent } from '@/types';
import {
  Compass,
  MapPin,
  Sparkles,
  Search,
  Navigation,
  Loader2,
  Music2,
  Building2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const POPULAR_CITIES = ['London', 'New York', 'Berlin', 'Paris', 'Los Angeles', 'Amsterdam', 'Prague', 'Tokyo'];

export default function RadarPage() {
  const router = useRouter();

  const [city, setCity] = useState('London');
  const [searchInput, setSearchInput] = useState('');
  const [radius, setRadius] = useState<number>(50);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [concerts, setConcerts] = useState<ConcertEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  const fetchConcerts = useCallback(async (targetCity: string, userCoords?: { lat: number; lng: number } | null) => {
    setIsLoading(true);
    try {
      let query = `?radius=${radius}`;
      if (userCoords) {
        query += `&lat=${userCoords.lat}&lng=${userCoords.lng}`;
      } else {
        query += `&city=${encodeURIComponent(targetCity)}`;
      }

      const res = await fetch(`/api/concerts/radar${query}`);
      if (res.ok) {
        const data = await res.json();
        setConcerts(data.concerts || []);
        if (data.targetCity && !userCoords) {
          setCity(data.targetCity);
        }
      }
    } catch {
      toast.error('Failed to load concert radar');
    } finally {
      setIsLoading(false);
    }
  }, [radius]);

  useEffect(() => {
    fetchConcerts(city, coords);
  }, [city, radius, coords, fetchConcerts]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
        toast.success('Found nearby concerts based on your location!');
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Location access denied: ${err.message}`);
      },
      { timeout: 10000 }
    );
  };

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setCoords(null);
    setCity(searchInput.trim());
    setSearchInput('');
  };

  const handleGenerateWarmup = (concert: ConcertEvent) => {
    if (!concert.mbid) {
      toast.error('Artist identifier unavailable');
      return;
    }
    router.push(`/setlist/${concert.mbid}?artistName=${encodeURIComponent(concert.artistName)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-36 pt-4 px-4 max-w-4xl mx-auto">
      {/* Radar Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-950/40 via-card/80 to-background border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.12)] mb-8">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider w-fit mb-3 border border-cyan-500/30">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Location Radar</span>
        </div>

        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-2">
          Concerts Near Me
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Discover live tour dates near your city or venue, and instantly generate a warm-up playlist before the show.
        </p>

        {/* Controls: Search, GPS, Radius */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* City Search */}
          <form onSubmit={handleCitySearch} className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search city (current: ${city})...`}
              className="w-full bg-secondary/80 border border-border/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-setdrift-gold shadow-inner"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          </form>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={isLocating}
            className="px-5 py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>Use My GPS</span>
          </button>

          {/* Radius Selector */}
          <div className="flex items-center bg-secondary/80 p-1 rounded-2xl border border-border/40 text-xs font-bold">
            {[25, 50, 100].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`px-3 py-2 rounded-xl transition-all ${
                  radius === r
                    ? 'bg-setdrift-gold text-black shadow-sm'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Popular City Quick-Filter Tags */}
        <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-border/30">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Popular:</span>
          {POPULAR_CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCoords(null);
                setCity(c);
              }}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                city.toLowerCase() === c.toLowerCase() && !coords
                  ? 'bg-setdrift-gold/20 text-setdrift-gold border-setdrift-gold/40 font-bold'
                  : 'bg-secondary/40 text-muted-foreground border-border/40 hover:text-white hover:bg-secondary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Concerts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Discovered Tour Dates near {city} ({concerts.length})
          </h3>
          <span className="text-xs text-muted-foreground">
            Within {radius} km
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 bg-card/50 border border-border/40 rounded-3xl animate-pulse p-4" />
            ))}
          </div>
        ) : concerts.length === 0 ? (
          <div className="text-center py-16 bg-card/30 rounded-3xl border border-border/40 p-8">
            <Music2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">No upcoming concerts found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Try increasing your radar radius to 100 km or searching for a major nearby hub city.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concerts.map((concert, idx) => (
              <motion.div
                key={concert.id + idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-card/70 backdrop-blur-md border border-border/60 hover:border-setdrift-gold/40 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-[0_0_30px_rgba(244,168,54,0.12)] transition-all group"
              >
                {/* Top Info */}
                <div className="flex items-start gap-3.5">
                  {concert.artistImageUrl ? (
                    <img
                      src={concert.artistImageUrl}
                      alt={concert.artistName}
                      className="w-14 h-14 rounded-2xl object-cover border border-border/60 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-black border border-border flex items-center justify-center text-setdrift-gold font-black text-lg shrink-0">
                      {concert.artistName.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-black text-white truncate group-hover:text-setdrift-gold transition-colors">
                        {concert.artistName}
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/40 shrink-0">
                        {concert.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{concert.venue}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">
                        {concert.city}, {concert.country}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom One-Tap Action */}
                <button
                  type="button"
                  onClick={() => handleGenerateWarmup(concert)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-setdrift-gold/20 via-setdrift-gold/10 to-transparent hover:bg-setdrift-gold hover:text-black border border-setdrift-gold/40 text-setdrift-gold font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Warm-Up Playlist</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
