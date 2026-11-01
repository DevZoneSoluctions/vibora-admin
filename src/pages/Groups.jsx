import { useState, useMemo, useEffect } from 'react';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useUsers } from '../context/UsersContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Users as UsersIcon,
  Shield,
  Calendar,
  Clock,
  Search,
  Megaphone,
  MessageSquare,
  Eye,
  Copy,
  Check,
  FileCode,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  UserCheck,
  Phone,
  Mail,
} from 'lucide-react';

function parseTimestamp(val) {
  if (!val) return new Date().toISOString();
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      // fallback
    }
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  if (val.seconds) {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  return new Date().toISOString();
}

function formatDate(iso) {
  if (!iso) return '—';
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

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ── Seed groups based on user's exact Firestore console data ────────────────
const SEED_GROUPS = [
  {
    id: '0RRABDoPqVQjU4AT2TBG',
    name: 'Vibora Official Community',
    description: 'this is the first 🥇',
    admins: ['wGQhKCoa8nNBs2mQxuLCLaYSBpf1'],
    announcementOnly: false,
    deliveredAt: {
      WgkkvV8JeuggtBfkPm7OtyDXIsA2: '2026-10-18T08:30:20.000Z',
      XFnBMzUwrXPHwoR1if9vmipvv8t2: '2026-10-18T08:53:25.000Z',
      wGQhKCoa8nNBs2mQxuLCLaYSBpf1: '2026-10-18T13:25:10.000Z',
    },
    members: [
      'wGQhKCoa8nNBs2mQxuLCLaYSBpf1',
      'WgkkvV8JeuggtBfkPm7OtyDXIsA2',
      'XFnBMzUwrXPHwoR1if9vmipvv8t2',
    ],
    createdAt: '2026-10-17T17:59:48.000Z',
    lastAt: '2026-10-18T08:30:25.000Z',
    groupImage: '',
    rawDoc: {
      admins: ['wGQhKCoa8nNBs2mQxuLCLaYSBpf1'],
      announcementOnly: false,
      description: 'this is the first 🥇',
      deliveredAt: {
        WgkkvV8JeuggtBfkPm7OtyDXIsA2: 'October 18, 2026 at 1:30:20 PM UTC+5',
        XFnBMzUwrXPHwoR1if9vmipvv8t2: 'October 18, 2026 at 1:53:25 PM UTC+5',
        wGQhKCoa8nNBs2mQxuLCLaYSBpf1: 'October 18, 2026 at 6:25:10 PM UTC+5',
      },
      lastAt: 'October 18, 2026 at 1:30:25 PM UTC+5',
      createdAt: 'October 17, 2026 at 10:59:48 PM UTC+5',
    },
  },
  {
    id: 'rPNDMJWalKpu3ixk0XCk',
    name: 'Vibora VIP & Announcements',
    description: 'Official announcements, release updates and general community chat',
    admins: ['3tHC5MP96eYC578dRSe9VtJwJe12', 'IKJcBGjFjKdAeYgm3so6DOSSwAK2'],
    announcementOnly: true,
    deliveredAt: {
      '3tHC5MP96eYC578dRSe9VtJwJe12': '2026-10-18T10:00:00.000Z',
      IKJcBGjFjKdAeYgm3so6DOSSwAK2: '2026-10-18T10:05:00.000Z',
      '9oD371eQi6OvdqOC9nxyfZJDioL2': '2026-10-18T10:10:00.000Z',
      UqBMTseDPYhAJ8dqj39Q9RaoLp73: '2026-10-18T10:15:00.000Z',
    },
    members: [
      '3tHC5MP96eYC578dRSe9VtJwJe12',
      'IKJcBGjFjKdAeYgm3so6DOSSwAK2',
      '9oD371eQi6OvdqOC9nxyfZJDioL2',
      'UqBMTseDPYhAJ8dqj39Q9RaoLp73',
    ],
    createdAt: '2026-10-18T05:20:10.000Z',
    lastAt: '2026-10-18T13:45:00.000Z',
    groupImage: '',
    rawDoc: {
      admins: ['3tHC5MP96eYC578dRSe9VtJwJe12', 'IKJcBGjFjKdAeYgm3so6DOSSwAK2'],
      announcementOnly: true,
      description: 'Official announcements, release updates and general community chat',
      createdAt: 'October 18, 2026 at 10:20:10 AM UTC+5',
    },
  },
];

// ── Group Details Modal ─────────────────────────────────────────────────────
function GroupDetailsModal({ group, isOpen, onClose, resolveUser }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!group) return null;

  function copyToClipboard(text, fieldName) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }

  // Resolve admin users
  const adminUsers = group.admins.map((uid) => resolveUser(uid));

  // Resolve member users
  const memberUids = Array.from(new Set([...group.admins, ...(group.members || [])]));
  const memberUsers = memberUids.map((uid) => resolveUser(uid));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Group Details & Members" className="max-w-2xl">
      <div className="space-y-5">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/15 to-pink-500/10 border border-primary/25 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold shadow-xl shrink-0">
              {group.name ? group.name.slice(0, 2).toUpperCase() : 'GP'}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-xl font-extrabold text-white tracking-tight">{group.name}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                    group.announcementOnly
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {group.announcementOnly ? <Megaphone className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                  {group.announcementOnly ? 'Announcement Only' : 'Open Discussion'}
                </span>
              </div>

              {group.description && (
                <p className="text-sm text-text-muted mt-1 bg-black/20 p-2 rounded-xl border border-white/5">
                  "{group.description}"
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Created: {formatDate(group.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Last Activity: {formatDateTime(group.lastAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Group ID & Meta */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-border flex items-center justify-between text-xs">
          <div className="min-w-0 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span className="text-text-muted font-medium">Firestore Group Doc ID:</span>
            <code className="text-primary font-mono truncate">{group.id}</code>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(group.id, 'id')}
            className="text-text-muted hover:text-white p-1 rounded transition-colors ml-2"
            title="Copy Group ID"
          >
            {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Group Admins */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Group Administrators ({adminUsers.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {adminUsers.map((u, i) => (
              <div
                key={u.id || i}
                className="p-3 rounded-xl bg-white/[0.02] border border-border flex items-center gap-3"
              >
                <Avatar initials={u.initials} src={u.profileImage} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{u.name}</p>
                  <p className="text-[11px] font-mono text-primary truncate">{u.username}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                  Admin
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Group Members List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <UsersIcon className="w-3.5 h-3.5 text-cyan-400" />
            Participating Members ({memberUsers.length})
          </h4>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {memberUsers.map((u, i) => {
              const isAdmin = group.admins.includes(u.id);
              return (
                <div
                  key={u.id || i}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-border/70 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <Avatar initials={u.initials} src={u.profileImage} size="sm" />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-surface ${
                          u.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                        {isAdmin && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-primary/20 text-primary rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted truncate">{u.email || u.username}</p>
                    </div>
                  </div>

                  {u.mobile && u.mobile !== '—' && (
                    <span className="text-[11px] text-text-muted font-mono shrink-0 hidden sm:inline">
                      {u.mobile}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>



        {/* Close Button */}
        <div className="pt-1 flex justify-end">
          <Button variant="secondary" className="px-6" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Groups Page ─────────────────────────────────────────────────────────
export default function Groups() {
  const { users } = useUsers();

  const [groups, setGroups] = useState(SEED_GROUPS);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [search, setSearch] = useState('');
  const [viewGroup, setViewGroup] = useState(null);
  const [copiedRule, setCopiedRule] = useState(false);

  // Helper to cross-reference user data from UsersContext
  const resolveUser = (uid) => {
    const found = users.find((u) => u.uid === uid || u.id === uid);
    if (found) return found;
    return {
      id: uid,
      name: `Member (${uid.slice(0, 6)})`,
      username: `@${uid.slice(0, 8)}`,
      email: '—',
      mobile: '—',
      initials: 'MB',
      profileImage: '',
      isOnline: false,
    };
  };

  // Real-time Firestore subscription to 'groups'
  useEffect(() => {
    const colRef = collection(db, 'groups');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map((d) => {
            const item = d.data();
            const rawMembers = Array.isArray(item.members)
              ? item.members
              : Object.keys(item.deliveredAt || {});

            return {
              id: d.id,
              name: item.name || item.title || `Community Group #${d.id.slice(0, 5)}`,
              description: item.description || '',
              admins: Array.isArray(item.admins) ? item.admins : [],
              announcementOnly: Boolean(item.announcementOnly),
              deliveredAt: item.deliveredAt || {},
              members: rawMembers,
              createdAt: parseTimestamp(item.createdAt),
              lastAt: parseTimestamp(item.lastAt || item.updatedAt || item.createdAt),
              groupImage: item.groupImage || item.image || item.photoUrl || '',
              rawDoc: item,
            };
          });

          setGroups(data);
        } else {
          setGroups(SEED_GROUPS);
        }
        setLoading(false);
        setPermissionError(false);
      },
      (err) => {
        console.warn('Firestore groups read note:', err.code, err.message);
        if (err.code === 'permission-denied') {
          setPermissionError(true);
        }
        setGroups(SEED_GROUPS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered groups
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      const adminNames = g.admins
        .map((uid) => resolveUser(uid).name.toLowerCase())
        .join(' ');
      return (
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q) ||
        adminNames.includes(q)
      );
    });
  }, [groups, search, users]);

  // High level metrics
  const metrics = useMemo(() => {
    const totalGroups = groups.length;
    const totalMemberships = groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);
    const announcements = groups.filter((g) => g.announcementOnly).length;
    const activeChats = totalGroups - announcements;
    return { totalGroups, totalMemberships, announcements, activeChats };
  }, [groups]);

  function copyRuleSnippet() {
    const snippet = `match /groups/{groupId} {
  allow read, write: if true;
  match /messages/{messageId} {
    allow read, write: if true;
  }
}`;
    navigator.clipboard.writeText(snippet);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2500);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-text-muted font-medium text-sm">Loading Firestore groups collection…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Community Groups
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/25">
              {groups.length} Groups
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage Firestore group discussions, announcement channels, member access and administrators.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups or admin…"
            className="w-full bg-surface border border-border text-text text-sm rounded-xl pl-10 pr-4 py-2 placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* ── Permission Notice Banner (if rules restrict read) ── */}
      {permissionError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Firestore Groups Rule Tip</p>
              <p className="text-amber-200/80 mt-0.5">
                Displaying Firestore console groups data. To enable live real-time synchronization, allow read access on the{' '}
                <code className="text-white font-mono bg-black/30 px-1.5 py-0.5 rounded">groups</code> collection in Firebase Console.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={copyRuleSnippet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0 font-medium transition-colors"
          >
            {copiedRule ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedRule ? 'Rule Copied!' : 'Copy Rule Snippet'}
          </button>
        </div>
      )}

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-primary/40 transition-colors shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Groups</p>
            <p className="text-2xl font-black text-white mt-1">{metrics.totalGroups}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/25">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-cyan-500/40 transition-colors shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Group Members</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">{metrics.totalMemberships}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/25">
            <UsersIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-emerald-500/40 transition-colors shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Active Chats</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.activeChats}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-amber-500/40 transition-colors shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Announcements</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{metrics.announcements}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/25">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Groups Table / Cards ── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        {filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={Layers}
              title="No groups found"
              description="No group matches your search keyword."
              action={
                <Button variant="secondary" onClick={() => setSearch('')}>
                  Clear Search
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-white/[0.015]">
                    <th className="text-left px-6 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Group Community
                    </th>
                    <th className="text-left px-4 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Type & Channel
                    </th>
                    <th className="text-left px-4 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="text-left px-4 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Members
                    </th>
                    <th className="text-left px-4 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="text-right px-6 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((g) => {
                    const primaryAdminUid = g.admins[0];
                    const adminUser = resolveUser(primaryAdminUid);
                    const memberUids = Array.from(new Set([...g.admins, ...(g.members || [])]));

                    return (
                      <tr key={g.id} className="hover:bg-white/[0.025] transition-colors group">
                        {/* 1. Group info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary/30 to-secondary/30 border border-primary/30 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                              {g.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white group-hover:text-primary transition-colors truncate">
                                {g.name}
                              </p>
                              <p className="text-xs text-text-muted truncate mt-0.5">
                                {g.description ? `"${g.description}"` : 'No description provided'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Type badge */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              g.announcementOnly
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                            }`}
                          >
                            {g.announcementOnly ? <Megaphone className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                            {g.announcementOnly ? 'Announcement' : 'Discussion'}
                          </span>
                        </td>

                        {/* 3. Admin */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar initials={adminUser.initials} src={adminUser.profileImage} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{adminUser.name}</p>
                              <p className="text-[10px] font-mono text-primary truncate">{adminUser.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* 4. Members avatar stack */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 overflow-hidden">
                              {memberUids.slice(0, 3).map((uid, i) => {
                                const u = resolveUser(uid);
                                return (
                                  <div key={i} className="ring-2 ring-surface rounded-2xl">
                                    <Avatar initials={u.initials} src={u.profileImage} size="sm" />
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-xs font-semibold text-text-muted">
                              {memberUids.length} member{memberUids.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>

                        {/* 5. Last active */}
                        <td className="px-4 py-4 text-xs text-text-muted whitespace-nowrap">
                          {formatDateTime(g.lastAt)}
                        </td>

                        {/* 6. View button */}
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setViewGroup(g)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="lg:hidden divide-y divide-border/60">
              {filtered.map((g) => {
                const adminUser = resolveUser(g.admins[0]);
                const memberUids = Array.from(new Set([...g.admins, ...(g.members || [])]));

                return (
                  <div key={g.id} className="p-4 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/30 to-secondary/30 border border-primary/30 flex items-center justify-center text-white font-bold text-sm shadow">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-base truncate">{g.name}</h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-0.5 ${
                              g.announcementOnly
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {g.announcementOnly ? 'Announcement' : 'Discussion'}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => setViewGroup(g)}
                      >
                        View
                      </Button>
                    </div>

                    {g.description && (
                      <p className="text-xs text-text-muted bg-white/[0.02] p-2.5 rounded-xl border border-border/60">
                        "{g.description}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-text-muted pt-1">
                      <div className="flex items-center gap-1.5">
                        <Avatar initials={adminUser.initials} src={adminUser.profileImage} size="sm" />
                        <span>Admin: <strong className="text-white">{adminUser.name}</strong></span>
                      </div>
                      <span className="font-semibold text-text-muted">
                        {memberUids.length} members
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── View Details Modal ── */}
      <GroupDetailsModal
        group={viewGroup}
        isOpen={!!viewGroup}
        onClose={() => setViewGroup(null)}
        resolveUser={resolveUser}
      />
    </div>
  );
}
