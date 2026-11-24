import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Camera, Eye, EyeOff, AlertCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Main Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo & Heading */}
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-rose-500/20">
              <Camera size={26} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Snapgram</h1>
            <p className="text-xs text-neutral-400">Sign in to share photos and 24-hr stories</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="name@snapgram.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-xl bg-instagram-blue hover:bg-instagram-blueHover text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
            >
              {loading ? 'Signing In...' : 'Log In'}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-neutral-900 space-y-2">
            <span className="text-[11px] font-semibold uppercase text-neutral-500 tracking-wider block text-center">
              One-Click Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('alex@snapgram.com', 'password123')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium transition"
              >
                <User size={13} />
                <span>Demo User</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@snapgram.com', 'admin123')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition"
              >
                <Shield size={13} />
                <span>Demo Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Register prompt card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center text-xs text-neutral-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-instagram-blue font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
