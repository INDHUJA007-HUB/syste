import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { watchlistService } from '../services/watchlistService';
import { useAuth } from './AuthContext';
import { WatchlistItem } from '../types';

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  watchlistIds: Set<string>;
  loading: boolean;
  isInWatchlist: (videoId: string) => boolean;
  addToWatchlist: (videoId: string) => Promise<void>;
  removeFromWatchlist: (videoId: string) => Promise<void>;
  toggleWatchlist: (videoId: string) => Promise<boolean>;
  refreshWatchlist: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);

  const refreshWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setWatchlistIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const items = await watchlistService.getWatchlist();
      const validItems = items || [];
      setWatchlist(validItems);
      setWatchlistIds(new Set(validItems.map((item) => item.video.id)));
    } catch (err) {
      console.error('Failed to load watchlist from backend:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  const isInWatchlist = (videoId: string): boolean => {
    return watchlistIds.has(videoId);
  };

  const addToWatchlist = async (videoId: string) => {
    if (!user) return;
    // Optimistic UI state update
    setWatchlistIds((prev) => new Set([...prev, videoId]));
    try {
      await watchlistService.add(videoId);
      await refreshWatchlist();
    } catch (err) {
      // Revert on failure
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
      throw err;
    }
  };

  const removeFromWatchlist = async (videoId: string) => {
    if (!user) return;
    // Optimistic UI state update
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      next.delete(videoId);
      return next;
    });
    setWatchlist((prev) => prev.filter((item) => item.video.id !== videoId));
    try {
      await watchlistService.remove(videoId);
    } catch (err) {
      await refreshWatchlist();
      throw err;
    }
  };

  const toggleWatchlist = async (videoId: string): Promise<boolean> => {
    if (isInWatchlist(videoId)) {
      await removeFromWatchlist(videoId);
      return false;
    } else {
      await addToWatchlist(videoId);
      return true;
    }
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        watchlistIds,
        loading,
        isInWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        refreshWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
