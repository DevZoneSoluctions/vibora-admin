import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Activity,
  Globe2,
  ArrowUpRight,
  PieChart,
  CheckCircle2,
} from 'lucide-react';
import { useUsers } from '../context/UsersContext';
import { cn } from '../lib/cn';

const TIMEFRAMES = [
  { id: '7d', label: '7D', days: 7 },
  { id: '30d', label: '30D', days: 30 },
  { id: '90d', label: '3M', days: 90 },
  { id: '1y', label: '1Y', days: 365 },
];

export default function Analytics() {
  const { users } = useUsers();
  const [selectedTf, setSelectedTf] = useState('30d');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const stats = useMemo(() => {
    const total = users.length || 0;
    const active = users.filter((u) => u.status === 'Active').length;
    const blocked = users.filter((u) => u.status === 'Blocked').length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const registeredToday = users.filter((u) => {
      try { return new Date(u.joinedAt || u.createdAt) >= todayStart; } catch { return false; }
    }).length;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 100;
    return { total, active, blocked, registeredToday, activeRate };
  }, [users]);

  const genderStats = useMemo(() => {
    let male = 0, female = 0;
    users.forEach((u) => { if (u.gender === 'Female') female++; else male++; });
    const total = users.length || 1;
    return {
      male, female,
      malePct: Math.round((male / total) * 100),
      femalePct: Math.round((female / total) * 100),
      total: users.length,
    };
  }, [users]);

  const countryStats = useMemo(() => {
    const counts = {};
    users.forEach((u) => { const c = u.country?.trim() || 'Global'; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts)
      .map(([country, count]) => ({ country, count, pct: Math.round((count / (users.length || 1)) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [users]);

  const chartData = useMemo(() => {
    const tfObj = TIMEFRAMES.find((t) => t.id === selectedTf) || TIMEFRAMES[1];
    const numPoints = selectedTf === '7d' ? 7 : 8;
    const now = new Date();
    const start = new Date(now.getTime() - tfObj.days * 86400000);
    const step = (now.getTime() - start.getTime()) / (numPoints - 1 || 1);
    return Array.from({ length: numPoints }, (_, i) => {
      const t = new Date(start.getTime() + i * step);
      const label = selectedTf === '7d'
        ? t.toLocaleDateString('en-US', { weekday: 'short' })
        : t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const val = users.filter((u) => { try { return new Date(u.joinedAt || u.createdAt) <= t; } catch { return false; } }).length;
      return { label, val };
    });
  }, [users, selectedTf]);

  const W = 600, H = 180, pL = 16, pR = 16, pT = 16, pB = 28;
  const maxVal = Math.max(...chartData.map((d) => d.val), 6);
  const pts = chartData.map((d, i) => ({
    ...d,
    x: pL + (i / (chartData.length - 1 || 1)) * (W - pL - pR),
    y: H - pB - (d.val / maxVal) * (H - pT - pB),
  }));
  const lineD = pts.reduce((a, p, i) => i === 0 ? `M${p.x},${p.y}` : `${a}L${p.x},${p.y}`, '');
  const areaD = `${lineD}L${pts[pts.length - 1]?.x ?? W},${H - pB}L${pts[0]?.x ?? pL},${H - pB}Z`;

  return (
    <div className="animate-fade-in space-y-5 text-text pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            Analytics
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-text-muted mt-0.5">Platform insights &amp; user demographics</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-border">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setSelectedTf(tf.id)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                selectedTf === tf.id ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-white'
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: stats.total, sub: `+${stats.registeredToday} today`, icon: <Users className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10', bar: 'bg-primary', barW: `${Math.min(stats.total > 0 ? 100 : 0, 100)}%` },
          { label: 'Active Rate', value: `${stats.activeRate}%`, sub: `${stats.active} active`, icon: <Activity className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-400', barW: `${stats.activeRate}%` },
          { label: 'Gender Split', value: `${genderStats.malePct}/${genderStats.femalePct}`, sub: 'M% / F%', icon: <PieChart className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', bar: 'bg-cyan-400', barW: `${genderStats.malePct}%` },
          { label: 'Blocked', value: stats.blocked, sub: 'restricted', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-500/10', bar: 'bg-pink-400', barW: `${stats.total > 0 ? Math.round((stats.blocked / stats.total) * 100) : 0}%` },
        ].map((card) => (
          <div key={card.label} className="bg-surface border border-border rounded-xl p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted">{card.label}</span>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', card.bg, card.color)}>{card.icon}</div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{card.value}</div>
            <div className="text-xs text-text-muted">{card.sub}</div>
            <div className="mt-3 w-full bg-white/5 rounded-full h-1 overflow-hidden">
              <div className={cn('h-1 rounded-full', card.bar)} style={{ width: card.barW }} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-white">User Growth</h2>
          </div>
          {hoveredIndex !== null && pts[hoveredIndex] && (
            <span className="text-xs text-primary font-semibold">
              {pts[hoveredIndex].label}: {pts[hoveredIndex].val} users
            </span>
          )}
        </div>
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
            <defs>
              <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map((pct, i) => (
              <line key={i} x1={pL} y1={H - pB - pct * (H - pT - pB)} x2={W - pR} y2={H - pB - pct * (H - pT - pB)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            ))}
            <path d={areaD} fill="url(#aGrad)" />
            <path d={lineD} fill="none" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? 5 : 3.5} fill="#0e0826" stroke="#d946ef" strokeWidth="2" className="transition-all duration-150" />
                <text x={p.x} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">{p.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Bottom: Gender + Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gender */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Gender Demographics</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-400 font-medium">Male</span>
                <span className="text-text-muted">{genderStats.male} ({genderStats.malePct}%)</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${genderStats.malePct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-pink-400 font-medium">Female</span>
                <span className="text-text-muted">{genderStats.female} ({genderStats.femalePct}%)</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full bg-pink-400 transition-all duration-500" style={{ width: `${genderStats.femalePct}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-text-muted">
            <span>{genderStats.total} total members</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
        </div>

        {/* Countries */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-semibold text-white">Top Regions</h3>
          </div>
          <div className="space-y-3">
            {countryStats.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white font-medium">{item.country}</span>
                  <span className="text-text-muted">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{ width: `${Math.max(item.pct, 6)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-text-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Global coverage operational
          </div>
        </div>
      </div>
    </div>
  );
}

