import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { videoService } from '../services/videoService';
import { playbackService } from '../services/playbackService';
import { Video, Genre, PlanTier, ContinueWatchingItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { HeroBanner } from '../components/HeroBanner';
import { VideoCarousel } from '../components/VideoCarousel';
import { VideoCard } from '../components/VideoCard';
import { HeroSkeleton } from '../components/SkeletonLoader';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Film,
  Sparkles,
  Play,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isCataloguePage = location.pathname === '/catalogue';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [topRatedVideos, setTopRatedVideos] = useState<Video[]>([]);
  const [sciFiVideos, setSciFiVideos] = useState<Video[]>([]);
  const [gridVideos, setGridVideos] = useState<Video[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);

  // Filter states
  const searchQuery = searchParams.get('search') || '';
  const selectedGenre = searchParams.get('genre') || '';
  const selectedTier = (searchParams.get('tier') as PlanTier) || '';
  const sortBy = (searchParams.get('sortBy') as any) || 'trending';

  useEffect(() => {
    loadCatalogue();
    if (user) {
      loadContinueWatching();
    }
  }, [searchQuery, selectedGenre, selectedTier, sortBy, user, location.pathname]);

  const loadContinueWatching = async () => {
    try {
      const items = await playbackService.getContinueWatching();
      setContinueWatching(items || []);
    } catch {
      // ignore
    }
  };

  const loadCatalogue = async () => {
    try {
      setLoading(true);
      setError(null);

      const [videosRes, genresRes] = await Promise.all([
        videoService.getVideos({
          limit: 30,
          search: searchQuery.trim() || undefined,
          genre: selectedGenre || undefined,
          tier: selectedTier ? (selectedTier as PlanTier) : undefined,
          sortBy,
        }),
        videoService.getGenres(),
      ]);

      setGenres(genresRes || []);
      setGridVideos(videosRes?.videos || []);

      if (!searchQuery && !selectedGenre && !selectedTier) {
        // Find featured video for hero
        const featured = videosRes?.videos?.find((v) => v.isFeatured) || videosRes?.videos?.[0];
        setFeaturedVideo(featured || null);

        // Populate curated carousels
        if (videosRes?.videos) {
          setTrendingVideos(videosRes.videos.filter((v) => v.isTrending).slice(0, 10));
          setTopRatedVideos(
            [...videosRes.videos].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 10)
          );
          setSciFiVideos(
            videosRes.videos
              .filter((v) => v.genres.some((g) => g.slug === 'sci-fi' || g.slug === 'cyberpunk'))
              .slice(0, 10)
          );
        }
      }
    } catch (err: any) {
      console.error('Failed to load catalogue:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to load video catalogue. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const isFiltering = isCataloguePage || !!(searchQuery || selectedGenre || selectedTier || sortBy !== 'trending');

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 pb-20">
      {/* 1. Hero Banner (Only on Home page when not actively filtering) */}
      {!isCataloguePage && !isFiltering && (
        <>
          {loading && !featuredVideo ? (
            <HeroSkeleton />
          ) : featuredVideo ? (
            <HeroBanner video={featuredVideo} />
          ) : null}
        </>
      )}

      {/* Dedicated Movies & Shows Page Header */}
      {isCataloguePage && (
        <section className="pt-28 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-widest mb-1.5">
                <Film className="w-4 h-4" />
                StreamSphere Catalogue
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
                Movies & Shows Library
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Browse our collection of licensed titles, 4K HDR originals, and exclusive series.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl font-medium">
                <span className="font-bold text-white">{gridVideos.length}</span> titles available
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-300">
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadCatalogue()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* 2. Catalogue Controls Bar */}
      <section
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
          isCataloguePage ? 'mt-6' : isFiltering ? 'pt-24' : '-mt-6 relative z-20'
        }`}
      >
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
          {/* Top Row: Search input + Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search by title, actor, director..."
                value={searchQuery}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => updateFilter('search', '')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="trending">🔥 Trending</option>
                <option value="rating">⭐ Highest Rated</option>
                <option value="year">📅 Release Year</option>
                <option value="views">👁️ Most Viewed</option>
                <option value="newest">✨ Recently Added</option>
              </select>
            </div>
          </div>

          {/* Genre Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => updateFilter('genre', '')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                !selectedGenre
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => updateFilter('genre', g.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedGenre === g.slug
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Plan Tier Quick Filter Pills */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Plan Tier:
            </span>
            {(['', 'FREE', 'BASIC', 'STANDARD', 'PREMIUM'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => updateFilter('tier', tier)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedTier === tier
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tier === '' ? 'All Access' : tier}
              </button>
            ))}

            {isFiltering && (
              <button
                onClick={() => setSearchParams(new URLSearchParams())}
                className="ml-auto text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Continue Watching Section (Logged in users with in-progress movies) */}
      {user && continueWatching.length > 0 && !isFiltering && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-['Outfit'] flex items-center gap-2">
              <Play className="w-5 h-5 text-rose-500 fill-rose-500" />
              Continue Watching for {user.name.split(' ')[0]}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {continueWatching.map((item) => (
              <VideoCard
                key={item.id}
                video={item.video}
                progressPercent={item.percentWatched}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Filter Results Grid OR Curated Carousels */}
      {isFiltering ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-['Outfit']">
              {searchQuery
                ? `Search results for "${searchQuery}"`
                : isCataloguePage && !selectedGenre && !selectedTier
                ? 'All Movies & Series'
                : 'Filtered Movies & Series'}
              <span className="text-xs font-normal text-slate-400 ml-2">
                ({gridVideos.length} titles found)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="aspect-[2/3] skeleton-shimmer rounded-xl" />
              ))}
            </div>
          ) : gridVideos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {gridVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto space-y-4 my-10 border border-slate-800">
              <Film className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No titles match your filter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Try searching with different keywords or clear your genre and tier filters.
              </p>
              <button
                onClick={() => setSearchParams(new URLSearchParams())}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-600/30"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Trending Carousel */}
          <VideoCarousel
            title="🔥 Trending Movies"
            videos={trendingVideos}
            seeAllLink="/catalogue?sortBy=trending"
          />

          {/* Top Rated Carousel */}
          <VideoCarousel
            title="⭐ Top Rated Originals"
            videos={topRatedVideos}
            seeAllLink="/catalogue?sortBy=rating"
          />

          {/* Sci-Fi & Cyberpunk Carousel */}
          <VideoCarousel
            title="🚀 Sci-Fi & Cyberpunk Worlds"
            videos={sciFiVideos}
            seeAllLink="/catalogue?genre=sci-fi"
          />

          {/* Full Grid Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-['Outfit'] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                All Catalogue Titles
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {gridVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
