import { api } from './api';
import { User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await api.post<{ success: boolean; data: { user: User; tokens: { accessToken: string; refreshToken: string } } }>(
      '/auth/register',
      data
    );
    return res.data.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<{ success: boolean; data: { user: User; tokens: { accessToken: string; refreshToken: string } } }>(
      '/auth/login',
      data
    );
    return res.data.data;
  },

  async getMe() {
    const res = await api.get<{ success: boolean; data: User }>('/auth/me');
    return res.data.data;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('streamsphere_access_token');
  },

  async updateProfile(data: { name?: string; avatarUrl?: string }) {
    const res = await api.patch<{ success: boolean; data: User }>('/auth/profile', data);
    return res.data.data;
  },
};
