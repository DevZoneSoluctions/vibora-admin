import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Eye,
  Mail,
  Phone,
  Globe,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useUsers } from '../context/UsersContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function isThisMonth(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  } catch {
    return false;
  }
}

// ── Quick View User Modal ──────────────────────────────────────────────────
function QuickViewModal({ user, isOpen, onClose }) {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Overview">
      <div className="space-y-5 text-text">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-border">
          <Avatar
            initials={user.initials}
            src={user.profileImage}
            size="lg"
            className="ring-2 ring-primary/40 shadow-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-text truncate">{user.name}</h3>
              <Badge label={user.status} />
              <Badge label={user.role} />
            </div>
            <p className="text-sm text-primary font-mono mt-0.5">{user.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
            <span className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
              <Mail className="w-3.5 h-3.5 text-primary" /> Email
            </span>
            <p className="text-text font-medium truncate text-xs">{user.email || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
            <span className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> Mobile
            </span>
            <p className="text-text font-medium truncate text-xs">{user.mobile || user.phone || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
            <span className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Country
            </span>
            <p className="text-text font-medium truncate text-xs">{user.country || 'Global'}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
            <span className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Joined
            </span>
            <p className="text-text font-medium truncate text-xs">{formatDate(user.joinedAt)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Link to="/users">
            <Button variant="primary" icon={ExternalLink}>
              Manage in Users
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

export default function Dashboard() {
  const { users, loading, error } = useUsers();
  const [selectedUser, setSelectedUser] = useState(null);

  // Computations
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'Active').length;
    const blocked = users.filter((u) => u.status === 'Blocked').length;
    const newThisMonth = users.filter((u) => isThisMonth(u.joinedAt)).length;
    return { total, active, blocked, newThisMonth };
  }, [users]);

  // Gender Distribution
  const genderStats = useMemo(() => {
    let male = 0;
    let female = 0;
    users.forEach((u) => {
      if (u.gender === 'Female') female++;
      else male++;
    });
    const total = users.length || 1;
    const malePct = Math.round((male / total) * 100);
    const femalePct = Math.round((female / total) * 100);

    return {
      male,
      female,
      malePct,
      femalePct,
      total: users.length,
      ratio: `${male}:${female}`,
    };
  }, [users]);

  // Recent 5 users
  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
        .slice(0, 5),
    [users]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-text-muted font-medium">Firestore se live data load ho raha hai…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
        <div className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <p className="font-bold text-red-300">Firestore Connection Error</p>
            <p className="text-sm text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Circular Donut Calculation
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.72
  const maleStrokeDashoffset =
    circumference - (circumference * genderStats.malePct) / 100;
  const femaleStrokeDashoffset =
    circumference - (circumference * genderStats.femalePct) / 100;

  return (
    <div className="space-y-6 animate-fade-in text-text">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-extrabold text-text tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-text-muted mt-0.5 font-normal">
          Real-time overview of users and network statistics.
        </p>
      </div>

      {/* ── 4 KPI Cards (Vibora Dark Theme) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg hover:border-primary/40 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Users
            </p>
            <p className="text-3xl font-black text-text tracking-tight mt-1">
              {stats.total}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg hover:border-emerald-500/40 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Active Users
            </p>
            <p className="text-3xl font-black text-text tracking-tight mt-1">
              {stats.active}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Blocked Users */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg hover:border-rose-500/40 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Blocked Users
            </p>
            <p className="text-3xl font-black text-text tracking-tight mt-1">
              {stats.blocked}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: New This Month */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg hover:border-amber-500/40 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              New This Month
            </p>
            <p className="text-3xl font-black text-text tracking-tight mt-1">
              {stats.newThisMonth}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── 2-Column Row: Gender Distribution (Left) + Recent Members (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ── Left: Gender Distribution (lg:col-span-5) ── */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-text text-base">Gender Distribution</h3>
                <p className="text-xs text-text-muted mt-0.5">Male vs Female user breakdown</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {genderStats.total} Total Users
              </span>
            </div>

            {/* Circular Donut with glowing neon arcs */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
                  {/* Background dark circle */}
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    className="text-white/[0.05]"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Male arc (Neon Blue #38bdf8) */}
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    stroke="#38bdf8"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={maleStrokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  {/* Female arc (Neon Pink #ec4899) */}
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    stroke="#ec4899"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={femaleStrokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      transform: `rotate(${(genderStats.malePct / 100) * 360}deg)`,
                      transformOrigin: 'center',
                      transition: 'stroke-dashoffset 0.8s ease',
                    }}
                  />
                </svg>

                {/* Center Counter */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-text tracking-tight">
                    {genderStats.total}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
                    USERS
                  </span>
                </div>
              </div>

              {/* Progress bars & details */}
              <div className="w-full sm:w-52 space-y-4">
                {/* Male */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-text">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
                      Male
                    </span>
                    <span className="font-bold text-text">
                      {genderStats.male} <span className="text-text-muted font-normal">({genderStats.malePct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      className="bg-[#38bdf8] h-2 rounded-full transition-all duration-700"
                      style={{ width: `${genderStats.malePct}%` }}
                    />
                  </div>
                </div>

                {/* Female */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-text">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] shadow-[0_0_8px_rgba(236,72,153,0.7)]" />
                      Female
                    </span>
                    <span className="font-bold text-text">
                      {genderStats.female} <span className="text-text-muted font-normal">({genderStats.femalePct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      className="bg-[#ec4899] h-2 rounded-full transition-all duration-700"
                      style={{ width: `${genderStats.femalePct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span>Ratio: {genderStats.ratio}</span>
            <Link
              to="/analytics"
              className="text-primary hover:text-secondary font-semibold flex items-center gap-1 transition-colors"
            >
              Detailed analytics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Right: Recent Members (lg:col-span-7) ── */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white/[0.015]">
              <div>
                <h3 className="font-bold text-text text-base">Recent Members</h3>
                <p className="text-xs text-text-muted mt-0.5">Last 5 registrations</p>
              </div>
              <Link
                to="/users"
                className="text-xs text-primary hover:text-secondary font-semibold flex items-center gap-1 transition-colors"
              >
                View all ({users.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <ul className="divide-y divide-border">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-white/[0.025] transition-colors group"
                >
                  <Avatar initials={u.initials} src={u.profileImage} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text truncate">{u.name}</p>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                          u.gender === 'Female'
                            ? 'bg-pink-500/10 text-pink-300 border-pink-500/20'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        }`}
                      >
                        {u.gender || 'Male'}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">{u.email || u.username}</p>
                  </div>

                  <div className="hidden sm:block text-xs text-text-muted whitespace-nowrap">
                    {formatDate(u.joinedAt)}
                  </div>

                  <Badge label={u.status} />

                  <button
                    onClick={() => setSelectedUser(u)}
                    title="Quick preview"
                    className="p-1.5 rounded-lg text-text-muted hover:text-cyan-400 hover:bg-cyan-400/10 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 py-3 border-t border-border bg-white/[0.01] flex items-center justify-between text-xs text-text-muted">
            <span>Showing top {recentUsers.length} of {users.length} members</span>
            <Link to="/users" className="text-primary hover:underline font-medium">
              Manage all →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}