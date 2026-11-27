// Reels API Module
// Backend endpoints:
//   GET    /api/reels
//   POST   /api/reels           (multipart/form-data OR JSON with videoUrl)
//   POST   /api/reels/:id/like  (toggle)
//   DELETE /api/reels/:id

import { apiClient } from './apiClient';

/** Realistic mock reels for offline / fallback mode */
const MOCK_REELS = [
  {
    _id: 'reel_1',
    id: 'reel_1',
    author: { username: 'alex_creator', avatarUrl: 'https://i.pravatar.cc/150?u=alex_creator', name: 'Alex Rivera' },
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    caption: '🌊 Pacific sunset vibes — golden hour never gets old',
    audioTitle: 'Sunset Vibes – Lo-fi Beats',
    likesCount: 847,
    commentsCount: 23,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'reel_2',
    id: 'reel_2',
    author: { username: 'jamie_lens', avatarUrl: 'https://i.pravatar.cc/150?u=jamie_lens', name: 'Jamie Chen' },
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    caption: '📸 Street photography golden hour — Tokyo alleys',
    audioTitle: 'City Lights – Ambient Mix',
    likesCount: 1203,
    commentsCount: 58,
    isLiked: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: 'reel_3',
    id: 'reel_3',
    author: { username: 'mia_traveler', avatarUrl: 'https://i.pravatar.cc/150?u=mia_traveler', name: 'Mia Santos' },
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    caption: '🏔️ Alpine hiking trail — worth every step',
    audioTitle: 'Mountain Echo – Acoustic',
    likesCount: 592,
    commentsCount: 14,
    isLiked: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

let _mockReels = [...MOCK_REELS];

export const reelApi = {
  async getReels() {
    return apiClient('/reels', {
      method: 'GET',
      fallbackHandler: async () => [..._mockReels],
    });
  },

  async createReel({ videoUrl, caption, audioTitle, videoFile }) {
    // If a file was provided, use FormData
    if (videoFile) {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (caption) formData.append('caption', caption);
      if (audioTitle) formData.append('audioTitle', audioTitle);

      return apiClient('/reels', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type; browser sets it with boundary for multipart
        headers: {},
        fallbackHandler: async () => {
          const newReel = {
            _id: `reel_${Date.now()}`,
            id: `reel_${Date.now()}`,
            author: { username: 'you', avatarUrl: '', name: 'You' },
            videoUrl: URL.createObjectURL(videoFile),
            caption: caption || '',
            audioTitle: audioTitle || '',
            likesCount: 0,
            commentsCount: 0,
            isLiked: false,
            createdAt: new Date().toISOString(),
          };
          _mockReels = [newReel, ..._mockReels];
          return newReel;
        },
      });
    }

    // Otherwise use JSON with videoUrl
    return apiClient('/reels', {
      method: 'POST',
      body: JSON.stringify({ videoUrl, caption, audioTitle }),
      fallbackHandler: async () => {
        const newReel = {
          _id: `reel_${Date.now()}`,
          id: `reel_${Date.now()}`,
          author: { username: 'you', avatarUrl: '', name: 'You' },
          videoUrl: videoUrl || '',
          caption: caption || '',
          audioTitle: audioTitle || '',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
        };
        _mockReels = [newReel, ..._mockReels];
        return newReel;
      },
    });
  },

  async toggleLike(reelId) {
    return apiClient(`/reels/${reelId}/like`, {
      method: 'POST',
      fallbackHandler: async () => {
        const reel = _mockReels.find(r => r._id === reelId || r.id === reelId);
        if (!reel) throw new Error('Reel not found');
        reel.isLiked = !reel.isLiked;
        reel.likesCount = reel.isLiked ? reel.likesCount + 1 : reel.likesCount - 1;
        return { isLiked: reel.isLiked, likesCount: reel.likesCount };
      },
    });
  },

  async toggleRepost(reelId) {
    return apiClient(`/reels/${reelId}/repost`, {
      method: 'POST',
      fallbackHandler: async () => {
        const reel = _mockReels.find(r => r._id === reelId || r.id === reelId);
        if (!reel) throw new Error('Reel not found');
        reel.isReposted = !reel.isReposted;
        reel.repostCount = (reel.repostCount || 0) + (reel.isReposted ? 1 : -1);
        return { isReposted: reel.isReposted, repostCount: Math.max(0, reel.repostCount) };
      },
    });
  },

  async deleteReel(reelId) {
    return apiClient(`/reels/${reelId}`, {
      method: 'DELETE',
      fallbackHandler: async () => {
        _mockReels = _mockReels.filter(r => r._id !== reelId && r.id !== reelId);
        return { message: 'Reel deleted' };
      },
    });
  },
};
