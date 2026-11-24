import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Lock,
  KeyRound,
  UserX,
  Star,
  Archive as ArchiveIcon,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { Avatar } from '../components/Avatar';

export function Settings() {
  const { user, updateUserSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'edit-profile';

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-5xl mx-auto px-4 py-8">
      {/* Top Mobile Bar */}
      <div className="md:hidden flex items-center gap-3 mb-6 pb-4 border-b border-[#262626]">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-[#262626] text-neutral-300"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="bg-[#121212] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[620px]">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#262626] bg-black/60 p-4 shrink-0">
          <div className="hidden md:block mb-6 px-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Settings</h2>
          </div>

          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
            <TabButton
              active={activeTab === 'edit-profile'}
              onClick={() => setTab('edit-profile')}
              icon={User}
              label="Edit Profile"
            />
            <TabButton
              active={activeTab === 'privacy'}
              onClick={() => setTab('privacy')}
              icon={Lock}
              label="Account Privacy"
            />
            <TabButton
              active={activeTab === 'password'}
              onClick={() => setTab('password')}
              icon={KeyRound}
              label="Change Password"
            />
            <TabButton
              active={activeTab === 'blocked'}
              onClick={() => setTab('blocked')}
              icon={UserX}
              label="Blocked Accounts"
            />
            <TabButton
              active={activeTab === 'close-friends'}
              onClick={() => setTab('close-friends')}
              icon={Star}
              label="Close Friends"
            />
            <Link
              to="/archive"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#262626] transition"
            >
              <ArchiveIcon size={18} />
              <span>Story Archive</span>
            </Link>
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 p-6 md:p-8 bg-[#121212] overflow-y-auto">
          {activeTab === 'edit-profile' && <EditProfilePanel user={user} onUpdate={updateUserSession} />}
          {activeTab === 'privacy' && <PrivacyPanel user={user} onUpdate={updateUserSession} />}
          {activeTab === 'password' && <ChangePasswordPanel user={user} />}
          {activeTab === 'blocked' && <BlockedAccountsPanel user={user} />}
          {activeTab === 'close-friends' && <CloseFriendsPanel user={user} onUpdate={updateUserSession} />}
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition text-left w-full ${
        active
          ? 'bg-[#262626] text-white shadow-sm'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
      }`}
    >
      <Icon size={18} className={active ? 'text-white' : 'text-neutral-400'} />
      <span>{label}</span>
    </button>
  );
}

// 1. Edit Profile Panel
function EditProfilePanel({ user, onUpdate }) {
  const [name, setName] = useState(user?.name || user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || user?.avatar || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updates = {
        name: name.trim(),
        fullName: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        avatar: avatarUrl.trim(),
        website: website.trim(),
      };

      const updated = await userApi.updateMe(updates, user.username);
      onUpdate({ ...user, ...updates, ...updated });
      setMessage('Profile updated successfully.');
    } catch (err) {
      console.error('Update profile error', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="border-b border-[#262626] pb-4">
        <h3 className="text-lg font-bold text-white">Edit Profile</h3>
        <p className="text-xs text-neutral-400">Keep your public profile details up to date</p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Avatar Preview & URL */}
      <div className="flex items-center gap-5 p-4 rounded-2xl bg-black/40 border border-[#262626]">
        <Avatar
          src={avatarUrl}
          name={name || username}
          username={username}
          className="w-16 h-16 ring-2 ring-[#262626]"
        />
        <div className="flex-1 space-y-1">
          <div className="font-semibold text-sm text-white">@{username}</div>
          <p className="text-xs text-neutral-400">
            Paste an image URL below, or leave blank to show your clean initials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Avatar Image URL
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl px-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl px-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Username
          </label>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl px-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Bio
          </label>
          <textarea
            rows={3}
            placeholder="Write a brief bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl px-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition resize-none"
          />
          <span className="text-[11px] text-neutral-500 float-right mt-1">{bio.length}/150</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Website
          </label>
          <input
            type="text"
            placeholder="https://yourwebsite.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl px-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 px-6 py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white font-semibold text-sm transition shadow-md"
        >
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

// 2. Privacy Panel
function PrivacyPanel({ user, onUpdate }) {
  const [isPrivate, setIsPrivate] = useState(!!user?.isPrivate);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const togglePrivacy = async () => {
    const nextVal = !isPrivate;
    setSaving(true);
    setMessage('');
    try {
      await userApi.updateMe({ isPrivate: nextVal }, user.username);
      setIsPrivate(nextVal);
      onUpdate({ ...user, isPrivate: nextVal });
      setMessage(nextVal ? 'Account is now Private.' : 'Account is now Public.');
    } catch (err) {
      console.error('Failed to update privacy', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="border-b border-[#262626] pb-4">
        <h3 className="text-lg font-bold text-white">Account Privacy</h3>
        <p className="text-xs text-neutral-400">Control who can see your photos and videos</p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}

      <div className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-[#262626]">
        <div className="space-y-1 pr-6">
          <span className="font-semibold text-sm text-white block">Private account</span>
          <p className="text-xs text-neutral-400 leading-relaxed">
            When your account is private, only people you approve can see your photos, reels, and stories.
          </p>
        </div>

        <button
          onClick={togglePrivacy}
          disabled={saving}
          className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none shrink-0 ${
            isPrivate ? 'bg-[#0095f6]' : 'bg-neutral-700'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              isPrivate ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// 3. Change Password Panel
function ChangePasswordPanel({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword }, user.username);
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password error', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="border-b border-[#262626] pb-4">
        <h3 className="text-lg font-bold text-white">Change Password</h3>
        <p className="text-xs text-neutral-400">Protect your account with a secure password</p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl px-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <input
            type={showPass ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl px-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Confirm New Password
          </label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl px-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword}
          className="mt-4 px-6 py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white font-semibold text-sm transition shadow-md"
        >
          {saving ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

// 4. Blocked Accounts Panel
function BlockedAccountsPanel({ user }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocked();
  }, [user]);

  const loadBlocked = async () => {
    setLoading(true);
    try {
      const data = await userApi.getBlockedUsers(user.username);
      setBlockedUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load blocked accounts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (targetUsernameOrId) => {
    try {
      await userApi.toggleBlock(targetUsernameOrId, user.username);
      setBlockedUsers(prev =>
        prev.filter(u => u.username !== targetUsernameOrId && u.id !== targetUsernameOrId && u._id !== targetUsernameOrId)
      );
    } catch (err) {
      console.error('Unblock failed', err);
      alert('Failed to unblock user');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="border-b border-[#262626] pb-4">
        <h3 className="text-lg font-bold text-white">Blocked Accounts</h3>
        <p className="text-xs text-neutral-400">
          Blocked users cannot message you, see your stories, or view your posts
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-sm">
          You haven't blocked anyone.
        </div>
      ) : (
        <div className="space-y-2">
          {blockedUsers.map((b) => (
            <div
              key={b.id || b._id || b.username}
              className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-[#262626]"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={b.avatarUrl || b.avatar}
                  name={b.name || b.username}
                  username={b.username}
                  className="w-10 h-10"
                />
                <div>
                  <div className="text-sm font-semibold text-white">@{b.username}</div>
                  <div className="text-xs text-neutral-400">{b.name || 'Snapgram user'}</div>
                </div>
              </div>

              <button
                onClick={() => handleUnblock(b.username || b.id || b._id)}
                className="px-4 py-1.5 rounded-xl bg-[#262626] hover:bg-[#363636] text-white text-xs font-semibold transition"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 5. Close Friends Panel
function CloseFriendsPanel({ user, onUpdate }) {
  const [closeFriends, setCloseFriends] = useState(user?.closeFriends || []);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await userApi.searchUsers(query);
        setResults(Array.isArray(found) ? found.filter(u => u.username !== user.username) : []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query, user.username]);

  const toggleFriend = async (targetUsername) => {
    try {
      const res = await userApi.toggleCloseFriend(user.username, targetUsername);
      const updatedList = Array.isArray(res) ? res : [];
      setCloseFriends(updatedList);
      onUpdate({ ...user, closeFriends: updatedList });
    } catch (err) {
      console.error('Toggle close friend failed', err);
    }
  };

  const isFriend = (uName) => {
    return closeFriends.some(f => (typeof f === 'string' ? f : f.username) === uName);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="border-b border-[#262626] pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-white">Close Friends</h3>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
            {closeFriends.length}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Share exclusive 24-hr stories with your green-ring Close Friends circle
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Search accounts to add..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#1c1c1c] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-[#262626] focus:outline-none focus:border-neutral-500 transition"
        />
      </div>

      {/* Results or Current List */}
      <div className="space-y-2">
        {query ? (
          <div>
            <span className="text-[11px] font-semibold uppercase text-neutral-500 tracking-wider block mb-2">
              Search Results
            </span>
            {loading ? (
              <div className="text-center py-6 text-neutral-500 text-xs">Searching...</div>
            ) : results.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs">No accounts found</div>
            ) : (
              results.map((u) => {
                const active = isFriend(u.username);
                return (
                  <div
                    key={u._id || u.username}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-900 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={u.avatarUrl || u.avatar}
                        name={u.name || u.username}
                        username={u.username}
                        className="w-10 h-10"
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">@{u.username}</div>
                        <div className="text-xs text-neutral-400">{u.name}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFriend(u.username)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#0095f6] text-white hover:bg-[#1877f2]'
                      }`}
                    >
                      {active ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div>
            <span className="text-[11px] font-semibold uppercase text-neutral-500 tracking-wider block mb-2">
              Your Close Friends List ({closeFriends.length})
            </span>
            {closeFriends.length === 0 ? (
              <div className="text-center py-10 text-neutral-500 text-sm">
                No close friends added yet. Search above to add friends!
              </div>
            ) : (
              closeFriends.map((f) => {
                const fUsername = typeof f === 'string' ? f : f.username;
                return (
                  <div
                    key={fUsername}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-[#262626]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={typeof f === 'object' ? f.avatarUrl || f.avatar : ''}
                        name={fUsername}
                        username={fUsername}
                        className="w-9 h-9"
                      />
                      <span className="text-sm font-semibold text-white">@{fUsername}</span>
                    </div>
                    <button
                      onClick={() => toggleFriend(fUsername)}
                      className="px-3 py-1 rounded-xl bg-[#262626] hover:bg-red-500/20 text-neutral-300 hover:text-red-400 text-xs font-semibold transition"
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
