import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Shield,
  User,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { userApi } from '../api/userApi';
import { FALLBACK_IMAGE } from '../mock/mockData';
import { Avatar } from '../components/Avatar';

export function AdminDashboard() {
  const { user } = useAuth();
  const { posts, stories, deletePost, setActiveDetailPost } = useFeed();

  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'users'
  const [actionNotice, setActionNotice] = useState('');

  const loadUsers = async () => {
    try {
      const fetched = await userApi.getAllUsers();
      setAllUsers(fetched);
    } catch (e) {
      console.error('Failed to load users for admin', e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    await userApi.updateUserRole(targetUser.id, newRole);
    await loadUsers();
    showNotice(`Updated @${targetUser.username} role to "${newRole}".`);
  };

  const handleModeratePost = async (postId, authorUsername) => {
    if (window.confirm(`Admin Moderation: Delete post by @${authorUsername}?`)) {
      await deletePost(postId);
      showNotice(`Post ${postId} deleted by Administrator.`);
    }
  };

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-rose-950/30 border border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-md">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Admin Moderation Console</h1>
              <span className="text-[11px] bg-rose-500 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                RBAC LIVE
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Logged in as <span className="text-white font-medium">@{user?.username}</span> with administrative clearance.
            </p>
          </div>
        </div>

        {actionNotice && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-2 rounded-xl">
            <CheckCircle size={14} />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Accounts</span>
            <Users size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white">{allUsers.length}</div>
          <div className="text-[11px] text-neutral-500">Registered platform users</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Feed Posts</span>
            <ImageIcon size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white">{posts.length}</div>
          <div className="text-[11px] text-neutral-500">Live community photos</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Stories</span>
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stories.length}</div>
          <div className="text-[11px] text-neutral-500">Within 24h validity window</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Admin Staff</span>
            <Shield size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {allUsers.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-[11px] text-neutral-500">Privileged supervisors</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'posts'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <ImageIcon size={16} />
          <span>Post Content Moderation ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'users'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Users size={16} />
          <span>User & RBAC Permissions ({allUsers.length})</span>
        </button>
      </div>

      {/* Tab: Post Moderation */}
      {activeTab === 'posts' && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/60 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Post Media</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Caption</th>
                  <th className="py-3.5 px-4">Engagement</th>
                  <th className="py-3.5 px-4">Published</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-neutral-900/40 transition">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setActiveDetailPost(post)}
                        className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 cursor-pointer ring-1 ring-neutral-800 group relative"
                        title="Click to view details"
                      >
                        <img
                          src={post.imageUrl || FALLBACK_IMAGE}
                          alt="Thumbnail"
                          className="w-full h-full object-cover group-hover:opacity-80 transition"
                          onError={e => { e.target.src = FALLBACK_IMAGE; }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">@{post.author?.username}</div>
                      <div className="text-[11px] text-neutral-500">{post.location || 'No location'}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="truncate text-neutral-300">{post.caption || 'No caption'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">{post.likesCount || 0}</span> likes •{' '}
                      <span className="font-medium text-white">{post.comments?.length || 0}</span> comments
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveDetailPost(post)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                          title="Preview Post"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => handleModeratePost(post.id, post.author?.username)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition font-medium text-xs"
                          title="Delete as Administrator"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/60 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role (RBAC)</th>
                  <th className="py-3.5 px-4">Audience</th>
                  <th className="py-3.5 px-4">Close Friends</th>
                  <th className="py-3.5 px-4 text-right">Manage Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                {allUsers.map((target) => {
                  const isCurrent = target.username === user?.username;
                  const isAdminRole = target.role === 'admin';

                  return (
                    <tr key={target.id || target.username} className="hover:bg-neutral-900/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={target.avatarUrl || target.avatar}
                            name={target.name || target.fullName}
                            username={target.username}
                            className="w-8 h-8 ring-1 ring-neutral-700"
                          />
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>@{target.username}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-neutral-800 px-1 rounded text-neutral-400">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500">{target.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                        {target.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isAdminRole
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {isAdminRole ? <Shield size={10} /> : <User size={10} />}
                          <span className="capitalize">{target.role}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">{target.followersCount || 0}</span> followers •{' '}
                        <span className="font-medium text-white">{target.followingCount || 0}</span> following
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-mono">
                          {target.closeFriends?.length || 0} members
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRoleToggle(target)}
                          disabled={isCurrent}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isAdminRole
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {isAdminRole ? 'Demote to User' : 'Promote to Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
