import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import {
  Play,
  Info,
  Bookmark,
  Check,
  Star,
  Sparkles,
  Volume2,
  VolumeX,
  Lock,
} from 'lucide-react';

interface HeroBannerProps {
  video: Video;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ video }) => {
  const navigate = useNavigate();
  const { user, canAccessTier } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const inWatchlist = isInWatchlist(video.id);
  const [loadingWatchlist, setLoadingWatchlist] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(true);

  const isLocked = !canAccessTier(video.minimumPlanTier);

  const handleWatchlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLoadingWatchlist(true);
      await toggleWatchlist(video.id);
    } catch {
      // ignore
    } finally {
      setLoadingWatchlist(false);
    }
  };


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] min-h-[520px] max-h-[750px] overflow-hidden select-none">
      {/* Background Image / Video Poster */}
      <img
        src={video.posterUrl}
        alt={video.title}
        className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 filter brightness-90 animate-in fade-in duration-700"
      />

      {/* Cinematic Vignette Overlays */}
      <div className="absolute inset-0 hero-vignette" />
      <div className="absolute inset-0 hero-vignette-sides" />

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-20 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badge Row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span
              className={`font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md backdrop-blur-md shadow-lg ${
                video.minimumPlanTier === 'PREMIUM'
                  ? 'bg-amber-500 text-slate-950 flex items-center gap-1 font-bold'
                  : video.minimumPlanTier === 'STANDARD'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : video.minimumPlanTier === 'BASIC'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-700/80 text-white'
              }`}
            >
              {video.minimumPlanTier === 'PREMIUM' && <Sparkles className="w-3.5 h-3.5 fill-slate-950" />}
              {video.minimumPlanTier} Tier
            </span>

            <span className="bg-white/10 backdrop-blur-md text-white font-semibold px-2 py-0.5 rounded-md border border-white/10">
              {video.maturityRating}
            </span>

            <span className="flex items-center gap-1 text-amber-400 font-bold bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {video.rating != null ? video.rating.toFixed(1) : 'N/A'}
            </span>

            <span className="text-slate-300 font-medium">{video.releaseYear}</span>
            <span className="text-slate-300 font-medium">•</span>
            <span className="text-slate-300 font-medium">{formatDuration(video.durationSeconds)}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-['Outfit'] drop-shadow-xl leading-none">
            {video.title}
          </h1>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
            {video.description}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {video.genres.map((g) => (
              <span
                key={g.id}
                className="text-[11px] font-medium text-slate-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10"
              >
                {g.name}
              </span>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => navigate(`/watch/${video.id}`)}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              Play Movie
            </button>

            <button
              onClick={() => navigate(`/videos/${video.id}`)}
              className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm flex items-center gap-2 backdrop-blur-md border border-white/10 transition-colors"
            >
              <Info className="w-4 h-4" />
              More Details
            </button>

            <button
              onClick={handleWatchlistToggle}
              disabled={loadingWatchlist}
              className={`p-3 rounded-xl backdrop-blur-md border transition-all ${
                inWatchlist
                  ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                  : 'bg-black/50 text-slate-200 border-white/10 hover:text-white hover:bg-black/70'
              }`}
              title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              aria-label={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            >
              {inWatchlist ? <Check className="w-5 h-5 text-rose-400" /> : <Bookmark className="w-5 h-5" />}
            </button>

            {isLocked && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                Requires {video.minimumPlanTier} Subscription
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio Mute toggle preview decoration */}
      <div className="absolute right-6 bottom-20 z-10 hidden md:block">
        <button
          onClick={() => setMuted(!muted)}
          className="p-2.5 rounded-full bg-black/60 hover:bg-black text-slate-300 hover:text-white backdrop-blur-md border border-white/10 transition-colors"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
