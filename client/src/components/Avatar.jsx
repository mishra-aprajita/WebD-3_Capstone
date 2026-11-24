import React, { useState, useEffect } from 'react';

/**
 * Extracts 1-2 uppercase initials from a name or username
 * Examples:
 *   "Alex Rivera" -> "AR"
 *   "Samantha Miller" -> "SM"
 *   "alex_creator" -> "AC"
 *   "mia" -> "M"
 *   "" -> "?"
 */
export function getInitials(nameOrUsername) {
  if (!nameOrUsername || typeof nameOrUsername !== 'string') return '?';
  const clean = nameOrUsername.trim();
  if (!clean) return '?';

  // If two or more words (e.g. "Alex Rivera")
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const second = parts[1][0] || '';
    return (first + second).toUpperCase();
  }

  // If separated by underscore or dot or hyphen (e.g. "alex_creator", "john.doe")
  const subParts = clean.split(/[._-]+/).filter(Boolean);
  if (subParts.length >= 2) {
    const first = subParts[0][0] || '';
    const second = subParts[1][0] || '';
    return (first + second).toUpperCase();
  }

  // Single word: return first character uppercase (or 2 characters if short)
  return clean.slice(0, 1).toUpperCase();
}

/**
 * Clean circular Avatar component matching Instagram Web dark style.
 * Displays photo if available. If avatarUrl is empty, null, or fails to load,
 * displays user's initials centered on a subtle #262626 surface — never a hardcoded stock photo.
 */
export function Avatar({
  src,
  name,
  fullName,
  username,
  alt,
  className = 'w-10 h-10',
  textClassName = '',
  style = {},
  onClick,
}) {
  const [imgError, setImgError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const displayName = fullName || name || username || alt || '';
  const initials = getInitials(displayName);

  // Derive sensible text size from container className if textClassName not provided
  const deriveTextSize = () => {
    if (textClassName) return textClassName;
    if (className.includes('w-6') || className.includes('w-7')) return 'text-[10px]';
    if (className.includes('w-8')) return 'text-xs';
    if (className.includes('w-9') || className.includes('w-10')) return 'text-xs';
    if (className.includes('w-11') || className.includes('w-12')) return 'text-sm';
    if (className.includes('w-14') || className.includes('w-16')) return 'text-base font-bold';
    if (className.includes('w-20') || className.includes('w-24')) return 'text-2xl font-bold';
    if (
      className.includes('w-28') ||
      className.includes('w-32') ||
      className.includes('w-36') ||
      className.includes('150px')
    ) {
      return 'text-4xl font-bold';
    }
    return 'text-sm font-semibold';
  };

  const hasValidPhoto = src && typeof src === 'string' && src.trim() !== '' && !imgError;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 select-none bg-[#262626] text-neutral-200 ${className}`}
      style={style}
    >
      {hasValidPhoto ? (
        <img
          src={src}
          alt={alt || displayName || 'User avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`uppercase font-semibold tracking-wider ${deriveTextSize()}`}>
          {initials}
        </span>
      )}
    </div>
  );
}

export default Avatar;
