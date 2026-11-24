import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Image as ImageIcon, Calendar } from 'lucide-react';
import { storyApi } from '../api/storyApi';
import { useAuth } from '../context/AuthContext';
import { CreateHighlightModal } from '../components/CreateHighlightModal';
import { StoryModal } from '../components/StoryModal';

export function Archive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateHighlightOpen, setIsCreateHighlightOpen] = useState(false);
  const [selectedPreviewStory, setSelectedPreviewStory] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadArchive();
  }, [user]);

  const loadArchive = async () => {
    setLoading(true);
    try {
      const data = await storyApi.getArchivedStories(user.username);
      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load archive', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-4xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-[#262626] text-neutral-300 hover:text-white transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Stories Archive</h1>
            <p className="text-xs text-neutral-500">Only you can see your archived stories</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateHighlightOpen(true)}
          className="flex items-center gap-2 bg-[#262626] hover:bg-[#333333] text-white px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-700 transition shadow"
        >
          <Plus size={16} />
          <span>New Highlight</span>
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#1c1c1c] border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-base font-semibold text-white">No Stories Archived Yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            When you post a 24-hour story, Snapgram automatically saves a permanent copy to your archive so your memories are never lost.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {stories.map((story) => {
            const mediaUrl = story.mediaUrl || story.imageUrl;
            const sId = story._id || story.id;
            const dateStr = story.createdAt
              ? new Date(story.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '';

            return (
              <div
                key={sId}
                onClick={() => setSelectedPreviewStory(story)}
                className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group border border-neutral-800 hover:border-neutral-700 transition"
              >
                <img
                  src={mediaUrl}
                  alt={story.caption || 'Archived story'}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end">
                  <span className="text-[11px] text-white font-medium truncate">
                    {story.caption || 'Story'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <Calendar size={10} />
                    <span>{dateStr}</span>
                  </div>
                </div>
                {/* Floating Date pill */}
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white/90 font-mono">
                  {story.createdAt ? new Date(story.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      {selectedPreviewStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setSelectedPreviewStory(null)}
        >
          <div
            className="relative max-w-sm w-full bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[9/16]">
              <img
                src={selectedPreviewStory.mediaUrl || selectedPreviewStory.imageUrl}
                alt="Story preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white drop-shadow">
                <span className="text-xs font-semibold bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {selectedPreviewStory.createdAt
                    ? new Date(selectedPreviewStory.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Archived Story'}
                </span>
                <button
                  onClick={() => setSelectedPreviewStory(null)}
                  className="p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white transition"
                >
                  ✕
                </button>
              </div>
              {selectedPreviewStory.caption && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-3 text-xs text-white">
                  {selectedPreviewStory.caption}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Highlight Modal */}
      <CreateHighlightModal
        isOpen={isCreateHighlightOpen}
        onClose={() => setIsCreateHighlightOpen(false)}
        onCreated={() => {
          navigate(`/profile/${user.username}`);
        }}
      />
    </div>
  );
}
