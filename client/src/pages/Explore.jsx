import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Compass, TrendingUp } from 'lucide-react';
import { postApi } from '../api/postApi';
import { useFeed } from '../context/FeedContext';
import { FALLBACK_IMAGE } from '../mock/mockData';

export function Explore() {
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setActiveDetailPost } = useFeed();

  useEffect(() => {
    async function loadExplore() {
      try {
        const sorted = await postApi.getExplorePosts();
        setExplorePosts(sorted);
      } catch (err) {
        console.error('Failed to load explore posts', err);
      } finally {
        setLoading(false);
      }
    }
    loadExplore();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-instagram-blue">
            <Compass size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Explore Most Popular
              <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-normal flex items-center gap-1">
                <TrendingUp size={12} /> Ranked by Likes
              </span>
            </h1>
            <p className="text-xs text-neutral-400">
              Discover top-trending photography and stories shared across the Snapgram community.
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-neutral-900/60 rounded-xl animate-pulse border border-neutral-800" />
          ))}
        </div>
      ) : explorePosts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {explorePosts.map((post, index) => (
            <div
              key={post.id}
              onClick={() => setActiveDetailPost(post)}
              className="relative aspect-square group cursor-pointer overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800"
            >
              {/* Photo */}
              <img
                src={post.imageUrl || FALLBACK_IMAGE}
                alt={post.caption || 'Explore post'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={e => { e.target.src = FALLBACK_IMAGE; }}
              />

              {/* Rank Badge on Top 3 */}
              {index < 3 && (
                <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/30 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-md">
                  #{index + 1} Trending
                </div>
              )}

              {/* Hover Overlay with Likes & Comments Count */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 text-white font-bold text-sm md:text-base pointer-events-none">
                <div className="flex items-center gap-2">
                  <Heart size={20} className="fill-white" />
                  <span>{post.likesCount || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="fill-white" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-500 text-sm">
          No posts available to explore yet.
        </div>
      )}
    </div>
  );
}
