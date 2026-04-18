import api from '../lib/api';
import type { 
  NotificationSummary, 
  RecentActivity, 
  NotificationSettings 
} from '../types';

export const notificationService = {
  async getSummary(): Promise<NotificationSummary> {
    const response = await api.get('/notifications/summary');
    return response.data;
  },

  async getRecentActivities(): Promise<RecentActivity[]> {
    const response = await api.get('/notifications/recent-activities');
    return response.data;
  },

  async getSettings(): Promise<NotificationSettings> {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  async updateSettings(data: NotificationSettings): Promise<NotificationSettings> {
    const response = await api.put('/notifications/settings', data);
    return response.data;
  },
};
