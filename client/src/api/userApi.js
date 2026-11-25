// User & Admin API Module
// Backend endpoints:
//   GET   /users
//   GET   /users/:username
//   PUT   /users/:username
//   POST  /users/:username/follow
//   POST  /users/close-friends
//   PATCH /users/:id/role (admin)

import { apiClient } from './apiClient';
import {
  getMockUsers,
  getMockUserByUsername,
  updateMockUser,
  toggleMockFollow,
  toggleMockCloseFriend,
  getMockBlockedUsers,
  toggleMockBlock,
  updateMockPassword,
} from '../mock/mockStorage';

export const userApi = {
  /**
   * Search users by query
   * Express Route: GET /api/users/search?q=:query
   */
  async searchUsers(query) {
    if (!query || !query.trim()) return [];
    return apiClient(`/users/search?q=${encodeURIComponent(query.trim())}`, {
      method: 'GET',
      fallbackHandler: async () => {
        const q = query.toLowerCase().trim();
        return getMockUsers().filter(
          u => u.username.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
        );
      }
    });
  },

  /**
   * Get all users (Admin/Search)
   * Express Route: GET /api/users
   */
  async getAllUsers() {
    return apiClient('/users', {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockUsers();
      }
    });
  },

  /**
   * Get single user profile
   * Express Route: GET /api/users/:username
   */
  async getUserProfile(username) {
    return apiClient(`/users/${username}`, {
      method: 'GET',
      fallbackHandler: async () => {
        const user = getMockUserByUsername(username);
        if (!user) throw new Error(`User @${username} not found`);
        return user;
      }
    });
  },

  /**
   * Update profile info
   * Express Route: PUT /api/users/:username
   */
  async updateProfile(username, updates) {
    return apiClient(`/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      fallbackHandler: async () => {
        return updateMockUser(username, updates);
      }
    });
  },

  /**
   * Follow or Unfollow user
   * Express Route: POST /api/users/:username/follow
   */
  async toggleFollow(currentUsername, targetUsername) {
    return apiClient(`/users/${targetUsername}/follow`, {
      method: 'POST',
      fallbackHandler: async () => {
        return toggleMockFollow(currentUsername, targetUsername);
      }
    });
  },

  /**
   * Toggle Close Friend status
   * Express Route: POST /api/users/close-friends
   */
  async toggleCloseFriend(currentUsername, targetUsername) {
    return apiClient('/users/close-friends', {
      method: 'POST',
      body: JSON.stringify({ targetUsername }),
      fallbackHandler: async () => {
        return toggleMockCloseFriend(currentUsername, targetUsername);
      }
    });
  },

  /**
   * Update user role (Admin only)
   * Express Route: PATCH /api/users/:id/role
   */
  async updateUserRole(userId, newRole) {
    return apiClient(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
      fallbackHandler: async () => {
        const users = getMockUsers();
        const user = users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');
        return updateMockUser(user.username, { role: newRole });
      }
    });
  },

  /**
   * Get list of users who follow :username
   * Express Route: GET /api/users/:username/followers
   */
  async getUserFollowers(username) {
    return apiClient(`/users/${username}/followers`, {
      method: 'GET',
      fallbackHandler: async () => {
        const all = getMockUsers();
        const target = all.find(u => u.username === username);
        if (!target) return [];
        return all.filter(u => (u.following || []).includes(username));
      }
    });
  },

  /**
   * Get list of users that :username follows
   * Express Route: GET /api/users/:username/following
   */
  async getUserFollowing(username) {
    return apiClient(`/users/${username}/following`, {
      method: 'GET',
      fallbackHandler: async () => {
        const all = getMockUsers();
        const target = all.find(u => u.username === username);
        if (!target) return [];
        return all.filter(u => (target.following || []).includes(u.username));
      }
    });
  },

  /**
   * Update own profile
   * Express Route: PUT /api/users/me
   */
  async updateMe(updates, currentUsername) {
    return apiClient('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
      fallbackHandler: async () => {
        if (!currentUsername) throw new Error('Not authenticated');
        return updateMockUser(currentUsername, updates);
      }
    });
  },

  /**
   * Change password
   * Express Route: PUT /api/users/me/password
   */
  async changePassword({ currentPassword, newPassword }, currentUsername) {
    return apiClient('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
      fallbackHandler: async () => {
        return updateMockPassword(currentUsername, currentPassword, newPassword);
      }
    });
  },

  /**
   * Get list of blocked users
   * Express Route: GET /api/users/me/blocked
   */
  async getBlockedUsers(currentUsername) {
    return apiClient('/users/me/blocked', {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockBlockedUsers(currentUsername);
      }
    });
  },

  /**
   * Toggle block/unblock user
   * Express Route: POST /api/users/:usernameOrId/block
   */
  async toggleBlock(targetUsernameOrId, currentUsername) {
    return apiClient(`/users/${targetUsernameOrId}/block`, {
      method: 'POST',
      fallbackHandler: async () => {
        return toggleMockBlock(currentUsername, targetUsernameOrId);
      }
    });
  },

  /**
   * Get pending incoming follow requests for logged-in user
   * Express Route: GET /api/users/me/follow-requests
   */
  async getFollowRequests() {
    return apiClient('/users/me/follow-requests', {
      method: 'GET',
      fallbackHandler: async () => [],
    });
  },

  /**
   * Accept a follow request
   * Express Route: POST /api/users/follow-requests/:userId/accept
   */
  async acceptFollowRequest(userId) {
    return apiClient(`/users/follow-requests/${userId}/accept`, {
      method: 'POST',
      fallbackHandler: async () => ({ success: true }),
    });
  },

  /**
   * Decline a follow request
   * Express Route: POST /api/users/follow-requests/:userId/decline
   */
  async declineFollowRequest(userId) {
    return apiClient(`/users/follow-requests/${userId}/decline`, {
      method: 'POST',
      fallbackHandler: async () => ({ success: true }),
    });
  },
};
