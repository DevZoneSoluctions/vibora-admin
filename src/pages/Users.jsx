import { useState, useMemo, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useUsers } from '../context/UsersContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  Users as UsersIcon,
  Loader2,
  AlertTriangle,
  Eye,
  Globe,
  Phone,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  Image as ImageIcon,
  X,
  Copy,
  Check,
  Clock,
  Layers,
  Heart,
  UserX,
  FileCode,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Coins,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

const ROLES = ['Admin', 'Moderator', 'Member'];
const STATUSES = ['Active', 'Blocked'];
const GENDERS = ['Male', 'Female'];

const EMPTY_FORM = {
  name: '',
  username: '',
  email: '',
  mobile: '',
  country: 'Pakistan',
  profileImage: '',
  gender: 'Male',
  role: 'Member',
  status: 'Active',
};

// Seed groups matching user's Firestore console
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
  },
];

function validate(form) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Full name is required.';
  if (!form.email?.trim()) errors.email = 'Email address is required.';
  else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!form.role) errors.role = 'Role is required.';
  return errors;
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

// ── 1. Comprehensive View User Modal (Profile, Friends, Groups, Blocked) ──────
function ViewUserModal({ user, isOpen, onClose, allUsers, groups }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [copiedField, setCopiedField] = useState(null);
  const [chatFriendUids, setChatFriendUids] = useState([]);
  const [blockedSubUids, setBlockedSubUids] = useState([]);
  const [loadingRelations, setLoadingRelations] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('profile');
    }
  }, [isOpen]);

  // Fetch real friends & blocked from Firestore when modal opens (browser is authenticated)
  useEffect(() => {
    if (!isOpen || !user) return;
    const uid = user.uid || user.id;
    setLoadingRelations(true);
    setChatFriendUids([]);
    setBlockedSubUids([]);

    // Fetch chats where this user is a participant (private 1-to-1 chats = friends)
    const fetchRelations = async () => {
      try {
        // Try chats collection — look for docs where participants array contains user's uid
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', uid)
        );
        const chatsSnap = await getDocs(chatsQuery);
        const friendUidsFromChats = [];
        chatsSnap.forEach((chatDoc) => {
          const data = chatDoc.data();
          const participants = data.participants || data.members || [];
          // Only include 1-to-1 chats (2 participants = private chat = friend)
          if (participants.length === 2) {
            const otherUid = participants.find((p) => p !== uid);
            if (otherUid) friendUidsFromChats.push(otherUid);
          }
        });
        setChatFriendUids(friendUidsFromChats);
      } catch {
        // chats collection not accessible — fallback to empty
      }

      // Try blocked subcollection on user doc
      try {
        const blockedSnap = await getDocs(
          collection(db, 'users', uid, 'blocked')
        );
        const ids = blockedSnap.docs.map((d) => d.id);
        setBlockedSubUids(ids);
      } catch {
        // not accessible
      }

      setLoadingRelations(false);
    };

    fetchRelations();
  }, [isOpen, user]);

  if (!user) return null;

  function copyToClipboard(text, fieldName) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const isOnline = Boolean(user.isOnline);
  const raw = user.rawDoc || {};
  const userUid = user.uid || user.id;

  // 1. Groups — from real Firestore groups collection (real-time subscription)
  const userGroups = groups.filter((g) => {
    const uid = user.uid || user.id;
    const isAdmin = Array.isArray(g.admins) && (g.admins.includes(user.id) || g.admins.includes(uid));
    const isMember = Array.isArray(g.members) && (g.members.includes(user.id) || g.members.includes(uid));
    const inDelivered = g.deliveredAt && (user.id in g.deliveredAt || uid in g.deliveredAt);
    return isAdmin || isMember || inDelivered;
  });

  // 2. Friends — Priority: chats collection (real private chats) > closeFriends rawDoc field
  const closeFriendsUids = Array.isArray(raw.closeFriends) ? raw.closeFriends : [];
  // Merge both sources (chats-based friends + closeFriends field)
  const allFriendUids = [...new Set([...chatFriendUids, ...closeFriendsUids])];
  const userFriends = allUsers.filter((other) => {
    if (other.id === user.id) return false;
    const otherUid = other.uid || other.id;
    return allFriendUids.includes(otherUid) || allFriendUids.includes(other.id);
  });

  // 3. Blocked users — Priority: blocked subcollection > rawDoc blocked/blockedUsers field
  const rawBlockedUids = Array.isArray(raw.blocked)
    ? raw.blocked
    : Array.isArray(raw.blockedUsers)
    ? raw.blockedUsers
    : [];
  const allBlockedUids = [...new Set([...blockedSubUids, ...rawBlockedUids])];
  const blockedUsers = allUsers.filter((other) => {
    if (other.id === user.id) return false;
    const otherUid = other.uid || other.id;
    return allBlockedUids.includes(otherUid) || allBlockedUids.includes(other.id);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile & Social Graph" className="max-w-2xl">
      <div className="space-y-5">
        {/* Profile Card Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-pink-500/10 border border-primary/25 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative shrink-0">
              <Avatar
                initials={user.initials}
                src={user.profileImage}
                size="lg"
                className="ring-4 ring-primary/40 shadow-xl w-16 h-16 text-lg font-bold"
              />
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-surface ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-xl font-extrabold text-white tracking-tight truncate">{user.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    user.role === 'Admin'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : user.role === 'Moderator'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/10 text-text-muted border border-white/10'
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    user.status === 'Active'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/15 text-red-300 border-red-500/30'
                  }`}
                >
                  {user.status}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-text-muted border-border'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-text-muted/50'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <p className="text-xs font-mono text-primary/90">{user.username}</p>

              {user.tagline && (
                <p className="text-xs text-text-muted mt-1.5 italic bg-black/20 px-2.5 py-1 rounded-lg border border-white/5 inline-block">
                  "{user.tagline}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Friends</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {userFriends.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Joined Groups</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {userGroups.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocked')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'blocked'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Blocked Users</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {blockedUsers.length}
            </span>
          </button>
        </div>

        {/* ── Tab 1: Profile Details ── */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {/* Email */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-border flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Email Address</p>
                    <p className="text-xs font-medium text-text truncate mt-0.5" title={user.email}>
                      {user.email || '—'}
                    </p>
                  </div>
                </div>
                {user.email && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(user.email, 'email')}
                    className="text-text-muted hover:text-white p-1 rounded"
                    title="Copy email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Mobile Phone */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-border flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Mobile Phone</p>
                  <p className="text-xs font-medium text-text truncate mt-0.5">
                    {user.mobile || user.phone || '—'}
                  </p>
                </div>
              </div>

              {/* Country */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-border flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Country / Location</p>
                  <p className="text-xs font-medium text-text truncate mt-0.5">
                    {user.country || 'Pakistan'}
                  </p>
                </div>
              </div>

              {/* Gender */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-border flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Gender</p>
                  <p className="text-xs font-medium text-text truncate mt-0.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        user.gender === 'Female' ? 'bg-pink-500/15 text-pink-300' : 'bg-blue-500/15 text-blue-300'
                      }`}
                    >
                      {user.gender || 'Male'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-border flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Registered On</p>
                  <p className="text-xs font-medium text-text truncate mt-0.5">
                    {formatDateTime(user.createdAt || user.joinedAt)}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-border flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Last Updated / Seen</p>
                  <p className="text-xs font-medium text-text truncate mt-0.5">
                    {user.lastSeen ? formatDateTime(user.lastSeen) : user.updatedAt ? formatDateTime(user.updatedAt) : 'Recently'}
                  </p>
                </div>
              </div>

              {/* Firestore UID */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-border flex items-start justify-between gap-2 sm:col-span-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Firestore Document ID (UID)</p>
                    <p className="text-xs font-mono text-text-muted truncate mt-0.5" title={user.id}>
                      {user.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.id, 'id')}
                  className="text-text-muted hover:text-white p-1 rounded"
                  title="Copy Firestore ID"
                >
                  {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── Tab 2: Friends & Social Connections ── */}
        {activeTab === 'friends' && (
          <div className="space-y-3 animate-fade-in">
            {loadingRelations ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-text-muted">Loading friends from Firestore...</p>
              </div>
            ) : userFriends.length === 0 ? (
              <div className="py-8 text-center bg-white/[0.02] border border-border rounded-2xl p-6">
                <Heart className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No Friends Yet</p>
                <p className="text-xs text-text-muted mt-1">This user has not added any friends on Vibora yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {userFriends.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-border flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <Avatar initials={f.initials} src={f.profileImage} size="sm" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-surface ${
                            f.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{f.name}</p>
                        <p className="text-[11px] text-text-muted truncate">{f.username} • {f.country}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                        Connected Friend
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Joined Groups ── */}
        {activeTab === 'groups' && (
          <div className="space-y-3 animate-fade-in">
            {userGroups.length === 0 ? (
              <div className="py-8 text-center bg-white/[0.02] border border-border rounded-2xl p-6">
                <Layers className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No Groups Joined</p>
                <p className="text-xs text-text-muted mt-1">This user has not joined or created any groups in Firestore.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {userGroups.map((g) => {
                  const isAdmin = Array.isArray(g.admins) && (g.admins.includes(user.id) || g.admins.includes(user.uid));
                  return (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-border flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/30 to-secondary/30 border border-primary/30 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white truncate">{g.name}</p>
                            {isAdmin && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30">
                                Group Admin
                              </span>
                            )}
                          </div>
                          {g.description && (
                            <p className="text-[11px] text-text-muted truncate mt-0.5">"{g.description}"</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-text-muted block">
                          {g.members?.length || 3} members
                        </span>
                        <span className="text-[10px] text-primary font-mono block mt-0.5">
                          {formatDate(g.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: Blocked Users ── */}
        {activeTab === 'blocked' && (
          <div className="space-y-3 animate-fade-in">
            {blockedUsers.length === 0 ? (
              <div className="py-8 text-center bg-white/[0.02] border border-border rounded-2xl p-6">
                <UserCheck className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No Blocked Users</p>
                <p className="text-xs text-text-muted mt-1">This user has not blocked anyone on Vibora.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {blockedUsers.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-red-500/[0.03] border border-red-500/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar initials={b.initials} src={b.profileImage} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{b.name}</p>
                        <p className="text-[11px] text-text-muted truncate">{b.username || b.email}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
                      Restricted / Blocked
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <Button variant="secondary" className="w-full sm:w-auto px-6" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── 2. Dedicated Edit User Modal (Strictly Edit Only) ─────────────────────────
function EditUserModal({ user, isOpen, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setForm({
        name: user.name || user.fullName || '',
        username: (user.username || '').replace(/^@/, ''),
        email: user.email || '',
        mobile: user.mobile || user.phone || '',
        country: user.country || 'Pakistan',
        profileImage: user.profileImage || '',
        gender: user.gender || 'Male',
        role: user.role || 'Member',
        status: user.status || 'Active',
        coins: user.coins !== null && user.coins !== undefined ? String(user.coins) : '',
      });
      setErrors({});
      setServerError('');
      setIsSubmitting(false);
    }
  }, [isOpen, user]);

  function handleChange(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    if (serverError) setServerError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      await onSave(user.id, form);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error updating user:', err);
      setServerError(err.message || 'Failed to update user.');
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Profile" className="max-w-xl">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="edit-user-name"
            label="Full Name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Doe"
            error={errors.name}
            required
          />
          <Input
            id="edit-user-username"
            label="Username"
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="johndoe"
            error={errors.username}
          />
        </div>

        <Input
          id="edit-user-email"
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="john@example.com"
          error={errors.email}
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="edit-user-image" className="text-sm font-medium text-text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              Profile Avatar URL
            </span>
            {form.profileImage && (
              <button
                type="button"
                onClick={() => handleChange('profileImage', '')}
                className="text-[11px] text-red-400 hover:underline"
              >
                Clear Avatar
              </button>
            )}
          </label>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar
                initials={form.name ? form.name.slice(0, 2).toUpperCase() : 'U'}
                src={form.profileImage}
                size="md"
                className="ring-2 ring-primary/40 shadow"
              />
            </div>
            <input
              id="edit-user-image"
              type="url"
              value={form.profileImage}
              onChange={(e) => handleChange('profileImage', e.target.value)}
              placeholder="https://images.unsplash.com/... or image link"
              className="flex-1 bg-white/5 border border-border text-text rounded-xl px-4 py-2 text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-mono text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="edit-user-mobile"
            label="Mobile Phone"
            type="tel"
            value={form.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            placeholder="+92 300 1234567"
          />
          <Input
            id="edit-user-country"
            label="Country"
            value={form.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="Pakistan"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-user-gender" className="text-sm font-medium text-text-muted">
              Gender
            </label>
            <select
              id="edit-user-gender"
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full bg-surface border border-border text-text rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g} className="bg-surface text-text">
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-user-role" className="text-sm font-medium text-text-muted">
              Role
            </label>
            <select
              id="edit-user-role"
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full bg-surface border border-border text-text rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer font-semibold"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-surface text-text">
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-user-status" className="text-sm font-medium text-text-muted">
              Status
            </label>
            <select
              id="edit-user-status"
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-surface border border-border text-text rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer font-semibold"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-surface text-text">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Coins Balance (Editable) ── */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-user-coins" className="text-sm font-medium text-text-muted flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            Coins Balance
          </label>
          <div className="relative flex items-center">
            <Coins className="absolute left-3 w-4 h-4 text-amber-400 pointer-events-none" />
            <input
              id="edit-user-coins"
              type="number"
              min="0"
              step="1"
              value={form.coins}
              onChange={(e) => handleChange('coins', e.target.value)}
              placeholder="0"
              className="w-full bg-amber-500/[0.06] border border-amber-500/30 text-amber-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold tabular-nums placeholder:text-text-muted/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all"
            />
          </div>
          {form.coins !== '' && Number(form.coins) < 0 && (
            <p className="text-[11px] text-red-400">Coins cannot be negative.</p>
          )}
        </div>

        <div className="flex gap-3 pt-3">
          <Button
            variant="secondary"
            className="flex-1"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── 3. Add New User Modal ───────────────────────────────────────────────────
function AddUserModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setServerError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  function handleChange(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    if (serverError) setServerError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      await onAdd(form);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error adding user:', err);
      setServerError(err.message || 'Failed to add new user.');
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New User" className="max-w-xl">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="add-user-name"
            label="Full Name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ayesha Khan"
            error={errors.name}
            required
          />
          <Input
            id="add-user-username"
            label="Username (optional)"
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="ayeshakhan"
            error={errors.username}
          />
        </div>

        <Input
          id="add-user-email"
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="ayesha@example.com"
          error={errors.email}
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="add-user-image" className="text-sm font-medium text-text-muted flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-primary" />
            Profile Avatar URL (optional)
          </label>
          <div className="flex items-center gap-3">
            <Avatar
              initials={form.name ? form.name.slice(0, 2).toUpperCase() : 'U'}
              src={form.profileImage}
              size="md"
              className="ring-1 ring-border"
            />
            <input
              id="add-user-image"
              type="url"
              value={form.profileImage}
              onChange={(e) => handleChange('profileImage', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 bg-white/5 border border-border text-text rounded-xl px-4 py-2 text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-mono text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="add-user-mobile"
            label="Mobile Phone"
            type="tel"
            value={form.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            placeholder="+92 300 1234567"
          />
          <Input
            id="add-user-country"
            label="Country"
            value={form.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="Pakistan"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-user-gender" className="text-sm font-medium text-text-muted">
              Gender
            </label>
            <select
              id="add-user-gender"
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full bg-surface border border-border text-text rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g} className="bg-surface text-text">
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-user-role" className="text-sm font-medium text-text-muted">
              Role
            </label>
            <select
              id="add-user-role"
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full bg-surface border border-border text-text rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer font-semibold"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-surface text-text">
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-user-status" className="text-sm font-medium text-text-muted">
              Status
            </label>
            <select
              id="add-user-status"
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-surface border border-border text-text rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer font-semibold"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-surface text-text">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          <Button
            variant="secondary"
            className="flex-1"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Adding...
              </span>
            ) : (
              'Create User'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Users Page ──────────────────────────────────────────────────────────
export default function Users() {
  const { users, loading, error, addUser, updateUser, deleteUser, toggleBlock } = useUsers();

  const [groups, setGroups] = useState(SEED_GROUPS);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null); // purely View
  const [editTarget, setEditTarget] = useState(null); // purely Edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [toast, setToast] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  // Subscribe to groups so each user's group memberships are calculated dynamically
  useEffect(() => {
    const colRef = collection(db, 'groups');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map((d) => {
            const item = d.data();
            return {
              id: d.id,
              name: item.name || item.title || `Group #${d.id.slice(0, 5)}`,
              description: item.description || '',
              admins: Array.isArray(item.admins) ? item.admins : [],
              announcementOnly: Boolean(item.announcementOnly),
              deliveredAt: item.deliveredAt || {},
              members: Array.isArray(item.members) ? item.members : Object.keys(item.deliveredAt || {}),
              createdAt: item.createdAt,
            };
          });
          setGroups(data);
        }
      },
      () => {
        // Fallback to seed groups
        setGroups(SEED_GROUPS);
      }
    );
    return () => unsubscribe();
  }, []);

  // Filtered users list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.country && u.country.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  // ── Pagination State (Default 100 users per page, scalable for lifetime data) ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Reset to first page whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Total pages and safe clamping
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);

  // Sliced users for current page — O(1) rendering, prevents DOM lagging with thousands of users
  const paginatedUsers = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  // Helper for generating smart page numbers
  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [currentPage, totalPages]);

  // Actions
  async function handleUpdateUser(userId, updatedData) {
    await updateUser(userId, updatedData);
    showToast(`User updated successfully!`, 'success');
  }

  async function handleAddUser(newData) {
    await addUser(newData);
    showToast(`User added successfully!`, 'success');
  }

  async function handleToggleBlock(user) {
    try {
      const nextStatus = await toggleBlock(user.id);
      showToast(
        `${user.name} is now ${nextStatus}.`,
        nextStatus === 'Blocked' ? 'warning' : 'success'
      );
    } catch {
      showToast('Failed to update status.', 'error');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget);
      setDeleteTarget(null);
      showToast('User deleted successfully.', 'success');
    } catch {
      showToast('Failed to delete user.', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-text-muted font-medium text-sm">Loading users from Firestore…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-6 py-5 bg-red-500/10 border border-red-500/30 rounded-2xl w-full">
          <AlertTriangle className="w-7 h-7 text-red-400 shrink-0" />
          <div>
            <p className="font-bold text-red-300">Firestore Connection Error</p>
            <p className="text-xs text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in relative pb-10">
      {/* ── Toast Notification ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-surface/95 border-emerald-500/40 text-emerald-300'
                : toast.type === 'warning'
                ? 'bg-surface/95 border-amber-500/40 text-amber-300'
                : 'bg-surface/95 border-red-500/40 text-red-300'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'error' && <Ban className="w-4 h-4 text-red-400 shrink-0" />}
            <span className="text-xs font-semibold">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-text-muted hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Top Header (Search + Add User) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, email, country, phone…"
            aria-label="Search users"
            className="w-full bg-surface border border-border text-text text-sm rounded-xl pl-10 pr-9 py-2.5 placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button
          variant="primary"
          icon={UserPlus}
          onClick={() => setAddOpen(true)}
          className="shadow-md shadow-primary/20 shrink-0"
        >
          Add User
        </Button>
      </div>

      {/* ── Real Firestore Users Table ── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        {filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={UsersIcon}
              title={search ? 'No users match your search' : 'No users in Firestore collection'}
              description={
                search
                  ? 'Try searching with a different name, username, email, or country.'
                  : 'Add a user to get started.'
              }
              action={
                search ? (
                  <Button variant="secondary" onClick={() => setSearch('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button icon={UserPlus} onClick={() => setAddOpen(true)}>
                    Add User
                  </Button>
                )
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
                      User Member
                    </th>
                    <th className="text-left px-4 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-left px-4 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Gender
                    </th>

                    <th className="text-left px-4 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-4 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedUsers.map((u) => {
                    const isAdmin = u.role === 'Admin';
                    const isMod = u.role === 'Moderator';
                    const isActive = u.status === 'Active';
                    const isOnline = Boolean(u.isOnline);


                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-white/[0.025] transition-colors group"
                      >
                        {/* 1. User Avatar + Name + Username + Tagline */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar
                                initials={u.initials}
                                src={u.profileImage}
                                size="md"
                                className="ring-1 ring-border shadow"
                              />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                                  isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                                }`}
                                title={isOnline ? 'Online' : 'Offline'}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white group-hover:text-primary transition-colors truncate">
                                {u.name}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-mono text-primary/80">
                                  {u.username || `@${u.name.toLowerCase().replace(/\s+/g, '')}`}
                                </span>
                                {u.tagline && (
                                  <span className="text-[11px] text-text-muted italic truncate max-w-[130px]">
                                    • "{u.tagline}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contact: Email + Mobile */}
                        <td className="px-4 py-4">
                          <div className="min-w-0">
                            <p className="text-xs text-text truncate font-medium flex items-center gap-1">
                              <Mail className="w-3 h-3 text-text-muted shrink-0" />
                              {u.email || '—'}
                            </p>
                            {u.mobile && u.mobile !== '—' && (
                              <p className="text-[11px] text-text-muted truncate mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-400/80 shrink-0" />
                                {u.mobile}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 3. Gender */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              u.gender === 'Female'
                                ? 'bg-pink-500/10 text-pink-300 border-pink-500/25'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/25'
                            }`}
                          >
                            {u.gender || 'Male'}
                          </span>
                        </td>


                        {/* 5. Role */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isAdmin
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : isMod
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-white/10 text-text-muted border border-white/10'
                            }`}
                          >
                            {isAdmin && <Shield className="w-3 h-3" />}
                            {u.role}
                          </span>
                        </td>

                        {/* 6. Status */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-red-500/10 text-red-300 border-red-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                              }`}
                            />
                            {u.status}
                          </span>
                        </td>

                        {/* 7. Actions: View, Edit, Block, Delete */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View (Strictly Read-Only with Tabs for Profile, Groups, Friends, Blocked) */}
                            <button
                              type="button"
                              onClick={() => setViewTarget(u)}
                              title="View friends, groups, blocked & profile"
                              aria-label={`View ${u.name}`}
                              className="p-2 rounded-xl text-text-muted hover:text-cyan-400 hover:bg-cyan-500/10 transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit (Strictly Edit Only) */}
                            <button
                              type="button"
                              onClick={() => setEditTarget(u)}
                              title="Edit user"
                              aria-label={`Edit ${u.name}`}
                              className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Block / Unblock Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u)}
                              title={isActive ? 'Block user' : 'Unblock user'}
                              aria-label={isActive ? `Block ${u.name}` : `Unblock ${u.name}`}
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                isActive
                                  ? 'text-text-muted hover:text-amber-400 hover:bg-amber-500/10'
                                  : 'text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(u.id)}
                              title="Delete user"
                              aria-label={`Delete ${u.name}`}
                              className="p-2 rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-border/60">
              {paginatedUsers.map((u) => {
                const isActive = u.status === 'Active';

                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        initials={u.initials}
                        src={u.profileImage}
                        size="md"
                        className="ring-1 ring-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{u.name}</p>
                        <p className="text-xs font-mono text-primary truncate">
                          {u.username || u.email}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-300 border-red-500/30'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>

                    {u.tagline && (
                      <p className="text-xs text-text-muted italic bg-white/[0.02] px-2.5 py-1 rounded-lg">
                        "{u.tagline}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span className="truncate">{u.email}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            u.gender === 'Female'
                              ? 'bg-pink-500/10 text-pink-300 border-pink-500/25'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/25'
                          }`}
                        >
                          {u.gender || 'Male'}
                        </span>
                        <span className="font-semibold text-white">{u.role}</span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        className="flex-1 text-cyan-400 hover:text-cyan-300"
                        onClick={() => setViewTarget(u)}
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Pencil}
                        className="flex-1 text-primary hover:text-primary/90"
                        onClick={() => setEditTarget(u)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={isActive ? 'warning' : 'success'}
                        size="sm"
                        icon={isActive ? Ban : CheckCircle}
                        onClick={() => handleToggleBlock(u)}
                      >
                        {isActive ? 'Block' : 'Unblock'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(u.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Scalable Pagination Bar (100 per page, Next 200, Jump, Size Selector) ── */}
            <div className="border-t border-border bg-white/[0.015] px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Range & Info */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="text-xs text-text-muted">
                  Showing <span className="font-bold text-white">{filtered.length === 0 ? 0 : startIndex + 1}</span>–<span className="font-bold text-white">{endIndex}</span> of <span className="font-bold text-primary">{filtered.length.toLocaleString()}</span> users
                </p>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="hidden sm:inline">Rows per page:</span>
                <div className="inline-flex rounded-xl bg-white/5 p-1 border border-border">
                  {[50, 100, 200, 500].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        pageSize === size
                          ? 'bg-primary text-white shadow-sm shadow-primary/40 font-bold'
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                  title="First Page (1)"
                  className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  title="Previous Page"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Numeric Page Buttons */}
                <div className="flex items-center gap-1">
                  {paginationRange.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-1.5 text-xs text-text-muted select-none">
                          …
                        </span>
                      );
                    }
                    const isActive = p === currentPage;
                    return (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-primary to-pink-500 text-white shadow-md shadow-primary/30 ring-1 ring-white/30 scale-105'
                            : 'text-text-muted hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  title="Next Page"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  title={`Last Page (${totalPages})`}
                  className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                {/* Direct Jump Input if totalPages > 5 */}
                {totalPages > 5 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const p = parseInt(jumpPageInput, 10);
                      if (!isNaN(p) && p >= 1 && p <= totalPages) {
                        setCurrentPage(p);
                        setJumpPageInput('');
                      }
                    }}
                    className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-border"
                  >
                    <span className="text-[11px] text-text-muted">Go:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      placeholder={String(currentPage)}
                      className="w-12 bg-white/5 border border-border text-text rounded-md px-1.5 py-1 text-xs text-center focus:outline-none focus:border-primary"
                    />
                  </form>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer Count (Pagination-Aware) ── */}
      {users.length > 0 && (
        <p className="text-xs text-text-muted text-right px-1">
          {search
            ? `Found ${filtered.length} matching user${filtered.length !== 1 ? 's' : ''} — Page ${currentPage} of ${totalPages}`
            : `${users.length.toLocaleString()} total Firestore users — Showing page ${currentPage} of ${totalPages}`
          }
        </p>
      )}

      {/* ── 1. Pure View Modal (Read Only with Profile, Friends, Groups, Blocked tabs) ── */}
      <ViewUserModal
        user={viewTarget}
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        allUsers={users}
        groups={groups}
      />

      {/* ── 2. Pure Edit Modal (Edit Only) ── */}
      <EditUserModal
        user={editTarget}
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdateUser}
      />

      {/* ── 3. Add User Modal ── */}
      <AddUserModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddUser}
      />

      {/* ── 4. Delete Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This operation cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}