import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  PlusSquare,
  ShieldCheck,
  LogOut,
  Camera,
  X,
  Clapperboard,
  Sparkles,
  Image as ImageIcon,
  Film,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { useMessages } from '../context/MessageContext';
import { useNotifications } from '../context/NotificationContext';
import { Avatar } from './Avatar';

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { setIsCreatePostOpen, setIsCreateStoryOpen } = useFeed();
  const { unreadCount: msgUnreadCount } = useMessages();
  const { unreadCount: notifUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Search', path: '/explore', icon: Search },
    { label: 'Reels', path: '/reels', icon: Clapperboard },
    {
      label: 'Messages',
      path: '/messages',
      icon: MessageCircle,
      badge: msgUnreadCount,
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Heart,
      badge: notifUnreadCount,
    },
    {
      label: 'Create',
      action: () => setIsCreateChoiceOpen(true),
      icon: PlusSquare,
      isActive: isCreateChoiceOpen,
    },
  ];

  return (
    <>
      {/* Desktop Left Rail Navigation (Pure Black Instagram Style) */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 border-r border-[#262626] bg-black z-30 px-3 pt-6 pb-5 justify-between select-none">
        <div className="space-y-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 px-3 py-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200">
              <Camera size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              Snapgram
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.action) {
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 text-left ${
                      item.isActive
                        ? 'bg-neutral-900 text-white font-bold'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon size={24} strokeWidth={item.isActive ? 2.5 : 2} />
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              }

              const isItemActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isItemActive
                      ? 'bg-neutral-900 text-white font-bold'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Icon size={24} strokeWidth={isItemActive ? 2.5 : 2} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-[#ff3040] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md border-2 border-black">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {/* Profile Link */}
            {user && (
              <NavLink
                to={`/profile/${user.username}`}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  location.pathname === `/profile/${user.username}`
                    ? 'bg-neutral-900 text-white font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                <Avatar
                  src={user.avatarUrl || user.avatar}
                  name={user.name || user.fullName}
                  username={user.username}
                  className={`w-6 h-6 ${location.pathname === `/profile/${user.username}` ? 'ring-2 ring-white' : ''}`}
                />
                <span>Profile</span>
              </NavLink>
            )}

            {/* Admin Console (RBAC) */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-rose-500/15 text-rose-400 font-bold'
                      : 'text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10'
                  }`
                }
              >
                <ShieldCheck size={24} />
                <span>Admin Panel</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        {user && (
          <div className="pt-4 border-t border-[#262626] space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar
                src={user.avatarUrl || user.avatar}
                name={user.name || user.fullName}
                username={user.username}
                className="w-8 h-8"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user.name || user.fullName}
                </p>
                <p className="text-[11px] text-[#737373] truncate">@{user.username}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Create Choice Modal */}
      {isCreateChoiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#262626] border border-neutral-700/60 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-700/60">
              <span className="text-sm font-bold text-white">Create new</span>
              <button
                onClick={() => setIsCreateChoiceOpen(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 space-y-1.5">
              {/* Option 1: Create Post */}
              <button
                onClick={() => {
                  setIsCreateChoiceOpen(false);
                  setIsCreatePostOpen(true);
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-neutral-800 transition text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-800 group-hover:bg-blue-500/20 flex items-center justify-center text-white group-hover:text-blue-400 transition">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Post</div>
                  <div className="text-xs text-[#737373]">Share a photo to your feed</div>
                </div>
              </button>

              {/* Option 2: Create Reel */}
              <button
                onClick={() => {
                  setIsCreateChoiceOpen(false);
                  navigate('/reels?create=1');
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-neutral-800 transition text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-800 group-hover:bg-rose-500/20 flex items-center justify-center text-white group-hover:text-rose-400 transition">
                  <Film size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Reel</div>
                  <div className="text-xs text-[#737373]">Share a short video reel with music</div>
                </div>
              </button>

              {/* Option 3: Add Story */}
              <button
                onClick={() => {
                  setIsCreateChoiceOpen(false);
                  setIsCreateStoryOpen(true);
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-neutral-800 transition text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-800 group-hover:bg-emerald-500/20 flex items-center justify-center text-white group-hover:text-emerald-400 transition">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    Story
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      24h
                    </span>
                  </div>
                  <div className="text-xs text-[#737373]">Share photos with Close Friends option</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black/95 backdrop-blur-md border-b border-[#262626] flex items-center justify-between px-4 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white">
            <Camera size={16} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">Snapgram</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="p-1.5 text-neutral-300 hover:text-white transition relative"
            title="Notifications"
          >
            <Heart size={22} />
            {notifUnreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#ff3040] rounded-full ring-2 ring-black animate-pulse" />
            )}
          </Link>
          <Link
            to="/messages"
            className="p-1.5 text-neutral-300 hover:text-white transition relative"
            title="Messages"
          >
            <MessageCircle size={22} />
            {msgUnreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#ff3040] rounded-full ring-2 ring-black animate-pulse" />
            )}
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-13 bg-black/95 backdrop-blur-md border-t border-[#262626] flex items-center justify-around px-2 z-30">
        <NavLink
          to="/"
          className={({ isActive }) => `p-2 ${isActive ? 'text-white' : 'text-neutral-500'}`}
        >
          <Home size={24} />
        </NavLink>
        <NavLink
          to="/explore"
          className={({ isActive }) => `p-2 ${isActive ? 'text-white' : 'text-neutral-500'}`}
        >
          <Search size={24} />
        </NavLink>
        <button
          onClick={() => setIsCreateChoiceOpen(true)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          <PlusSquare size={24} />
        </button>
        <NavLink
          to="/reels"
          className={({ isActive }) => `p-2 ${isActive ? 'text-white' : 'text-neutral-500'}`}
        >
          <Clapperboard size={24} />
        </NavLink>
        {user && (
          <NavLink
            to={`/profile/${user.username}`}
            className={({ isActive }) => `p-1 rounded-full ${isActive ? 'ring-2 ring-white' : ''}`}
          >
            <Avatar
              src={user.avatarUrl || user.avatar}
              name={user.name || user.fullName}
              username={user.username}
              className="w-6 h-6"
            />
          </NavLink>
        )}
      </nav>
    </>
  );
}
