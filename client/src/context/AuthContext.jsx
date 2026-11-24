import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { clearTokens, getAccessToken, setTokens } from '../api/apiClient';
import { getMockUsers, initStorage } from '../mock/mockStorage';

const AuthContext = createContext(null);

// Custom event name emitted by apiClient when refresh fails irrecoverably
export const AUTH_EXPIRED_EVENT = 'snapgram:auth-expired';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session from stored real JWT
  useEffect(() => {
    initStorage();

    const storedUser = localStorage.getItem('snapgram_current_user');
    const storedToken = getAccessToken();

    // Only restore session when the token looks like a real JWT (3 parts, base64)
    const isRealJWT = storedToken && storedToken.split('.').length === 3;

    if (storedUser && isRealJWT) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        // Corrupted — start fresh
        clearAuthStorage();
      }
    } else {
      // No real JWT: clear any stale mock tokens and do NOT auto-login
      clearAuthStorage();
    }

    setLoading(false);

    // Listen for the global auth-expired event (fired by apiClient after refresh failure)
    const handleAuthExpired = () => {
      clearAuthStorage();
      setUser(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  function clearAuthStorage() {
    clearTokens();
    localStorage.removeItem('snapgram_current_user');
  }

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      setUser(result.user);
      localStorage.setItem('snapgram_current_user', JSON.stringify(result.user));
      return result;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ username, name, email, password, role = 'user' }) => {
    setLoading(true);
    try {
      const result = await authApi.register({ username, name, email, password, role });
      setUser(result.user);
      localStorage.setItem('snapgram_current_user', JSON.stringify(result.user));
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* best-effort */ }
    clearAuthStorage();
    setUser(null);
  };

  const updateUserSession = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('snapgram_current_user', JSON.stringify(updatedUser));
  };

  /**
   * Switch demo account — always uses real backend credentials.
   * Falls back to mock state if backend is unreachable.
   */
  const switchDemoAccount = async (role = 'user') => {
    const credentials = role === 'admin'
      ? { email: 'admin@snapgram.com', password: 'admin123' }
      : { email: 'alex@snapgram.com', password: 'password123' };

    try {
      const res = await login(credentials.email, credentials.password);
      if (res?.user) return;
    } catch (e) {
      console.warn('Backend login unavailable during demo switch, using mock fallback', e);
    }

    // Backend offline: use mock user object (no fake JWT stored)
    clearAuthStorage();
    const users = getMockUsers();
    const target = role === 'admin'
      ? users.find(u => u.username === 'sarah_admin')
      : users.find(u => u.username === 'alex_creator');

    if (target) {
      // Store mock user but NO tokens — apiClient will use fallbackHandlers
      setUser(target);
      localStorage.setItem('snapgram_current_user', JSON.stringify(target));
    }
  };

  const value = {
    user,
    role: user?.role || 'guest',
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    updateUserSession,
    switchDemoAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
