'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  X,
  ChevronRight,
  Calendar,
  ExternalLink,
  SlidersHorizontal,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface CitySuggestion {
  name: string;
  country: string;
  flag: string;
}

const GLOBAL_CITIES: CitySuggestion[] = [
  { name: 'Vienna', country: 'Austria', flag: '🇦🇹' },
  { name: 'Bratislava', country: 'Slovakia', flag: '🇸🇰' },
  { name: 'Prague', country: 'Czechia', flag: '🇨🇿' },
  { name: 'Brno', country: 'Czechia', flag: '🇨🇿' },
  { name: 'Budapest', country: 'Hungary', flag: '🇭🇺' },
  { name: 'Krakow', country: 'Poland', flag: '🇵🇱' },
  { name: 'Warsaw', country: 'Poland', flag: '🇵🇱' },
  { name: 'Berlin', country: 'Germany', flag: '🇩🇪' },
  { name: 'Munich', country: 'Germany', flag: '🇩🇪' },
  { name: 'Hamburg', country: 'Germany', flag: '🇩🇪' },
  { name: 'Frankfurt', country: 'Germany', flag: '🇩🇪' },
  { name: 'Cologne', country: 'Germany', flag: '🇩🇪' },
  { name: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Manchester', country: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Glasgow', country: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Dublin', country: 'Ireland', flag: '🇮🇪' },
  { name: 'Paris', country: 'France', flag: '🇫🇷' },
  { name: 'Lyon', country: 'France', flag: '🇫🇷' },
  { name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱' },
  { name: 'Brussels', country: 'Belgium', flag: '🇧🇪' },
  { name: 'Zurich', country: 'Switzerland', flag: '🇨🇭' },
  { name: 'Milan', country: 'Italy', flag: '🇮🇹' },
  { name: 'Rome', country: 'Italy', flag: '🇮🇹' },
  { name: 'Madrid', country: 'Spain', flag: '🇪🇸' },
  { name: 'Barcelona', country: 'Spain', flag: '🇪🇸' },
  { name: 'Lisbon', country: 'Portugal', flag: '🇵🇹' },
  { name: 'Copenhagen', country: 'Denmark', flag: '🇩🇰' },
  { name: 'Stockholm', country: 'Sweden', flag: '🇸🇪' },
  { name: 'Oslo', country: 'Norway', flag: '🇳🇴' },
  { name: 'Helsinki', country: 'Finland', flag: '🇫🇮' },
  { name: 'New York', country: 'United States', flag: '🇺🇸' },
  { name: 'Los Angeles', country: 'United States', flag: '🇺🇸' },
  { name: 'Chicago', country: 'United States', flag: '🇺🇸' },
  { name: 'Austin', country: 'United States', flag: '🇺🇸' },
  { name: 'Nashville', country: 'United States', flag: '🇺🇸' },
  { name: 'Seattle', country: 'United States', flag: '🇺🇸' },
  { name: 'San Francisco', country: 'United States', flag: '🇺🇸' },
  { name: 'Toronto', country: 'Canada', flag: '🇨🇦' },
  { name: 'Montreal', country: 'Canada', flag: '🇨🇦' },
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { name: 'Sydney', country: 'Australia', flag: '🇦🇺' },
  { name: 'Melbourne', country: 'Australia', flag: '🇦🇺' },
];

const POPULAR_HUBS = [
  'Vienna',
  'Bratislava',
  'Prague',
  'Budapest',
  'Berlin',
  'Munich',
  'London',
  'Paris',
  'Amsterdam',
  'New York',
  'Los Angeles',
  'Tokyo',
];

const RADIUS_OPTIONS = [25, 50, 100, 250, 400];

type TimeFilter = 'all' | 'upcoming' | 'week' | 'month';
type SortOption = 'date' | 'distance' | 'artist';

export default function RadarPage() {
  const router = useRouter();

  // Location and scanning state
  const [city, setCity] = useState('Vienna');
  const [searchInput, setSearchInput] = useState('');
  const [radius, setRadius] = useState<number>(100);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Data state
  const [concerts, setConcerts] = useState<ConcertEvent[]>([]);
  const [queriedCities, setQueriedCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  // In-page search and filtering
  const [cardFilter, setCardFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Autocomplete dropdown state
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const filteredSuggestions = useMemo(() => {
    if (!searchInput.trim()) return GLOBAL_CITIES.slice(0, 8);
    const query = searchInput.toLowerCase();
    return GLOBAL_CITIES.filter(
      (c) => c.name.toLowerCase().includes(query) || c.country.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchInput]);

  const fetchConcerts = useCallback(
    async (targetCity: string, userCoords?: { lat: number; lng: number } | null) => {
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
          setQueriedCities(data.queriedCities || [targetCity]);
          if (data.targetCity && !userCoords) {
            setCity(data.targetCity);
          }
        } else {
          toast.error('Failed to load concert radar');
        }
      } catch {
        toast.error('Network error loading concert radar');
      } finally {
        setIsLoading(false);
      }
    },
    [radius]
  );

  const displayedConcerts = useMemo(() => {
    let list = [...concerts];

    // Filter by card search keyword
    if (cardFilter.trim()) {
      const q = cardFilter.toLowerCase();
      list = list.filter(
        (c) =>
          c.artistName.toLowerCase().includes(q) ||
          c.venue.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          (c.genres && c.genres.some((g) => g.toLowerCase().includes(q)))
      );
    }

    // Filter by timeframe
    if (timeFilter === 'upcoming') {
      list = list.filter((c) => (c.daysUntil ?? 0) >= 0);
    } else if (timeFilter === 'week') {
      list = list.filter((c) => (c.daysUntil ?? -1) >= 0 && (c.daysUntil ?? 999) <= 7);
    } else if (timeFilter === 'month') {
      list = list.filter((c) => (c.daysUntil ?? -1) >= 0 && (c.daysUntil ?? 999) <= 30);
    }

    // Sort
    if (sortBy === 'distance') {
      list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else if (sortBy === 'artist') {
      list.sort((a, b) => a.artistName.localeCompare(b.artistName));
    } else {
      // By date
      list.sort((a, b) => {
        const aDays = a.daysUntil ?? -9999;
        const bDays = b.daysUntil ?? -9999;
        if (aDays >= 0 && bDays >= 0) return aDays - bDays;
        if (aDays >= 0 && bDays < 0) return -1;
        if (bDays >= 0 && aDays < 0) return 1;
        return bDays - aDays;
      });
    }

    return list;
  }, [concerts, cardFilter, timeFilter, sortBy]);

  useEffect(() => {
    fetchConcerts(city, coords);
  }, [city, radius, coords, fetchConcerts]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        toast.success('Radar synced with your GPS location!');
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
    setIsFocused(false);
  };

  const selectCitySuggestion = (selected: string) => {
    setCoords(null);
    setCity(selected);
    setSearchInput('');
    setIsFocused(false);
  };

  const handleGenerateWarmup = (concert: ConcertEvent) => {
    if (!concert.mbid) {
      toast.error('Artist identifier unavailable');
      return;
    }
    router.push(`/setlist/${concert.mbid}?artistName=${encodeURIComponent(concert.artistName)}`);
  };

  const formatCountdown = (days?: number) => {
    if (days === undefined) return null;
    if (days === 0) return { label: 'LIVE TONIGHT', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' };
    if (days === 1) return { label: 'TOMORROW', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    if (days > 1 && days <= 7) return { label: `IN ${days} DAYS`, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (days > 7 && days <= 30) return { label: `IN ${Math.round(days / 7)} WEEKS`, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    if (days > 30) return { label: `IN ${Math.round(days / 30)} MONTHS`, color: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60' };
    return { label: 'RECENT SHOW', color: 'bg-zinc-900/90 text-zinc-500 border-zinc-800' };
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-36 pt-4 px-4 max-w-5xl mx-auto">
      {/* Radar Scanning Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-950/60 via-card/95 to-background border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] mb-8">
        {/* Background Radar Animation Ring */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-20 hidden md:block">
          <div className="relative w-80 h-80 rounded-full border border-cyan-400 flex items-center justify-center">
            <div className="w-56 h-56 rounded-full border border-cyan-400/60 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-cyan-400/40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-cyan-400/30 animate-ping" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider border border-cyan-500/30">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Live Tour Radar</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 text-muted-foreground text-xs font-bold border border-border/50">
              <MapPin className="w-3 h-3 text-setdrift-gold" />
              <span>Active Hub: <strong className="text-white">{coords ? 'GPS Location' : city}</strong></span>
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-2">
            Live Concerts Radar
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Scan upcoming concerts and tour dates across your region. Tap any artist to instantly generate their predicted live setlist.
          </p>

          {/* Controls: Search, GPS, Radius */}
          <div className="mt-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* City Search Bar with Dropdown */}
            <div ref={dropdownRef} className="flex-1 relative">
              <form onSubmit={handleCitySearch} className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  placeholder={`Search global concert city (current: ${coords ? 'GPS' : city})...`}
                  className="w-full bg-zinc-900/90 text-white font-bold text-sm md:text-base placeholder:text-zinc-400 border-2 border-zinc-700/80 focus:border-setdrift-gold rounded-2xl pl-11 pr-10 py-3.5 focus:outline-none shadow-lg transition-all caret-setdrift-gold"
                />
                <Search className="w-5 h-5 text-setdrift-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* City Suggestions Dropdown */}
              <AnimatePresence>
                {isFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-border/80 rounded-2xl p-2 shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-border/20"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Featured Music Capitals
                    </div>
                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => selectCitySuggestion(item.name)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/80 text-left transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{item.flag}</span>
                            <span className="text-sm font-bold text-white group-hover:text-setdrift-gold transition-colors">
                              {item.name}
                            </span>
                            <span className="text-xs text-muted-foreground">({item.country})</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-setdrift-gold transition-colors" />
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        Press enter to scan &ldquo;{searchInput}&rdquo;
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* GPS Button */}
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={isLocating}
              className="px-5 py-3.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span>Use My GPS</span>
            </button>

            {/* Radius Switcher */}
            <div className="flex items-center bg-zinc-900/90 p-1 rounded-2xl border border-border/60 text-xs font-bold shrink-0">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`px-2.5 py-2 rounded-xl transition-all ${
                    radius === r
                      ? 'bg-setdrift-gold text-black font-extrabold shadow-sm'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Filter Hub Chips */}
          <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-border/30">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase mr-1">
              Capitals:
            </span>
            {POPULAR_HUBS.map((c) => (
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
      </div>

      {/* Discovered Concerts Section */}
      <div className="space-y-4">
        {/* Results Header & Real-time Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/40 border border-border/40 p-4 rounded-2xl">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Discovered Tour Dates ({displayedConcerts.length}{concerts.length !== displayedConcerts.length ? ` of ${concerts.length}` : ''})
              </h3>
              {isLoading && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
            </div>
            {queriedCities.length > 0 && (
              <p className="text-[11px] text-cyan-400 font-medium mt-0.5">
                Scanning radius ({radius} km): {queriedCities.join(' • ')}
              </p>
            )}
          </div>

          {/* In-page Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Text Filter */}
            <div className="relative min-w-[160px] flex-1 sm:flex-none">
              <input
                type="text"
                value={cardFilter}
                onChange={(e) => setCardFilter(e.target.value)}
                placeholder="Filter artist/venue..."
                className="w-full bg-zinc-900/90 text-white text-xs font-medium placeholder:text-zinc-500 border border-border/60 rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-setdrift-gold"
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              {cardFilter && (
                <button
                  type="button"
                  onClick={() => setCardFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Timeframe Filter */}
            <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-border/60 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  timeFilter === 'all' ? 'bg-secondary text-white' : 'text-muted-foreground hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('upcoming')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  timeFilter === 'upcoming' ? 'bg-secondary text-white' : 'text-muted-foreground hover:text-white'
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('month')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  timeFilter === 'month' ? 'bg-secondary text-white' : 'text-muted-foreground hover:text-white'
                }`}
              >
                &le; 30 Days
              </button>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-border/60 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSortBy('date')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  sortBy === 'date' ? 'bg-setdrift-gold/20 text-setdrift-gold' : 'text-muted-foreground hover:text-white'
                }`}
                title="Sort by Date"
              >
                <Calendar className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setSortBy('distance')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  sortBy === 'distance' ? 'bg-setdrift-gold/20 text-setdrift-gold' : 'text-muted-foreground hover:text-white'
                }`}
                title="Sort by Distance"
              >
                <Compass className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setSortBy('artist')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  sortBy === 'artist' ? 'bg-setdrift-gold/20 text-setdrift-gold' : 'text-muted-foreground hover:text-white'
                }`}
                title="Sort Alphabetically"
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Concert Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 bg-card/40 border border-border/40 rounded-3xl animate-pulse p-5 flex flex-col justify-between"
              />
            ))}
          </div>
        ) : displayedConcerts.length === 0 ? (
          <div className="text-center py-16 bg-card/30 rounded-3xl border border-border/40 p-8">
            <Music2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">No matching concerts found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
              {cardFilter
                ? 'Try clearing the text search filter or changing the timeframe filter.'
                : 'Try expanding your radar range to 250 km or 400 km to cover surrounding regional venues.'}
            </p>
            <div className="flex justify-center gap-3">
              {cardFilter && (
                <button
                  type="button"
                  onClick={() => setCardFilter('')}
                  className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/80"
                >
                  Clear Filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setRadius(400)}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30"
              >
                Expand to 400 km
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedConcerts.map((concert, idx) => {
              const countdown = formatCountdown(concert.daysUntil);

              return (
                <motion.div
                  key={concert.id + idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                  className="bg-card/70 backdrop-blur-md border border-border/60 hover:border-setdrift-gold/40 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-[0_0_30px_rgba(244,168,54,0.12)] transition-all group"
                >
                  {/* Top Details */}
                  <div className="flex items-start gap-3.5">
                    {concert.artistImageUrl ? (
                      <img
                        src={concert.artistImageUrl}
                        alt={concert.artistName}
                        className="w-16 h-16 rounded-2xl object-cover border border-border/60 shrink-0 shadow-md group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-black border border-border flex items-center justify-center text-setdrift-gold font-black text-xl shrink-0">
                        {concert.artistName.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Artist Name & Countdown Tag */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-black text-white truncate group-hover:text-setdrift-gold transition-colors">
                          {concert.artistName}
                        </h4>
                        {countdown && (
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${countdown.color}`}
                          >
                            {countdown.label}
                          </span>
                        )}
                      </div>

                      {/* Date & Distance Info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-zinc-300">
                          <Calendar className="w-3.5 h-3.5 text-setdrift-gold shrink-0" />
                          {concert.formattedDate || concert.date}
                        </span>
                        {concert.distanceKm !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-cyan-300 border border-cyan-500/20 font-bold">
                            {concert.distanceKm === 0 ? 'Local' : `${concert.distanceKm} km`}
                          </span>
                        )}
                      </div>

                      {/* Venue & Location */}
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

                  {/* Bottom One-Tap Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => handleGenerateWarmup(concert)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-setdrift-gold/20 via-setdrift-gold/10 to-transparent hover:bg-setdrift-gold hover:text-black border border-setdrift-gold/40 text-setdrift-gold font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Warm-Up</span>
                    </button>
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(concert.artistName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-muted-foreground hover:text-white border border-border/60 transition-colors"
                      title="Search Artist on Spotify"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
