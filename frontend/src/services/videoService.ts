import { api } from './api';
import { Video, Genre, PlanTier } from '../types';

export interface VideoListParams {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  tier?: PlanTier;
  sortBy?: 'trending' | 'rating' | 'year' | 'views' | 'newest';
}

export const videoService = {
  async getVideos(params?: VideoListParams) {
    const res = await api.get<{
      success: boolean;
      data: {
        videos: Video[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>('/videos', { params });
    return res.data.data;
  },

  async getVideoById(idOrSlug: string) {
    const res = await api.get<{ success: boolean; data: Video }>(`/videos/${idOrSlug}`);
    return res.data.data;
  },

  async getGenres() {
    const res = await api.get<{ success: boolean; data: Genre[] }>('/genres');
    return res.data.data;
  },
};
