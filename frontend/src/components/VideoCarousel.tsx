import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../types';
import { VideoCard } from './VideoCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VideoCarouselProps {
  title: string;
  videos: Video[];
  seeAllLink?: string;
  layout?: 'poster' | 'landscape';
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({
  title,
  videos,
  seeAllLink,
  layout = 'poster',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section className="relative py-4 group/carousel">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-['Outfit']">
          {title}
        </h2>
        {seeAllLink && (
          <Link
            to={seeAllLink}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
          >
            Explore All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Carousel Track */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 shadow-xl backdrop-blur-md"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex-shrink-0 w-36 sm:w-44 md:w-52 transition-transform duration-200"
            >
              <VideoCard video={video} layout={layout} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 shadow-xl backdrop-blur-md"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};
