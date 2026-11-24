import React, { useMemo } from 'react';
import { Plus, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { Avatar } from './Avatar';

export function StoriesBar() {
  const { user } = useAuth();
  const { stories, setIsCreateStoryOpen, setActiveStoryGroup } = useFeed();

  // Group stories by author username
  const groupedStories = useMemo(() => {
    const groups = new Map();

    stories.forEach(story => {
      const username = story.author?.username;
      if (!username) return;

      if (!groups.has(username)) {
        groups.set(username, {
          author: story.author,
          stories: [],
          hasCloseFriendsStory: false,
        });
      }

      const group = groups.get(username);
      group.stories.push(story);
      if (story.isCloseFriendsOnly) {
        group.hasCloseFriendsStory = true;
      }
    });

    return Array.from(groups.values());
  }, [stories]);

  const handleOpenStories = (group) => {
    setActiveStoryGroup(group);
  };

  return (
    <div className="w-full mb-7 select-none">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-1">
        {/* Your Story / Add Story Button */}
        <div
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
          onClick={() => setIsCreateStoryOpen(true)}
        >
          <div className="relative transition-transform duration-200 group-hover:scale-[1.03]">
            <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-neutral-800 border border-neutral-700">
              <Avatar
                src={user?.avatarUrl || user?.avatar}
                name={user?.name || user?.fullName}
                username={user?.username}
                className="w-full h-full text-xl"
              />
            </div>
            {/* Plus icon badge */}
            <div className="absolute bottom-0 right-0 w-[20px] h-[20px] rounded-full bg-[#0095f6] border-2 border-black flex items-center justify-center text-white shadow-md">
              <Plus size={13} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[12px] text-neutral-400 mt-1.5 truncate max-w-[74px] text-center font-normal lowercase">
            your story
          </span>
        </div>

        {/* Stories from authors */}
        {groupedStories.map(group => {
          const isCloseFriend = group.hasCloseFriendsStory;
          const uname = (group.author.username || '').toLowerCase();

          return (
            <button
              key={group.author.username}
              onClick={() => handleOpenStories(group)}
              className="flex flex-col items-center flex-shrink-0 group cursor-pointer outline-none focus:outline-none transition-transform duration-200 group-hover:scale-[1.03]"
            >
              <div
                className={`relative w-[66px] h-[66px] p-[2.5px] rounded-full transition-transform duration-200 ${
                  isCloseFriend
                    ? 'bg-[#1cd14f] shadow-md shadow-[#1cd14f]/20'
                    : 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-md shadow-rose-500/10'
                }`}
              >
                <div className="w-full h-full rounded-full p-[2px] bg-black">
                  <Avatar
                    src={group.author.avatarUrl || group.author.avatar}
                    name={group.author.name || group.author.fullName}
                    username={group.author.username}
                    className="w-full h-full text-xl"
                  />
                </div>

                {/* Close Friends Green Star Badge */}
                {isCloseFriend && (
                  <div
                    className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-[#1cd14f] border-2 border-black flex items-center justify-center text-white shadow-sm"
                    title="Close Friends Only Story"
                  >
                    <Star size={9} fill="currentColor" />
                  </div>
                )}
              </div>
              <span className="text-[12px] text-neutral-300 mt-1.5 truncate max-w-[74px] text-center font-normal lowercase group-hover:text-white transition">
                {uname}
              </span>
            </button>
          );
        })}

        {groupedStories.length === 0 && (
          <div className="text-xs text-neutral-500 flex items-center pl-2 italic">
            No active 24-hr stories right now. Tap Your Story to post one!
          </div>
        )}
      </div>
    </div>
  );
}
