'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { toast } from 'sonner';
import { 
  User, 
  Lock, 
  Globe, 
  Music, 
  Layers, 
  Trash2, 
  CheckCircle2, 
  Radio, 
  LogOut,
  LogIn
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { settings, updateSettings, resetSettings } = useAppSettings();

  const handleClearSearches = () => {
    localStorage.removeItem('setdeck_recent_searches');
    toast.success('Recent searches cleared');
  };

  const handleClearCache = () => {
    localStorage.removeItem('setdeck_recent_searches');
    resetSettings();
    toast.success('Local cache and preferences reset');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16 pb-28 px-4 max-w-lg mx-auto flex flex-col gap-6">
      {/* Account Section */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary/40 border border-border/40 rounded-2xl p-4 backdrop-blur-sm"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <User className="w-3.5 h-3.5" />
          Spotify Account
        </h2>

        {session ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover border-2 border-setdeck-gold"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{session.user?.name || 'Spotify User'}</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                    Connected
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{session.user?.email || 'Authenticated'}</p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/settings' })}
              className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 py-1">
            <div>
              <h3 className="font-semibold text-sm">Not Connected</h3>
              <p className="text-xs text-muted-foreground">Sign in to export setlists directly to your library.</p>
            </div>
            <button
              onClick={() => signIn('spotify')}
              className="px-4 py-2 rounded-xl bg-setdeck-gold text-black hover:bg-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              Connect
            </button>
          </div>
        )}
      </motion.section>

      {/* Playlist & Generation Preferences */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-secondary/40 border border-border/40 rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-4"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Music className="w-3.5 h-3.5" />
          Generation Preferences
        </h2>

        {/* Playlist Visibility */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Default Playlist Visibility</p>
            <p className="text-xs text-muted-foreground">Exported playlists privacy on your Spotify profile</p>
          </div>
          <div className="flex bg-black/40 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => {
                updateSettings({ playlistVisibility: 'private' });
                toast.success('Default visibility: Private');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                settings.playlistVisibility === 'private'
                  ? 'bg-setdeck-gold text-black shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Lock className="w-3 h-3" />
              Private
            </button>
            <button
              onClick={() => {
                updateSettings({ playlistVisibility: 'public' });
                toast.success('Default visibility: Public');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                settings.playlistVisibility === 'public'
                  ? 'bg-setdeck-gold text-black shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              Public
            </button>
          </div>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        {/* Shows to Analyze */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Recent Shows Sample Size</p>
            <span className="text-xs font-bold text-setdeck-gold">{settings.showCount} Shows</span>
          </div>
          <p className="text-xs text-muted-foreground">Number of recent concert setlists analyzed for likelihood weighting</p>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {([5, 10, 15, 20] as const).map((count) => (
              <button
                key={count}
                onClick={() => {
                  updateSettings({ showCount: count });
                  toast.success(`Analysis window set to ${count} shows`);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  settings.showCount === count
                    ? 'bg-setdeck-gold text-black border-setdeck-gold shadow-sm'
                    : 'bg-black/30 border-border/50 text-muted-foreground hover:text-white hover:border-border'
                }`}
              >
                {count} Shows
              </button>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        {/* Tour Region Detection */}
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium">Tour Region Filtering</p>
            <p className="text-xs text-muted-foreground">Prioritize setlists from the same continent or tour leg</p>
          </div>
          <button
            onClick={() => {
              const next = !settings.tourRegionDetection;
              updateSettings({ tourRegionDetection: next });
              toast.success(next ? 'Tour region filtering enabled' : 'Global setlist analysis enabled');
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors border ${
              settings.tourRegionDetection ? 'bg-setdeck-gold border-setdeck-gold' : 'bg-secondary border-border'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                settings.tourRegionDetection ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        {/* Audio Previews */}
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium">Audio Previews (30s Snippets)</p>
            <p className="text-xs text-muted-foreground">Enable preview playback controls next to setlist tracks</p>
          </div>
          <button
            onClick={() => {
              const next = !settings.autoPreview;
              updateSettings({ autoPreview: next });
              toast.success(next ? 'Audio previews enabled' : 'Audio previews disabled');
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors border ${
              settings.autoPreview ? 'bg-setdeck-gold border-setdeck-gold' : 'bg-secondary border-border'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                settings.autoPreview ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </motion.section>

      {/* Storage & Maintenance */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-secondary/40 border border-border/40 rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-3"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />
          Data & Cache
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Recent Searches</p>
            <p className="text-xs text-muted-foreground">Saved artist queries on the home screen</p>
          </div>
          <button
            onClick={handleClearSearches}
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Reset App Cache</p>
            <p className="text-xs text-muted-foreground">Restore all settings to factory default</p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-xs font-semibold text-destructive flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset All
          </button>
        </div>
      </motion.section>

      {/* App Info & About */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center flex flex-col items-center gap-2 py-4 text-xs text-muted-foreground"
      >
        <div className="flex items-center gap-2 text-setdeck-gold font-bold tracking-widest uppercase">
          <Radio className="w-4 h-4" />
          SetDeck v1.2.0
        </div>
        <p className="max-w-xs">
          Built with live data from <span className="text-white font-medium">Setlist.fm</span> and powered by the <span className="text-white font-medium">Spotify Web API</span>.
        </p>
      </motion.section>
    </div>
  );
}
