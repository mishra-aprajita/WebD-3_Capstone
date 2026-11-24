// Local storage persistence manager for mock fallback state in Phase 1
import { INITIAL_USERS, INITIAL_POSTS, INITIAL_STORIES, INITIAL_MESSAGES } from './mockData';

const STORAGE_KEYS = {
  USERS: 'snapgram_users_v1',
  POSTS: 'snapgram_posts_v1',
  STORIES: 'snapgram_stories_v1',
  SAVED: 'snapgram_saved_v1',
  MESSAGES: 'snapgram_messages_v1',
};

function safeGet(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Storage get error for', key, e);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage set error for', key, e);
  }
}

export function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    safeSet(STORAGE_KEYS.POSTS, INITIAL_POSTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STORIES)) {
    safeSet(STORAGE_KEYS.STORIES, INITIAL_STORIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SAVED)) {
    safeSet(STORAGE_KEYS.SAVED, {
      alex_creator: ['post_2', 'post_3'],
      sarah_admin: ['post_1'],
    });
  }
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    safeSet(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  }
}

// User methods
export function getMockUsers() {
  initStorage();
  return safeGet(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function getMockUserByUsername(username) {
  const users = getMockUsers();
  return users.find(u => u.username.toLowerCase() === (username || '').toLowerCase()) || null;
}

export function updateMockUser(username, updates) {
  const users = getMockUsers();
  const index = users.findIndex(u => u.username.toLowerCase() === (username || '').toLowerCase());
  if (index !== -1) {
    const patched = { ...updates };
    if (patched.avatarUrl !== undefined) patched.avatar = patched.avatarUrl;
    else if (patched.avatar !== undefined) patched.avatarUrl = patched.avatar;
    if (patched.fullName !== undefined) patched.name = patched.fullName;
    else if (patched.name !== undefined) patched.fullName = patched.name;

    users[index] = { ...users[index], ...patched };
    safeSet(STORAGE_KEYS.USERS, users);
    return users[index];
  }
  return null;
}

// Post methods
export function getMockPosts() {
  initStorage();
  return safeGet(STORAGE_KEYS.POSTS, INITIAL_POSTS);
}

export function createMockPost(newPostData) {
  const posts = getMockPosts();
  const newPost = {
    id: `post_${Date.now()}`,
    likes: [],
    likesCount: 0,
    comments: [],
    createdAt: new Date().toISOString(),
    ...newPostData,
  };
  const updated = [newPost, ...posts];
  safeSet(STORAGE_KEYS.POSTS, updated);

  // Increment user's posts count
  if (newPost.author?.username) {
    const user = getMockUserByUsername(newPost.author.username);
    if (user) {
      updateMockUser(user.username, { postsCount: (user.postsCount || 0) + 1 });
    }
  }

  return newPost;
}

export function toggleMockLikePost(postId, username) {
  const posts = getMockPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return null;

  const hasLiked = (post.likes || []).includes(username);
  if (hasLiked) {
    post.likes = post.likes.filter(u => u !== username);
    post.likesCount = Math.max(0, (post.likesCount || 1) - 1);
  } else {
    post.likes = [...(post.likes || []), username];
    post.likesCount = (post.likesCount || 0) + 1;
  }

  safeSet(STORAGE_KEYS.POSTS, posts);
  return post;
}

export function addMockComment(postId, commentData) {
  const posts = getMockPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return null;

  const newComment = {
    id: `c_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...commentData,
  };

  post.comments = [...(post.comments || []), newComment];
  safeSet(STORAGE_KEYS.POSTS, posts);
  return post;
}

export function deleteMockPost(postId) {
  const posts = getMockPosts();
  const target = posts.find(p => p.id === postId);
  const updated = posts.filter(p => p.id !== postId);
  safeSet(STORAGE_KEYS.POSTS, updated);

  if (target?.author?.username) {
    const user = getMockUserByUsername(target.author.username);
    if (user) {
      updateMockUser(user.username, { postsCount: Math.max(0, (user.postsCount || 1) - 1) });
    }
  }
  return true;
}

// Stories methods - 24hr validity & Close Friends privacy enforcement
export function getMockStories(viewerUsername) {
  initStorage();
  const rawStories = safeGet(STORAGE_KEYS.STORIES, INITIAL_STORIES);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  // 1. Filter out expired stories (> 24 hours)
  const activeStories = rawStories.filter(story => {
    const createdTime = new Date(story.createdAt).getTime();
    return createdTime >= cutoff;
  });

  // 2. Filter close friends privacy:
  // If story.isCloseFriendsOnly is true, only viewers who are in author's closeFriends
  // OR the author themselves can view it!
  const users = getMockUsers();
  return activeStories.filter(story => {
    if (!story.isCloseFriendsOnly) return true;

    // Is viewer the author?
    if (viewerUsername && story.author?.username?.toLowerCase() === viewerUsername.toLowerCase()) {
      return true;
    }

    // Is viewer in author's close friends list?
    const authorUser = users.find(u => u.username.toLowerCase() === (story.author?.username || '').toLowerCase());
    const authorCloseFriends = authorUser?.closeFriends || story.author?.closeFriends || [];
    return viewerUsername && authorCloseFriends.includes(viewerUsername);
  });
}

export function createMockStory(storyData) {
  initStorage();
  const rawStories = safeGet(STORAGE_KEYS.STORIES, INITIAL_STORIES);
  const newStory = {
    id: `story_${Date.now()}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    viewers: [],
    ...storyData,
  };

  const updated = [newStory, ...rawStories];
  safeSet(STORAGE_KEYS.STORIES, updated);
  return newStory;
}

// Saved posts
export function getMockSavedPostIds(username) {
  initStorage();
  const savedMap = safeGet(STORAGE_KEYS.SAVED, {});
  return savedMap[username] || [];
}

export function toggleMockSavePost(postId, username) {
  initStorage();
  const savedMap = safeGet(STORAGE_KEYS.SAVED, {});
  const userList = savedMap[username] || [];
  const exists = userList.includes(postId);

  const updatedList = exists
    ? userList.filter(id => id !== postId)
    : [...userList, postId];

  savedMap[username] = updatedList;
  safeSet(STORAGE_KEYS.SAVED, savedMap);
  return updatedList;
}

// Follow / Unfollow
export function toggleMockFollow(currentUsername, targetUsername) {
  if (currentUsername === targetUsername) return null;
  const users = getMockUsers();
  const currentUser = users.find(u => u.username === currentUsername);
  const targetUser = users.find(u => u.username === targetUsername);

  if (!currentUser || !targetUser) return null;

  const isFollowing = (currentUser.following || []).includes(targetUsername);

  if (isFollowing) {
    currentUser.following = currentUser.following.filter(u => u !== targetUsername);
    currentUser.followingCount = Math.max(0, (currentUser.followingCount || 1) - 1);
    targetUser.followers = (targetUser.followers || []).filter(u => u !== currentUsername);
    targetUser.followersCount = Math.max(0, (targetUser.followersCount || 1) - 1);
  } else {
    currentUser.following = [...(currentUser.following || []), targetUsername];
    currentUser.followingCount = (currentUser.followingCount || 0) + 1;
    targetUser.followers = [...(targetUser.followers || []), currentUsername];
    targetUser.followersCount = (targetUser.followersCount || 0) + 1;
  }

  safeSet(STORAGE_KEYS.USERS, users);
  return { currentUser, targetUser, isFollowing: !isFollowing };
}

// Close Friends toggle
export function toggleMockCloseFriend(currentUsername, targetUsername) {
  const users = getMockUsers();
  const currentUser = users.find(u => u.username === currentUsername);
  if (!currentUser) return null;

  const closeFriends = currentUser.closeFriends || [];
  const isClose = closeFriends.includes(targetUsername);

  if (isClose) {
    currentUser.closeFriends = closeFriends.filter(u => u !== targetUsername);
  } else {
    currentUser.closeFriends = [...closeFriends, targetUsername];
  }

  safeSet(STORAGE_KEYS.USERS, users);
  return currentUser.closeFriends;
}

// ----------------- DIRECT MESSAGES (DM) METHODS -----------------

export function getMockMessages() {
  initStorage();
  return safeGet(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
}

/**
 * Returns list of conversation summaries for a user
 * { user, lastMessage, unreadCount }
 */
export function getMockConversations(currentUsername) {
  if (!currentUsername) return [];
  const messages = getMockMessages();
  const users = getMockUsers();

  const convMap = new Map();

  // Find all messages involving current user
  messages.forEach(msg => {
    const isSender = msg.sender?.toLowerCase() === currentUsername.toLowerCase();
    const isReceiver = msg.receiver?.toLowerCase() === currentUsername.toLowerCase();

    if (!isSender && !isReceiver) return;

    const partnerUsername = isSender ? msg.receiver : msg.sender;
    const partnerKey = partnerUsername.toLowerCase();

    if (!convMap.has(partnerKey)) {
      const partnerUser = users.find(u => u.username.toLowerCase() === partnerKey) || {
        username: partnerUsername,
        name: partnerUsername,
        avatar: '',
      };

      convMap.set(partnerKey, {
        user: partnerUser,
        lastMessage: msg,
        unreadCount: 0,
      });
    }

    const conv = convMap.get(partnerKey);

    // Track latest message
    if (new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
      conv.lastMessage = msg;
    }

    // Increment unread count if message was sent to current user and unread
    if (isReceiver && !msg.isRead) {
      conv.unreadCount += 1;
    }
  });

  // Sort conversations by latest message timestamp descending
  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
  );
}

/**
 * Get all messages between current user and target user
 */
export function getMockMessagesWithUser(currentUsername, targetUsername) {
  if (!currentUsername || !targetUsername) return [];
  const messages = getMockMessages();
  const cur = currentUsername.toLowerCase();
  const tgt = targetUsername.toLowerCase();

  return messages
    .filter(msg => {
      const s = (msg.sender || '').toLowerCase();
      const r = (msg.receiver || '').toLowerCase();
      return (s === cur && r === tgt) || (s === tgt && r === cur);
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Send a new direct message
 */
export function sendMockMessage({ senderUsername, receiverUsername, text, sharedPost = null }) {
  const messages = getMockMessages();
  const newMessage = {
    _id: `msg_${Date.now()}`,
    sender: senderUsername,
    receiver: receiverUsername,
    text: text || '',
    sharedPost: sharedPost || null,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [...messages, newMessage];
  safeSet(STORAGE_KEYS.MESSAGES, updated);

  // Auto-reply simulation for realistic feel in mock mode (delayed by 2s)
  if (senderUsername.toLowerCase() !== receiverUsername.toLowerCase()) {
    setTimeout(() => {
      const currentMsgs = safeGet(STORAGE_KEYS.MESSAGES, updated);
      const autoReplies = [
        "Sounds awesome! Loved your latest post on Snapgram 📸",
        "Got it! Let me check that out right now 🙌",
        "Totally agree! Let's talk more about this soon.",
        "Hey, thanks for reaching out! Super cool shot you shared.",
        "Awesome! Appreciate the message! ✨"
      ];
      const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];

      const replyMsg = {
        _id: `msg_${Date.now() + 1}`,
        sender: receiverUsername,
        receiver: senderUsername,
        text: randomReply,
        sharedPost: null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      safeSet(STORAGE_KEYS.MESSAGES, [...currentMsgs, replyMsg]);
    }, 2000);
  }

  return newMessage;
}

/**
 * Mark messages from a specific sender to current user as read
 */
export function markMockMessagesAsRead(currentUsername, senderUsername) {
  if (!currentUsername || !senderUsername) return [];
  const messages = getMockMessages();
  const cur = currentUsername.toLowerCase();
  const snd = senderUsername.toLowerCase();

  let modified = false;
  const updated = messages.map(msg => {
    if (
      (msg.receiver || '').toLowerCase() === cur &&
      (msg.sender || '').toLowerCase() === snd &&
      !msg.isRead
    ) {
      modified = true;
      return { ...msg, isRead: true };
    }
    return msg;
  });

  if (modified) {
    safeSet(STORAGE_KEYS.MESSAGES, updated);
  }
  return true;
}

/**
 * Get total unread messages count for current user
 */
export function getMockUnreadMessagesCount(currentUsername) {
  if (!currentUsername) return 0;
  const messages = getMockMessages();
  const cur = currentUsername.toLowerCase();

  return messages.filter(
    msg => (msg.receiver || '').toLowerCase() === cur && !msg.isRead
  ).length;
}

const STORAGE_KEYS_EXTRA = {
  HIGHLIGHTS: 'snapgram_highlights_v1',
  ARCHIVED_STORIES: 'snapgram_archived_stories_v1',
};

export function getMockBlockedUsers(currentUsername) {
  if (!currentUsername) return [];
  const users = getMockUsers();
  const cur = users.find(u => u.username.toLowerCase() === currentUsername.toLowerCase());
  if (!cur || !Array.isArray(cur.blockedUsers)) return [];
  return cur.blockedUsers.map(b => (typeof b === 'object' ? b : { username: b, name: b, avatar: '', bio: '' }));
}

export function toggleMockBlock(currentUsername, targetUsername) {
  const users = getMockUsers();
  const curIndex = users.findIndex(u => u.username.toLowerCase() === currentUsername?.toLowerCase());
  if (curIndex === -1) return { isBlocked: false };

  const cur = users[curIndex];
  const blockedList = Array.isArray(cur.blockedUsers) ? [...cur.blockedUsers] : [];
  const targetLower = targetUsername.toLowerCase();
  const existingIdx = blockedList.findIndex(
    b => (typeof b === 'string' ? b.toLowerCase() : b.username.toLowerCase()) === targetLower
  );

  let isBlocked = false;
  if (existingIdx !== -1) {
    blockedList.splice(existingIdx, 1);
    isBlocked = false;
  } else {
    blockedList.push({ username: targetUsername, name: targetUsername, avatar: '', bio: '' });
    isBlocked = true;
  }

  cur.blockedUsers = blockedList;
  users[curIndex] = cur;
  safeSet(STORAGE_KEYS.USERS, users);
  return { isBlocked, targetUser: { username: targetUsername } };
}

export function updateMockPassword(currentUsername, currentPassword, newPassword) {
  return { success: true, message: 'Password updated successfully' };
}

export function getMockArchivedStories(currentUsername) {
  const allStories = safeGet(STORAGE_KEYS_EXTRA.ARCHIVED_STORIES, null);
  if (!allStories) {
    const active = getMockStories();
    const userStories = active.filter(s => (s.author?.username || '').toLowerCase() === currentUsername?.toLowerCase());
    return userStories;
  }
  return allStories.filter(s => (s.author?.username || '').toLowerCase() === currentUsername?.toLowerCase());
}

export function getMockHighlights(username) {
  const all = safeGet(STORAGE_KEYS_EXTRA.HIGHLIGHTS, []);
  return all.filter(h => (h.owner?.username || h.ownerUsername || '').toLowerCase() === username?.toLowerCase());
}

export function createMockHighlight({ username, title, coverUrl, items }) {
  const all = safeGet(STORAGE_KEYS_EXTRA.HIGHLIGHTS, []);
  const newH = {
    _id: `hl_${Date.now()}`,
    id: `hl_${Date.now()}`,
    title,
    coverUrl: coverUrl || items?.[0]?.mediaUrl || '',
    items: items || [],
    owner: { username },
    createdAt: new Date().toISOString(),
  };
  safeSet(STORAGE_KEYS_EXTRA.HIGHLIGHTS, [newH, ...all]);
  return newH;
}

export function deleteMockHighlight(id) {
  const all = safeGet(STORAGE_KEYS_EXTRA.HIGHLIGHTS, []);
  const filtered = all.filter(h => h._id !== id && h.id !== id);
  safeSet(STORAGE_KEYS_EXTRA.HIGHLIGHTS, filtered);
  return { success: true };
}

