// Story Highlights API Module
// Backend endpoints:
//   GET    /api/highlights/user/:username
//   POST   /api/highlights
//   PUT    /api/highlights/:id
//   DELETE /api/highlights/:id

import { apiClient } from './apiClient';
import {
  getMockHighlights,
  createMockHighlight,
  deleteMockHighlight,
} from '../mock/mockStorage';

export const highlightApi = {
  /**
   * Get highlights for a specific user
   * Express Route: GET /api/highlights/user/:username
   */
  async getUserHighlights(username) {
    return apiClient(`/highlights/user/${username}`, {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockHighlights(username);
      },
    });
  },

  /**
   * Create a new highlight
   * Express Route: POST /api/highlights
   */
  async createHighlight({ title, coverUrl, items }, currentUsername) {
    return apiClient('/highlights', {
      method: 'POST',
      body: JSON.stringify({ title, coverUrl, items }),
      fallbackHandler: async () => {
        return createMockHighlight({ username: currentUsername, title, coverUrl, items });
      },
    });
  },

  /**
   * Update highlight (e.g. title, coverUrl, items)
   * Express Route: PUT /api/highlights/:id
   */
  async updateHighlight(id, updates) {
    return apiClient(`/highlights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      fallbackHandler: async () => {
        return { success: true, id, ...updates };
      },
    });
  },

  /**
   * Delete highlight
   * Express Route: DELETE /api/highlights/:id
   */
  async deleteHighlight(id) {
    return apiClient(`/highlights/${id}`, {
      method: 'DELETE',
      fallbackHandler: async () => {
        return deleteMockHighlight(id);
      },
    });
  },
};
