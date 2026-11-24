// Auth API Module
// Backend endpoints:
//   POST /auth/login
//   POST /auth/register
//   GET  /auth/me
//   POST /auth/refresh

import { apiClient, setTokens, clearTokens, isValidJWT } from './apiClient';
import { getMockUsers, updateMockUser } from '../mock/mockStorage';

export const authApi = {
  /**
   * Login user
   * Express Route: POST /api/auth/login
   */
  async login({ email, password }) {
    const res = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      fallbackHandler: async () => {
        const users = getMockUsers();
        const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
        if (!user) {
          throw new Error('Invalid email or password.');
        }

        // Mock token generation
        const mockAccessToken = `mock_access_jwt_${user.id}_${Date.now()}`;
        const mockRefreshToken = `mock_refresh_jwt_${user.id}_${Date.now()}`;

        return {
          user,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          message: 'Logged in successfully (Mock Session)'
        };
      }
    });

    if (res?.accessToken && isValidJWT(res.accessToken)) {
      setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    }
    return res;
  },

  /**
   * Register new user
   * Express Route: POST /api/auth/register
   */
  async register({ username, name, email, password, role = 'user' }) {
    const res = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, name, email, password, role }),
      fallbackHandler: async () => {
        const users = getMockUsers();
        const cleanUsername = username.trim().toLowerCase();

        if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
          throw new Error(`Username @${cleanUsername} is already taken.`);
        }
        if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
          throw new Error(`Email ${email} is already registered.`);
        }

        const newUser = {
          id: `user_${Date.now()}`,
          username: cleanUsername,
          name: name.trim(),
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          role: role || 'user',
          avatar: '',
          avatarUrl: '',
          bio: 'Hey there! I am new on Snapgram 📸',
          website: '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          followers: [],
          following: [],
          closeFriends: [],
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem('snapgram_users_v1', JSON.stringify(updatedUsers));

        const mockAccessToken = `mock_access_jwt_${newUser.id}_${Date.now()}`;
        const mockRefreshToken = `mock_refresh_jwt_${newUser.id}_${Date.now()}`;

        return {
          user: newUser,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          message: 'Registered successfully (Mock Session)'
        };
      }
    });

    if (res?.accessToken && isValidJWT(res.accessToken)) {
      setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    }
    return res;
  },

  /**
   * Get current user session
   * Express Route: GET /api/auth/me
   */
  async getMe() {
    return apiClient('/auth/me', {
      method: 'GET',
      fallbackHandler: async () => {
        const savedUserStr = localStorage.getItem('snapgram_current_user');
        if (!savedUserStr) return null;
        try {
          const parsed = JSON.parse(savedUserStr);
          const users = getMockUsers();
          const refreshed = users.find(u => u.id === parsed.id || u.username === parsed.username);
          return refreshed || parsed;
        } catch {
          return null;
        }
      }
    });
  },

  /**
   * Logout user
   */
  async logout() {
    clearTokens();
    localStorage.removeItem('snapgram_current_user');
    return { success: true };
  }
};
