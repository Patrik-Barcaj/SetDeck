'use client';

import { useState } from 'react';
import { useSession, signIn } from '@/lib/auth-client';
import { FestivalArtistSlot, AggregatedTrack, ArtistResult } from '@/types';
import { TrackCard } from '@/components/setlist/TrackCard';
import { SuccessModal } from '@/components/setlist/SuccessModal';
import {
  Tent,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Search,
  ArrowDown,
  ArrowUp,
  Share2,
  Music,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FestivalPage() {
  const { data: session } = useSession();

  const [festivalName, setFestivalName] = useState('Summer Festival 2026 Warm-Up');
  const [slots, setSlots] = useState<FestivalArtistSlot[]>([
    {
      artistMbid: '65f4f0c5-ef9e-490c-aee3-909e7f6b2e4f',
      artistName: 'Metallica',
      stageName: 'Main Stage',
      startTime: '21:30',
      endTime: '23:30',
      trackCount: 12,
    },
    {
      artistMbid: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
      artistName: 'Radiohead',
      stageName: 'Main Stage',
      startTime: '19:00',
      endTime: '20:30',
      trackCount: 8,
    },
  ]);

  // Search state for adding new artists
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArtistResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Merge state
  const [isMerging, setIsMerging] = useState(false);
  const [mergedTracks, setMergedTracks] = useState<AggregatedTrack[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ url: string; id: string; name: string } | null>(null);

  // Search handler
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/setlist/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.artists || []);
        setShowDropdown(true);
      }
    } catch {
      // Ignore search error
    } finally {
      setIsSearching(false);
    }
  };

  const addArtistSlot = (artist: ArtistResult) => {
    if (slots.some((s) => s.artistMbid === artist.id || s.artistMbid === artist.mbid)) {
      toast.info(`${artist.name} is already in the lineup`);
      setShowDropdown(false);
      setSearchQuery('');
      return;
    }

    const newSlot: FestivalArtistSlot = {
      artistMbid: artist.mbid || artist.id,
      artistName: artist.name,
      imageUrl: artist.images?.[0]?.url,
      stageName: 'Main Stage',
      startTime: '18:00',
      trackCount: 8,
    };

    setSlots((prev) => [...prev, newSlot]);
    setShowDropdown(false);
    setSearchQuery('');
    toast.success(`Added ${artist.name} to lineup`);
  };

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateSlot = (index: number, updates: Partial<FestivalArtistSlot>) => {
    setSlots((prev) => prev.map((s, idx) => (idx === index ? { ...s, ...updates } : s)));
  };

  const moveSlot = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === slots.length - 1)) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const copy = [...slots];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSlots(copy);
  };

  const handleGenerateMerge = async () => {
    if (slots.length === 0) {
      toast.error('Add at least one artist to the lineup');
      return;
    }

    setIsMerging(true);
    setMergedTracks([]);

    try {
      const res = await fetch('/api/festival/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalName,
          slots,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Merge failed');
      }

      const data = await res.json();
      setMergedTracks(data.tracks || []);
      toast.success(`Generated ${data.totalTracks} warm-up tracks across ${slots.length} artists!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to merge festival timetable';
      toast.error(message);
    } finally {
      setIsMerging(false);
    }
  };

  const handleExportSpotify = async () => {
    if (!session?.accessToken) {
      signIn('spotify');
      return;
    }

    if (mergedTracks.length === 0) {
      toast.error('Generate the merged setlist first');
      return;
    }

    setIsExporting(true);
    try {
      const trackUris = mergedTracks
        .filter((t) => !t.excluded && t.spotifyUri)
        .map((t) => t.spotifyUri as string);

      const res = await fetch('/api/setlist/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: festivalName,
          tracks: mergedTracks,
          trackUris,
          tourName: 'Festival Timetable Warm-Up',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }

      const playlistData = await res.json();
      setExportResult({
        url: playlistData.url,
        id: playlistData.id,
        name: playlistData.name,
      });
      toast.success('Festival playlist created on Spotify!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const totalSelectedSongs = slots.reduce((acc, s) => acc + (s.trackCount || 8), 0);
  const estimatedHours = Math.floor((totalSelectedSongs * 3.8) / 60);
  const estimatedMinutes = Math.round((totalSelectedSongs * 3.8) % 60);

  return (
    <div className="min-h-screen bg-background text-foreground pb-36 pt-4 px-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/40 via-card/80 to-background border border-purple-500/30 p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.12)] mb-8">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-wider w-fit mb-3 border border-purple-500/30">
          <Tent className="w-3.5 h-3.5" />
          <span>Festival Mode</span>
        </div>

        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-2">
          Multi-Artist Timetable Merge
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Build your custom festival warm-up playlist. Add artists, set their scheduled stage times, and merge their predicted setlists into one chronological warm-up soundtrack.
        </p>

        {/* Festival Name Input */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Playlist Title
            </label>
            <input
              type="text"
              value={festivalName}
              onChange={(e) => setFestivalName(e.target.value)}
              placeholder="e.g. Glastonbury 2026 Warm-Up"
              className="w-full bg-secondary/80 border border-border/60 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-setdrift-gold"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold pt-2 md:pt-6">
            <div className="flex items-center gap-1.5 bg-secondary/60 px-3 py-2 rounded-xl border border-border/40">
              <Music className="w-4 h-4 text-setdrift-gold" />
              <span>{totalSelectedSongs} Songs Budgeted</span>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary/60 px-3 py-2 rounded-xl border border-border/40">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>~{estimatedHours > 0 ? `${estimatedHours}h ` : ''}{estimatedMinutes}m Playtime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Search & Add */}
      <div className="relative mb-6">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
          Add Artist to Festival Lineup
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search artist name (e.g. Metallica, Arctic Monkeys, Dua Lipa)..."
            className="w-full bg-secondary/60 border border-border/60 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-setdrift-gold shadow-inner"
          />
          <Search className="w-5 h-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-setdrift-gold animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-2 shadow-2xl z-50 max-h-64 overflow-y-auto">
            {searchResults.map((artist) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => addArtistSlot(artist)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/80 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {artist.images?.[0]?.url ? (
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-setdrift-gold">
                      {artist.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-bold text-white block group-hover:text-setdrift-gold transition-colors">
                      {artist.name}
                    </span>
                    {artist.genres?.length > 0 && (
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {artist.genres.slice(0, 2).join(' • ')}
                      </span>
                    )}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-setdrift-gold transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lineup Timetable Builder List */}
      <div className="space-y-3 mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Lineup Schedule & Track Budgets ({slots.length} Artists)
        </h3>

        {slots.map((slot, index) => (
          <div
            key={slot.artistMbid + index}
            className="bg-card/70 backdrop-blur-md border border-border/60 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
          >
            {/* Artist Info & Reorder */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveSlot(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded bg-secondary/60 hover:bg-secondary text-muted-foreground disabled:opacity-20 transition-colors"
                  title="Move earlier"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSlot(index, 'down')}
                  disabled={index === slots.length - 1}
                  className="p-1 rounded bg-secondary/60 hover:bg-secondary text-muted-foreground disabled:opacity-20 transition-colors"
                  title="Move later"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>

              <div>
                <h4 className="text-base font-black text-white">{slot.artistName}</h4>
                <span className="text-[10px] text-purple-300 font-bold bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-500/30">
                  Slot #{index + 1}
                </span>
              </div>
            </div>

            {/* Stage & Time inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  Stage
                </label>
                <input
                  type="text"
                  value={slot.stageName || ''}
                  onChange={(e) => updateSlot(index, { stageName: e.target.value })}
                  placeholder="Main Stage"
                  className="w-full bg-secondary/80 border border-border/50 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-setdrift-gold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  Time Slot
                </label>
                <input
                  type="text"
                  value={slot.startTime || ''}
                  onChange={(e) => updateSlot(index, { startTime: e.target.value })}
                  placeholder="20:00"
                  className="w-full bg-secondary/80 border border-border/50 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-setdrift-gold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  Songs ({slot.trackCount})
                </label>
                <select
                  value={slot.trackCount}
                  onChange={(e) => updateSlot(index, { trackCount: parseInt(e.target.value, 10) })}
                  className="w-full bg-secondary/80 border border-border/50 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-setdrift-gold font-bold"
                >
                  <option value={4}>4 Songs (Opening Act)</option>
                  <option value={6}>6 Songs (~25 min)</option>
                  <option value={8}>8 Songs (~35 min)</option>
                  <option value={10}>10 Songs (~45 min)</option>
                  <option value={12}>12 Songs (~55 min)</option>
                  <option value={15}>15 Songs (Headline)</option>
                </select>
              </div>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeSlot(index)}
              className="p-2 rounded-xl bg-secondary/40 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors self-end md:self-center"
              title="Remove artist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Action CTA to merge */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <button
          type="button"
          onClick={handleGenerateMerge}
          disabled={isMerging || slots.length === 0}
          className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
        >
          {isMerging ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing & Merging Setlists...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Generate Timetable Warm-Up Playlist</span>
            </>
          )}
        </button>
      </div>

      {/* Merged Setlist Result View */}
      {mergedTracks.length > 0 && (
        <div className="bg-card/40 border border-border/50 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Ready to Stream
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {festivalName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mergedTracks.length} tracks • {slots.length} artists in chronological stage order
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportSpotify}
              disabled={isExporting}
              className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Share2 className="w-4 h-4 text-black" />
              )}
              <span>Export to Spotify</span>
            </button>
          </div>

          {/* Render Tracks grouped by Artist / Stage Section */}
          <div className="divide-y divide-border/20 pt-4">
            {mergedTracks.map((track, idx) => {
              const currentSection = track.section || 'Festival Set';
              const prevSection = idx > 0 ? mergedTracks[idx - 1].section : null;
              const isNewSection = idx === 0 || currentSection !== prevSection;

              return (
                <div key={track.id + idx}>
                  {isNewSection && (
                    <div className={`${idx === 0 ? 'pt-2' : 'pt-8'} pb-3 flex items-center justify-between`}>
                      <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        🎪 {currentSection}
                      </span>
                      <div className="h-px flex-1 ml-4 bg-gradient-to-r from-purple-500/30 to-transparent" />
                    </div>
                  )}
                  <TrackCard
                    track={track}
                    onRemove={(id) => setMergedTracks((prev) => prev.filter((t) => t.id !== id))}
                    onToggleExclude={(id) =>
                      setMergedTracks((prev) =>
                        prev.map((t) => (t.id === id ? { ...t, excluded: !t.excluded } : t))
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Export Success Modal */}
      {exportResult && (
        <SuccessModal
          url={exportResult.url}
          playlistId={exportResult.id}
          playlistName={exportResult.name}
          tracksCount={mergedTracks.filter((t) => !t.excluded).length}
          onClose={() => setExportResult(null)}
        />
      )}
    </div>
  );
}
