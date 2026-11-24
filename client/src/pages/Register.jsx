import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim().toLowerCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-rose-500/20">
              <Camera size={26} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Join Snapgram</h1>
            <p className="text-xs text-neutral-400">
              Create an account to share stories with Close Friends
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. wanderlust_sam"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Samantha Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="sam@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role selector (User or Admin) */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 tracking-wider mb-1">
                Role (RBAC Capstone)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-neutral-600 transition"
              >
                <option value="user">Standard User</option>
                <option value="admin">Administrator (Moderation Access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-xl bg-instagram-blue hover:bg-instagram-blueHover text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Login prompt */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center text-xs text-neutral-400">
          Have an account?{' '}
          <Link to="/login" className="text-instagram-blue font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
