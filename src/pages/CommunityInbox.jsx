import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useUsers } from '../context/UsersContext';
import {
  Send,
  Search,
  MessageSquare,
  Users,
  CheckCheck,
  Check,
  ChevronLeft,
  Inbox,
  Circle,
  RefreshCw,
  Coins,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Landmark,
  ShieldAlert,
  Radio,
  FileText,
  Package,
  Image as ImageIcon,
  X,
  Link2,
  Reply,
  User,
  Trash2,
  Eraser,
  ShieldX,
  MoreVertical,
} from 'lucide-react';
import { cn } from '../lib/cn';

const ADMIN_UID = 'admin_vibora_panel';

// ── Quick reply templates ──────────────────────────────────────────────────
const QUICK_REPLIES = [
  {
    label: '🏦 Share Bank Details',
    text: 'Bank details for coin transfer:\nBank: Meezan Bank Ltd\nAccount Title: Vibora Official Admin\nIBAN: PK36MEZN0002840105492817\nPlease send payment screenshot here once transferred.',
  },
  {
    label: '📱 Share JazzCash / EasyPaisa',
    text: 'Payment Details:\nJazzCash / EasyPaisa: 0311-4627893\nAccount Title: Vibora Official Admin\nPlease send the transaction slip screenshot here.',
  },
  {
    label: '🪙 Coins Added Successfully',
    text: 'Payment verified! Your coins have been added to your Vibora account. Enjoy the app! ✨',
  },
  {
    label: '📸 Send Payment Screenshot',
    text: 'Please share the payment screenshot or transaction ID so we can verify and approve your coins.',
  },
  {
    label: '✅ Looking into this',
    text: 'Thank you for contacting Vibora Admin support! Looking into your request now.',
  },
];

