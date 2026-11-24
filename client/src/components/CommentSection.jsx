import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';

export function CommentSection({ comments = [] }) {
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (!comments.length) {
    return (
      <div className="py-8 text-center text-xs text-neutral-500 italic">
        No comments yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-3 text-xs leading-relaxed group">
          <Link to={`/profile/${comment.author?.username}`}>
            <Avatar
              src={comment.author?.avatarUrl || comment.author?.avatar}
              name={comment.author?.name || comment.author?.fullName}
              username={comment.author?.username}
              className="w-7 h-7 mt-0.5"
            />
          </Link>
          <div className="flex-1">
            <div className="inline">
              <Link
                to={`/profile/${comment.author?.username}`}
                className="font-semibold text-white mr-1.5 hover:underline"
              >
                {comment.author?.username}
              </Link>
              <span className="text-neutral-300">{comment.text}</span>
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">
              {formatTimeAgo(comment.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
