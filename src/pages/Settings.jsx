import { useState } from 'react';
import {
  User,
  Lock,
  Save,
  CheckCircle2,
  Bell,
  ShieldCheck,
  Moon,
  Sparkles,
  Camera,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { cn } from '../lib/cn';

export default function Settings() {
  const { user, login } = useAuth();

  // Profile Form
  const [form, setForm] = useState({
    name: user?.name || 'Admin',
    email: user?.email || 'admin@vibora.com',
    profileImage: user?.profileImage || '',
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });

  // System Toggles
  const [notifications, setNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  function handleProfileSave(e) {
    e.preventDefault();
    const updated = {
      ...user,
      name: form.name.trim() || 'Admin',
      email: form.email.trim(),
      profileImage: form.profileImage.trim(),
      initials: (form.name.trim() || 'AD').slice(0, 2).toUpperCase(),
    };
    login(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordError('');
    if (!passwordForm.newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordSuccess(true);
    setPasswordForm({ currentPassword: '', newPassword: '' });
    setTimeout(() => setPasswordSuccess(false), 2500);
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6 pb-12 text-text">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Manage your admin profile, credentials, and platform preferences.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-border text-xs text-text-muted">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Super Admin</span>
        </div>
      </div>

      {/* ── 1. Profile Details (Main) ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Admin Profile</h2>
            <p className="text-xs text-text-muted">Update your display information and avatar</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-5">
          {/* Avatar preview row */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-border/60">
            <div className="relative">
              <Avatar
                initials={form.name ? form.name.slice(0, 2).toUpperCase() : 'AD'}
                src={form.profileImage}
                size="lg"
                className="ring-2 ring-primary/40 shadow-lg"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{form.name || 'Admin User'}</p>
              <p className="text-xs text-text-muted truncate">{form.email || 'admin@vibora.com'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Admin Name"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-border text-text text-sm focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@vibora.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-border text-text text-sm focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
          </div>


          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d946ef] to-[#ec4899] text-white text-xs font-bold shadow-lg shadow-pink-500/25 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* ── 2. Password & Security (Compact) ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center text-secondary">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Change Password</h2>
            <p className="text-xs text-text-muted">Update your administrator sign-in password</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Password updated successfully!
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold animate-fade-in">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-border text-text text-sm focus:outline-none focus:border-secondary/60 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-border text-text text-sm focus:outline-none focus:border-secondary/60 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-border text-white text-xs font-bold transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-secondary" />
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. Quick System Preferences (Main switches only) ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-1">Platform Preferences</h2>
        <p className="text-xs text-text-muted mb-4">Essential settings for system behavior</p>

        <div className="space-y-3">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">System Notifications</p>
                <p className="text-xs text-text-muted">Receive alerts for new user signups and community messages</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifications(!notifications)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                notifications ? 'bg-primary' : 'bg-white/10'
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full bg-white absolute top-1 transition-transform',
                  notifications ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Maintenance Mode</p>
                <p className="text-xs text-text-muted">Temporarily display a maintenance screen to non-admin users</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                maintenanceMode ? 'bg-amber-500' : 'bg-white/10'
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full bg-white absolute top-1 transition-transform',
                  maintenanceMode ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
