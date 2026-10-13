import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { videoService } from '../services/videoService';
import { Video } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import { VideoCarousel } from '../components/VideoCarousel';
import {
  Play,
  Bookmark,
  Check,
  Star,
  Clock,
  Calendar,
  Lock,
  ArrowLeft,
  Tv,
  Film,
  User,
  Share2,
} from 'lucide-react';

export const VideoDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canAccessTier } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingWatchlist, setLoadingWatchlist] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const inWatchlist = video ? isInWatchlist(video.id) : false;

  useEffect(() => {
    if (id) {
      loadVideoDetails(id);
    }
  }, [id, user]);

  const loadVideoDetails = async (videoIdOrSlug: string) => {
    try {
      setLoading(true);
      const data = await videoService.getVideoById(videoIdOrSlug);
      setVideo(data);

      // Load related videos matching primary genre
      const primaryGenre = data.genres[0]?.slug;
      if (primaryGenre) {
        const related = await videoService.getVideos({ genre: primaryGenre, limit: 8 });
        setRelatedVideos(related.videos.filter((v) => v.id !== data.id));
      }
    } catch (err) {
      console.error('Failed to load video details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!video) return;

    try {
      setLoadingWatchlist(true);
      await toggleWatchlist(video.id);
    } catch {
      // ignore
    } finally {
      setLoadingWatchlist(false);
    }
  };


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  if (loading || !video) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isLocked = !canAccessTier(video.minimumPlanTier);
  const resumeSeconds = video.playbackProgress?.positionSeconds || 0;
  const hasResume = resumeSeconds > 5 && !video.playbackProgress?.completed;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 pb-20">
      {/* 1. Backdrop Header */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] overflow-hidden">
        <img
          src={video.posterUrl}
          alt={video.title}
          className="w-full h-full object-cover object-center filter brightness-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-transparent to-[#0a0d14]/70" />

        {/* Back Link */}
        <div className="absolute top-24 left-4 sm:left-8 z-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-panel text-slate-300 hover:text-white text-xs font-medium border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>
      </div>

      {/* 2. Content Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 sm:-mt-52 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Column: High-Res Poster Card */}
          <div className="w-48 sm:w-64 md:w-72 flex-shrink-0 mx-auto md:mx-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/90 border border-slate-700/80 relative aspect-[2/3]">
              <img
                src={video.posterUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span
                  className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-md shadow-lg ${
                    video.minimumPlanTier === 'PREMIUM'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : video.minimumPlanTier === 'STANDARD'
                      ? 'bg-indigo-600 text-white font-bold'
                      : video.minimumPlanTier === 'BASIC'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-700/90 text-slate-200'
                  }`}
                >
                  {video.minimumPlanTier} Tier
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Metadata, Actions, Synopsis */}
          <div className="flex-1 space-y-6">
            {/* Title & Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {video.rating != null ? `${video.rating.toFixed(1)} / 10 Score` : 'Unrated'}
                </span>
                <span className="bg-white/10 text-white px-2 py-0.5 rounded-md font-semibold">
                  {video.maturityRating}
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3.5 h-3.5" />
                  {video.releaseYear}
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(video.durationSeconds)}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white font-['Outfit'] tracking-tight">
                {video.title}
              </h1>

              {/* Genre Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {video.genres.map((g) => (
                  <Link
                    key={g.id}
                    to={`/catalogue?genre=${g.slug}`}
                    className="text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full border border-slate-700 transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Entitlement Gate Notice (If locked) */}
            {isLocked && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">Subscription Upgrade Required</h4>
                    <p className="text-xs text-slate-300">
                      This movie is reserved for {video.minimumPlanTier} subscribers. Your current plan is{' '}
                      {user?.entitlement.tierName || 'FREE'}.
                    </p>
                  </div>
                </div>

                <Link
                  to="/plans"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all whitespace-nowrap"
                >
                  Upgrade to {video.minimumPlanTier}
                </Link>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/watch/${video.id}`)}
                className={`px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide flex items-center gap-2.5 shadow-xl transition-all ${
                  isLocked
                    ? 'bg-rose-600/60 hover:bg-rose-600 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/40 hover:scale-105 active:scale-95'
                }`}
              >
                <Play className="w-5 h-5 fill-white" />
                {hasResume ? `Resume (${Math.floor(resumeSeconds / 60)}m)` : 'Play Movie'}
              </button>

              <button
                onClick={handleWatchlistToggle}
                disabled={loadingWatchlist}
                className={`px-5 py-3.5 rounded-2xl border font-semibold text-xs tracking-wide flex items-center gap-2 transition-all ${
                  inWatchlist
                    ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                    : 'glass-panel text-slate-300 border-slate-700 hover:text-white hover:border-slate-500'
                }`}
              >
                {inWatchlist ? (
                  <>
                    <Check className="w-4 h-4 text-rose-400" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Add to Watchlist
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-3.5 rounded-2xl glass-panel text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {copied && <span className="text-xs text-emerald-400 font-medium">Link copied!</span>}
            </div>

            {/* Synopsis */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Synopsis</h3>
              <p className="text-sm text-slate-200 leading-relaxed max-w-3xl">
                {video.description}
              </p>
            </div>

            {/* Cast & Crew Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
              {video.director && (
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-indigo-400" /> Director
                  </span>
                  <p className="text-white font-medium">{video.director}</p>
                </div>
              )}

              {video.cast && (
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" /> Starring Cast
                  </span>
                  <p className="text-white font-medium">{video.cast}</p>
                </div>
              )}
            </div>

            {/* Available Formats / Qualities */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Available Video Renditions
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {['4K Ultra HD', '1080p Full HD', '720p HD', 'Adaptive HLS'].map((q) => (
                  <span
                    key={q}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg"
                  >
                    <Tv className="w-3 h-3 text-cyan-400" />
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Related Titles Carousel */}
      {relatedVideos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-10 border-t border-slate-800/80">
          <VideoCarousel
            title="More Like This"
            videos={relatedVideos}
            seeAllLink={`/catalogue?genre=${video.genres[0]?.slug}`}
          />
        </div>
      )}
    </div>
  );
};
