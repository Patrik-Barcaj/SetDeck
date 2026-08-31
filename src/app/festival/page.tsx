'use client';

import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSession, signIn } from '@/lib/auth-client';
import { ArtistResult, AggregatedTrack, SetlistData } from '@/types';
import { TrackCard } from '@/components/setlist/TrackCard';
import { SuccessModal } from '@/components/setlist/SuccessModal';
import {
  Tent,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  Search,
  Loader2,
  Music,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface FestivalAct {
  id: string;
  artistName: string;
  mbid: string;
  imageUrl?: string;
  stage: string;
  startTime: string; // "17:30"
  endTime: string;   // "18:20"
  mode: 'festival' | 'headline';
}

const DEFAULT_STAGES = ['Main Stage', 'Second Stage', 'Dance Tent', 'Acoustic Stage'];

const SUGGESTED_ACTS = [
  { name: 'Arctic Monkeys', mbid: 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop' },
  { name: 'Fred again..', mbid: '787ca16a-ff55-460d-a316-cf4c3dbfa3cf', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop' },
  { name: 'Foo Fighters', mbid: '67f66c07-6e61-4026-ade5-7e782fad3a5d', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop' },
  { name: 'Lana Del Rey', mbid: 'b7539c32-53e7-4908-bda3-81449c367da6', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop' },
];

export default function FestivalPage() {
  const { data: session } = useSession();
  const [acts, setActs] = useState<FestivalAct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArtistResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [mergedTracks, setMergedTracks] = useState<AggregatedTrack[]>([]);
  const [festivalTitle, setFestivalTitle] = useState('My Festival Warm-Up');
  
  const [isExporting, setIsExporting] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState<{
    url: string;
    playlistId?: string;
    playlistName?: string;
    tracksCount?: number;
    imageUrl?: string;
  } | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search artists
  useMemo(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let isCurrent = true;
    setIsSearching(true);

    fetch(`/api/setlist/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isCurrent) {
          setSearchResults(data || []);
          setIsSearching(false);
        }
      })
      .catch(() => {
        if (isCurrent) setIsSearching(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  // Add artist to lineup
  const addArtistToLineup = async (name: string, mbid?: string, imageUrl?: string) => {
    // Check if already in lineup
    if (acts.some((a) => a.artistName.toLowerCase() === name.toLowerCase())) {
      toast.info(`${name} is already in your timetable`);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    setIsResolving(true);
    try {
      let resolvedMbid = mbid;
      if (!resolvedMbid) {
        const res = await fetch(`/api/setlist/resolve?artistName=${encodeURIComponent(name)}`);
        if (res.ok) {
          const data = await res.json();
          resolvedMbid = data.mbid;
        } else {
          toast.error(`Could not resolve setlist data for ${name}`);
          setIsResolving(false);
          return;
        }
      }

      const defaultTimes = [
        { start: '16:00', end: '16:50' },
        { start: '17:15', end: '18:05' },
        { start: '18:30', end: '19:25' },
        { start: '20:00', end: '21:15' },
        { start: '21:45', end: '23:00' },
      ];
      const slotIndex = Math.min(acts.length, defaultTimes.length - 1);
      const stage = DEFAULT_STAGES[acts.length % DEFAULT_STAGES.length];

      const newAct: FestivalAct = {
        id: `act-${Date.now()}-${Math.random()}`,
        artistName: name,
        mbid: resolvedMbid || '',
        imageUrl,
        stage,
        startTime: defaultTimes[slotIndex].start,
        endTime: defaultTimes[slotIndex].end,
        mode: slotIndex >= 3 ? 'headline' : 'festival',
      };

      setActs((prev) => [...prev, newAct]);
      setSearchQuery('');
      setSearchResults([]);
      toast.success(`Added ${name} to festival timetable`);
    } catch {
      toast.error('Failed to add artist');
    } finally {
      setIsResolving(false);
    }
  };

  // Remove artist
  const removeAct = (id: string) => {
    setActs((prev) => prev.filter((a) => a.id !== id));
  };

  // Update act attributes
  const updateAct = (id: string, updates: Partial<FestivalAct>) => {
    setActs((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  // Sort acts chronologically
  const sortedActs = useMemo(() => {
    return [...acts].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [acts]);

  // Generate merged timetable setlist
  const generateMergedPlaylist = async () => {
    if (sortedActs.length === 0) {
      toast.error('Add at least one artist to your festival lineup');
      return;
    }

    setIsGenerating(true);
    try {
      // Fetch each artist's setlist in parallel without waterfall
      const setlistResults = await Promise.all(
        sortedActs.map(async (act) => {
          try {
            const res = await fetch(
              `/api/setlist/${act.mbid}?mode=${act.mode}&artistName=${encodeURIComponent(act.artistName)}`
            );
            if (!res.ok) return null;
            const data: SetlistData = await res.json();
            return { act, data };
          } catch {
            return null;
          }
        })
      );

      const allMerged: AggregatedTrack[] = [];

      setlistResults.forEach((item) => {
        if (!item || !item.data || !item.data.tracks) return;
        const { act, data } = item;
        const sectionHeader = `${act.startTime} • ${act.stage} (${act.artistName})`;

        data.tracks.forEach((track, idx) => {
          allMerged.push({
            ...track,
            id: `merged-${act.id}-${track.id}-${idx}`,
            section: sectionHeader,
            // Prefix artist for cover/spotify search context
            name: `${track.name}`,
          });
        });
      });

      if (allMerged.length === 0) {
        toast.error('Could not load setlist tracks for the selected artists');
        setIsGenerating(false);
        return;
      }

      setMergedTracks(allMerged);
      const artistNames = sortedActs.map((a) => a.artistName).join(' • ');
      setFestivalTitle(`Festival Warm-Up: ${artistNames}`);
      toast.success(`Generated merged playlist with ${allMerged.length} tracks!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to merge setlists');
    } finally {
      setIsGenerating(false);
    }
  };

  // Remove single track
  const handleRemoveTrack = useCallback((id: string) => {
    setMergedTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Toggle track exclusion
  const handleToggleExclude = useCallback((id: string) => {
    setMergedTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, excluded: !t.excluded } : t))
    );
  }, []);

  // Export merged setlist to Spotify
  const handleExportToSpotify = async () => {
    if (!session) {
      signIn('spotify');
      return;
    }

    const activeTracks = mergedTracks.filter((t) => !t.excluded);
    if (activeTracks.length === 0) {
      toast.error('No active tracks to export');
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch('/api/setlist/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: festivalTitle,
          tourName: 'Festival Timetable Merge',
          tracks: activeTracks.map((t) => ({
            name: t.name,
            spotifyUri: t.spotifyUri,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Export failed');
      }

      const data = await res.json();
      setCreatedPlaylist({
        url: data.playlistUrl,
        playlistId: data.playlistId,
        playlistName: festivalTitle,
        tracksCount: activeTracks.length,
        imageUrl: data.imageUrl || sortedActs[0]?.imageUrl,
      });
      toast.success('Festival timetable playlist created!');
    } catch {
      toast.error('Failed to export playlist to Spotify');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 overflow-x-hidden">
      {/* Header Banner */}
      <div className="relative border-b border-border/40 bg-gradient-to-b from-amber-950/20 via-background to-background py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-setdrift-gold/15 text-setdrift-gold border border-setdrift-gold/30 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Tent className="w-4 h-4" />
            <span>Festival Timetable Merge Engine</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3">
            Build Your Multi-Artist <span className="text-transparent bg-clip-text bg-gradient-to-r from-setdrift-gold to-amber-300">Timetable</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Select the acts on your schedule, set their stage times, and generate one chronological Spotify warm-up playlist.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
        {/* Search & Add Artist */}
        <div className="bg-card/70 border border-border/60 rounded-3xl p-6 shadow-sm mb-8 backdrop-blur-md">
          <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-setdrift-gold" />
            <span>Add Artist to Lineup</span>
          </h2>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search artist name (e.g. Arctic Monkeys, Fred again..)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-border/50 rounded-2xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-setdrift-gold transition-all"
            />
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
            {(isSearching || isResolving) && (
              <Loader2 className="absolute right-4 top-3.5 w-4 h-4 text-setdrift-gold animate-spin" />
            )}

            {/* Live Search Dropdown */}
            {searchQuery.trim() && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-50 p-2">
                {searchResults.map((result) => {
                  const directMbid = result.mbid || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.id) ? result.id : undefined);
                  const subtitle = result.disambiguation || (result.genres?.join(', ') || 'Artist');
                  return (
                    <div
                      key={result.id}
                      onClick={() => addArtistToLineup(result.name, directMbid, result.images?.[0]?.url)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {result.images?.[0]?.url ? (
                          <img src={result.images[0].url} alt={result.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-muted-foreground">
                            {result.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{result.name}</h4>
                            {typeof result.totalShows === 'number' && result.totalShows > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-400">
                                {result.totalShows} shows
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs">{subtitle}</p>
                        </div>
                      </div>
                      <button className="p-1.5 rounded-lg bg-setdrift-gold/15 text-setdrift-gold text-xs font-bold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground font-semibold">Suggested Acts:</span>
            {SUGGESTED_ACTS.map((act) => (
              <button
                key={act.mbid}
                type="button"
                onClick={() => addArtistToLineup(act.name, act.mbid, act.image)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/60 hover:bg-secondary border border-border/40 hover:border-setdrift-gold/40 text-xs font-medium text-white transition-all active:scale-95"
              >
                <Plus className="w-3 h-3 text-setdrift-gold" />
                <span>{act.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Timetable Lineup */}
        <div className="bg-card/70 border border-border/60 rounded-3xl p-6 shadow-sm mb-8 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-setdrift-gold" />
              <h2 className="text-base font-extrabold text-white">
                Festival Schedule ({sortedActs.length} {sortedActs.length === 1 ? 'Act' : 'Acts'})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">Sorted chronologically by start time</span>
          </div>

          {sortedActs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border/60 rounded-2xl p-6">
              <Tent className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-bold text-white mb-1">Your Festival Lineup is Empty</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Search and add artists above to configure stage times and build your warm-up schedule.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedActs.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-secondary/40 border border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-setdrift-gold/30"
                >
                  {/* Artist Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {act.imageUrl ? (
                      <img src={act.imageUrl} alt={act.artistName} className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-base text-setdrift-gold shrink-0 border border-border/50">
                        {act.artistName[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm md:text-base font-black text-white truncate">{act.artistName}</h3>
                      <p className="text-xs text-muted-foreground truncate">{act.stage} • {act.startTime} - {act.endTime}</p>
                    </div>
                  </div>

                  {/* Stage & Time Controls */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Stage Name input */}
                    <input
                      type="text"
                      value={act.stage}
                      onChange={(e) => updateAct(act.id, { stage: e.target.value })}
                      placeholder="Stage Name"
                      className="bg-background/80 border border-border/50 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:ring-1 focus:ring-setdrift-gold focus:outline-none w-28"
                    />

                    {/* Start Time */}
                    <div className="flex items-center gap-1 bg-background/80 border border-border/50 rounded-xl px-2 py-1.5">
                      <Clock className="w-3 h-3 text-setdrift-gold" />
                      <input
                        type="time"
                        value={act.startTime}
                        onChange={(e) => updateAct(act.id, { startTime: e.target.value })}
                        className="bg-transparent text-xs font-bold text-white focus:outline-none w-16"
                      />
                    </div>

                    {/* Mode Toggle (Headline vs Festival Slot) */}
                    <div className="flex items-center bg-background/90 p-0.5 rounded-xl border border-border/50 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => updateAct(act.id, { mode: 'festival' })}
                        className={`px-2 py-1 rounded-lg transition-all ${
                          act.mode === 'festival'
                            ? 'bg-setdrift-gold text-black font-black shadow-sm'
                            : 'text-muted-foreground hover:text-white'
                        }`}
                      >
                        Festival (~50m)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAct(act.id, { mode: 'headline' })}
                        className={`px-2 py-1 rounded-lg transition-all ${
                          act.mode === 'headline'
                            ? 'bg-setdrift-gold text-black font-black shadow-sm'
                            : 'text-muted-foreground hover:text-white'
                        }`}
                      >
                        Full (90-120m)
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeAct(act.id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove artist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Generate Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={generateMergedPlaylist}
                  disabled={isGenerating}
                  className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-setdrift-gold to-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Aggregating & Merging Setlists...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Timetable Warm-Up</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Merged Setlist Tracklist */}
        {mergedTracks.length > 0 && (
          <div className="bg-card/70 border border-border/60 rounded-3xl p-6 shadow-sm mb-12 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Timetable Ready</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">{festivalTitle}</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  {mergedTracks.filter((t) => !t.excluded).length} tracks ready for Spotify export
                </p>
              </div>

              {/* Export to Spotify CTA */}
              <button
                type="button"
                onClick={handleExportToSpotify}
                disabled={isExporting}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting to Spotify...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    <span>Export Timetable to Spotify</span>
                  </>
                )}
              </button>
            </div>

            {/* Tracks grouped by stage/time */}
            <div className="flex flex-col">
              {mergedTracks.map((track, idx) => {
                const currentSection = track.section || 'Main Stage';
                const prevSection = idx > 0 ? mergedTracks[idx - 1].section : null;
                const isNewSection = idx === 0 || currentSection !== prevSection;

                return (
                  <div key={track.id}>
                    {isNewSection && (
                      <div className={`${idx === 0 ? 'pt-1' : 'pt-6'} pb-3 flex items-center justify-between`}>
                        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border bg-setdrift-gold/15 text-setdrift-gold border-setdrift-gold/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                          {currentSection}
                        </span>
                        <div className="h-px flex-1 ml-4 bg-gradient-to-r from-border/50 to-transparent" />
                      </div>
                    )}
                    <TrackCard
                      track={track}
                      onRemove={handleRemoveTrack}
                      onToggleExclude={handleToggleExclude}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Export Success Modal */}
      {createdPlaylist && (
        <SuccessModal
          url={createdPlaylist.url}
          playlistId={createdPlaylist.playlistId}
          playlistName={createdPlaylist.playlistName}
          tracksCount={createdPlaylist.tracksCount}
          imageUrl={createdPlaylist.imageUrl}
          onClose={() => setCreatedPlaylist(null)}
        />
      )}
    </div>
  );
}
