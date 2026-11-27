import { apiClient } from './apiClient';

export const notificationApi = {
  async getNotifications() {
    return apiClient('/notifications', {
      method: 'GET',
      fallbackHandler: async () => ({ notifications: [], unreadCount: 0 }),
    });
  },

  async getUnreadCount() {
    return apiClient('/notifications/unread/count', {
      method: 'GET',
      fallbackHandler: async () => ({ count: 0 }),
    });
  },

  async markAllRead() {
    return apiClient('/notifications/read-all', {
      method: 'PATCH',
      fallbackHandler: async () => ({ success: true }),
    });
  },
};
