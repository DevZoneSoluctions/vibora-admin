import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Image as ImageIcon, Layers, BarChart3, Settings, MessageSquare } from 'lucide-react';
import { cn } from '../lib/cn';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Posts', path: '/posts', icon: ImageIcon },
  { name: 'Groups', path: '/groups', icon: Layers },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Community Inbox', path: '/community-inbox', icon: MessageSquare },
  { name: 'Settings', path: '/settings', icon: Settings },
];

function NavItem({ item, onClick, collapsed }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.name : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-2xl transition-all duration-200 group relative overflow-hidden text-sm font-semibold select-none',
          collapsed
            ? 'justify-center p-3 w-12 h-12 mx-auto'
            : 'gap-3.5 px-4 py-3',
          isActive
            ? 'text-white'
            : 'text-[#b8aec8] hover:text-white hover:bg-white/[0.04]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active pink/magenta gradient background matching user reference */}
          {isActive && (
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#d946ef] to-[#ec4899] shadow-[0_4px_20px_rgba(217,70,239,0.35)]" />
          )}

          <item.icon
            className={cn(
              'w-5 h-5 relative z-10 transition-transform duration-200 shrink-0',
              isActive ? 'text-white scale-105' : 'group-hover:scale-105'
            )}
          />

          {!collapsed && (
            <span className="relative z-10 truncate">{item.name}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ mobile, onClose, collapsed }) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-[#0a0620]/95 backdrop-blur-3xl border-r border-white/[0.08] transition-all duration-300',
        mobile
          ? 'w-72 h-full shadow-2xl z-50'
          : collapsed
          ? 'hidden md:flex w-20 h-full'
          : 'hidden md:flex w-64 h-full'
      )}
    >
      {/* Mobile Drawer Header with Logo */}
      {mobile && (
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.08]">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8b5cf6] to-[#6366f1] flex items-center justify-center p-1.5 shadow-md">
              <img
                src="/logo.png"
                alt="Vibora"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-base font-bold text-white">Vibora Platform</span>
          </Link>
        </div>
      )}

      {/* Nav Items */}
      <nav
        className={cn(
          'flex-1 flex flex-col gap-1.5 pt-4',
          collapsed ? 'px-2 items-center' : 'p-3.5'
        )}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            collapsed={!mobile && collapsed}
            onClick={mobile ? onClose : undefined}
          />
        ))}
      </nav>
    </aside>
  );
}