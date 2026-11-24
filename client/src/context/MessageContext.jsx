import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { messageApi } from '../api/messageApi';
import { useAuth } from './AuthContext';
import { getAccessToken, isValidJWT } from '../api/apiClient';

const MessageContext = createContext(null);

export function MessageProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  // Ref to interval so we can clear it from inside the callback
  const intervalRef = useRef(null);
  // Track whether polling has been permanently stopped due to auth failure
  const authFailedRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    // Don't poll if no user or auth permanently failed
    if (!user || authFailedRef.current) {
      setUnreadCount(0);
      return;
    }

    // Don't poll if there's no real JWT (backend would 401 and fallback handles it)
    const token = getAccessToken();
    if (!isValidJWT(token)) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await messageApi.getUnreadCount(user.username);
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      const msg = err?.message || '';
      // If it's an auth error (401 / token expired), stop polling permanently
      if (
        msg.includes('401') ||
        msg.includes('Unauthorized') ||
        msg.includes('Session expired') ||
        msg.includes('token')
      ) {
        authFailedRef.current = true;
        stopPolling();
        setUnreadCount(0);
      }
    }
  }, [user, stopPolling]);

  // Reset auth-failed flag when user changes (new login)
  useEffect(() => {
    authFailedRef.current = false;
  }, [user]);

  // Start/stop polling based on user presence and valid JWT
  useEffect(() => {
    const token = getAccessToken();
    if (!user || !isValidJWT(token)) {
      stopPolling();
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    refreshUnreadCount();

    // Poll every 15s only when authenticated with valid token
    intervalRef.current = setInterval(() => {
      const currentToken = getAccessToken();
      if (!authFailedRef.current && isValidJWT(currentToken)) {
        refreshUnreadCount();
      } else {
        stopPolling();
      }
    }, 15000);

    return () => stopPolling();
  }, [user, refreshUnreadCount, stopPolling]);

  // Also stop polling immediately on the global auth-expired event
  useEffect(() => {
    const handleAuthExpired = () => {
      authFailedRef.current = true;
      stopPolling();
      setUnreadCount(0);
    };
    window.addEventListener('snapgram:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('snapgram:auth-expired', handleAuthExpired);
  }, [stopPolling]);

  const value = {
    unreadCount,
    refreshUnreadCount,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
}
