import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { postApi } from '../api/postApi';
import { storyApi } from '../api/storyApi';
import { userApi } from '../api/userApi';
import { useAuth } from './AuthContext';

const FeedContext = createContext(null);

export function FeedProvider({ children }) {
  const { user, updateUserSession } = useAuth();

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isCloseFriendsModalOpen, setIsCloseFriendsModalOpen] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null); // { author, stories: [] }
  const [activeDetailPost, setActiveDetailPost] = useState(null);

  // Fetch feed and stories
  const refreshFeed = useCallback(async () => {
    try {
      const [fetchedPosts, fetchedStories] = await Promise.all([
        postApi.getPosts(),
        storyApi.getStories(user?.username),
      ]);
      setPosts(fetchedPosts);
      setStories(fetchedStories);

      if (user?.username) {
        const saved = await postApi.getSavedPostIds(user.username);
        setSavedPostIds(saved);
      }
    } catch (err) {
      console.error('Error refreshing feed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    refreshFeed();
  }, [refreshFeed]);

  // Create post
  const createPost = async ({ imageUrl, caption, location, mediaType, isReel }) => {
    if (!user) throw new Error('You must be logged in to create a post');
    const newPost = await postApi.createPost({
      author: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
      imageUrl,
      caption,
      location,
      mediaType,
      isReel,
    });
    setPosts(prev => [newPost, ...prev]);
    setIsCreatePostOpen(false);
    return newPost;
  };

  // Delete post (allowed for post author or admin)
  const deletePost = async (postId) => {
    await postApi.deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (activeDetailPost?.id === postId) {
      setActiveDetailPost(null);
    }
  };

  // Toggle Like
  const toggleLike = async (postId) => {
    if (!user) return;
    const updatedPost = await postApi.toggleLike(postId, user.username);
    setPosts(prev => prev.map(p => (p.id === postId ? updatedPost : p)));
    if (activeDetailPost?.id === postId) {
      setActiveDetailPost(updatedPost);
    }
  };

  // Add Comment
  const addComment = async (postId, text) => {
    if (!user || !text.trim()) return;
    const commentAuthor = {
      username: user.username,
      avatar: user.avatar,
    };
    const updatedPost = await postApi.addComment(postId, { author: commentAuthor, text });
    setPosts(prev => prev.map(p => (p.id === postId ? updatedPost : p)));
    if (activeDetailPost?.id === postId) {
      setActiveDetailPost(updatedPost);
    }
    return updatedPost;
  };

  // Toggle Save Post
  const toggleSave = async (postId) => {
    if (!user) return;
    const updatedSaved = await postApi.toggleSavePost(postId, user.username);
    setSavedPostIds(updatedSaved);
  };

  // Create Story
  const createStory = async ({ imageUrl, caption, isCloseFriendsOnly }) => {
    if (!user) throw new Error('You must be logged in to share a story');
    const newStory = await storyApi.createStory({
      author: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        closeFriends: user.closeFriends || [],
      },
      imageUrl,
      caption,
      isCloseFriendsOnly: Boolean(isCloseFriendsOnly),
    });

    setStories(prev => [newStory, ...prev]);
    setIsCreateStoryOpen(false);
    return newStory;
  };

  // Toggle Follow
  const toggleFollow = async (targetUsername) => {
    if (!user) return;
    const result = await userApi.toggleFollow(user.username, targetUsername);
    if (result?.currentUser) {
      updateUserSession(result.currentUser);
    }
    return result;
  };

  // Toggle Close Friend
  const toggleCloseFriend = async (targetUsername) => {
    if (!user) return;
    const updatedCloseFriends = await userApi.toggleCloseFriend(user.username, targetUsername);
    if (updatedCloseFriends) {
      const updatedUser = { ...user, closeFriends: updatedCloseFriends };
      updateUserSession(updatedUser);
      // Re-fetch stories to update close friend visibility
      const refetchedStories = await storyApi.getStories(user.username);
      setStories(refetchedStories);
    }
  };

  const value = {
    posts,
    stories,
    savedPostIds,
    loading,
    refreshFeed,
    createPost,
    deletePost,
    toggleLike,
    addComment,
    toggleSave,
    createStory,
    toggleFollow,
    toggleCloseFriend,

    // Modal controls
    isCreatePostOpen,
    setIsCreatePostOpen,
    isCreateStoryOpen,
    setIsCreateStoryOpen,
    isCloseFriendsModalOpen,
    setIsCloseFriendsModalOpen,
    activeStoryGroup,
    setActiveStoryGroup,
    activeDetailPost,
    setActiveDetailPost,
  };

  return (
    <FeedContext.Provider value={value}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
}
