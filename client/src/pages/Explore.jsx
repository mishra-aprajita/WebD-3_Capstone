import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Search,
  X,
  Film,
  Clock,
  UserPlus,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { postApi } from '../api/postApi';
import { userApi } from '../api/userApi';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';
import { FALLBACK_IMAGE } from '../mock/mockData';
import { resolveMediaUrl, isVideoMedia } from '../utils/mediaUtils';

const RECENT_SEARCHES_KEY = 'snapgram_recent_searches';

function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(userObj) {
  try {
    const existing = getRecentSearches().filter(
      (u) => (u.id || u._id) !== (userObj.id || userObj._id)
    );
    const updated = [userObj, ...existing].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function removeRecentSearch(userId) {
  try {
    const updated = getRecentSearches().filter((u) => (u.id || u._id) !== userId);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function Explore() {
  const { user: currentUser } = useAuth();
  const { setActiveDetailPost } = useFeed();

  const [explorePosts, setExplorePosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const [followStates, setFollowStates] = useState({});

  const searchContainerRef = useRef(null);

  useEffect(() => {
    async function loadExplore() {
      try {
        const sorted = await postApi.getExplorePosts();
        setExplorePosts(Array.isArray(sorted) ? sorted : []);
      } catch (err) {
        console.error('Failed to load explore posts', err);
      } finally {
        setLoadingPosts(false);
      }
    }
    loadExplore();
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced user search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await userApi.searchUsers(query);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error('Search failed', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectUser = (u) => {
    const updated = saveRecentSearch({
      id: u.id || u._id,
      username: u.username,
      name: u.fullName || u.name,
      avatarUrl: u.avatarUrl || u.avatar,
      followersCount: u.followersCount ?? u.followers?.length ?? 0,
    });
    setRecentSearches(updated);
    setIsFocused(false);
  };

  const handleRemoveRecent = (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches(removeRecentSearch(userId));
  };

  const handleQuickFollow = async (e, targetUser) => {
    e.preventDefault();
    e.stopPropagation();
    const targetId = targetUser.id || targetUser._id;
    try {
      const res = await userApi.toggleFollow(targetId);
      const status = res?.status || res?.followStatus || 'following';
      setFollowStates((prev) => ({ ...prev, [targetId]: status }));
    } catch (err) {
      console.error('Follow failed', err);
    }
  };

  const showDropdown = isFocused && (query.trim().length > 0 || recentSearches.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-6">
      {/* Sticky Top Search Bar */}
      <div ref={searchContainerRef} className="sticky top-14 md:top-4 z-20">
        <div className="relative">
          <div className="flex items-center bg-[#1c1c1c]/95 backdrop-blur-md border border-neutral-800 focus-within:border-neutral-600 rounded-xl px-4 py-2.5 shadow-xl transition-colors">
            <Search size={18} className="text-neutral-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Search people by name or @username..."
              className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSearchResults([]);
                }}
                className="text-neutral-400 hover:text-white ml-2 p-0.5 rounded-full hover:bg-neutral-800 transition"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto z-30">
              {query.trim() ? (
                searching ? (
                  <div className="p-6 text-center text-xs text-neutral-400">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-neutral-800/60">
                    {searchResults.map((u) => {
                      const uid = u.id || u._id;
                      const isSelf = String(uid) === String(currentUser?._id || currentUser?.id);
                      const status =
                        followStates[uid] ||
                        (u.followers?.some((f) => String(f?._id || f) === String(currentUser?._id || currentUser?.id))
                          ? 'following'
                          : 'unfollowed');
                      const followerCount = u.followersCount ?? u.followers?.length ?? 0;

                      return (
                        <Link
                          key={uid}
                          to={`/profile/${u.username}`}
                          onClick={() => handleSelectUser(u)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-neutral-800/60 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={u.avatarUrl || u.avatar}
                              name={u.fullName || u.name}
                              username={u.username}
                              className="w-11 h-11 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                @{u.username}
                              </p>
                              <p className="text-xs text-neutral-400 truncate">
                                {u.fullName || u.name} • {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
                              </p>
                            </div>
                          </div>

                          {!isSelf && (
                            <button
                              onClick={(e) => handleQuickFollow(e, u)}
                              className={`flex-shrink-0 ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                status === 'following'
                                  ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                                  : status === 'requested'
                                  ? 'bg-neutral-800 text-neutral-400'
                                  : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                              }`}
                            >
                              {status === 'following' ? (
                                <><UserCheck size={13} /> Following</>
                              ) : status === 'requested' ? (
                                <>Requested</>
                              ) : (
                                <><UserPlus size={13} /> Follow</>
                              )}
                            </button>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-neutral-500">
                    No users found for "{query}"
                  </div>
                )
              ) : (
                <div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800/80">
                    <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                      <Clock size={13} /> Recent Searches
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-800/40">
                    {recentSearches.map((u) => {
                      const uid = u.id || u._id;
                      return (
                        <Link
                          key={uid}
                          to={`/profile/${u.username}`}
                          onClick={() => setIsFocused(false)}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/60 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={u.avatarUrl}
                              name={u.name}
                              username={u.username}
                              className="w-10 h-10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">@{u.username}</p>
                              <p className="text-xs text-neutral-400 truncate">{u.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveRecent(e, uid)}
                            className="p-1.5 text-neutral-500 hover:text-white rounded-full hover:bg-neutral-800 transition"
                            aria-label="Remove recent search"
                          >
                            <X size={14} />
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          Explore
          <span className="text-[11px] bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <TrendingUp size={11} /> Trending
          </span>
        </h1>
      </div>

      {/* Masonry / 3-Col Media Grid */}
      {loadingPosts ? (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="aspect-square bg-neutral-900/60 rounded-md animate-pulse" />
          ))}
        </div>
      ) : explorePosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {explorePosts.map((post) => {
            const isVid = isVideoMedia(post);
            return (
              <div
                key={post.id || post._id}
                onClick={() => setActiveDetailPost(post)}
                className="relative aspect-square group cursor-pointer overflow-hidden rounded-sm md:rounded-lg bg-neutral-950 border border-neutral-900"
              >
                {isVid ? (
                  <>
                    <video
                      src={resolveMediaUrl(post.imageUrl)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      muted
                      playsInline
                      loop
                      onMouseEnter={(e) => e.target.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />
                    <div className="absolute top-2 right-2 z-10 bg-black/60 text-white p-1 rounded-md pointer-events-none">
                      <Film size={13} />
                    </div>
                  </>
                ) : (
                  <img
                    src={resolveMediaUrl(post.imageUrl, FALLBACK_IMAGE)}
                    alt={post.caption || 'Explore post'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                )}

                {/* Hover Overlay with Likes & Comments Count */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-5 text-white font-bold text-sm pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <Heart size={18} className="fill-white" />
                    <span>{post.likesCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={18} className="fill-white" />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-500 text-sm">
          No posts available to explore yet.
        </div>
      )}
    </div>
  );
}
