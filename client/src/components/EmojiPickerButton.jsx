import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    label: 'Smileys',
    emojis: ['😀', '😂', '🥹', '😍', '🥰', '😎', '🤩', '🥳', '😭', '😤', '🤔', '🫡', '🫠', '😴', '🤯', '😇'],
  },
  {
    label: 'Hearts & Vibes',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💖', '🔥', '✨', '💯', '👏', '🙌', '🫶', '🙏'],
  },
  {
    label: 'Fun & Nature',
    emojis: ['🎉', '🎊', '🚀', '⚡', '🌟', '🌈', '🌊', '🌸', '🍀', '☕', '🍕', '🎵', '📸', '🎬', '🏆', '👀'],
  },
];

/**
 * Lightweight dark-mode Emoji Picker popover for comment input bars.
 * Inserts the chosen emoji at the input's cursor position without losing focus.
 */
export function EmojiPickerButton({ inputRef, value, onChange, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(0);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleSelectEmoji = (emoji) => {
    const el = inputRef?.current;
    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart;
      const end = el.selectionEnd ?? start;
      const nextValue = value.slice(0, start) + emoji + value.slice(end);
      onChange(nextValue);
      requestAnimationFrame(() => {
        el.focus();
        const cursor = start + emoji.length;
        el.setSelectionRange(cursor, cursor);
      });
    } else {
      onChange((value || '') + emoji);
      requestAnimationFrame(() => el?.focus());
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-neutral-400 hover:text-white transition p-1 rounded-full"
        aria-label="Add emoji"
        title="Add emoji"
      >
        <Smile size={18} />
      </button>

      {open && (
        <div
          className={`absolute bottom-full mb-2 ${
            align === 'right' ? 'right-0' : 'left-0'
          } w-64 bg-[#1a1a1a] border border-[#262626] rounded-2xl shadow-2xl p-2.5 z-50`}
        >
          {/* Category tabs */}
          <div className="flex items-center gap-1 pb-2 mb-2 border-b border-[#262626]">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCat(idx)}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                  activeCat === idx
                    ? 'bg-[#262626] text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[activeCat].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectEmoji(emoji)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#262626] text-base transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
