import { api } from './api';
import { PlaybackSessionResponse, ContinueWatchingItem } from '../types';

export const playbackService = {
  async createSession(videoId: string) {
    const res = await api.post<{ success: boolean; data: PlaybackSessionResponse }>('/playback/sessions', {
      videoId,
    });
    return res.data.data;
  },

  async updateProgress(
    sessionId: string,
    positionSeconds: number,
    durationSeconds: number,
    completed?: boolean,
    clientTimestamp?: number
  ) {
    const res = await api.put<{ success: boolean; data: any }>(`/playback/sessions/${sessionId}/progress`, {
      positionSeconds,
      durationSeconds,
      completed,
      clientTimestamp: clientTimestamp || Date.now(),
    });
    return res.data.data;
  },


  async getContinueWatching() {
    const res = await api.get<{ success: boolean; data: ContinueWatchingItem[] }>('/playback/continue-watching');
    return res.data.data;
  },

  async getResume(videoId: string) {
    const res = await api.get<{ success: boolean; data: any }>(`/playback/resume/${videoId}`);
    return res.data.data;
  },
};
