import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Compass,
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
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { useMessages } from '../context/MessageContext';
import { userApi } from '../api/userApi';
import { Avatar } from './Avatar';

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { setIsCreatePostOpen, setIsCreateStoryOpen } = useFeed();
  const { unreadCount } = useMessages();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const searchInputRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Focus input when search drawer opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isSearchOpen]);

  // Live search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await userApi.searchUsers(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error('Search failed', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    {
      label: 'Search',
      action: () => setIsSearchOpen(prev => !prev),
      icon: Search,
      isActive: isSearchOpen,
    },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Reels', path: '/reels', icon: Clapperboard },
    {
      label: 'Messages',
      path: '/messages',
      icon: MessageCircle,
      badge: unreadCount,
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
            {navItems.map((item, idx) => {
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
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-[#ff3040] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
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
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-neutral-900 text-white font-bold'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                  }`
                }
              >
                <Avatar
                  src={user.avatarUrl || user.avatar}
                  name={user.name || user.fullName}
                  username={user.username}
                  className="w-6 h-6 border border-neutral-700"
                />
                <span>Profile</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Footer / More / Admin / Logout */}
        <div className="pt-3 border-t border-[#262626] space-y-1">
          {/* Admin Link (Only visible if role === 'admin') */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-400 font-bold'
                    : 'text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10'
                }`
              }
            >
              <ShieldCheck size={22} />
              <span>Admin Hub</span>
            </NavLink>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-rose-400 hover:bg-neutral-900/60 transition-colors duration-150 text-left"
            >
              <LogOut size={22} />
              <span>Log Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center justify-center py-2.5 rounded-xl bg-[#0095f6] text-white font-semibold text-sm hover:opacity-90 transition"
            >
              Log In
            </Link>
          )}
        </div>
      </aside>

      {/* Instagram Search Drawer */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsSearchOpen(false)}
          />

          {/* Sliding Panel */}
          <div className="relative z-50 w-full sm:w-96 md:ml-64 bg-black border-r border-[#262626] h-screen shadow-2xl flex flex-col p-5 select-none animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-[#262626]">
              <h2 className="text-xl font-bold text-white">Search</h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-4">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#262626] text-sm text-white placeholder-neutral-500 rounded-lg pl-10 pr-9 py-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search Results List */}
            <div className="mt-4 flex-1 overflow-y-auto no-scrollbar">
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-[#0095f6] border-t-transparent animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((u) => (
                    <div
                      key={u._id || u.username}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/profile/${u.username}`);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 cursor-pointer transition"
                    >
                      <Avatar
                        src={u.avatarUrl || u.avatar}
                        name={u.name || u.fullName}
                        username={u.username}
                        className="w-11 h-11 border border-neutral-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-white truncate">
                          {u.username}
                        </div>
                        <div className="text-xs text-[#737373] truncate">
                          {u.name || (u.bio ? u.bio.slice(0, 30) : 'Snapgram User')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center py-10 text-neutral-500 text-sm">
                  No accounts found for "{searchQuery}".
                </div>
              ) : (
                <div className="text-center py-12 text-[#737373] text-sm">
                  Type a username or name to search accounts.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clean Instagram Create Choice Modal */}
      {isCreateChoiceOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateChoiceOpen(false);
          }}
        >
          <div className="bg-[#262626] border border-neutral-700/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-700/60">
              <span className="font-semibold text-white text-base">Create</span>
              <button
                onClick={() => setIsCreateChoiceOpen(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Options */}
            <div className="p-3 space-y-2">
              {/* Option 1: Create Post */}
              <button
                onClick={() => {
                  setIsCreateChoiceOpen(false);
                  setIsCreatePostOpen(true);
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-neutral-800 transition text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-800 group-hover:bg-[#0095f6]/20 flex items-center justify-center text-white group-hover:text-[#0095f6] transition">
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
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 text-neutral-300 hover:text-white transition"
            title="Search"
          >
            <Search size={22} />
          </button>
          <Link
            to="/messages"
            className="p-1.5 text-neutral-300 hover:text-white transition relative"
            title="Messages"
          >
            <MessageCircle size={22} />
            {unreadCount > 0 && (
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
          <Compass size={24} />
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
