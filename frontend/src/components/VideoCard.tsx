import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import {
  Play,
  Bookmark,
  Check,
  Star,
  Lock,
  Clock,
  Sparkles,
} from 'lucide-react';

interface VideoCardProps {
  video: Video;
  layout?: 'poster' | 'landscape';
  progressPercent?: number;
  onWatchlistToggle?: (videoId: string, isInWatchlist: boolean) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  layout = 'poster',
  progressPercent,
  onWatchlistToggle,
}) => {
  const { user, canAccessTier } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const navigate = useNavigate();

  const [loadingWatchlist, setLoadingWatchlist] = useState<boolean>(false);
  const inWatchlist = isInWatchlist(video.id);

  const isLocked = !canAccessTier(video.minimumPlanTier);

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLoadingWatchlist(true);
      const newState = await toggleWatchlist(video.id);
      onWatchlistToggle?.(video.id, newState);
    } catch {
      // ignore
    } finally {
      setLoadingWatchlist(false);
    }
  };


  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${video.id}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  const imageUrl = layout === 'landscape' ? video.thumbnailUrl : video.posterUrl;

  return (
    <div className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/80 hover:border-slate-700 flex flex-col">
      <Link to={`/videos/${video.id}`} className="block relative aspect-[2/3] overflow-hidden">
        {/* Thumbnail Image */}
        <img
          src={imageUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Tier Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md backdrop-blur-md shadow-md ${
              video.minimumPlanTier === 'PREMIUM'
                ? 'bg-amber-500/90 text-slate-950 font-black'
                : video.minimumPlanTier === 'STANDARD'
                ? 'bg-indigo-600/90 text-white'
                : video.minimumPlanTier === 'BASIC'
                ? 'bg-emerald-600/90 text-white'
                : 'bg-slate-700/80 text-slate-200'
            }`}
          >
            {video.minimumPlanTier}
          </span>
          {video.minimumPlanTier === 'PREMIUM' && <Sparkles className="w-3 h-3 text-amber-300 drop-shadow" />}
        </div>

        {/* Lock Overlay if locked */}
        {isLocked && (
          <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md p-1.5 rounded-lg border border-white/10 text-amber-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/50 hover:scale-110 active:scale-95 transition-transform"
            aria-label={`Play ${video.title}`}
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        </div>

        {/* Quick Watchlist Button */}
        <button
          onClick={handleWatchlistClick}
          disabled={loadingWatchlist}
          className={`absolute bottom-2.5 right-2.5 p-2 rounded-lg backdrop-blur-md border transition-all ${
            inWatchlist
              ? 'bg-rose-600 text-white border-rose-500 shadow-md'
              : 'bg-black/60 text-slate-300 border-white/10 hover:text-white hover:bg-black/90'
          }`}
          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>

        {/* Progress bar if present */}
        {(progressPercent !== undefined || video.playbackProgress) && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div
              className="h-full bg-rose-600"
              style={{
                width: `${
                  progressPercent !== undefined
                    ? progressPercent
                    : video.playbackProgress
                    ? Math.min(100, Math.round((video.playbackProgress.positionSeconds / video.playbackProgress.durationSeconds) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
        )}
      </Link>

      {/* Card Metadata */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/videos/${video.id}`} className="hover:text-rose-400 transition-colors">
            <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
              {video.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span>{video.releaseYear}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {video.rating != null ? video.rating.toFixed(1) : 'N/A'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              {formatDuration(video.durationSeconds)}
            </span>
          </div>
        </div>

        {/* Genres */}
        <div className="flex items-center gap-1.5 mt-2 overflow-hidden text-[10px] text-slate-400">
          {video.genres.slice(0, 2).map((g) => (
            <span key={g.id} className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300">
              {g.name}
            </span>
          ))}
          {video.genres.length > 2 && <span className="text-slate-400">+{video.genres.length - 2}</span>}
        </div>
      </div>
    </div>
  );
};
