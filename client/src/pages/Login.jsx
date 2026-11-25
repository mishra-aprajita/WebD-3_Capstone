import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Showcase collage card data (generic stock visuals, no personal info) ─── */
const COLLAGE = [
  {
    rotate: '-rotate-6',
    translateY: '-translate-y-6',
    translateX: '-translate-x-3',
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    label: '🌄 Story',
    color: 'from-orange-400 to-pink-500',
  },
  {
    rotate: 'rotate-3',
    translateY: 'translate-y-4',
    translateX: 'translate-x-2',
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=80',
    label: '🌆 Reel',
    color: 'from-purple-500 to-blue-500',
  },
  {
    rotate: '-rotate-3',
    translateY: 'translate-y-10',
    translateX: '-translate-x-1',
    img: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80',
    label: '📸 Post',
    color: 'from-emerald-400 to-cyan-500',
  },
];

/* ─── Shared input style ─── */
const inp =
  'w-full bg-[#121212] border border-[#262626] focus:border-[#737373] text-sm text-white placeholder-[#737373] rounded-md px-3 py-2.5 outline-none transition';

/* ═══════════════════════════════════════════════════════════════════
   SPLIT-SCREEN AUTH PAGE  (Login + Sign-Up in one component)
═══════════════════════════════════════════════════════════════════ */
export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* which panel is showing */
  const [mode, setMode] = useState(
    location.pathname === '/register' ? 'signup' : 'login'
  );

  /* shared */
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = location.state?.from?.pathname || '/';

  /* ── LOGIN fields ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);

  /* ── SIGN-UP fields ── */
  const [signupEmail, setSignupEmail] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupGender, setSignupGender] = useState('Prefer not to say');
  const [showSignupPw, setShowSignupPw] = useState(false);

  const switchTo = (m) => {
    setError('');
    setMode(m);
    navigate(m === 'login' ? '/login' : '/register', { replace: true });
  };

  /* ── Handlers ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (signupUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({
        username: signupUsername.trim().toLowerCase(),
        name: signupFullName.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        dob: signupDob,
        gender: signupGender,
        role: 'user',
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, pw) => {
    setLoginEmail(email);
    setLoginPassword(pw);
    setError('');
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-black flex items-stretch">
      {/* ───────── LEFT SHOWCASE PANEL ───────── */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 bg-black relative overflow-hidden px-16">
        {/* Gradient background blob */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-purple-700/20 via-rose-600/10 to-transparent blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-gradient-to-tl from-amber-500/15 to-transparent blur-3xl" />
        </div>

        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-10 z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Camera size={22} className="text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight text-white">Snapgram</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-black text-white text-center leading-tight max-w-xs z-10 mb-4">
          See everyday moments from your close friends.
        </h1>
        <p className="text-sm text-neutral-400 text-center max-w-xs z-10 mb-14 leading-relaxed">
          Share 24-hr stories, reels, posts, and direct messages — all in one clean, private space.
        </p>

        {/* Tilted photo collage */}
        <div className="relative w-72 h-80 z-10">
          {COLLAGE.map((c, i) => (
            <div
              key={i}
              className={`absolute w-44 h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/10 ${c.rotate} ${c.translateY} ${c.translateX}`}
              style={{ left: `${i * 60}px`, zIndex: i }}
            >
              <img
                src={c.img}
                alt="collage"
                className="w-full h-full object-cover"
              />
              {/* Overlay badge */}
              <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t ${c.color} opacity-40`} />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full border border-white/10">
                {c.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-16 z-10">
          {['24h Stories', 'Close Friends', 'Reels', 'DMs', 'Explore'].map((f) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-400 font-medium"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ───────── RIGHT AUTH PANEL ───────── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[460px] px-6 py-10 bg-black lg:border-l lg:border-[#262626]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center shadow-md">
            <Camera size={18} className="text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">Snapgram</span>
        </div>

        {/* Tab switcher */}
        <div className="flex w-full max-w-sm mb-6 rounded-xl overflow-hidden border border-[#262626] bg-[#0a0a0a]">
          <button
            onClick={() => switchTo('login')}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${
              mode === 'login'
                ? 'bg-[#1c1c1c] text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => switchTo('signup')}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${
              mode === 'signup'
                ? 'bg-[#1c1c1c] text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="w-full max-w-sm">
          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@snapgram.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`${inp} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200 transition"
                  >
                    {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !loginEmail || !loginPassword}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-lg shadow-blue-700/20"
              >
                {loading ? 'Logging in…' : 'Log In'}
              </button>

              {/* Demo shortcuts */}
              <div className="pt-4 border-t border-[#1c1c1c] space-y-2">
                <p className="text-center text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                  Quick Demo
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo('alex@snapgram.com', 'password123')}
                    className="py-2 px-3 rounded-xl bg-[#1c1c1c] hover:bg-[#262626] border border-[#2a2a2a] text-xs text-neutral-300 font-medium transition text-center"
                  >
                    👤 Demo User
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('admin@snapgram.com', 'admin123')}
                    className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs text-rose-300 font-medium transition text-center"
                  >
                    🛡️ Demo Admin
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── SIGN-UP FORM ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm select-none">@</span>
                  <input
                    type="text"
                    placeholder="alex_creator"
                    value={signupUsername}
                    onChange={(e) =>
                      setSignupUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))
                    }
                    required
                    autoComplete="username"
                    className={`${inp} pl-7`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSignupPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`${inp} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200 transition"
                  >
                    {showSignupPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* DOB + Gender in a 2-col row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-500 tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={signupDob}
                    onChange={(e) => setSignupDob(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`${inp} [color-scheme:dark]`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-500 tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select
                    value={signupGender}
                    onChange={(e) => setSignupGender(e.target.value)}
                    className={`${inp} cursor-pointer`}
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-neutral-500 leading-relaxed">
                By signing up, you agree to our{' '}
                <span className="text-neutral-300 cursor-pointer hover:underline">Terms</span>,{' '}
                <span className="text-neutral-300 cursor-pointer hover:underline">Privacy Policy</span> and{' '}
                <span className="text-neutral-300 cursor-pointer hover:underline">Cookies Policy</span>.
              </p>

              <button
                type="submit"
                disabled={loading || !signupEmail || !signupFullName || !signupUsername || !signupPassword}
                className="w-full py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-lg shadow-blue-700/20"
              >
                {loading ? 'Creating account…' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* Bottom toggle link */}
          <div className="mt-6 p-4 border border-[#262626] rounded-2xl text-center text-xs text-neutral-400 bg-[#0a0a0a]">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => switchTo('signup')}
                  className="text-[#0095f6] font-bold hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Have an account?{' '}
                <button
                  onClick={() => switchTo('login')}
                  className="text-[#0095f6] font-bold hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Register route re-uses Login with register mode pre-selected */
export function Register() {
  return <Login />;
}
