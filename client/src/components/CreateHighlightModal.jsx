import React, { useState, useEffect } from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import { storyApi } from '../api/storyApi';
import { highlightApi } from '../api/highlightApi';
import { useAuth } from '../context/AuthContext';

export function CreateHighlightModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [archivedStories, setArchivedStories] = useState([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    setTitle('');
    setSelectedStoryIds([]);
    setError('');
    loadArchived();
  }, [isOpen, user]);

  const loadArchived = async () => {
    setLoading(true);
    try {
      const stories = await storyApi.getArchivedStories(user.username);
      setArchivedStories(Array.isArray(stories) ? stories : []);
    } catch (err) {
      console.error('Failed to load archived stories', err);
      setError('Could not load archived stories.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedStoryIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a title for the highlight.');
      return;
    }
    if (selectedStoryIds.length === 0) {
      setError('Please select at least one story for the highlight.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const selectedDocs = archivedStories.filter(s =>
        selectedStoryIds.includes(s._id || s.id)
      );

      const items = selectedDocs.map(s => ({
        mediaUrl: s.mediaUrl || s.imageUrl,
        mediaType: s.mediaType || 'image',
        caption: s.caption || '',
        createdAt: s.createdAt || new Date().toISOString(),
      }));

      const coverUrl = items[0]?.mediaUrl || '';

      const created = await highlightApi.createHighlight(
        { title: title.trim(), coverUrl, items },
        user.username
      );

      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create highlight', err);
      setError(err.message || 'Failed to create highlight');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1c1c1c] border border-[#262626] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <span className="font-semibold text-white text-base">New Highlight</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[#262626] space-y-3">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Highlight Name
            </label>
            <input
              type="text"
              placeholder="e.g. Tokyo 2026, Travel, Best Moments"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={25}
              required
              className="w-full bg-[#262626] text-white text-sm rounded-xl px-4 py-2.5 border border-neutral-700 focus:outline-none focus:border-white transition"
            />
          </div>

          {error && (
            <div className="mx-5 mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Stories Grid */}
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase text-neutral-400 tracking-wider">
                Select Stories ({selectedStoryIds.length} selected)
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : archivedStories.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                <p>No stories in your archive yet.</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Post a story to save it automatically to your permanent archive.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {archivedStories.map((story) => {
                  const sId = story._id || story.id;
                  const isSelected = selectedStoryIds.includes(sId);
                  const mediaUrl = story.mediaUrl || story.imageUrl;

                  return (
                    <div
                      key={sId}
                      onClick={() => toggleSelect(sId)}
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group border transition ${
                        isSelected
                          ? 'border-[#0095f6] ring-2 ring-[#0095f6]'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <img
                        src={mediaUrl}
                        alt="Archive thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      {/* Check badge */}
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-[#0095f6] text-white shadow'
                            : 'bg-black/50 text-white/50 border border-white/30'
                        }`}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      {/* Date label */}
                      <div className="absolute bottom-1 left-1.5 text-[10px] text-white/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs font-mono">
                        {story.createdAt ? new Date(story.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#262626] flex justify-end gap-3 bg-[#171717]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || selectedStoryIds.length === 0}
              className="px-5 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white text-xs font-semibold transition shadow-md"
            >
              {saving ? 'Creating...' : 'Create Highlight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
