import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StoriesBar } from '../components/StoriesBar';
import { PostCard } from '../components/PostCard';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';
import { getMockUsers } from '../mock/mockStorage';
import { Avatar } from '../components/Avatar';

export function Home() {
  const { posts, loading, toggleFollow } = useFeed();
  const { user } = useAuth();
  const [followingMap, setFollowingMap] = useState({});

  // Suggested users to follow (excluding current user)
  const suggestedUsers = getMockUsers()
    .filter(u => u.username !== user?.username)
    .slice(0, 5);

  const handleToggleFollow = async (targetUsername) => {
    // Optimistic toggle
    setFollowingMap(prev => {
      const current = prev[targetUsername] !== undefined
        ? prev[targetUsername]
        : (user?.following || []).includes(targetUsername);
      return { ...prev, [targetUsername]: !current };
    });
    try {
      await toggleFollow(targetUsername);
    } catch {
      // Revert if error
      setFollowingMap(prev => ({
        ...prev,
        [targetUsername]: (user?.following || []).includes(targetUsername),
      }));
    }
  };

  return (
    <div className="w-full flex justify-center py-6 px-2 sm:px-4">
      <div className="flex justify-center gap-16 w-full max-w-[975px]">
        {/* Main Feed Column (Strict 470px Instagram Web standard) */}
        <div className="w-full max-w-[470px]">
          {/* 24-Hour Stories Bar */}
          <StoriesBar />

          {/* Post Feed */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl h-[480px] bg-neutral-900/40 animate-pulse border border-[#262626]/40" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="border border-[#262626] rounded-xl p-10 text-center text-neutral-400 my-8">
              <p className="text-base font-semibold text-white mb-2">No posts yet</p>
              <p className="text-sm">Be the first to share a moment with the Snapgram community!</p>
            </div>
          )}
        </div>

        {/* Right Sidebar Suggestions (Desktop Only - Strict 320px) */}
        <aside className="hidden lg:block w-[320px] pt-4 select-none">
          {/* Current User Summary */}
          {user && (
            <div className="flex items-center justify-between mb-6">
              <Link to={`/profile/${user.username}`} className="flex items-center gap-3 group">
                <Avatar
                  src={user.avatarUrl || user.avatar}
                  name={user.name || user.fullName}
                  username={user.username}
                  className="w-11 h-11"
                />
                <div className="leading-tight">
                  <span className="font-semibold text-sm text-white group-hover:opacity-80 block truncate max-w-[160px]">
                    {user.username}
                  </span>
                  <span className="text-xs text-[#737373] block truncate max-w-[160px]">
                    {user.name}
                  </span>
                </div>
              </Link>
              <Link
                to={`/profile/${user.username}`}
                className="text-xs font-semibold text-[#0095f6] hover:text-white transition"
              >
                Switch
              </Link>
            </div>
          )}

          {/* Suggested For You */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-[#737373]">
                Suggested for you
              </span>
              <Link to="/explore" className="text-xs font-semibold text-white hover:text-neutral-400 transition">
                See All
              </Link>
            </div>

            <div className="space-y-3.5">
              {suggestedUsers.map(sUser => {
                const isFollowed = followingMap[sUser.username] !== undefined
                  ? followingMap[sUser.username]
                  : (user?.following || []).includes(sUser.username);

                return (
                  <div key={sUser.username} className="flex items-center justify-between">
                    <Link to={`/profile/${sUser.username}`} className="flex items-center gap-3 group">
                      <Avatar
                        src={sUser.avatarUrl || sUser.avatar}
                        name={sUser.name || sUser.fullName}
                        username={sUser.username}
                        className="w-11 h-11"
                      />
                      <div className="leading-tight text-left">
                        <div className="text-sm font-semibold text-white group-hover:opacity-80 truncate max-w-[140px]">
                          {sUser.username}
                        </div>
                        <div className="text-xs text-[#737373] truncate max-w-[140px]">
                          Suggested for you
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleToggleFollow(sUser.username)}
                      className={`text-xs font-semibold transition px-1 ${
                        isFollowed
                          ? 'text-neutral-400 hover:text-neutral-200'
                          : 'text-[#0095f6] hover:text-white'
                      }`}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Snapgram Instagram Web Footer */}
          <div className="text-[11px] text-[#737373] space-y-3 pt-3">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span className="hover:underline cursor-pointer">About</span> • 
              <span className="hover:underline cursor-pointer">Help</span> • 
              <span className="hover:underline cursor-pointer">Press</span> • 
              <span className="hover:underline cursor-pointer">API</span> • 
              <span className="hover:underline cursor-pointer">Jobs</span> • 
              <span className="hover:underline cursor-pointer">Privacy</span> • 
              <span className="hover:underline cursor-pointer">Terms</span> • 
              <span className="hover:underline cursor-pointer">Locations</span> • 
              <span className="hover:underline cursor-pointer">Language</span>
            </div>
            <div>
              © 2026 SNAPGRAM FROM DEEPMIND
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
