import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import LoadingScreen from '../components/LoadingScreen';

// Authorized Admin Credentials (can also be overridden in deploy via Vite env vars)
const AUTHORIZED_EMAIL = (import.meta.env?.VITE_ADMIN_EMAIL || 'admin@vibora.com').trim().toLowerCase();
const AUTHORIZED_PASSWORD = (import.meta.env?.VITE_ADMIN_PASSWORD || 'admin123').trim();

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setError('Please enter your admin email.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Strict Admin Credentials Verification
    if (cleanEmail !== AUTHORIZED_EMAIL || cleanPass !== AUTHORIZED_PASSWORD) {
      setError('Invalid email or password. Only the authorized administrator account can log in.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const username = cleanEmail.split('@')[0] || 'admin';
      const displayName = 'Vibora Administrator';

      const authenticatedUser = {
        name: displayName,
        username: `@${username}`,
        email: cleanEmail,
        role: 'Super Admin',
        initials: 'VA',
        loggedInAt: new Date().toISOString(),
      };

      login(authenticatedUser);
      navigate('/dashboard', { replace: true });
    }, 1500);
  }


  if (loading) {
    return <LoadingScreen durationMs={2000} subtitle="Signing in to Vibora…" />;
  }

  return (
    <div className="relative min-h-screen w-full bg-[#0a0620] text-[#f5ede0] flex items-center justify-center p-4 sm:p-6 selection:bg-[#ec4899]/30 selection:text-white overflow-hidden">
      {/* ── Soft Ambient Background Glow (Ultra Subtle) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-[#5b8def]/15 via-[#a855f7]/20 to-[#ec4899]/15 blur-[160px]"
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Clean Centered Login Card ── */}
      <div className="relative z-10 w-full max-w-[400px]">
        <div
          className={cn(
            'rounded-[28px] border border-white/[0.08] bg-[#0e0826]/85 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(168,85,247,0.12)] transition-all duration-300',
            shake && 'animate-shake'
          )}
        >
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src="/logo.png"
              alt="Vibora"
              className="h-14 w-auto object-contain mb-5 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            />
            <h1 className="text-2xl font-bold text-[#f5ede0] tracking-tight">
              Sign in to Vibora
            </h1>
            <p className="text-sm text-[#b8aec8] mt-1.5 font-normal">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium text-center animate-fade-in"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            autoComplete="off"
            className="space-y-4"
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="vb-email"
                className="block text-xs font-semibold text-[#f5ede0]/90"
              >
                Email
              </label>
              <input
                id="vb-email"
                name="vibora_user_email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your email"
                className="w-full bg-white/[0.03] border border-white/[0.1] text-[#f5ede0] rounded-xl px-4 py-3 text-sm font-normal placeholder:text-[#b8aec8]/35 focus:outline-none focus:border-[#a855f7] focus:bg-white/[0.05] focus:ring-1 focus:ring-[#a855f7] transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="vb-pass"
                className="block text-xs font-semibold text-[#f5ede0]/90"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="vb-pass"
                  name="vibora_user_password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/[0.1] text-[#f5ede0] rounded-xl pl-4 pr-11 py-3 text-sm font-normal placeholder:text-[#b8aec8]/35 focus:outline-none focus:border-[#a855f7] focus:bg-white/[0.05] focus:ring-1 focus:ring-[#a855f7] transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#b8aec8]/60 hover:text-[#f5ede0] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 text-[#b8aec8] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-transparent accent-[#a855f7] cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <span className="text-xs text-[#b8aec8]/60 select-none">
                Vibora v2.4
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_25px_rgba(168,85,247,0.55)] hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#b8aec8]/40 mt-6 select-none">
          © {new Date().getFullYear()} Vibora Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}