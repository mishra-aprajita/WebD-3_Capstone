// Story API Module
// Backend endpoints:
//   GET    /stories (filtered for 24h & close friends privacy)
//   POST   /stories
//   DELETE /stories/:id

import { apiClient } from './apiClient';
import { getMockStories, createMockStory, getMockArchivedStories } from '../mock/mockStorage';

export const storyApi = {
  /**
   * Get active stories (< 24 hours) for the current viewer
   * Enforces Close Friends privacy check
   * Express Route: GET /api/stories
   */
  async getStories(viewerUsername) {
    return apiClient('/stories', {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockStories(viewerUsername);
      }
    });
  },

  /**
   * Create a new story (24-hour expiry)
   * Express Route: POST /api/stories
   */
  async createStory({ author, imageUrl, mediaType = 'image', caption, isCloseFriendsOnly = false }) {
    return apiClient('/stories', {
      method: 'POST',
      body: JSON.stringify({ author, imageUrl, mediaType, caption, isCloseFriendsOnly }),
      fallbackHandler: async () => {
        return createMockStory({ author, imageUrl, mediaType, caption, isCloseFriendsOnly });
      }
    });
  },

  /**
   * Get all permanent archived stories for logged-in user
   * Express Route: GET /api/stories/archive
   */
  async getArchivedStories(currentUsername) {
    return apiClient('/stories/archive', {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockArchivedStories(currentUsername);
      }
    });
  },
};
