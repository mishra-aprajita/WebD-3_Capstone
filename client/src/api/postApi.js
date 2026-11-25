// Post API Module
// Backend endpoints:
//   GET    /posts
//   GET    /posts/explore (sorted by likes descending)
//   GET    /posts/:id
//   POST   /posts
//   DELETE /posts/:id
//   POST   /posts/:id/like
//   POST   /posts/:id/save
//   POST   /posts/:id/comments
//   DELETE /posts/:id/comments/:commentId

import { apiClient } from './apiClient';
import {
  getMockPosts,
  createMockPost,
  toggleMockLikePost,
  addMockComment,
  deleteMockPost,
  getMockSavedPostIds,
  toggleMockSavePost,
} from '../mock/mockStorage';

export const postApi = {
  /**
   * Get all feed posts
   * Express Route: GET /api/posts
   */
  async getPosts() {
    return apiClient('/posts', {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockPosts();
      }
    });
  },

  /**
   * Get explore posts (sorted by like count descending)
   * Express Route: GET /api/posts/explore
   */
  async getExplorePosts() {
    return apiClient('/posts/explore', {
      method: 'GET',
      fallbackHandler: async () => {
        const posts = getMockPosts();
        return [...posts].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
      }
    });
  },

  /**
   * Get single post by ID
   * Express Route: GET /api/posts/:id
   */
  async getPostById(postId) {
    return apiClient(`/posts/${postId}`, {
      method: 'GET',
      fallbackHandler: async () => {
        const posts = getMockPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) throw new Error('Post not found');
        return post;
      }
    });
  },

  /**
   * Create a new post
   * Express Route: POST /api/posts
   */
  async createPost({ author, imageUrl, caption, location, mediaType, isReel }) {
    return apiClient('/posts', {
      method: 'POST',
      body: JSON.stringify({ author, imageUrl, caption, location, mediaType, isReel }),
      fallbackHandler: async () => {
        return createMockPost({ author, imageUrl, caption, location, mediaType, isReel });
      }
    });
  },

  /**
   * Toggle like on post
   * Express Route: POST /api/posts/:id/like
   */
  async toggleLike(postId, username) {
    return apiClient(`/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ username }),
      fallbackHandler: async () => {
        return toggleMockLikePost(postId, username);
      }
    });
  },

  /**
   * Add a comment to a post
   * Express Route: POST /api/posts/:id/comments
   */
  async addComment(postId, { author, text }) {
    return apiClient(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
      fallbackHandler: async () => {
        return addMockComment(postId, { author, text });
      }
    });
  },

  /**
   * Delete a post
   * Express Route: DELETE /api/posts/:id
   */
  async deletePost(postId) {
    return apiClient(`/posts/${postId}`, {
      method: 'DELETE',
      fallbackHandler: async () => {
        return deleteMockPost(postId);
      }
    });
  },

  /**
   * Get user's saved post IDs
   * Express Route: GET /api/posts/saved
   */
  async getSavedPostIds(username) {
    return apiClient('/posts/saved', {
      method: 'GET',
      fallbackHandler: async () => {
        return getMockSavedPostIds(username);
      }
    });
  },

  /**
   * Toggle save/bookmark on a post
   * Express Route: POST /api/posts/:id/save
   */
  async toggleSavePost(postId, username) {
    return apiClient(`/posts/${postId}/save`, {
      method: 'POST',
      body: JSON.stringify({ postId }),
      fallbackHandler: async () => {
        return toggleMockSavePost(postId, username);
      }
    });
  }
};
