// Message API Module
// Backend endpoints:
//   GET   /api/messages/conversations
//   GET   /api/messages/:userId
//   POST  /api/messages/:userId
//   PATCH /api/messages/:userId/read

import { apiClient } from './apiClient';
import {
  getMockConversations,
  getMockMessagesWithUser,
  sendMockMessage,
  markMockMessagesAsRead,
  getMockUnreadMessagesCount,
} from '../mock/mockStorage';

export const messageApi = {
  /**
   * Get all conversation threads for logged-in user
   * Express Route: GET /api/messages/conversations
   */
  async getConversations(currentUsername) {
    return apiClient('/messages/conversations', {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockConversations(currentUsername);
      },
    });
  },

  /**
   * Get message history with a specific user
   * Express Route: GET /api/messages/:userId
   */
  async getMessages(targetUsernameOrId, currentUsername) {
    return apiClient(`/messages/${targetUsernameOrId}`, {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockMessagesWithUser(currentUsername, targetUsernameOrId);
      },
    });
  },

  /**
   * Send a new message to a specific user
   * Express Route: POST /api/messages/:userId
   * Payload: { text, sharedPostId, sharedPost }
   */
  async sendMessage(targetUsernameOrId, { text, sharedPostId, sharedPost, currentUsername }) {
    return apiClient(`/messages/${targetUsernameOrId}`, {
      method: 'POST',
      body: JSON.stringify({ text, sharedPostId, sharedPost }),
      fallbackHandler: async () => {
        return sendMockMessage({
          senderUsername: currentUsername,
          receiverUsername: targetUsernameOrId,
          text,
          sharedPost,
        });
      },
    });
  },

  /**
   * Mark all messages from a user as read
   * Express Route: PATCH /api/messages/:userId/read
   */
  async markAsRead(senderUsernameOrId, currentUsername) {
    return apiClient(`/messages/${senderUsernameOrId}/read`, {
      method: 'PATCH',
      fallbackHandler: async () => {
        return markMockMessagesAsRead(currentUsername, senderUsernameOrId);
      },
    });
  },

  /**
   * Get total unread count for logged-in user badge
   */
  async getUnreadCount(currentUsername) {
    return apiClient('/messages/unread/count', {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockUnreadMessagesCount(currentUsername);
      },
    });
  },
};
