import { api } from './api';

export const adminService = {
  async getAnalytics() {
    const res = await api.get<{ success: boolean; data: any }>('/admin/analytics');
    return res.data.data;
  },

  async createVideo(data: any) {
    const res = await api.post<{ success: boolean; data: any }>('/admin/videos', data);
    return res.data.data;
  },

  async updateVideo(id: string, data: any) {
    const res = await api.put<{ success: boolean; data: any }>(`/admin/videos/${id}`, data);
    return res.data.data;
  },

  async deleteVideo(id: string) {
    const res = await api.delete<{ success: boolean; data: any }>(`/admin/videos/${id}`);
    return res.data.data;
  },

  async updatePlan(id: string, data: any) {
    const res = await api.put<{ success: boolean; data: any }>(`/admin/plans/${id}`, data);
    return res.data.data;
  },
};