// ── Timestamp helpers ──────────────────────────────────────────────────────
function parseTimestamp(val) {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    try { return val.toDate().toISOString(); } catch { /* skip */ }
  }
  if (val.seconds) return new Date(val.seconds * 1000).toISOString();
  if (typeof val === 'number') return new Date(val).toISOString();
  if (typeof val === 'string') return val;
  return null;
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMins = Math.floor((now - d) / 60000);
    const diffHours = Math.floor((now - d) / 3600000);
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function formatMsgTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function msgDateLabel(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const diffDays = Math.floor((new Date() - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

// ── Thread Item (left panel) ────────────────────────────────────────────────
function ThreadItem({ purchase, isActive, onClick }) {
  const isPending = purchase.purchaseStatus === 'pending' || purchase.status === 'open';
  const isApproved = purchase.purchaseStatus === 'approved';
  const coins = purchase.selectedPackageCoins || 100;
  const unread = Number(purchase.unreadByAdmin || 0);
  const name = purchase.userName || purchase.userEmail?.split('@')[0] || `User ${purchase.userId?.slice(0, 6)}`;

  const [avatarErr, setAvatarErr] = useState(false);
  const rawAvatar = purchase.profileImage;
  const resolvedAvatar = rawAvatar && !avatarErr
    ? (rawAvatar.startsWith('http')
        ? rawAvatar
        : (rawAvatar.startsWith('assets/')
            ? `/${rawAvatar}`
            : (rawAvatar.startsWith('/') ? rawAvatar : null)))
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3.5 px-4 py-4 text-left transition-all duration-150 cursor-pointer border-b border-border/60 relative group',
        isActive
          ? 'bg-gradient-to-r from-primary/25 to-secondary/15 border-r-4 border-r-primary'
          : 'hover:bg-white/[0.05]'
      )}
    >
      {/* Avatar / Real User DP */}
      <div className="relative shrink-0">
        {resolvedAvatar ? (
          <img
            src={resolvedAvatar}
            alt={name}
            onError={() => setAvatarErr(true)}
            className={cn(
              'w-11 h-11 rounded-full object-cover shadow-lg border border-white/10',
              isActive ? 'ring-2 ring-primary shadow-lg shadow-primary/40' : ''
            )}
          />
        ) : (
          <div className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white shadow-lg',
            'bg-gradient-to-br from-[#d946ef] to-[#8b5cf6]',
            isActive ? 'ring-2 ring-primary shadow-lg shadow-primary/40' : ''
          )}>
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0e0826] bg-emerald-400 ring-1 ring-emerald-400/50" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-2 truncate">
            <span className={cn('text-sm font-bold truncate', unread > 0 ? 'text-white' : 'text-zinc-200')}>
              {name}
            </span>
            {isPending && (
              <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black animate-pulse">
                <Coins className="w-3 h-3" />
                <span>{coins} Coins</span>
              </span>
            )}
            {isApproved && (
              <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                <CheckCircle2 className="w-3 h-3" />
                <span>Approved</span>
              </span>
            )}
          </div>
          {purchase.lastMessageAt && (
            <span className="text-[11px] text-zinc-400 whitespace-nowrap shrink-0">
              {formatTime(purchase.lastMessageAt)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {purchase.lastMessageSenderId === 'admin' && (
            <CheckCheck className="w-4 h-4 text-primary shrink-0" />
          )}
          <p className={cn(
            'text-xs truncate leading-normal',
            unread > 0 ? 'text-zinc-100 font-semibold' : 'text-zinc-400',
            isPending ? 'text-amber-200 font-medium' : ''
          )}>
            {purchase.lastMessage
              ? (purchase.lastMessageSenderId === 'admin' ? 'You: ' : '') + purchase.lastMessage
              : 'No messages yet'}
          </p>
        </div>
      </div>

      {/* Unread badge */}
      {unread > 0 && (
        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-[#d946ef] to-[#ec4899] text-white text-[11px] font-black flex items-center justify-center shadow-lg shadow-pink-500/40 animate-pulse">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

// ── Purchase Request Card ───────────────────────────────────────────────────
function PurchaseRequestCard({ request, purchase, onApprove, onReject, onQuickReply, onCopyId, onReply }) {
  const isApproved = request.status === 'approved' || request.purchaseStatus === 'approved';
  const isRejected = request.status === 'rejected' || request.purchaseStatus === 'rejected';
  const isPending = !isApproved && !isRejected;
  const reqId = request.id || request.requestId || '';
  const shortId = reqId.slice(0, 8).toUpperCase();
  const coins = request.selectedPackageCoins || request.coins || purchase?.selectedPackageCoins || 100;

  return (
    <div className="flex flex-col self-start w-full max-w-[94%] sm:max-w-[88%] lg:max-w-[80%] my-3">
      <div className="rounded-3xl border-2 border-pink-500/50 bg-gradient-to-br from-[#2f0e4d] via-[#1c0b33] to-[#120826] shadow-[0_12px_35px_rgba(236,72,153,0.3)] p-5 sm:p-6 backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-pink-500/30 to-transparent pointer-events-none rounded-bl-full" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-3.5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/35">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-white tracking-wide">
                  Purchase Request #{shortId}
                </span>
                <button
                  onClick={() => onCopyId(reqId)}
                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all text-xs font-semibold cursor-pointer flex items-center gap-1"
                  title="Copy Request ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <span className="text-xs text-pink-300 font-medium">userspurchases/{purchase?.userId}/requests</span>
            </div>
          </div>

          <div>
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
                Approved & Credited
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-rose-500/25 border border-rose-500/50 text-rose-300 shadow-md">
                <XCircle className="w-4 h-4" />
                Declined
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black bg-amber-500/25 border border-amber-500/50 text-amber-300 shadow-md animate-pulse">
                <Circle className="w-2.5 h-2.5 fill-amber-300" />
                Pending Review
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between mb-4">
          <div>
            <span className="text-xs sm:text-sm text-zinc-400 block font-medium mb-1">Selected Package</span>
            <span className="text-2xl sm:text-4xl font-black text-amber-300 flex items-center gap-2">
              <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
              {coins} Coins
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs sm:text-sm text-zinc-400 block font-medium mb-1">Status</span>
            <span className="text-sm sm:text-base font-bold text-white capitalize">
              {request.status || request.purchaseStatus || 'Pending'}
            </span>
          </div>
        </div>

        {/* Note */}
        {request.note && (
          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/10 mb-4 font-medium italic">
            &ldquo;{request.note}&rdquo;
          </p>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-2.5">
          {isPending ? (
            <>
              <button
                onClick={() => onApprove(request, purchase)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept Request (+Credit {coins} Coins)
              </button>

              <button
                onClick={() => onReject(request, purchase)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold">
              {isApproved && (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Request Accepted & Coins credited to user wallet.
                </span>
              )}
              {isRejected && (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  Request was declined.
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onReply && (
              <button
                onClick={() => onReply({ id: reqId, text: `${coins} Coins Purchase Request #${shortId}`, sender: 'user' })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs text-purple-200 font-bold transition-all cursor-pointer shadow-sm"
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
            )}

            <button
              onClick={() => onQuickReply('bank', request, purchase)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs text-cyan-300 font-bold transition-all cursor-pointer shadow-sm"
            >
              <Landmark className="w-4 h-4" />
              Bank Info
            </button>

            <button
              onClick={() => onQuickReply('wallet', request, purchase)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs text-pink-300 font-bold transition-all cursor-pointer shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              Wallet Info
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mt-3 pt-2.5 border-t border-white/[0.08]">
          <span>
            Request ID: <strong className="text-zinc-300 font-mono">{reqId.slice(0, 16)}</strong>
          </span>
          <span>{formatMsgTime(parseTimestamp(request.createdAt) || parseTimestamp(request.timestamp))}</span>
        </div>
      </div>
    </div>
  );
}

// ── Inline Purchase Request Bubble (from messages subcollection) ────────────
function PurchaseRequestBubble({ msg, onReply }) {
  const isApproved = msg.purchaseStatus === 'approved';
  const isRejected = msg.purchaseStatus === 'rejected';
  const isPending = !isApproved && !isRejected;
  const shortId = (msg.purchaseRequestId || '').slice(0, 8).toUpperCase();

  return (
    <div className="flex flex-col self-start w-full max-w-[90%] sm:max-w-[80%] my-2">
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#1e0a38] to-[#120826] p-4 shadow-lg">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center shrink-0">
            <Coins className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white">
              {msg.packageCoins} Coins Purchase Request
            </p>
            {shortId && (
              <p className="text-[11px] text-pink-300 font-mono">#{shortId}</p>
            )}
          </div>
          <div className="ml-auto">
            {isApproved && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Approved
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300">
                <XCircle className="w-3 h-3" /> Rejected
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
                <Circle className="w-2 h-2 fill-amber-300" /> Pending
              </span>
            )}
          </div>
        </div>
        {msg.text && (
          <p className="text-xs text-zinc-300 italic leading-relaxed border-t border-white/10 pt-2 mt-1">
            &ldquo;{msg.text}&rdquo;
          </p>
        )}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
          {onReply ? (
            <button
              onClick={() => onReply(msg)}
              className="flex items-center gap-1 text-[11px] text-pink-300 hover:text-white font-bold cursor-pointer transition-colors"
            >
              <Reply className="w-3.5 h-3.5" /> Reply to this request
            </button>
          ) : <span />}
          <span className="text-[10px] text-zinc-500">{formatMsgTime(msg.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Helper: compress image to small base64 JPEG ────────────────────────────
function compressImage(file, maxWidth = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Message Action Toolbar (Sleek WhatsApp / Telegram style on hover) ────────
function MessageActionToolbar({ msg, onReply, onDelete, isAdmin }) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopy = () => {
    const text = msg.text || msg.message || msg.imageUrl || '';
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#180e2f]/95 border border-rose-500/40 shadow-xl backdrop-blur-md shrink-0 animate-fade-in z-20">
        <span className="text-[11px] font-bold text-rose-300">Delete msg?</span>
        <button
          type="button"
          onClick={() => {
            setConfirmDelete(false);
            onDelete(msg.id);
          }}
          className="px-2 py-0.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold transition-colors cursor-pointer"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-300 text-[10px] transition-colors cursor-pointer"
        >
          No
        </button>
      </div>
    );
  }

  const canDelete = onDelete && !msg.id?.startsWith('tmp-') && !msg.id?.startsWith('synth-');

  return (
    <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-0.5 p-1 rounded-2xl bg-[#140b2a]/95 border border-white/10 shadow-xl backdrop-blur-md shrink-0 scale-95 group-hover:scale-100">
      {onReply && (
        <button
          type="button"
          onClick={() => onReply(msg)}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      )}

      {msg.text && (
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title={copied ? "Copied!" : "Copy"}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
          title="Delete message"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Message Bubble ──────────────────────────────────────────────────────────
function Bubble({ msg, isAdmin, onReply, onDelete }) {
  // Quoted reply snippet if this message is a reply
  const renderQuoted = () => {
    if (!msg.replyTo) return null;
    return (
      <div className={cn(
        'mb-2 px-3 py-1.5 rounded-xl text-xs border-l-4 bg-black/35 flex flex-col gap-0.5',
        isAdmin ? 'border-white/80 text-white/95' : 'border-pink-500 text-zinc-200'
      )}>
        <span className="font-bold text-[10px] text-pink-300">
          {msg.replyTo.sender === 'admin' ? '👑 Admin' : (msg.replyTo.userName || 'User')}
        </span>
        <span className="truncate text-xs opacity-90 italic">
          {msg.replyTo.text || (msg.replyTo.imageUrl ? '📷 Photo' : 'Message')}
        </span>
      </div>
    );
  };

  // Image message
  if (msg.messageType === 'image' || msg.imageUrl) {
    const caption = (msg.text && msg.text !== 'Photo' && msg.text !== msg.imageUrl)
      ? msg.text
      : (msg.message && msg.message !== 'Photo' && msg.message !== msg.imageUrl ? msg.message : null);

    return (
      <div className={cn('group flex items-center gap-2.5 my-2 max-w-[75%] sm:max-w-[60%]', isAdmin ? 'self-end flex-row-reverse' : 'self-start')}>
        <div className={cn('flex flex-col', isAdmin ? 'items-end' : 'items-start')}>
          <div className={cn(
            'rounded-3xl overflow-hidden shadow-2xl border transition-all p-1.5',
            isAdmin ? 'border-purple-500/40 rounded-br-none bg-gradient-to-br from-[#1e0d3a] to-[#120826]' : 'border-white/10 rounded-bl-none bg-[#140b2b]'
          )}>
            {renderQuoted()}
            <img
              src={msg.imageUrl}
              alt="Shared image"
              className="block w-full max-w-[280px] sm:max-w-[340px] max-h-[380px] rounded-2xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open(msg.imageUrl, '_blank')}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback if image fails */}
            <div
              style={{ display: 'none' }}
              className="w-[200px] h-[120px] bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-400 p-3"
            >
              <FileText className="w-8 h-8 opacity-40" />
              <span className="text-xs">Image load failed</span>
              <a
                href={msg.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline"
              >
                Open link
              </a>
            </div>

            {/* Optional Caption */}
            {caption && (
              <div className="p-3 text-xs sm:text-sm text-zinc-100 font-medium border-t border-white/10 whitespace-pre-wrap break-words">
                {caption}
              </div>
            )}
          </div>
          <div className={cn('flex items-center gap-1.5 text-xs mt-1.5 px-1 opacity-70', isAdmin ? 'text-right justify-end' : 'text-zinc-400')}>
            <span>{formatMsgTime(msg.createdAt)}</span>
            {isAdmin && (
              msg.read || msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-cyan-300" /> : <Check className="w-3.5 h-3.5 text-white/80" />
            )}
          </div>
        </div>

        <MessageActionToolbar msg={msg} onReply={onReply} onDelete={onDelete} isAdmin={isAdmin} />
      </div>
    );
  }

  // Normal text message
  return (
    <div className={cn('group flex items-center gap-2.5 max-w-[85%] sm:max-w-[78%] my-2', isAdmin ? 'self-end flex-row-reverse' : 'self-start')}>
      <div
        className={cn(
          'px-5 py-3.5 sm:py-4 rounded-3xl text-sm sm:text-base leading-relaxed shadow-xl transition-all',
          isAdmin
            ? 'bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white rounded-br-none shadow-[0_6px_22px_rgba(168,85,247,0.32)] font-medium'
            : 'bg-[#1b123d] border border-white/[0.12] text-zinc-100 rounded-bl-none shadow-md font-medium'
        )}
      >
        {renderQuoted()}
        <p className="whitespace-pre-wrap break-words">{msg.text || ''}</p>
        <div className={cn('flex items-center gap-1.5 text-xs mt-2 pt-1 border-t border-white/10 opacity-85', isAdmin ? 'justify-end text-white/95' : 'text-zinc-400')}>
          <span>{formatMsgTime(msg.createdAt)}</span>
          {isAdmin && (
            msg.read || msg.isRead
              ? <CheckCheck className="w-4 h-4 text-cyan-200" title="Read by User" />
              : <Check className="w-4 h-4 text-white/80" title="Sent" />
          )}
        </div>
      </div>

      <MessageActionToolbar msg={msg} onReply={onReply} onDelete={onDelete} isAdmin={isAdmin} />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function CommunityInbox() {
  const { users, updateUser } = useUsers();

  // All userspurchases docs
  const [purchases, setPurchases] = useState([]);

  // Per-user messages: { [userId]: [msg, ...] }
  const [userMessages, setUserMessages] = useState({});

  // Per-user requests: { [userId]: [req, ...] }
  const [userRequests, setUserRequests] = useState({});

  const [activeUserId, setActiveUserId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, text, sender, userName, isImage }
  const [senderRole, setSenderRole] = useState('admin'); // 'admin' | 'user'
  const [selectedImage, setSelectedImage] = useState(null); // { dataUrl, name, isUrl }
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [mobileView, setMobileView] = useState('list');
  const [firestoreStatus, setFirestoreStatus] = useState('checking');
  const [rulesAlert, setRulesAlert] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [copiedRule, setCopiedRule] = useState(false);
  const [toast, setToast] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Active subcollection listeners cleanup refs
  const msgUnsubRef = useRef(null);
  const reqUnsubRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── 1. Real-time listener: userspurchases ─────────────────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'userspurchases'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId || d.id,
            userName: data.userName || data.name || data.fullName || null,
            userEmail: data.userEmail || data.email || null,
            userPhone: data.userPhone || data.phone || null,
            activeRequestId: data.activeRequestId || '',
            lastMessage: data.lastMessage || '',
            lastMessageAt: parseTimestamp(data.lastMessageAt || data.updatedAt || data.createdAt),
            lastMessageSenderId: data.lastMessageSenderId || '',
            purchaseStatus: data.purchaseStatus || data.status || 'pending',
            status: data.status || 'open',
            selectedPackageCoins: Number(data.selectedPackageCoins || data.coins || 100),
            unreadByAdmin: Number(data.unreadByAdmin || 0),
            unreadByUser: Number(data.unreadByUser || 0),
            createdAt: parseTimestamp(data.createdAt),
          };
        });

        // Sort: pending first, then by lastMessageAt desc
        list.sort((a, b) => {
          const aPending = a.purchaseStatus === 'pending' || a.status === 'open';
          const bPending = b.purchaseStatus === 'pending' || b.status === 'open';
          if (aPending && !bPending) return -1;
          if (!aPending && bPending) return 1;
          return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
        });

        setPurchases(list);
        setFirestoreStatus('connected');
        setRulesAlert(false);

        // Auto-select first user if none selected
        setActiveUserId((prev) => prev || (list[0]?.userId || list[0]?.id || null));
      },
      (err) => {
        console.warn('userspurchases error:', err.message);
        if (err.code === 'permission-denied') {
          setRulesAlert(true);
          setFirestoreStatus('permission_denied');
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // ── 2. Real-time listeners: messages + requests subcollections ────────────
  useEffect(() => {
    // Cleanup previous listeners
    if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
    if (reqUnsubRef.current) { reqUnsubRef.current(); reqUnsubRef.current = null; }

    if (!activeUserId) return;

    setLoadingMessages(true);

    // Listen to messages subcollection
    const msgRef = query(
      collection(db, 'userspurchases', activeUserId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    msgUnsubRef.current = onSnapshot(
      msgRef,
      (snap) => {
        const msgs = snap.docs.map((d) => {
          const data = d.data();
          const senderIsAdmin =
            data.sender === 'admin' ||
            data.senderId === 'admin' ||
            data.senderId === ADMIN_UID ||
            data.senderType === 'admin';
          return {
            id: d.id,
            type: 'message',
            messageType: data.messageType || data.type || 'text',
            text: data.text || data.message || data.content || '',
            imageUrl: data.imageUrl || data.image || data.photoUrl || null,
            sender: senderIsAdmin ? 'admin' : 'user',
            senderId: data.senderId || data.sender || '',
            createdAt: parseTimestamp(data.createdAt || data.timestamp) || new Date().toISOString(),
            read: Boolean(data.read || data.isRead),
            replyTo: data.replyTo || null,
            // purchase_request fields (when sent from mobile app)
            packageCoins: data.packageCoins || data.selectedPackageCoins || data.coins || 0,
            purchaseRequestId: data.purchaseRequestId || data.activeRequestId || '',
            purchaseStatus: data.purchaseStatus || 'pending',
          };
        });

        setUserMessages((prev) => ({ ...prev, [activeUserId]: msgs }));
        setLoadingMessages(false);
        setFirestoreStatus('connected');
      },
      (err) => {
        console.debug('messages listener:', err.message);
        // Try without orderBy if index missing
        const msgRefFallback = collection(db, 'userspurchases', activeUserId, 'messages');
        msgUnsubRef.current = onSnapshot(msgRefFallback, (snap) => {
          const msgs = snap.docs.map((d) => {
            const data = d.data();
            const senderIsAdmin = data.sender === 'admin' || data.senderId === 'admin' || data.senderType === 'admin';
            return {
              id: d.id,
              type: 'message',
              messageType: data.messageType || data.type || 'text',
              text: data.text || data.message || data.content || '',
              imageUrl: data.imageUrl || data.image || data.photoUrl || null,
              sender: senderIsAdmin ? 'admin' : 'user',
              senderId: data.senderId || '',
              createdAt: parseTimestamp(data.createdAt || data.timestamp) || new Date().toISOString(),
              read: Boolean(data.read || data.isRead),
              replyTo: data.replyTo || null,
              packageCoins: data.packageCoins || data.selectedPackageCoins || 0,
              purchaseRequestId: data.purchaseRequestId || '',
              purchaseStatus: data.purchaseStatus || 'pending',
            };
          }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          setUserMessages((prev) => ({ ...prev, [activeUserId]: msgs }));
          setLoadingMessages(false);
        }, () => setLoadingMessages(false));
      }
    );

    // Listen to requests subcollection
    const reqRef = collection(db, 'userspurchases', activeUserId, 'requests');
    reqUnsubRef.current = onSnapshot(
      reqRef,
      (snap) => {
        const reqs = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: 'request',
            status: data.status || data.purchaseStatus || 'pending',
            purchaseStatus: data.purchaseStatus || data.status || 'pending',
            selectedPackageCoins: Number(data.selectedPackageCoins || data.coins || 0),
            coins: Number(data.coins || data.selectedPackageCoins || 0),
            note: data.note || data.message || '',
            createdAt: parseTimestamp(data.createdAt || data.timestamp) || new Date().toISOString(),
            requestId: d.id,
          };
        }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        setUserRequests((prev) => ({ ...prev, [activeUserId]: reqs }));
      },
      (err) => console.debug('requests listener:', err.message)
    );

    return () => {
      if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
      if (reqUnsubRef.current) { reqUnsubRef.current(); reqUnsubRef.current = null; }
    };
  }, [activeUserId]);

  // ── 3. Active purchase & derived user info ────────────────────────────────
  const activePurchase = useMemo(
    () => purchases.find((p) => (p.userId || p.id) === activeUserId),
    [purchases, activeUserId]
  );

  // Build user object from Firestore doc fields OR users context
  const activeUser = useMemo(() => {
    if (!activeUserId) return null;
    const contextUser = users.find((u) => u.id === activeUserId || u.uid === activeUserId);
    if (contextUser) return contextUser;
    if (activePurchase) {
      return {
        id: activeUserId,
        uid: activeUserId,
        name: activePurchase.userName || activePurchase.userEmail?.split('@')[0] || `User ${activeUserId.slice(0, 6)}`,
        fullName: activePurchase.userName || `User ${activeUserId.slice(0, 6)}`,
        email: activePurchase.userEmail || '—',
        mobile: activePurchase.userPhone || '—',
        username: activePurchase.userEmail ? `@${activePurchase.userEmail.split('@')[0]}` : `@user_${activeUserId.slice(0, 6)}`,
        initials: (activePurchase.userName || activeUserId).slice(0, 2).toUpperCase(),
        coins: 0,
        isOnline: true,
      };
    }
    return {
      id: activeUserId,
      uid: activeUserId,
      name: `User ${activeUserId.slice(0, 6)}`,
      fullName: `User ${activeUserId.slice(0, 6)}`,
      email: '—',
      mobile: '—',
      username: `@user_${activeUserId.slice(0, 6)}`,
      initials: activeUserId.slice(0, 2).toUpperCase(),
      coins: 0,
      isOnline: true,
    };
  }, [activeUserId, activePurchase, users]);

  // ── 4. Merged chat timeline (messages + requests interleaved) ─────────────
  const chatTimeline = useMemo(() => {
    if (!activeUserId) return [];

    const msgs = (userMessages[activeUserId] || []).map((m) => ({ ...m }));
    const reqs = (userRequests[activeUserId] || []).map((r) => ({ ...r }));

    // If no requests in subcollection but purchase doc has purchase info, synthesize one
    const combined = [...msgs, ...reqs];

    if (reqs.length === 0 && activePurchase) {
      combined.unshift({
        id: `synth-req-${activePurchase.id}`,
        type: 'request',
        status: activePurchase.purchaseStatus,
        purchaseStatus: activePurchase.purchaseStatus,
        selectedPackageCoins: activePurchase.selectedPackageCoins,
        coins: activePurchase.selectedPackageCoins,
        note: activePurchase.lastMessage || '',
        createdAt: activePurchase.createdAt || activePurchase.lastMessageAt || new Date().toISOString(),
        requestId: activePurchase.activeRequestId || activePurchase.id,
      });
    }

    return combined.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [activeUserId, userMessages, userRequests, activePurchase]);

  // Group by date for separator labels
  const groupedTimeline = useMemo(() => {
    const groups = [];
    let lastDate = '';
    chatTimeline.forEach((item) => {
      const label = msgDateLabel(item.createdAt);
      if (label !== lastDate) {
        groups.push({ type: 'date_separator', label, id: `sep-${label}` });
        lastDate = label;
      }
      groups.push(item);
    });
    return groups;
  }, [chatTimeline]);

  // ── 5. Auto scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupedTimeline.length, activeUserId]);

  // ── 6. Mark as read ───────────────────────────────────────────────────────
  const markAsRead = useCallback(async (uid) => {
    if (!uid) return;
    setPurchases((prev) => prev.map((p) => (p.userId === uid || p.id === uid) ? { ...p, unreadByAdmin: 0 } : p));
    try {
      await updateDoc(doc(db, 'userspurchases', uid), { unreadByAdmin: 0 });
    } catch { /* ignore */ }
  }, []);

  function handleSelectUser(uid) {
    setActiveUserId(uid);
    setMobileView('chat');
    markAsRead(uid);
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  // ── Paste & file select handlers for images ──────────────────────────────
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          try {
            const dataUrl = await compressImage(file);
            setSelectedImage({ dataUrl, name: 'screenshot.jpg' });
          } catch (err) {
            console.error('Image paste failed:', err);
          }
          break;
        }
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setSelectedImage({ dataUrl, name: file.name });
    } catch (err) {
      console.error('File load failed:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    setSelectedImage({ dataUrl: urlInput.trim(), name: 'Linked Image', isUrl: true });
    setUrlInput('');
    setShowUrlModal(false);
  };

  // ── Handle reply-to specific message or request ───────────────────────────
  const handleReplyTo = (item) => {
    const text = item.text || item.message || (item.imageUrl ? 'Photo' : (item.packageCoins ? `${item.packageCoins} Coins Request` : 'Message'));
    const isSenderAdmin = item.sender === 'admin' || item.senderType === 'admin' || item.senderId === 'admin';
    setReplyingTo({
      id: item.id,
      text: String(text).slice(0, 80),
      sender: isSenderAdmin ? 'admin' : 'user',
      userName: isSenderAdmin ? 'Admin' : (activeUser?.name || 'User'),
      isImage: !!item.imageUrl,
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── 7. Send reply (supports Admin reply, User reply simulation, Image & Quote Reply) ─────
  const sendReply = useCallback(async (customText = null, imagePayload = null) => {
    const imgToSend = imagePayload !== null ? imagePayload : selectedImage;
    const textToSend = (customText !== null ? customText : replyText).trim();
    if ((!textToSend && !imgToSend) || !activeUserId) return;

    const uid = activeUserId;
    const isImage = !!imgToSend?.dataUrl;
    const imageUrl = imgToSend?.dataUrl || '';
    const activeReqId = activePurchase?.activeRequestId || '';

    const asUser = senderRole === 'user';
    const sender = asUser ? (activeUser?.name || 'user') : 'admin';
    const senderType = asUser ? 'user' : 'admin';
    const senderId = asUser ? uid : 'admin';
    const receiverId = asUser ? 'admin' : uid;

    const currentReplyTo = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text,
      sender: replyingTo.sender,
      userName: replyingTo.userName,
    } : null;

    const tempMsg = {
      id: `tmp-${Date.now()}`,
      type: isImage ? 'image' : 'message',
      messageType: isImage ? 'image' : 'text',
      text: textToSend || (isImage ? 'Photo' : ''),
      message: textToSend || (isImage ? 'Photo' : ''),
      content: textToSend || (isImage ? 'Photo' : ''),
      imageUrl: isImage ? imageUrl : undefined,
      sender,
      senderType,
      senderId,
      replyTo: currentReplyTo,
      createdAt: new Date().toISOString(),
      read: false,
    };

    // Optimistic UI update
    setUserMessages((prev) => ({ ...prev, [uid]: [...(prev[uid] || []), tempMsg] }));
    const summaryText = isImage ? (textToSend ? `📷 ${textToSend}` : '📷 Photo') : textToSend;
    setPurchases((prev) =>
      prev.map((p) =>
        (p.userId === uid || p.id === uid)
          ? {
            ...p,
            lastMessage: summaryText,
            lastMessageAt: new Date().toISOString(),
            lastMessageSenderId: senderId,
            unreadByUser: asUser ? (p.unreadByUser || 0) : (p.unreadByUser || 0) + 1,
            unreadByAdmin: asUser ? (p.unreadByAdmin || 0) + 1 : 0,
          }
          : p
      )
    );
    setReplyText('');
    setSelectedImage(null);
    setReplyingTo(null);
    inputRef.current?.focus();

    try {
      const docData = {
        messageType: isImage ? 'image' : 'text',
        type: isImage ? 'image' : 'text',
        message: textToSend || (isImage ? 'Photo' : ''),
        text: textToSend || (isImage ? 'Photo' : ''),
        content: textToSend || (isImage ? imageUrl : ''),
        sender,
        senderType,
        senderId,
        receiverId,
        purchaseRequestId: activeReqId,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
        isRead: false,
        read: false,
      };

      if (isImage) {
        docData.imageUrl = imageUrl;
      }
      if (currentReplyTo) {
        docData.replyTo = currentReplyTo;
      }

      // Write to Firestore messages subcollection
      await addDoc(collection(db, 'userspurchases', uid, 'messages'), docData);

      // Update parent doc
      await updateDoc(doc(db, 'userspurchases', uid), {
        lastMessage: summaryText,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: senderId,
        unreadByUser: asUser ? (activePurchase?.unreadByUser || 0) : (activePurchase?.unreadByUser || 0) + 1,
        unreadByAdmin: asUser ? (activePurchase?.unreadByAdmin || 0) + 1 : 0,
        updatedAt: serverTimestamp(),
      });

      // Sync to conversations collection for mobile app
      const convId = [ADMIN_UID, uid].sort().join('_');
      await setDoc(
        doc(db, 'conversations', convId),
        {
          lastMessage: summaryText,
          lastSenderId: senderId,
          updatedAt: serverTimestamp(),
          participants: [ADMIN_UID, uid],
        },
        { merge: true }
      ).catch(() => { });

      setFirestoreStatus('connected');
      setRulesAlert(false);
    } catch (e) {
      console.warn('Firestore write error:', e.code, e.message);
      if (e.code === 'permission-denied') {
        setFirestoreStatus('permission_denied');
        setRulesAlert(true);
        setShowRulesModal(true);
      }
    }
  }, [replyText, selectedImage, activeUserId, activePurchase, replyingTo, senderRole, activeUser]);

  // ── 8. Approve purchase request ───────────────────────────────────────────
  const handleApproveRequest = useCallback(async (request, purchase) => {
    const uid = purchase?.userId || purchase?.id || activeUserId;
    const reqId = request?.requestId || request?.id || purchase?.activeRequestId || '';
    const shortId = reqId.slice(0, 8).toUpperCase();
    const coins = request?.selectedPackageCoins || request?.coins || purchase?.selectedPackageCoins || 100;

    // Optimistic local update
    setPurchases((prev) =>
      prev.map((p) =>
        (p.userId === uid || p.id === uid)
          ? { ...p, purchaseStatus: 'approved', status: 'approved' }
          : p
      )
    );
    setUserRequests((prev) => ({
      ...prev,
      [uid]: (prev[uid] || []).map((r) =>
        r.id === request.id ? { ...r, status: 'approved', purchaseStatus: 'approved' } : r
      ),
    }));

    // Add coins to user
    const ctxUser = users.find((u) => u.id === uid || u.uid === uid);
    const newCoins = Number(ctxUser?.coins || 0) + coins;
    if (ctxUser) updateUser(uid, { coins: newCoins });

    try {
      await updateDoc(doc(db, 'userspurchases', uid), {
        purchaseStatus: 'approved',
        status: 'approved',
        approvedAt: serverTimestamp(),
        lastMessage: `✅ Coin purchase approved: ${coins} Coins credited!`,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: 'admin',
        unreadByUser: 1,
        unreadByAdmin: 0,
      });

      if (reqId) {
        await setDoc(
          doc(db, 'userspurchases', uid, 'requests', reqId),
          { status: 'approved', purchaseStatus: 'approved', approvedAt: serverTimestamp() },
          { merge: true }
        ).catch(() => { });
      }

      // Update user coins in users collection
      if (ctxUser) {
        await updateDoc(doc(db, 'users', uid), { coins: newCoins }).catch(() => { });
      }

      await addDoc(collection(db, 'notifications'), {
        userId: uid,
        type: 'coin_purchase_approved',
        title: '✅ Coin Purchase Accepted!',
        body: `Your purchase request #${shortId} has been accepted! ${coins} coins have been added to your Vibora wallet. 🪙✨`,
        coins,
        requestId: reqId,
        isRead: false,
        read: false,
        createdAt: serverTimestamp(),
      }).catch(() => { });

    } catch (err) {
      console.warn('Approve error:', err.message);
    }

    await sendReply(`✅ Your purchase request #${shortId} for ${coins} Coins has been ACCEPTED! Coins have been credited to your Vibora account. Thank you! 🪙✨`);
  }, [activeUserId, users, updateUser, sendReply]);

  // ── 9. Reject request ─────────────────────────────────────────────────────
  const handleRejectRequest = useCallback(async (request, purchase) => {
    const uid = purchase?.userId || purchase?.id || activeUserId;
    const reqId = request?.requestId || request?.id || purchase?.activeRequestId || '';
    const shortId = reqId.slice(0, 8).toUpperCase();

    setPurchases((prev) =>
      prev.map((p) =>
        (p.userId === uid || p.id === uid) ? { ...p, purchaseStatus: 'rejected', status: 'rejected' } : p
      )
    );
    setUserRequests((prev) => ({
      ...prev,
      [uid]: (prev[uid] || []).map((r) =>
        r.id === request.id ? { ...r, status: 'rejected', purchaseStatus: 'rejected' } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'userspurchases', uid), {
        purchaseStatus: 'rejected',
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        unreadByUser: 1,
        unreadByAdmin: 0,
      });

      if (reqId) {
        await setDoc(
          doc(db, 'userspurchases', uid, 'requests', reqId),
          { status: 'rejected', purchaseStatus: 'rejected', rejectedAt: serverTimestamp() },
          { merge: true }
        ).catch(() => { });
      }
    } catch (err) {
      console.warn('Reject error:', err.message);
    }

    sendReply(`⚠️ Your purchase request #${shortId} could not be approved at this time. Please send your verified payment slip or contact admin support.`);
  }, [activeUserId, sendReply]);

  // ── 10. Quick Payment Reply ───────────────────────────────────────────────
  const handleQuickPaymentReply = (type, request, purchase) => {
    const reqId = request?.requestId || request?.id || purchase?.activeRequestId || '';
    const shortId = reqId.slice(0, 8).toUpperCase();
    const coins = request?.selectedPackageCoins || request?.coins || purchase?.selectedPackageCoins || 100;
    const name = activeUser?.name || 'there';

    if (type === 'bank') {
      sendReply(
        `Hi ${name}! Here are the official Bank details for Purchase Request #${shortId}:\n\n` +
        `🏦 Bank Name: Meezan Bank Ltd\n` +
        `👤 Account Title: Vibora Official Admin\n` +
        `🔢 Account No: 02840105492817\n` +
        `🌐 IBAN: PK36MEZN0002840105492817\n\n` +
        `Please reply with your payment screenshot here to approve ${coins} coins instantly! 🪙`
      );
    } else {
      sendReply(
        `Hi ${name}! Here are the Mobile Wallet details for Purchase Request #${shortId}:\n\n` +
        `📱 JazzCash: 0311-4627893\n` +
        `📱 EasyPaisa: 0311-4627893\n` +
        `👤 Title: Vibora Official Admin\n\n` +
        `Please send your transaction receipt screenshot here to add ${coins} coins immediately! 🪙`
      );
    }
  };

  // ── 11. Utility: copy & sync ──────────────────────────────────────────────
  const handleCopyId = (text) => {
    navigator.clipboard.writeText(text).catch(() => { });
    setToast(`Copied: ${text.slice(0, 20)}`);
    setTimeout(() => setToast(''), 2000);
  };

  // ── 11b. Delete single message ─────────────────────────────────────────────
  const handleDeleteMessage = useCallback(async (msgId) => {
    if (!activeUserId || !msgId) return;
    // Optimistic UI removal
    setUserMessages((prev) => ({
      ...prev,
      [activeUserId]: (prev[activeUserId] || []).filter((m) => m.id !== msgId),
    }));
    try {
      await deleteDoc(doc(db, 'userspurchases', activeUserId, 'messages', msgId));
      setToast('Message deleted ✓');
      setTimeout(() => setToast(''), 2000);
    } catch (e) {
      console.warn('Delete message error:', e);
      setToast('Delete failed – check Firestore rules');
      setTimeout(() => setToast(''), 3000);
    }
  }, [activeUserId]);

  // ── 11c. Clear & Delete controls state ────────────────────────────────────
  const [showClearConfirm, setShowClearConfirm] = useState(null); // 'messages' | 'full'
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const handleClearMessages = useCallback(async () => {
    if (!activeUserId) return;
    setShowClearConfirm(null);
    try {
      const messagesRef = collection(db, 'userspurchases', activeUserId, 'messages');
      const snap = await getDocs(messagesRef);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setUserMessages((prev) => ({ ...prev, [activeUserId]: [] }));
      setToast(`✅ All messages cleared for this user`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      console.warn('Clear messages error:', e);
      setToast('Clear failed – check Firestore rules');
      setTimeout(() => setToast(''), 3000);
    }
  }, [activeUserId]);

  // ── 11d. Clear full user file: messages + requests subcollections ───────────
  const handleClearUserFile = useCallback(async () => {
    if (!activeUserId) return;
    setShowClearConfirm(null);
    try {
      const batch = writeBatch(db);

      const messagesSnap = await getDocs(collection(db, 'userspurchases', activeUserId, 'messages'));
      messagesSnap.docs.forEach((d) => batch.delete(d.ref));

      const requestsSnap = await getDocs(collection(db, 'userspurchases', activeUserId, 'requests'));
      requestsSnap.docs.forEach((d) => batch.delete(d.ref));

      // Reset parent doc metadata
      batch.set(doc(db, 'userspurchases', activeUserId), {
        lastMessage: '',
        lastMessageAt: null,
        unreadByAdmin: 0,
        unreadByUser: 0,
        purchaseStatus: 'pending',
        status: 'open',
      }, { merge: true });

      await batch.commit();

      setUserMessages((prev) => ({ ...prev, [activeUserId]: [] }));
      setUserRequests((prev) => ({ ...prev, [activeUserId]: [] }));
      setPurchases((prev) => prev.map((p) =>
        (p.userId === activeUserId || p.id === activeUserId)
          ? { ...p, lastMessage: '', unreadByAdmin: 0, unreadByUser: 0, purchaseStatus: 'pending' }
          : p
      ));
      setToast(`🗑️ User file fully cleared`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      console.warn('Clear user file error:', e);
      setToast('Clear failed – check Firestore rules');
      setTimeout(() => setToast(''), 3000);
    }
  }, [activeUserId]);

  function copyRuleSnippet() {
    const rule = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
    navigator.clipboard.writeText(rule).catch(() => { });
    setCopiedRule(true);
    setToast('Firestore Rules Copied!');
    setTimeout(() => { setCopiedRule(false); setToast(''); }, 2500);
  }

  const syncFirestore = async () => {
    try {
      const snap = await getDocs(collection(db, 'userspurchases'));
      setFirestoreStatus('connected');
      setRulesAlert(false);
      setToast(`✅ Connected! ${snap.size} user purchase records found.`);
      setTimeout(() => setToast(''), 3000);
    } catch {
      setFirestoreStatus('permission_denied');
      setRulesAlert(true);
      setShowRulesModal(true);
    }
  };

  // ── 12. Filter & sort left panel ──────────────────────────────────────────
  // Show ONLY real Firestore purchase requests & chats (no dummy/filler data)
  const enrichedPurchases = useMemo(() => {
    const userMap = new Map();
    users.forEach((u) => {
      const uid = u.uid || u.id;
      if (uid) userMap.set(uid, u);
    });

    return purchases.map((p) => {
      const uid = p.userId || p.id;
      const matchedUser = userMap.get(uid);
      return {
        ...p,
        userName: p.userName || matchedUser?.name || matchedUser?.fullName || `User ${uid.slice(0, 6)}`,
        userEmail: p.userEmail || matchedUser?.email || '',
        userPhone: p.userPhone || matchedUser?.mobile || '',
        profileImage: matchedUser?.profileImage || null,
        userCoins: matchedUser?.coins ?? null,
      };
    });
  }, [purchases, users]);

  // Lazy limit for lifetime performance — prevents rendering thousands of DOM nodes at once
  const [threadLimit, setThreadLimit] = useState(50);

  useEffect(() => {
    setThreadLimit(50);
  }, [search, filterType]);

  const filteredPurchases = useMemo(() => {
    return enrichedPurchases.filter((p) => {
      const name = (p.userName || p.userEmail || p.userId || '').toLowerCase();
      const matchSearch =
        !search ||
        name.includes(search.toLowerCase()) ||
        p.userId?.toLowerCase().includes(search.toLowerCase()) ||
        p.activeRequestId?.toLowerCase().includes(search.toLowerCase()) ||
        String(p.selectedPackageCoins).includes(search);
      if (!matchSearch) return false;
      if (filterType === 'pending') return p.purchaseStatus === 'pending' || p.status === 'open';
      if (filterType === 'unread') return p.unreadByAdmin > 0;
      if (filterType === 'requests') return p.purchaseStatus && p.purchaseStatus !== 'none';
      return true;
    });
  }, [enrichedPurchases, search, filterType]);

  const visiblePurchases = useMemo(() => {
    return filteredPurchases.slice(0, threadLimit);
  }, [filteredPurchases, threadLimit]);

  const totalPending = purchases.filter((p) => p.purchaseStatus === 'pending' || p.status === 'open').length;
  const totalUnread = purchases.reduce((acc, p) => acc + (p.unreadByAdmin || 0), 0);
  const totalRequests = purchases.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-120px)] min-h-[720px] w-full relative">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-2.5 rounded-2xl bg-emerald-500/95 text-white font-bold text-sm shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          {toast}
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#120a2e] border-2 border-pink-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Firestore Rules Update Karein</h3>
                  <span className="text-xs text-pink-300 font-medium">Firebase Security Policy</span>
                </div>
              </div>
              <button onClick={() => setShowRulesModal(false)} className="text-text-muted hover:text-white p-1 text-base cursor-pointer">✕</button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p>
                Firestore me <strong className="text-pink-300">userspurchases</strong> collection aur uski subcollections access karne ke liye Firebase Rules update karein.
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>Firebase Console → Firestore Database → <strong>Rules</strong> tab open karein</li>
                <li>Neeche diya code copy karke paste karein</li>
                <li><strong>Publish</strong> button click karein</li>
              </ol>

              <div className="relative">
                <pre className="p-3.5 rounded-xl bg-black/60 border border-white/15 text-xs text-pink-200 overflow-x-auto font-mono">
                  {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                </pre>
                <button
                  onClick={copyRuleSnippet}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs shadow cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedRule ? 'Copied!' : 'Copy Rule'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 justify-end">
              <button
                onClick={() => { setShowRulesModal(false); syncFirestore(); }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 cursor-pointer transition-all"
              >
                Test Connection →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#120a2e] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30">
                  <Link2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Image Link Paste Karein</h3>
              </div>
              <button onClick={() => setShowUrlModal(false)} className="text-zinc-400 hover:text-white p-1 text-base cursor-pointer">✕</button>
            </div>
            <div className="space-y-3">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://res.cloudinary.com/... or https://example.com/receipt.jpg"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrlImage();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUrlModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUrlImage}
                disabled={!urlInput.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs cursor-pointer shadow-lg transition-all"
              >
                Attach Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Notice Banner */}
      {rulesAlert && (
        <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-purple-500/20 border border-amber-500/40 text-xs sm:text-sm text-amber-200 flex items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <span><strong>Firestore Rules:</strong> Permission denied. Admin panel ko read/write access dene ke liye rules update karein.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowRulesModal(true)} className="px-3.5 py-1.5 rounded-xl bg-pink-500/25 hover:bg-pink-500/40 border border-pink-500/50 text-pink-200 font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-pink-400" />
              Fix Rules
            </button>
            <button onClick={copyRuleSnippet} className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs">
              <Copy className="w-3.5 h-3.5" />
              {copiedRule ? 'Copied!' : 'Copy Rule'}
            </button>
            <button onClick={() => setRulesAlert(false)} className="text-zinc-400 hover:text-white px-2 cursor-pointer">✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#d946ef] to-[#ec4899] flex items-center justify-center shadow-lg shadow-pink-500/30">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight flex items-center gap-2.5">
              Community Inbox & Purchases
              {firestoreStatus === 'connected' ? (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Synced Live
                </span>
              ) : (
                <button onClick={() => setShowRulesModal(true)} className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1.5 hover:bg-amber-500/30 cursor-pointer">
                  <Radio className="w-3 h-3 animate-pulse text-amber-400" />
                  Checking Firestore
                </button>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={syncFirestore}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-border text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            Sync Firestore
          </button>

          {totalPending > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              {totalPending} Pending Request{totalPending > 1 ? 's' : ''}
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-zinc-400 text-xs font-medium">
            <Users className="w-4 h-4 text-primary" />
            {purchases.length} user{purchases.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Main Split-Pane */}
      <div className="flex-1 min-h-0 bg-surface border-2 border-border/80 rounded-3xl overflow-hidden shadow-2xl flex">

        {/* LEFT PANEL */}
        <div className={cn(
          'w-full md:w-80 lg:w-88 shrink-0 border-r-2 border-border/80 flex flex-col bg-[#0d0824]/95',
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        )}>
          {/* Search & Filters */}
          <div className="p-4 border-b border-border/80 flex flex-col gap-3 bg-white/[0.01]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-text">Purchase Requests</span>
              </div>
              <span className="text-xs font-semibold text-zinc-400">{filteredPurchases.length} total</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user, ID or coins…"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-border text-text text-xs placeholder:text-zinc-500 focus:outline-none focus:border-primary/70 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: `All (${enrichedPurchases.length})` },
                { id: 'pending', label: `⏳ Pending (${totalPending})` },
                { id: 'unread', label: `🔔 Unread (${totalUnread})` },
                { id: 'requests', label: `📦 Requests (${totalRequests})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border whitespace-nowrap',
                    filterType === f.id
                      ? 'bg-primary/25 border-primary text-white shadow-sm'
                      : 'bg-white/[0.03] border-border text-zinc-400 hover:text-text'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/20">
            {filteredPurchases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center text-zinc-400">
                <Users className="w-10 h-10 opacity-25 mb-2.5" />
                <p className="text-sm font-bold text-text">
                  {firestoreStatus === 'checking' ? 'Firestore se data load ho raha hai...' : 'Koi user nahi mila'}
                </p>
                <p className="text-xs mt-1 text-zinc-500">
                  {firestoreStatus === 'permission_denied' ? 'Firestore rules update karein' : 'Firestore mein koi users nahi mile'}
                </p>
              </div>
            ) : (
              <>
                {visiblePurchases.map((purchase) => (
                  <ThreadItem
                    key={purchase.id}
                    purchase={purchase}
                    isActive={activeUserId === (purchase.userId || purchase.id)}
                    onClick={() => handleSelectUser(purchase.userId || purchase.id)}
                  />
                ))}

                {/* Lifetime Scale: Lazy load more button */}
                {visiblePurchases.length < filteredPurchases.length && (
                  <div className="p-3 text-center bg-white/[0.02] border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => setThreadLimit((prev) => prev + 50)}
                      className="w-full py-2.5 px-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      Load More Users ({visiblePurchases.length} of {filteredPurchases.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Chat */}
        <div className={cn(
          'flex-1 min-w-0 flex flex-col bg-[#090518]/95',
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        )}>
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-border bg-[#0d0726] flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    {activeUser.profileImage ? (
                      <img
                        src={activeUser.profileImage.startsWith('http')
                          ? activeUser.profileImage
                          : (activeUser.profileImage.startsWith('assets/')
                              ? `/${activeUser.profileImage}`
                              : activeUser.profileImage)}
                        alt={activeUser.name || 'User'}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/50 shadow-lg border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d946ef] to-[#8b5cf6] flex items-center justify-center text-base font-black text-white ring-2 ring-primary/50 shadow-lg">
                        {activeUser.initials || activeUser.name?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0d0726] bg-emerald-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="text-base sm:text-lg font-black text-text truncate">
                        {activeUser.name || activeUser.fullName}
                      </p>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                        Online
                      </span>
                      {activePurchase && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black">
                          <Coins className="w-3.5 h-3.5" />
                          {activePurchase.selectedPackageCoins} Coins Request
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {activeUser.email !== '—' ? activeUser.email : activeUser.username}
                      {activeUser.mobile && activeUser.mobile !== '—' ? ` • ${activeUser.mobile}` : ''}
                      {` • ID: ${activeUserId?.slice(0, 12)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(activePurchase?.purchaseStatus === 'pending' || activePurchase?.status === 'open') && (
                    <button
                      onClick={() => {
                        const reqs = userRequests[activeUserId];
                        const synthReq = reqs?.[0] || {
                          id: activePurchase.activeRequestId || activePurchase.id,
                          requestId: activePurchase.activeRequestId || activePurchase.id,
                          selectedPackageCoins: activePurchase.selectedPackageCoins,
                        };
                        handleApproveRequest(synthReq, activePurchase);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-emerald-500/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept Request
                    </button>
                  )}

                  {/* Actions Dropdown Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowHeaderMenu((prev) => !prev)}
                      title="Chat options"
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-border transition-all cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {showHeaderMenu && (
                      <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#140b2a] border border-white/15 shadow-2xl p-1.5 z-40 backdrop-blur-xl animate-fade-in space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowHeaderMenu(false);
                            handleCopyId(activeUserId);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy User UID</span>
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setShowHeaderMenu(false);
                            setShowClearConfirm('messages');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 transition-colors text-left cursor-pointer"
                        >
                          <Eraser className="w-3.5 h-3.5 text-amber-400" />
                          <span>Clear Chat Messages</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowHeaderMenu(false);
                            setShowClearConfirm('full');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/15 transition-colors text-left cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete User History</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Sleek Clear Messages Confirmation Modal ─────────────────── */}
              {showClearConfirm === 'messages' && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                  <div className="max-w-sm w-full bg-[#150c2e] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <Eraser className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">Clear All Messages?</h3>
                        <p className="text-xs text-zinc-400">{activeUser?.name || 'User'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      Are you sure you want to delete all messages with this user? Purchase requests and user account will be preserved.
                    </p>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(null)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleClearMessages}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/25"
                      >
                        Clear Messages
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Sleek Clear Full File Confirmation Modal ─────────────────── */}
              {showClearConfirm === 'full' && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                  <div className="max-w-sm w-full bg-[#150c2e] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">Delete User History?</h3>
                        <p className="text-xs text-zinc-400">{activeUser?.name || 'User'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      This will permanently remove both messages and purchase request records for this user from Firestore.
                    </p>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(null)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleClearUserFile}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-500/25"
                      >
                        Delete File
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-3 bg-gradient-to-b from-transparent via-black/10 to-black/30 scroll-smooth">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full gap-3 text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Messages load ho rahe hain...</span>
                  </div>
                ) : groupedTimeline.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-border flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-primary opacity-60" />
                    </div>
                    <p className="text-base font-bold text-text">No messages yet with {activeUser.name}</p>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-sm text-center leading-relaxed">
                      Type a message below to start the conversation. Your reply will be sent directly to their app.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {groupedTimeline.map((item) => {
                      if (item.type === 'date_separator') {
                        return (
                          <div key={item.id} className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-border/60" />
                            <span className="text-xs text-zinc-400 font-bold px-3 py-1 rounded-full bg-surface border border-border">
                              {item.label}
                            </span>
                            <div className="flex-1 h-px bg-border/60" />
                          </div>
                        );
                      }

                      if (item.type === 'request') {
                        return (
                          <PurchaseRequestCard
                            key={item.id}
                            request={item}
                            purchase={activePurchase}
                            onApprove={handleApproveRequest}
                            onReject={handleRejectRequest}
                            onQuickReply={handleQuickPaymentReply}
                            onCopyId={handleCopyId}
                            onReply={handleReplyTo}
                          />
                        );
                      }

                      // purchase_request type message (from messages subcollection)
                      if (item.type === 'message' && item.messageType === 'purchase_request') {
                        return <PurchaseRequestBubble key={item.id} msg={item} onReply={handleReplyTo} />;
                      }

                      return (
                        <Bubble
                          key={item.id}
                          msg={item}
                          isAdmin={item.sender === 'admin' || item.senderType === 'admin' || item.senderId === 'admin'}
                          onReply={handleReplyTo}
                          onDelete={handleDeleteMessage}
                        />
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Quick Replies */}
              <div className="px-5 py-2.5 border-t border-border/50 bg-[#0d0726]/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-xs text-zinc-400 shrink-0 font-bold">Quick Reply:</span>
                {QUICK_REPLIES.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => sendReply(qr.text)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-border text-xs text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap font-medium"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Quoted Message Preview if Replying */}
              {replyingTo && (
                <div className="px-5 py-2.5 bg-[#170a33] border-t-2 border-primary/60 flex items-center justify-between gap-3 animate-fade-in shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 text-pink-300 flex items-center justify-center shrink-0">
                      <Reply className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-pink-300">
                        Replying to {replyingTo.sender === 'admin' ? '👑 Admin' : (replyingTo.userName || 'User')}:
                      </p>
                      <p className="text-xs text-zinc-300 truncate italic">
                        &ldquo;{replyingTo.text}&rdquo;
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
                    title="Cancel reply"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image Preview if attached */}
              {selectedImage && (
                <div className="px-5 py-3 bg-[#13082b] border-t border-purple-500/30 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={selectedImage.dataUrl}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-pink-500/40 shadow-md shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {selectedImage.name || 'Image ready to send'}
                      </p>
                      <p className="text-[11px] text-pink-300">
                        Will be sent as image message in reply
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-zinc-400 hover:text-white transition-all cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Reply Input */}
              <div className="p-4 sm:p-5 border-t-2 border-border/80 bg-[#0a051d] shrink-0">
                {/* Reply Role Switcher: Admin or User */}
                <div className="flex items-center justify-between mb-3 px-0.5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                    <button
                      type="button"
                      onClick={() => setSenderRole('admin')}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                        senderRole === 'admin'
                          ? 'bg-gradient-to-r from-[#d946ef] to-[#ec4899] text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      <span>👑 Admin Reply</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSenderRole('user')}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                        senderRole === 'user'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      )}
                      title="Send message as the user"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>👤 User Reply ({activeUser.name || 'User'})</span>
                    </button>
                  </div>

                  {senderRole === 'user' && (
                    <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 animate-pulse">
                      ⚡ User Reply Mode: Message user ki taraf se send hoga
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-2.5">
                  {/* Attach Image button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer shrink-0 shadow-sm flex items-center justify-center',
                      selectedImage
                        ? 'bg-pink-500/20 border-pink-500/60 text-pink-300'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-pink-300 hover:text-white'
                    )}
                    title="Attach Image from Computer (or paste screenshot directly with Ctrl+V)"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  {/* Add Image by URL button */}
                  <button
                    onClick={() => setShowUrlModal(true)}
                    className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-cyan-300 hover:text-white transition-all cursor-pointer shrink-0 shadow-sm hidden sm:flex items-center justify-center"
                    title="Paste Image Link / Cloudinary URL"
                  >
                    <Link2 className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); sendReply(); }
                      }}
                      placeholder={
                        replyingTo
                          ? `Reply to ${replyingTo.sender === 'admin' ? 'Admin' : (replyingTo.userName || 'User')}… (Enter to send)`
                          : selectedImage
                            ? "Add an optional caption… (Enter to send)"
                            : senderRole === 'user'
                              ? `Send message as ${activeUser.name || 'User'}… (Enter to send)`
                              : `Send message to ${activeUser.name || 'user'}… (Enter to send)`
                      }
                      className="w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-white/15 text-text text-base placeholder:text-zinc-500 focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/40 transition-all font-medium shadow-inner"
                    />
                  </div>

                  <button
                    onClick={() => sendReply()}
                    disabled={!replyText.trim() && !selectedImage}
                    className={cn(
                      'px-6 py-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 font-bold text-base shadow-xl',
                      (replyText.trim() || selectedImage)
                        ? 'bg-gradient-to-r from-[#d946ef] to-[#ec4899] text-white shadow-pink-500/40 hover:scale-105 active:scale-95'
                        : 'bg-white/[0.05] border border-border text-zinc-500 cursor-not-allowed'
                    )}
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-text">Community Inbox</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  {firestoreStatus === 'checking'
                    ? 'Firestore se data load ho raha hai...'
                    : 'Koi user select karein ya purchase requests ka wait karein'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
