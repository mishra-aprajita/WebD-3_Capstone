import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { FeedProvider } from './context/FeedContext';
import { MessageProvider, useMessages } from './context/MessageContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { StoryModal } from './components/StoryModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { CreatePostModal } from './components/CreatePostModal';
import { PostDetailModal } from './components/PostDetailModal';
import { CloseFriendsModal } from './components/CloseFriendsModal';

import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Profile } from './pages/Profile';
import { Messages } from './pages/Messages';
import { Reels } from './pages/Reels';
import { Notifications } from './pages/Notifications';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { Archive } from './pages/Archive';
import { Settings } from './pages/Settings';

function MainLayout({ children }) {
  const location = useLocation();
  const { unreadCount } = useMessages();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Navbar with Desktop Left Rail and Mobile Top/Bottom Bars */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen overflow-x-hidden bg-black">
        {children}
      </main>

      {/* Sleek Floating Messages Pill (Desktop Only, hidden on /messages) */}
      {location.pathname !== '/messages' && (
        <Link
          to="/messages"
          className="hidden md:flex fixed bottom-5 right-6 z-30 items-center gap-2.5 bg-[#262626] hover:bg-[#363636] text-white px-4 py-2.5 rounded-full shadow-2xl border border-neutral-700/60 transition-all duration-200 hover:scale-[1.03] cursor-pointer group select-none"
          title="Direct Messages"
        >
          <div className="relative flex items-center justify-center">
            <MessageCircle size={20} className="text-white group-hover:text-rose-400 transition" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-[#ff3040] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold tracking-tight">Messages</span>
        </Link>
      )}

      {/* Global Modals */}
      <StoryModal />
      <CreateStoryModal />
      <CreatePostModal />
      <PostDetailModal />
      <CloseFriendsModal />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FeedProvider>
          <MessageProvider>
            <NotificationProvider>
            <MainLayout>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/explore"
                  element={
                    <ProtectedRoute>
                      <Explore />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reels"
                  element={
                    <ProtectedRoute>
                      <Reels />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:username"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/archive"
                  element={
                    <ProtectedRoute>
                      <Archive />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected RBAC Route */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
            </NotificationProvider>
          </MessageProvider>
        </FeedProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
