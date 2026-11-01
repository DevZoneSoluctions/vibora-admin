import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, LogOut, User, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';

const PAGE_DETAILS = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview & platform insights',
  },
  '/users': {
    title: 'Users',
    subtitle: 'Manage platform accounts & roles',
  },
  '/posts': {
    title: 'Posts & Feed',
    subtitle: 'Live user posts from Firebase & content moderation',
  },
  '/groups': {
    title: 'Groups',
    subtitle: 'Manage community groups & members',
  },
  '/community-inbox': {
    title: 'Community Inbox',
    subtitle: 'Direct messages & community conversations',
  },
  '/analytics': {
    title: 'Analytics',
    subtitle: 'Growth metrics & platform telemetry',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Admin profile & system configuration',
  },
};

export default function Header({ onMenuClick, isCollapsed }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pageInfo = PAGE_DETAILS[location.pathname] || {
    title: 'Dashboard',
    subtitle: 'Overview & platform insights',
  };

  function handleLogout() {
    setDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 w-full bg-bg/95 backdrop-blur-2xl border-b border-border flex items-stretch z-40 sticky top-0 select-none shadow-sm transition-colors duration-200">
      {/* ── Left Brand Section: Original Vibora Logo + Brand Name + Tagline ── */}
      <div
        className={cn(
          'hidden md:flex items-center border-r border-border transition-all duration-300 shrink-0 px-5',
          isCollapsed ? 'w-20 justify-center px-2' : 'w-64 justify-start'
        )}
      >
        <Link to="/dashboard" className="flex items-center gap-3 group">
          {/* Original Vibora Logo (Enlarged) */}
          <img
            src="/logo.png"
            alt="Vibora"
            className="h-11 sm:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] group-hover:scale-105 transition-transform shrink-0"
          />

          {!isCollapsed && (
            <span className="text-[11px] text-primary font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
              Live Command Center
            </span>
          )}
        </Link>
      </div>

      {/* ── Main Navbar Section (Matching Reference Img Exactly) ── */}
      <div className="flex-1 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Clickable Hamburger + Title + Subtitle */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Clickable Hamburger Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/[0.06] transition-all cursor-pointer active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile brand mark (visible on small screens) */}
          <Link to="/dashboard" className="md:hidden flex items-center">
            <img
              src="/logo.png"
              alt="Vibora"
              className="h-9 sm:h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.55)]"
            />
          </Link>

          {/* Page Title & Subtitle */}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-text tracking-tight leading-tight">
              {pageInfo.title}
            </h1>
            <p className="text-xs text-text-muted/70 leading-none mt-1 hidden sm:block">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Dark/Light Mood Toggle + Vertical Divider + Profile Avatar with Green Dot */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark and Light Mode"
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-600" />
            )}
          </button>

          {/* Vertical Divider line */}
          <span className="h-5 w-px bg-border" />

          {/* Profile Avatar Pill with Green Status Dot */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              title="Admin Menu"
              aria-label="Open Admin Menu"
              className="relative p-0.5 rounded-full hover:ring-2 hover:ring-primary/60 transition-all cursor-pointer block"
            >
              {/* Avatar circle */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#8b5cf6] via-[#a855f7] to-[#ec4899] text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>

              {/* Green Online Dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-bg" />
            </button>

            {/* Admin Popup Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-56 rounded-2xl bg-surface border border-border shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
                {/* Header: Admin & Email */}
                <div className="px-3.5 py-2.5 border-b border-border">
                  <p className="text-sm font-bold text-text leading-tight">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-primary/80 truncate mt-0.5 font-medium">
                    {user?.email || 'admin@vibora.com'}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-1.5 space-y-0.5">
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text hover:bg-white/[0.06] transition-colors"
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text hover:bg-white/[0.06] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-primary" />
                    <span>Settings</span>
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-border my-1" />

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}