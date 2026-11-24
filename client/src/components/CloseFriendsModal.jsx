import React, { useState } from 'react';
import { X, Star, Search, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { getMockUsers } from '../mock/mockStorage';
import { Avatar } from './Avatar';

export function CloseFriendsModal() {
  const { user } = useAuth();
  const { isCloseFriendsModalOpen, setIsCloseFriendsModalOpen, toggleCloseFriend } = useFeed();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isCloseFriendsModalOpen || !user) return null;

  const currentCloseFriends = user.closeFriends || [];
  const allUsers = getMockUsers();

  // Followers list or potential friends (excluding own user)
  const candidateUsers = allUsers.filter(u => u.username !== user.username);

  const filteredUsers = candidateUsers.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => setIsCloseFriendsModalOpen(false)} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 text-center relative">
          <button
            onClick={() => setIsCloseFriendsModalOpen(false)}
            className="absolute left-4 top-5 text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
            <Star size={20} fill="currentColor" />
          </div>
          <h3 className="font-bold text-white text-lg">Close Friends List</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1 leading-normal">
            Stories shared with Close Friends have a <span className="text-emerald-400 font-semibold">green ring</span> and are completely hidden from everyone else.
          </p>
        </div>

        {/* Counter and Search */}
        <div className="p-4 border-b border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className="text-neutral-400 uppercase tracking-wider">Your Selected Circle</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              {currentCloseFriends.length} close friends
            </span>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-neutral-500" />
            <input
              type="text"
              placeholder="Search followers or friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredUsers.map(candidate => {
            const isClose = currentCloseFriends.includes(candidate.username);

            return (
              <div
                key={candidate.id || candidate.username}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-800/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-0.5 rounded-full ${isClose ? 'ring-2 ring-emerald-500' : ''}`}>
                    <Avatar
                      src={candidate.avatarUrl || candidate.avatar}
                      name={candidate.name || candidate.fullName}
                      username={candidate.username}
                      className="w-10 h-10"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-sm">
                        {candidate.username}
                      </span>
                      {isClose && (
                        <Star size={12} className="text-emerald-400" fill="currentColor" />
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 block truncate max-w-[160px]">
                      {candidate.name}
                    </span>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleCloseFriend(candidate.username)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    isClose
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {isClose ? (
                    <>
                      <Check size={14} strokeWidth={3} />
                      <span>Added</span>
                    </>
                  ) : (
                    <span>Add</span>
                  )}
                </button>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No matching users found.
            </div>
          )}
        </div>

        {/* Footer Done */}
        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={() => setIsCloseFriendsModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
