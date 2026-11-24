import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Grid,
  Bookmark,
  Star,
  UserPlus,
  UserCheck,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Shield,
  X,
  Camera,
  Clapperboard,
  Upload,
  Trash2,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  MoreHorizontal,
  Plus,
  Lock,
  UserX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { userApi } from '../api/userApi';
import { reelApi } from '../api/reelApi';
import { highlightApi } from '../api/highlightApi';
import { HighlightViewerModal } from '../components/HighlightViewerModal';
import { CreateHighlightModal } from '../components/CreateHighlightModal';
import { Avatar } from '../components/Avatar';
import { FALLBACK_IMAGE } from '../mock/mockData';

/* ─────────────────────────────── EditProfileModal ─────────────────────────── */
function EditProfileModal({ user, onClose, onSave }) {
  const [fullName, setFullName] = useState(user.name || user.fullName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [website, setWebsite] = useState(user.website || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || user.avatar || '');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP).');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (typeof dataUrl === 'string') {
        setAvatarUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (imageUrlInput.trim()) {
      setAvatarUrl(imageUrlInput.trim());
      setImageUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const updates = {
        name: fullName.trim(),
        fullName: fullName.trim(),
        bio: bio.trim(),
        website: website.trim(),
        avatarUrl: avatarUrl.trim(),
        avatar: avatarUrl.trim(),
      };
      await onSave(updates);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#262626] border border-neutral-700/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-700/60">
          <span className="font-semibold text-white text-base">Edit profile</span>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Avatar Change Section */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-700/50">
            <Avatar
              src={avatarUrl}
              name={fullName}
              username={user.username}
              className="w-16 h-16 border-2 border-neutral-700"
              textClassName="text-xl"
            />
            <div className="flex-1 space-y-1.5">
              <div className="font-semibold text-sm text-white truncate">
                {user.username}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-md bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold transition flex items-center gap-1.5"
                >
                  <Upload size={12} />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition"
                >
                  URL
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium transition flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Optional URL Input */}
          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#0095f6]"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 bg-[#0095f6] text-white text-xs font-semibold rounded-lg hover:bg-[#1877f2] transition"
              >
                Apply
              </button>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-400 tracking-wider mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#0095f6]"
            />
          </div>

          {/* Bio */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase text-neutral-400 tracking-wider">
                Bio
              </label>
              <span className="text-[11px] text-neutral-500">{bio.length} / 150</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              placeholder="Tell everyone a bit about yourself..."
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#0095f6] resize-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-400 tracking-wider mb-1.5">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#0095f6]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0095f6] hover:bg-[#1877f2] text-white transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────── FollowListModal ─────────────────────────── */
function FollowListModal({ username, initialTab, onClose }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab); // 'followers' | 'following'
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingF, setLoadingF] = useState(false);
  const [loadingG, setLoadingG] = useState(false);
  const [followingSet, setFollowingSet] = useState(new Set());

  // Fetch both lists once
  useEffect(() => {
    setLoadingF(true);
    userApi.getUserFollowers(username)
      .then(data => setFollowers(Array.isArray(data) ? data : []))
      .catch(() => setFollowers([]))
      .finally(() => setLoadingF(false));

    setLoadingG(true);
    userApi.getUserFollowing(username)
      .then(data => setFollowing(Array.isArray(data) ? data : []))
      .catch(() => setFollowing([]))
      .finally(() => setLoadingG(false));
  }, [username]);

  // Build set of usernames followed by current user
  useEffect(() => {
    if (!currentUser) return;
    userApi.getUserFollowing(currentUser.username)
      .then(data => {
        const names = new Set((Array.isArray(data) ? data : []).map(u => u.username));
        setFollowingSet(names);
      })
      .catch(() => {});
  }, [currentUser]);

  const handleFollowToggle = async (targetUsername) => {
    if (!currentUser) return;
    try {
      await userApi.toggleFollow(currentUser.username, targetUsername);
      setFollowingSet(prev => {
        const next = new Set(prev);
        if (next.has(targetUsername)) next.delete(targetUsername);
        else next.add(targetUsername);
        return next;
      });
    } catch { /* silent */ }
  };

  const handleUserClick = (uname) => {
    onClose();
    navigate(`/profile/${uname}`);
  };

  const list = tab === 'followers' ? followers : following;
  const isLoading = tab === 'followers' ? loadingF : loadingG;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#262626] border border-neutral-700/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center border-b border-neutral-700/60">
          <button
            onClick={() => setTab('followers')}
            className={`flex-1 py-3.5 text-sm font-semibold transition ${
              tab === 'followers'
                ? 'text-white border-b-2 border-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setTab('following')}
            className={`flex-1 py-3.5 text-sm font-semibold transition ${
              tab === 'following'
                ? 'text-white border-b-2 border-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Following
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3.5 text-neutral-400 hover:text-white transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 no-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-[#0095f6] border-t-transparent animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              {tab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-neutral-800/60">
              {list.map((u) => {
                const uname = u.username || u.name || '?';
                const isMe = currentUser?.username === uname;
                const isFollowed = followingSet.has(uname);
                return (
                  <li key={u._id || uname} className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => handleUserClick(uname)}
                      className="flex-shrink-0"
                    >
                      <Avatar
                        src={u.avatarUrl || u.avatar}
                        name={u.name}
                        username={uname}
                        className="w-10 h-10 border border-neutral-700"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => handleUserClick(uname)}
                        className="font-semibold text-sm text-white hover:underline truncate block text-left"
                      >
                        {uname}
                      </button>
                      <p className="text-xs text-neutral-400 truncate">
                        {u.name || u.bio || ''}
                      </p>
                    </div>
                    {!isMe && (
                      <button
                        onClick={() => handleFollowToggle(uname)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex-shrink-0 ${
                          isFollowed
                            ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            : 'bg-[#0095f6] text-white hover:bg-[#1877f2]'
                        }`}
                      >
                        {isFollowed ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Profile Page ─────────────────────────────── */
export function Profile() {
  const { username } = useParams();
  const { user: currentUser, updateUserSession } = useAuth();
  const {
    posts,
    savedPostIds,
    toggleFollow,
    setIsCloseFriendsModalOpen,
    setIsCreatePostOpen,
    setActiveDetailPost,
  } = useFeed();

  const [profileUser, setProfileUser] = useState(null);
  const [userReels, setUserReels] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reels' | 'saved'
  const [loading, setLoading] = useState(true);

  // Modals state
  const [followModal, setFollowModal] = useState({ open: false, tab: 'followers' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [isCreateHighlightOpen, setIsCreateHighlightOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const isOwnProfile =
    currentUser?.username?.toLowerCase() === (username || '').toLowerCase();

  const isFollowing = (currentUser?.following || []).includes(username);

  // Load user profile
  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const fetched = await userApi.getUserProfile(username);
        setProfileUser(fetched);
        setIsBlocked(!!fetched?.isBlocked);
      } catch (err) {
        console.error('Failed to load user profile', err);
      } finally {
        setLoading(false);
      }
    }
    if (username) fetchUser();
  }, [username, currentUser?.following]);

  // Load user highlights
  useEffect(() => {
    if (!username) return;
    highlightApi.getUserHighlights(username)
      .then(data => setHighlights(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load highlights', err));
  }, [username]);

  // Load user reels
  useEffect(() => {
    if (!username) return;
    reelApi.getReels()
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(
            r => r.author?.username?.toLowerCase() === username.toLowerCase()
          );
          setUserReels(filtered);
        }
      })
      .catch(() => setUserReels([]));
  }, [username]);

  const userPosts = posts.filter(
    (p) => p.author?.username?.toLowerCase() === (username || '').toLowerCase()
  );

  const userSavedPosts = posts.filter((p) =>
    (savedPostIds || []).includes(p.id)
  );

  const handleFollowClick = async () => {
    if (!profileUser) return;
    const result = await toggleFollow(profileUser.username);
    if (result?.targetUser) {
      setProfileUser(result.targetUser);
    }
  };

  const handleSaveProfile = async (updates) => {
    const updated = await userApi.updateProfile(username, updates);
    if (updated) {
      setProfileUser(prev => ({ ...prev, ...updated }));
      if (isOwnProfile && currentUser) {
        updateUserSession({ ...currentUser, ...updated });
      }
    }
  };

  const handleToggleBlock = async () => {
    setIsOptionsMenuOpen(false);
    try {
      const res = await userApi.toggleBlock(username, currentUser.username);
      setIsBlocked(!!res.isBlocked);
    } catch (err) {
      console.error('Toggle block error', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0095f6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Sorry, this page isn't available.</h2>
        <p className="text-sm text-neutral-400 max-w-sm mx-auto">
          The link you followed may be broken, or the account @{username} may have been removed.
        </p>
        <Link
          to="/"
          className="inline-block bg-[#0095f6] hover:bg-[#1877f2] text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
        >
          Go back to Snapgram
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[935px] mx-auto px-4 sm:px-8 py-8 select-none">
        {/* Profile Header */}
        <header className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-14 pb-11 border-b border-[#262626]">
          {/* Large Avatar (120px-150px) */}
          <div className="relative group flex-shrink-0">
            <div
              onClick={() => { if (isOwnProfile) setIsEditModalOpen(true); }}
              className={`w-32 h-32 sm:w-36 sm:h-36 md:w-[150px] md:h-[150px] rounded-full p-1 bg-black border border-[#262626] ${
                isOwnProfile ? 'cursor-pointer' : ''
              }`}
              title={isOwnProfile ? 'Click to change profile photo' : undefined}
            >
              <Avatar
                src={profileUser.avatarUrl || profileUser.avatar}
                name={profileUser.name || profileUser.fullName}
                username={profileUser.username}
                className="w-full h-full text-4xl sm:text-5xl"
              />
              {isOwnProfile && (
                <div className="absolute inset-1 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                  <Camera size={24} />
                  <span className="text-[11px] font-semibold">Change Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Info & Stats */}
          <div className="flex-1 space-y-4 text-center sm:text-left min-w-0">
            {/* Username & Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3.5">
              <h1 className="text-xl sm:text-2xl font-normal text-white tracking-tight">
                {profileUser.username}
              </h1>

              {/* Role Badge if Admin */}
              {profileUser.role === 'admin' && (
                <span className="flex items-center gap-1 text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  <Shield size={12} /> Admin
                </span>
              )}

              {/* Action Buttons */}
              {isOwnProfile ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-1.5 rounded-lg bg-[#262626] hover:bg-[#363636] text-white text-sm font-semibold transition"
                  >
                    Edit profile
                  </button>
                  <Link
                    to="/archive"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#363636] text-neutral-200 text-xs font-semibold transition"
                    title="View Story Archive"
                  >
                    <ArchiveIcon size={14} />
                    <span>View archive</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#363636] text-neutral-300 hover:text-white transition"
                    title="Settings"
                  >
                    <SettingsIcon size={17} />
                  </Link>
                  <button
                    onClick={() => setIsCloseFriendsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                    title="Manage Close Friends"
                  >
                    <Star size={13} fill="currentColor" />
                    <span>Close Friends ({profileUser.closeFriends?.length || 0})</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 relative">
                  {isBlocked ? (
                    <button
                      onClick={handleToggleBlock}
                      className="px-5 py-1.5 rounded-lg text-sm font-semibold bg-[#262626] hover:bg-[#363636] text-white transition"
                    >
                      Unblock
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleFollowClick}
                        className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition ${
                          isFollowing
                            ? 'bg-[#262626] hover:bg-[#363636] text-white'
                            : 'bg-[#0095f6] hover:bg-[#1877f2] text-white'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <Link
                        to={`/messages?user=${profileUser.username}`}
                        className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#262626] hover:bg-[#363636] text-white transition flex items-center gap-1.5"
                      >
                        <MessageCircle size={15} />
                        <span>Message</span>
                      </Link>
                    </>
                  )}

                  {/* Options Menu ••• */}
                  <div className="relative">
                    <button
                      onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                      className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#363636] text-white transition"
                      title="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {isOptionsMenuOpen && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-44 bg-[#262626] border border-neutral-700/60 rounded-xl shadow-2xl py-1 z-40">
                        <button
                          onClick={handleToggleBlock}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-neutral-800 transition flex items-center gap-2"
                        >
                          <UserX size={14} />
                          <span>{isBlocked ? 'Unblock user' : 'Block user'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-center sm:justify-start gap-8 text-sm">
              <div>
                <span className="font-semibold text-white mr-1.5">{userPosts.length}</span>
                <span className="text-neutral-300">posts</span>
              </div>

              {/* Clickable Followers Count */}
              <button
                onClick={() => setFollowModal({ open: true, tab: 'followers' })}
                className="hover:opacity-70 transition text-left"
              >
                <span className="font-semibold text-white mr-1.5">
                  {(profileUser.followersCount || 0).toLocaleString()}
                </span>
                <span className="text-neutral-300">followers</span>
              </button>

              {/* Clickable Following Count */}
              <button
                onClick={() => setFollowModal({ open: true, tab: 'following' })}
                className="hover:opacity-70 transition text-left"
              >
                <span className="font-semibold text-white mr-1.5">
                  {(profileUser.followingCount || 0).toLocaleString()}
                </span>
                <span className="text-neutral-300">following</span>
              </button>
            </div>

            {/* Bio & Links */}
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-white">
                {profileUser.fullName || profileUser.name || profileUser.username}
              </div>
              {profileUser.bio && (
                <p className="text-neutral-200 leading-relaxed max-w-lg whitespace-pre-line text-sm">
                  {profileUser.bio}
                </p>
              )}
              {profileUser.website && (
                <a
                  href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#0095f6] hover:underline font-semibold pt-0.5"
                >
                  <LinkIcon size={12} />
                  <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Story Highlights Strip */}
        {(isOwnProfile || highlights.length > 0) && (
          <div className="py-6 flex items-center gap-6 overflow-x-auto no-scrollbar">
            {isOwnProfile && (
              <div
                onClick={() => setIsCreateHighlightOpen(true)}
                className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-neutral-700 group-hover:border-neutral-500 bg-[#121212] flex items-center justify-center text-neutral-400 group-hover:text-white transition shadow">
                  <Plus size={26} />
                </div>
                <span className="text-xs text-neutral-300 font-medium">New</span>
              </div>
            )}

            {highlights.map((hl) => (
              <div
                key={hl._id || hl.id}
                onClick={() => setActiveHighlight(hl)}
                className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 border-2 border-neutral-700 group-hover:border-neutral-400 transition overflow-hidden bg-[#1a1a1a]">
                  <img
                    src={hl.coverUrl || hl.items?.[0]?.mediaUrl}
                    alt={hl.title}
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition"
                  />
                </div>
                <span className="text-xs text-white font-medium max-w-[80px] truncate text-center">
                  {hl.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation: Posts | Reels | Saved */}
        <div className="flex items-center justify-center border-t border-[#262626] text-xs uppercase tracking-widest font-semibold -mt-[1px]">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 py-4 px-6 border-t transition ${
              activeTab === 'posts'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Grid size={15} />
            <span>Posts</span>
          </button>

          <button
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-2 py-4 px-6 border-t transition ${
              activeTab === 'reels'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Clapperboard size={15} />
            <span>Reels</span>
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-4 px-6 border-t transition ${
                activeTab === 'saved'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Bookmark size={15} />
              <span>Saved</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {profileUser.isPrivate && !isOwnProfile && !isFollowing ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400 bg-[#121212]">
                <Lock size={26} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">This account is private</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Follow @{profileUser.username} to see their photos, reels, and highlights.
              </p>
            </div>
          ) : (
            <>
              {/* Posts Tab */}
          {activeTab === 'posts' && (
            userPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setActiveDetailPost(post)}
                    className="relative aspect-square group cursor-pointer overflow-hidden rounded-[2px] md:rounded-md bg-black border border-[#262626]/40"
                  >
                    <img
                      src={post.imageUrl || FALLBACK_IMAGE}
                      alt={post.caption || 'Post image'}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-5 text-white text-sm font-bold pointer-events-none">
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
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full border-2 border-neutral-700 flex items-center justify-center text-neutral-300">
                  <Camera size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">No Posts Yet</h3>
                <p className="text-sm text-neutral-400 max-w-xs">
                  {isOwnProfile
                    ? 'When you share photos, they will appear on your profile.'
                    : `When @${profileUser.username} shares photos, they will appear here.`}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="text-xs font-semibold text-[#0095f6] hover:text-white transition pt-1"
                  >
                    Share your first photo
                  </button>
                )}
              </div>
            )
          )}

          {/* Reels Tab */}
          {activeTab === 'reels' && (
            userReels.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {userReels.map((reel) => (
                  <div
                    key={reel._id || reel.id}
                    className="relative aspect-[9/16] group cursor-pointer overflow-hidden rounded-[2px] md:rounded-md bg-black border border-[#262626]/40"
                  >
                    <video
                      src={reel.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white text-sm font-bold">
                      <div className="flex items-center gap-1">
                        <Heart size={16} className="fill-white" />
                        <span>{reel.likesCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full border-2 border-neutral-700 flex items-center justify-center text-neutral-300">
                  <Clapperboard size={30} />
                </div>
                <h3 className="text-xl font-bold text-white">No Reels Yet</h3>
                <p className="text-sm text-neutral-400 max-w-xs">
                  {isOwnProfile
                    ? 'Capture and share reels with music and audio effects.'
                    : `No reels posted by @${profileUser.username} yet.`}
                </p>
                {isOwnProfile && (
                  <Link
                    to="/reels?create=1"
                    className="text-xs font-semibold text-[#0095f6] hover:text-white transition pt-1"
                  >
                    Create your first reel
                  </Link>
                )}
              </div>
            )
          )}

          {/* Saved Tab */}
          {activeTab === 'saved' && (
            userSavedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {userSavedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setActiveDetailPost(post)}
                    className="relative aspect-square group cursor-pointer overflow-hidden rounded-[2px] md:rounded-md bg-black border border-[#262626]/40"
                  >
                    <img
                      src={post.imageUrl || FALLBACK_IMAGE}
                      alt={post.caption || 'Saved post'}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-5 text-white text-sm font-bold pointer-events-none">
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
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full border-2 border-neutral-700 flex items-center justify-center text-neutral-300">
                  <Bookmark size={30} />
                </div>
                <h3 className="text-xl font-bold text-white">Save Photos and Videos</h3>
                <p className="text-sm text-neutral-400 max-w-xs">
                  Save items that you want to see again. No one is notified, and only you can see what you've saved.
                </p>
              </div>
            )
          )}
            </>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Followers / Following Modal */}
      {followModal.open && (
        <FollowListModal
          username={username}
          initialTab={followModal.tab}
          onClose={() => setFollowModal({ open: false, tab: 'followers' })}
        />
      )}

      {/* Highlight Viewer Modal */}
      <HighlightViewerModal
        highlight={activeHighlight}
        isOpen={!!activeHighlight}
        onClose={() => setActiveHighlight(null)}
        currentUsername={currentUser?.username}
        onDelete={(deletedId) => {
          setHighlights(prev => prev.filter(h => h._id !== deletedId && h.id !== deletedId));
        }}
      />

      {/* Create Highlight Modal */}
      <CreateHighlightModal
        isOpen={isCreateHighlightOpen}
        onClose={() => setIsCreateHighlightOpen(false)}
        onCreated={(newH) => {
          setHighlights(prev => [newH, ...prev]);
        }}
      />
    </>
  );
}

export default Profile;
