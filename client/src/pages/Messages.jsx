import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  SquarePen,
  X,
  ExternalLink,
  Sparkles,
  User as UserIcon,
  Smile,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { useMessages } from '../context/MessageContext';
import { messageApi } from '../api/messageApi';
import { postApi } from '../api/postApi';
import { getMockUsers } from '../mock/mockStorage';
import { FALLBACK_IMAGE } from '../mock/mockData';
import { Avatar } from '../components/Avatar';
import { resolveMediaUrl } from '../utils/mediaUtils';

export function Messages() {
  const { user } = useAuth();
  const { posts, setActiveDetailPost } = useFeed();
  const { refreshUnreadCount, socket } = useMessages();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // User object of the active chat partner
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSharePostModalOpen, setIsSharePostModalOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const allPlatformUsers = getMockUsers();

  const queryTargetUsername = searchParams.get('user');

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user?.username) return;
    try {
      const list = await messageApi.getConversations(user.username);
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle URL query param: /messages?user=sarah_admin
  useEffect(() => {
    if (queryTargetUsername && user?.username) {
      // Find or construct partner
      const matchedUser = allPlatformUsers.find(
        (u) => u.username.toLowerCase() === queryTargetUsername.toLowerCase()
      );
      if (matchedUser) {
        setSelectedUser(matchedUser);
      } else {
        setSelectedUser({
          username: queryTargetUsername,
          name: queryTargetUsername,
          avatar: '',
        });
      }
    }
  }, [queryTargetUsername, user?.username]);

  // Load message history for selected user
  const loadMessagesWithSelected = useCallback(async () => {
    if (!user?.username || !selectedUser?.username) return;
    try {
      const history = await messageApi.getMessages(selectedUser.username, user.username);
      setMessages(history);

      // Mark messages as read
      await messageApi.markAsRead(selectedUser.username, user.username);
      refreshUnreadCount();
      loadConversations();
    } catch (err) {
      console.error('Failed to load message history', err);
    }
  }, [user?.username, selectedUser?.username, refreshUnreadCount, loadConversations]);

  // When selected user changes, load their messages
  useEffect(() => {
    if (selectedUser?.username) {
      setLoadingMessages(true);
      loadMessagesWithSelected().finally(() => setLoadingMessages(false));
    } else {
      setMessages([]);
    }
  }, [selectedUser?.username, loadMessagesWithSelected]);

  // Real-time Socket.io listener for incoming & sent messages
  useEffect(() => {
    if (!socket || !user?.username) return;

    const handleNewMessage = (newMsg) => {
      const partnerName = selectedUser?.username?.toLowerCase();
      const senderLower = newMsg.sender?.toLowerCase();
      const receiverLower = newMsg.receiver?.toLowerCase();

      if (partnerName && (senderLower === partnerName || receiverLower === partnerName)) {
        setMessages((prev) => {
          const msgId = newMsg.id || newMsg._id;
          if (prev.some((m) => (m.id || m._id) === msgId)) return prev;
          return [...prev, newMsg];
        });

        if (senderLower === partnerName) {
          messageApi.markAsRead(selectedUser.username, user.username).catch(() => {});
          refreshUnreadCount();
        }
      }

      loadConversations();
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, user?.username, selectedUser?.username, refreshUnreadCount, loadConversations]);

  // Fallback polling every 8 seconds only if Socket.io is not connected
  useEffect(() => {
    if (!selectedUser?.username || !user?.username || socket?.connected) return;

    const interval = setInterval(async () => {
      try {
        const latestHistory = await messageApi.getMessages(selectedUser.username, user.username);
        setMessages((prev) => {
          if (latestHistory.length !== prev.length) {
            messageApi.markAsRead(selectedUser.username, user.username);
            refreshUnreadCount();
            loadConversations();
            return latestHistory;
          }
          return prev;
        });
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedUser?.username, user?.username, socket?.connected, refreshUnreadCount, loadConversations]);

  // Auto-scroll to bottom of messages container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || !selectedUser || !user) return;

    setInputText('');

    try {
      const newMsg = await messageApi.sendMessage(selectedUser.username, {
        text: textToSend,
        currentUsername: user.username,
      });

      setMessages((prev) => {
        const msgId = newMsg.id || newMsg._id;
        if (prev.some((m) => (m.id || m._id) === msgId)) return prev;
        return [...prev, newMsg];
      });
      await loadConversations();
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Share post into conversation
  const handleSharePost = async (postToShare) => {
    if (!selectedUser || !user) return;
    setIsSharePostModalOpen(false);

    try {
      const newMsg = await messageApi.sendMessage(selectedUser.username, {
        text: `Shared a post by @${postToShare.author?.username}`,
        sharedPostId: postToShare.id || postToShare._id,
        sharedPost: {
          id: postToShare.id || postToShare._id,
          imageUrl: postToShare.imageUrl || postToShare.image || postToShare.images?.[0],
          image: postToShare.image || postToShare.imageUrl,
          images: postToShare.images || (postToShare.imageUrl ? [postToShare.imageUrl] : []),
          caption: postToShare.caption,
          author: {
            username: postToShare.author?.username,
            name: postToShare.author?.name,
            avatarUrl: postToShare.author?.avatarUrl || postToShare.author?.avatar,
          },
        },
        currentUsername: user.username,
      });

      setMessages((prev) => {
        const msgId = newMsg.id || newMsg._id;
        if (prev.some((m) => (m.id || m._id) === msgId)) return prev;
        return [...prev, newMsg];
      });
      await loadConversations();
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to share post', err);
    }
  };

  // Format timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const q = searchTerm.toLowerCase();
    return (
      conv.user?.username?.toLowerCase().includes(q) ||
      conv.user?.name?.toLowerCase().includes(q) ||
      conv.lastMessage?.text?.toLowerCase().includes(q)
    );
  });

  // Filtered users for new chat modal
  const searchableUsers = allPlatformUsers.filter(
    (u) =>
      u.username !== user?.username &&
      (u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] p-2 md:p-4">
      {/* Outer Container with Instagram Border & Radius */}
      <div className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        {/* ======================================================== */}
        {/* LEFT PANE: Conversations List                            */}
        {/* ======================================================== */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-neutral-800 flex flex-col h-full bg-black ${
            selectedUser ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">
                {user?.username}
              </span>
              <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                DMs
              </span>
            </div>

            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-xl transition"
              title="New Message"
            >
              <SquarePen size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-neutral-900">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-900">
            {loadingConversations ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-neutral-900" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-neutral-900 rounded w-1/2" />
                      <div className="h-2.5 bg-neutral-900 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const partner = conv.user;
                const isSelected = selectedUser?.username === partner.username;
                const hasUnread = conv.unreadCount > 0;
                const isSentByMe =
                  conv.lastMessage?.sender?.toLowerCase() === user?.username?.toLowerCase();

                return (
                  <button
                    key={partner.username}
                    onClick={() => {
                      setSelectedUser(partner);
                      setSearchParams({ user: partner.username });
                    }}
                    className={`w-full text-left p-3.5 flex items-center gap-3 transition ${
                      isSelected
                        ? 'bg-neutral-900/80'
                        : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={partner.avatarUrl || partner.avatar}
                        name={partner.name || partner.fullName}
                        username={partner.username}
                        className="w-12 h-12 ring-1 ring-neutral-800"
                      />
                      {/* Active green dot */}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm truncate ${
                            hasUnread ? 'font-bold text-white' : 'font-medium text-neutral-200'
                          }`}
                        >
                          {partner.username}
                        </span>
                        <span className="text-[11px] text-neutral-500 flex-shrink-0">
                          {formatTime(conv.lastMessage?.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p
                          className={`text-xs truncate ${
                            hasUnread
                              ? 'font-semibold text-white'
                              : 'text-neutral-400'
                          }`}
                        >
                          {isSentByMe ? 'You: ' : ''}
                          {conv.lastMessage?.text || 'Sent an attachment'}
                        </p>

                        {/* Unread badge dot */}
                        {hasUnread && (
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-neutral-500 space-y-3">
                <MessageCircle size={32} className="mx-auto opacity-30" />
                <p>No conversations found.</p>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition"
                >
                  Start a Chat
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT PANE: Active Chat Window                           */}
        {/* ======================================================== */}
        <section
          className={`flex-1 flex flex-col h-full bg-neutral-950/60 ${
            selectedUser ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchParams({});
                    }}
                    className="md:hidden p-1.5 text-neutral-400 hover:text-white"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <Link
                    to={`/profile/${selectedUser.username}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="relative">
                      <Avatar
                        src={selectedUser.avatarUrl || selectedUser.avatar}
                        name={selectedUser.name || selectedUser.fullName}
                        username={selectedUser.username}
                        className="w-10 h-10 ring-1 ring-neutral-700"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:underline flex items-center gap-1.5">
                        <span>{selectedUser.username}</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium">
                        Active now
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSharePostModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-xl border border-neutral-800 transition"
                    title="Share a post to this conversation"
                  >
                    <Sparkles size={14} className="text-amber-400" />
                    <span className="hidden sm:inline">Share Post</span>
                  </button>

                  <Link
                    to={`/profile/${selectedUser.username}`}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl transition"
                    title="View Profile"
                  >
                    <ExternalLink size={18} />
                  </Link>
                </div>
              </div>

              {/* Message Thread Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Profile intro card at top of thread */}
                <div className="text-center py-6 border-b border-neutral-900/80 mb-4 flex flex-col items-center">
                  <Avatar
                    src={selectedUser.avatarUrl || selectedUser.avatar}
                    name={selectedUser.name || selectedUser.fullName}
                    username={selectedUser.username}
                    className="w-16 h-16 mb-2 ring-2 ring-neutral-800 text-2xl"
                  />
                  <h4 className="text-base font-bold text-white">{selectedUser.name || selectedUser.username}</h4>
                  <p className="text-xs text-neutral-400">@{selectedUser.username} • Snapgram</p>
                  <Link
                    to={`/profile/${selectedUser.username}`}
                    className="inline-block mt-2 text-xs font-semibold px-3 py-1 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-neutral-300 transition"
                  >
                    View Profile
                  </Link>
                </div>

                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-instagram-blue border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const myId = String(user?._id || user?.id || '');
                    const msgSenderId = String(msg.sender?._id || msg.senderId || msg.sender || '');
                    const isMe =
                      (myId && msgSenderId === myId) ||
                      (typeof msg.sender === 'string' &&
                        msg.sender.toLowerCase() === user?.username?.toLowerCase()) ||
                      (msg.sender?.username &&
                        msg.sender.username.toLowerCase() === user?.username?.toLowerCase());

                    return (
                      <div
                        key={msg._id || msg.id}
                        className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex flex-col max-w-[78%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Bubble */}
                          <div
                            className={`w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md ${
                              isMe
                                ? 'bg-[#0095f6] text-white rounded-br-xs'
                                : 'bg-neutral-800 text-neutral-100 rounded-bl-xs border border-neutral-700/40'
                            }`}
                          >
                          {/* Shared Post Card Attachment */}
                          {msg.sharedPost && (
                            <div
                              onClick={async () => {
                                const spId = msg.sharedPost.id || msg.sharedPost._id;
                                const found = posts.find((p) => (p.id || p._id) === spId);
                                if (found) {
                                  setActiveDetailPost(found);
                                  return;
                                }
                                try {
                                  const fetched = await postApi.getPostById(spId);
                                  if (fetched) setActiveDetailPost(fetched);
                                } catch {
                                  setActiveDetailPost({
                                    ...msg.sharedPost,
                                    likes: [],
                                    comments: [],
                                  });
                                }
                              }}
                              className="mb-1.5 rounded-xl overflow-hidden bg-black/50 border border-white/15 cursor-pointer hover:opacity-95 transition group"
                            >
                              {/* Shared Post Author Header */}
                              <div className="flex items-center gap-2 px-2.5 py-2 bg-black/40 border-b border-white/10">
                                <Avatar
                                  src={msg.sharedPost.author?.avatarUrl || msg.sharedPost.author?.avatar}
                                  name={msg.sharedPost.author?.name || msg.sharedPost.author?.username}
                                  username={msg.sharedPost.author?.username}
                                  className="w-5 h-5"
                                />
                                <span className="text-xs font-semibold text-white truncate">
                                  @{msg.sharedPost.author?.username || 'user'}
                                </span>
                              </div>
                              <div className="aspect-square w-full max-h-56 bg-black relative">
                                <img
                                  src={resolveMediaUrl(
                                    msg.sharedPost.images?.[0] ||
                                      msg.sharedPost.imageUrl ||
                                      msg.sharedPost.image,
                                    FALLBACK_IMAGE
                                  )}
                                  alt="Shared post"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = FALLBACK_IMAGE;
                                  }}
                                />
                                {msg.sharedPost.images?.length > 1 && (
                                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    1/{msg.sharedPost.images.length}
                                  </div>
                                )}
                              </div>
                              {msg.sharedPost.caption && (
                                <p className="px-2.5 py-2 text-xs text-neutral-200 line-clamp-2">
                                  {msg.sharedPost.caption}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Message Text (hide redundant auto-prefix when rich card is shown) */}
                          {(!msg.sharedPost ||
                            (msg.text && !msg.text.startsWith('Shared a post by @'))) && (
                            <p className="break-words">{msg.text}</p>
                          )}
                        </div>

                        {/* Timestamp & Seen checkmark */}
                        <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-1 px-1">
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            msg.isRead ? (
                              <CheckCheck size={12} className="text-blue-400" />
                            ) : (
                              <Check size={12} className="text-neutral-500" />
                            )
                          )}
                        </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-neutral-500">
                    No messages here yet. Say hello to @{selectedUser.username}! 👋
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-neutral-800 bg-neutral-950 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Message @${selectedUser.username}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-instagram-blue hover:bg-instagram-blueHover text-white text-sm font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Send size={15} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            /* Empty State: No conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 rounded-full border-2 border-neutral-800 flex items-center justify-center text-neutral-400 mb-4 bg-neutral-900/50">
                <MessageCircle size={44} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Your Messages</h3>
              <p className="text-xs text-neutral-400 max-w-xs mb-6">
                Send private photos and direct messages to friends on Snapgram.
              </p>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-instagram-blue hover:bg-instagram-blueHover text-white text-xs font-semibold transition shadow-md shadow-blue-500/20"
              >
                Send Message
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ======================================================== */}
      {/* MODAL: New Message / Start Chat                          */}
      {/* ======================================================== */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            onClick={() => setIsNewChatModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">New Message</h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search User Input */}
            <div className="p-3 border-b border-neutral-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search by username or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-neutral-900">
              {searchableUsers.map((candidate) => (
                <button
                  key={candidate.username}
                  onClick={() => {
                    setSelectedUser(candidate);
                    setSearchParams({ user: candidate.username });
                    setIsNewChatModalOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-neutral-800/60 rounded-xl transition text-left"
                >
                  <Avatar
                    src={candidate.avatarUrl || candidate.avatar}
                    name={candidate.name || candidate.fullName}
                    username={candidate.username}
                    className="w-10 h-10 ring-1 ring-neutral-700"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {candidate.username}
                    </div>
                    <div className="text-xs text-neutral-400">{candidate.name}</div>
                  </div>
                </button>
              ))}

              {searchableUsers.length === 0 && (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No users found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Share a Post to Conversation                      */}
      {/* ======================================================== */}
      {isSharePostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            onClick={() => setIsSharePostModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                Share a Post with @{selectedUser?.username}
              </h3>
              <button
                onClick={() => setIsSharePostModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3 max-h-96">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleSharePost(post)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-black border border-neutral-800 cursor-pointer hover:border-instagram-blue transition"
                >
                  <img
                    src={post.imageUrl || FALLBACK_IMAGE}
                    alt={post.caption || 'Post thumbnail'}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                    <span className="text-[11px] font-bold">@{post.author?.username}</span>
                    <span className="text-[10px] text-neutral-300 truncate">{post.caption}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
