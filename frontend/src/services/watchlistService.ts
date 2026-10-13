import { api } from './api';
import { WatchlistItem } from '../types';

export const watchlistService = {
  async getWatchlist() {
    const res = await api.get<{ success: boolean; data: WatchlistItem[] }>('/watchlist');
    return res.data.data;
  },

  async add(videoId: string) {
    const res = await api.post<{ success: boolean; data: any }>(`/watchlist/${videoId}`);
    return res.data.data;
  },

  async remove(videoId: string) {
    const res = await api.delete<{ success: boolean; data: any }>(`/watchlist/${videoId}`);
    return res.data.data;
  },
};
