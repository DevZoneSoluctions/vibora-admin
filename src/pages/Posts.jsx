import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useUsers } from '../context/UsersContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Image as ImageIcon,
  Video,
  Eye,
  Trash2,
  Search,
  Globe,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  Sparkles,
  RefreshCw,
  User,
  ShieldCheck,
  Layers,
  AlertCircle,
  Maximize2,
  FileText,
  Filter,
  X,
  Share2,
} from 'lucide-react';
import { cn } from '../lib/cn';

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
  if (val.seconds || val._seconds) {
    const sec = val.seconds ?? val._seconds;
    return new Date(sec * 1000).toISOString();
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

function formatRelativeTime(iso) {
  if (!iso) return '';
  try {
    const now = new Date();
    const past = new Date(iso);
    const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return '';
  }
}

export default function Posts() {
  const { users } = useUsers();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('ALL'); // 'ALL' | 'public' | 'private'
  const [mediaTypeFilter, setMediaTypeFilter] = useState('ALL'); // 'ALL' | 'image' | 'video'
  const [authorFilter, setAuthorFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals & Actions
  const [selectedPost, setSelectedPost] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Quick Toast Helper
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  }, []);

  // Copy helper
  const handleCopy = useCallback((text, label = 'Copied') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => {
      setCopiedId((curr) => (curr === text ? null : curr));
    }, 2000);
  }, [showToast]);

  // Real-time Firestore Posts Listener
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, 'posts');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const iso = parseTimestamp(d.createdAt);
          return {
            id: docSnap.id,
            authorUid: d.authorUid || '',
            caption: d.caption ?? '',
            mediaType: d.mediaType || 'image',
            mediaUrl: d.mediaUrl || '',
            visibility: d.visibility || 'public',
            createdAtIso: iso,
            rawDoc: d,
          };
        });
        setPosts(loaded);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore posts listener error:', err);
        setError(err.message || 'Failed to fetch posts from Firebase.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Map users for fast lookup by uid or id
  const usersMap = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => {
      if (u.id) map.set(u.id, u);
      if (u.uid) map.set(u.uid, u);
    });
    return map;
  }, [users]);

  // Enrich posts with author details
  const enrichedPosts = useMemo(() => {
    return posts.map((post) => {
      const author = usersMap.get(post.authorUid);
      const name = author?.fullName || author?.name || (post.authorUid ? `User ${post.authorUid.slice(0, 6)}` : 'Unknown User');
      const username = author?.username || (post.authorUid ? `@${post.authorUid.slice(0, 8)}` : '@unknown');
      const avatar = author?.profileImage || '';
      const initials = author?.initials || name.slice(0, 2).toUpperCase();

      return {
        ...post,
        author: {
          uid: post.authorUid,
          name,
          username,
          avatar,
          initials,
          role: author?.role || 'Member',
          status: author?.status || 'Active',
          email: author?.email || '—',
          phone: author?.phone || author?.mobile || '—',
          country: author?.country || '—',
        },
      };
    });
  }, [posts, usersMap]);

  // Unique Authors list for filtering dropdown
  const uniqueAuthors = useMemo(() => {
    const seen = new Set();
    const authors = [];
    enrichedPosts.forEach((p) => {
      if (p.authorUid && !seen.has(p.authorUid)) {
        seen.add(p.authorUid);
        authors.push({
          uid: p.authorUid,
          name: p.author.name,
          username: p.author.username,
        });
      }
    });
    return authors.sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedPosts]);

  // Filtered & Sorted Posts
  const filteredPosts = useMemo(() => {
    let result = [...enrichedPosts];

    // Visibility filter
    if (visibilityFilter !== 'ALL') {
      result = result.filter(
        (p) => (p.visibility || '').toLowerCase() === visibilityFilter.toLowerCase()
      );
    }

    // Media type filter
    if (mediaTypeFilter !== 'ALL') {
      result = result.filter(
        (p) => (p.mediaType || '').toLowerCase() === mediaTypeFilter.toLowerCase()
      );
    }

    // Author filter
    if (authorFilter !== 'ALL') {
      result = result.filter((p) => p.authorUid === authorFilter);
    }

    // Search query (matches caption, author name, username, post id, author uid)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          p.caption.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          p.author.username.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.authorUid.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.createdAtIso).getTime();
      const timeB = new Date(b.createdAtIso).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [enrichedPosts, visibilityFilter, mediaTypeFilter, authorFilter, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = enrichedPosts.length;
    const publicCount = enrichedPosts.filter(
      (p) => (p.visibility || '').toLowerCase() === 'public'
    ).length;
    const privateCount = enrichedPosts.filter(
      (p) => (p.visibility || '').toLowerCase() === 'private'
    ).length;
    const imagesCount = enrichedPosts.filter(
      (p) => (p.mediaType || 'image').toLowerCase() === 'image'
    ).length;
    const videosCount = enrichedPosts.filter(
      (p) => (p.mediaType || '').toLowerCase() === 'video'
    ).length;
    const uniqueCreators = new Set(enrichedPosts.map((p) => p.authorUid).filter(Boolean)).size;

    return { total, publicCount, privateCount, imagesCount, videosCount, uniqueCreators };
  }, [enrichedPosts]);

  // Delete Post handler
  const handleDeletePost = useCallback(async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', postToDelete.id));
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      if (selectedPost?.id === postToDelete.id) {
        setSelectedPost(null);
      }
      showToast('Post successfully deleted from Firebase.');
    } catch (err) {
      console.error('Failed to delete post:', err);
      // Fallback local remove if permission issue
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      showToast('Post removed from view (Firestore sync notice).');
    } finally {
      setDeleting(false);
      setPostToDelete(null);
    }
  }, [postToDelete, selectedPost, showToast]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setVisibilityFilter('ALL');
    setMediaTypeFilter('ALL');
    setAuthorFilter('ALL');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    visibilityFilter !== 'ALL' ||
    mediaTypeFilter !== 'ALL' ||
    authorFilter !== 'ALL';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#18113c] border border-primary/40 rounded-2xl shadow-2xl shadow-primary/20 text-white text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-secondary shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-text-muted hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* ── Top Header & Stats ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
                  Posts & Feed
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Live Firebase
                  </span>
                </h1>
                <p className="text-text-muted text-sm mt-0.5">
                  Real-time monitor and moderation for all user posts in Firestore
                </p>
              </div>
            </div>
          </div>

          {/* Quick Info & Refresh */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-text-muted bg-surface border border-border px-3 py-1.5 rounded-xl">
              Showing <strong className="text-text">{filteredPosts.length}</strong> of{' '}
              <strong className="text-text">{posts.length}</strong> posts
            </span>
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 500);
                showToast('Posts refreshed');
              }}
              className="p-2 rounded-xl bg-surface border border-border text-text-muted hover:text-white hover:border-primary/40 transition-colors"
              title="Refresh posts"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-primary')} />
            </button>
          </div>
        </div>

        {/* ── Metric Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total Posts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-primary/40 transition-all duration-200">
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Posts</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-text mt-1">{stats.total}</h3>
              <p className="text-xs text-text-muted mt-0.5">In Firestore collection</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* Public Posts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-success/40 transition-all duration-200">
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Public Posts</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-success mt-1">{stats.publicCount}</h3>
              <p className="text-xs text-text-muted mt-0.5">Visible to everyone</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0">
              <Globe className="w-6 h-6" />
            </div>
          </div>

          {/* Private Posts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-secondary/40 transition-all duration-200">
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Private Posts</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-secondary mt-1">{stats.privateCount}</h3>
              <p className="text-xs text-text-muted mt-0.5">Restricted / private</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <Lock className="w-6 h-6" />
            </div>
          </div>

          {/* Content Creators */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex items-center justify-between hover:border-info/40 transition-all duration-200">
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Active Creators</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-info mt-1">{stats.uniqueCreators}</h3>
              <p className="text-xs text-text-muted mt-0.5">Unique user authors</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-info/10 border border-info/20 flex items-center justify-center text-info shrink-0">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ── Filters & Search Bar ── */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by caption, user name, @username, or Post ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg border border-border text-text placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 self-end lg:self-auto bg-bg border border-border p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                    : 'text-text-muted hover:text-white'
                )}
                title="Feed Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                    : 'text-text-muted hover:text-white'
                )}
                title="Table / List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* Sub Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-white/[0.06] text-xs">
            <span className="text-text-muted flex items-center gap-1.5 font-medium mr-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Visibility Filter */}
            <div className="flex items-center gap-1 bg-bg border border-border rounded-xl p-1">
              {['ALL', 'public', 'private'].map((vis) => (
                <button
                  key={vis}
                  onClick={() => setVisibilityFilter(vis)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-colors capitalize',
                    visibilityFilter === vis
                      ? 'bg-primary/20 text-primary border border-primary/30 font-semibold'
                      : 'text-text-muted hover:text-white'
                  )}
                >
                  {vis === 'ALL' ? 'All Visibility' : vis}
                </button>
              ))}
            </div>

            {/* Media Type Filter */}
            <div className="flex items-center gap-1 bg-bg border border-border rounded-xl p-1">
              {['ALL', 'image', 'video'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMediaTypeFilter(type)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-colors capitalize',
                    mediaTypeFilter === type
                      ? 'bg-secondary/20 text-secondary border border-secondary/30 font-semibold'
                      : 'text-text-muted hover:text-white'
                  )}
                >
                  {type === 'ALL' ? 'All Media' : `${type}s`}
                </button>
              ))}
            </div>

            {/* Author Dropdown */}
            {uniqueAuthors.length > 0 && (
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="bg-bg border border-border rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Authors ({uniqueAuthors.length})</option>
                {uniqueAuthors.map((auth) => (
                  <option key={auth.uid} value={auth.uid}>
                    {auth.name} ({auth.username})
                  </option>
                ))}
              </select>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg border border-border rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary cursor-pointer ml-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-secondary hover:underline flex items-center gap-1 font-medium px-2 py-1"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface border border-border p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-24 h-3 rounded bg-white/5" />
                    <div className="w-16 h-2.5 rounded bg-white/5" />
                  </div>
                </div>
                <div className="w-full h-48 rounded-xl bg-white/5" />
                <div className="w-3/4 h-3 rounded bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && filteredPosts.length === 0 && (
          <div className="rounded-2xl bg-surface border border-border p-12 text-center">
            <EmptyState
              icon={ImageIcon}
              title={hasActiveFilters ? 'No posts matched your filters' : 'No posts found'}
              description={
                hasActiveFilters
                  ? 'Try loosening your search term or visibility filter to see other posts.'
                  : 'There are currently no post documents stored in your Firebase posts collection.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                ) : null
              }
            />
          </div>
        )}

        {/* ── GRID / FEED VIEW ── */}
        {!loading && filteredPosts.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPosts.map((post) => {
              const isPrivate = (post.visibility || '').toLowerCase() === 'private';
              return (
                <div
                  key={post.id}
                  className="group relative flex flex-col rounded-2xl bg-surface border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10 overflow-hidden"
                >
                  {/* Card Header: Author Info */}
                  <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-white/[0.05]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={post.author.avatar}
                        initials={post.author.initials}
                        size="sm"
                        className="rounded-xl ring-1 ring-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                          {post.author.name}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          {post.author.username}
                        </p>
                      </div>
                    </div>

                    {/* Visibility Badge */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
                        isPrivate
                          ? 'bg-secondary/15 text-secondary border border-secondary/30'
                          : 'bg-success/15 text-success border border-success/30'
                      )}
                      title={`Visibility: ${post.visibility}`}
                    >
                      {isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                      {post.visibility || 'public'}
                    </span>
                  </div>

                  {/* Card Media Section */}
                  <div className="relative aspect-square bg-[#070414] overflow-hidden flex items-center justify-center">
                    {post.mediaUrl ? (
                      post.mediaType === 'video' ? (
                        <video
                          src={post.mediaUrl}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.caption || 'Post image'}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center');
                          }}
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
                        <span className="text-xs">No media attached</span>
                      </div>
                    )}

                    {/* Media Type pill on top-left of image */}
                    {post.mediaUrl && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 flex items-center gap-1">
                        {post.mediaType === 'video' ? (
                          <>
                            <Video className="w-3 h-3 text-secondary" /> Video
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3 h-3 text-primary" /> Image
                          </>
                        )}
                      </span>
                    )}

                    {/* Hover Overlay with Quick Preview Button */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="px-3 py-1.5 rounded-xl bg-white text-[#0a0620] text-xs font-bold flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> View Details
                      </button>
                      {post.mediaUrl && (
                        <a
                          href={post.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                          title="Open original media"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Caption & Meta */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      {post.caption ? (
                        <p className="text-xs text-text line-clamp-2 font-normal leading-relaxed">
                          {post.caption}
                        </p>
                      ) : (
                        <p className="text-xs italic text-text-muted/60">
                          (No caption)
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-text-muted">
                      <div className="flex items-center gap-1" title={formatDateTime(post.createdAtIso)}>
                        <Clock className="w-3 h-3 text-text-muted/70" />
                        <span>{formatRelativeTime(post.createdAtIso) || formatDate(post.createdAtIso)}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(post.id, 'Post ID')}
                          className="p-1 rounded-md text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                          title={`Copy Post ID: ${post.id}`}
                        >
                          {copiedId === post.id ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="View Full Post"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPostToDelete(post)}
                          className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TABLE / LIST VIEW ── */}
        {!loading && filteredPosts.length > 0 && viewMode === 'table' && (
          <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-white/[0.02] text-xs font-bold text-text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-4">Post & Media</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Caption</th>
                    <th className="py-3.5 px-4">Visibility</th>
                    <th className="py-3.5 px-4">Created At</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredPosts.map((post) => {
                    const isPrivate = (post.visibility || '').toLowerCase() === 'private';
                    return (
                      <tr
                        key={post.id}
                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        onClick={() => setSelectedPost(post)}
                      >
                        {/* Media Preview & ID */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#070414] overflow-hidden relative shrink-0 border border-border">
                              {post.mediaUrl ? (
                                <img
                                  src={post.mediaUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-text-muted opacity-40" />
                                </div>
                              )}
                              <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/70 text-[9px] font-bold text-white uppercase">
                                {post.mediaType === 'video' ? 'VID' : 'IMG'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-text font-bold">
                                  {post.id.slice(0, 10)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(post.id, 'Post ID');
                                  }}
                                  className="text-text-muted hover:text-white p-0.5"
                                  title="Copy full Post ID"
                                >
                                  {copiedId === post.id ? (
                                    <Check className="w-3 h-3 text-success" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[11px] text-text-muted">
                                {post.mediaType || 'image'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={post.author.avatar}
                              initials={post.author.initials}
                              size="sm"
                              className="rounded-xl shrink-0"
                            />
                            <div>
                              <p className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                                {post.author.name}
                              </p>
                              <p className="text-[11px] text-text-muted">
                                {post.author.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Caption */}
                        <td className="py-3 px-4 max-w-xs">
                          {post.caption ? (
                            <p className="text-xs text-text truncate">{post.caption}</p>
                          ) : (
                            <span className="text-xs italic text-text-muted/60">—</span>
                          )}
                        </td>

                        {/* Visibility */}
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                              isPrivate
                                ? 'bg-secondary/15 text-secondary border border-secondary/30'
                                : 'bg-success/15 text-success border border-success/30'
                            )}
                          >
                            {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            {post.visibility || 'public'}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-text-muted">
                          <div>{formatDate(post.createdAtIso)}</div>
                          <span className="text-[10px] text-text-muted/60">
                            {formatRelativeTime(post.createdAtIso)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedPost(post)}
                              className="p-1.5 rounded-xl hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {post.mediaUrl && (
                              <a
                                href={post.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                                title="Open full media"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => setPostToDelete(post)}
                              className="p-1.5 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                              title="Delete post"
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
          </div>
        )}
      </div>

      {/* ── FULL POST DETAIL / LIGHTBOX MODAL ── */}
      {selectedPost && (
        <Modal
          isOpen={Boolean(selectedPost)}
          onClose={() => setSelectedPost(null)}
          title="Post Details & Inspection"
          className="max-w-3xl"
        >
          <div className="space-y-5">
            {/* Author Profile Header */}
            <div className="p-4 rounded-2xl bg-bg border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedPost.author.avatar}
                  initials={selectedPost.author.initials}
                  size="lg"
                  className="rounded-2xl shrink-0"
                />
                <div>
                  <h4 className="text-base font-bold text-text flex items-center gap-2">
                    {selectedPost.author.name}
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-primary/15 text-primary border border-primary/30">
                      {selectedPost.author.role}
                    </span>
                  </h4>
                  <p className="text-xs text-text-muted">{selectedPost.author.username}</p>
                  <p className="text-[11px] text-text-muted/70 font-mono mt-0.5">
                    UID: {selectedPost.authorUid}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                    selectedPost.visibility === 'private'
                      ? 'bg-secondary/15 text-secondary border border-secondary/30'
                      : 'bg-success/15 text-success border border-success/30'
                  )}
                >
                  {selectedPost.visibility === 'private' ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  {selectedPost.visibility}
                </span>
              </div>
            </div>

            {/* Media Box */}
            <div className="rounded-2xl overflow-hidden bg-[#070414] border border-border relative max-h-[460px] flex items-center justify-center">
              {selectedPost.mediaUrl ? (
                selectedPost.mediaType === 'video' ? (
                  <video
                    src={selectedPost.mediaUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[460px] object-contain"
                  />
                ) : (
                  <img
                    src={selectedPost.mediaUrl}
                    alt={selectedPost.caption || 'Post image'}
                    className="w-full max-h-[460px] object-contain"
                  />
                )
              ) : (
                <div className="p-12 text-center text-text-muted">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No media URL in this document</p>
                </div>
              )}

              {selectedPost.mediaUrl && (
                <a
                  href={selectedPost.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-black/90 transition-colors border border-white/10"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Full Resolution
                </a>
              )}
            </div>

            {/* Caption */}
            <div className="p-4 rounded-2xl bg-bg border border-border space-y-1.5">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Caption
              </span>
              <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                {selectedPost.caption || (
                  <span className="italic text-text-muted">No caption attached to this post.</span>
                )}
              </p>
            </div>

            {/* Post Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-bg border border-border space-y-1">
                <span className="text-text-muted">Document ID (Firebase):</span>
                <div className="flex items-center justify-between font-mono font-bold text-text">
                  <span className="truncate">{selectedPost.id}</span>
                  <button
                    onClick={() => handleCopy(selectedPost.id, 'Post ID')}
                    className="p-1 text-text-muted hover:text-white"
                  >
                    {copiedId === selectedPost.id ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-bg border border-border space-y-1">
                <span className="text-text-muted">Created Timestamp:</span>
                <div className="flex items-center gap-1.5 font-medium text-text">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{formatDateTime(selectedPost.createdAtIso)}</span>
                  <span className="text-text-muted">
                    ({formatRelativeTime(selectedPost.createdAtIso)})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-bg border border-border space-y-1">
                <span className="text-text-muted">Media Type:</span>
                <div className="font-bold text-text capitalize">
                  {selectedPost.mediaType || 'Image'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-bg border border-border space-y-1">
                <span className="text-text-muted">Author Contact:</span>
                <div className="text-text truncate">
                  {selectedPost.author.email !== '—'
                    ? selectedPost.author.email
                    : selectedPost.author.phone !== '—'
                    ? selectedPost.author.phone
                    : 'No email or phone recorded'}
                </div>
              </div>
            </div>

            {/* Raw Firestore JSON inspect */}
            <details className="rounded-xl bg-bg border border-border p-3 text-xs">
              <summary className="font-semibold text-text-muted cursor-pointer hover:text-white flex items-center justify-between">
                <span>View Raw Firestore Document</span>
                <span className="text-[11px] text-primary">JSON</span>
              </summary>
              <pre className="mt-3 p-3 rounded-lg bg-black/60 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {JSON.stringify(
                  {
                    id: selectedPost.id,
                    ...selectedPost.rawDoc,
                  },
                  null,
                  2
                )}
              </pre>
            </details>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setPostToDelete(selectedPost);
                }}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Post
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedPost(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── CONFIRM DELETE DIALOG ── */}
      <ConfirmDialog
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDeletePost}
        title="Delete Post from Firebase?"
        message={`Are you sure you want to permanently delete this post (${postToDelete?.id})? This action cannot be undone and will remove it from the platform.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Post'}
        variant="danger"
      />
    </div>
  );
}

