import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-neutral-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-instagram-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Restricted Access (403)</h2>
        <p className="text-neutral-400 max-w-md mb-6 text-sm">
          You are currently logged in as <span className="font-semibold text-neutral-200">@{user.username}</span> with role <span className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">{user.role}</span>. Only Snapgram administrators can access the Moderation Dashboard.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
