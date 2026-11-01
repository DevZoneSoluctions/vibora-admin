import React, { useState, useEffect } from 'react';

const PARTICLES = [
  { size: 2, top: 12, left: 8,  color: '#5b8def', dur: 2.1 },
  { size: 2, top: 28, left: 22, color: '#a855f7', dur: 2.8 },
  { size: 3, top: 44, left: 75, color: '#ec4899', dur: 3.3 },
  { size: 2, top: 65, left: 45, color: '#a855f7', dur: 2.5 },
  { size: 3, top: 80, left: 88, color: '#5b8def', dur: 3.7 },
  { size: 2, top: 18, left: 60, color: '#ec4899', dur: 2.2 },
  { size: 2, top: 52, left: 15, color: '#a855f7', dur: 3.1 },
  { size: 3, top: 35, left: 90, color: '#5b8def', dur: 2.9 },
  { size: 2, top: 72, left: 32, color: '#ec4899', dur: 3.5 },
  { size: 2, top: 88, left: 55, color: '#a855f7', dur: 2.3 },
  { size: 3, top: 25, left: 78, color: '#5b8def', dur: 2.7 },
  { size: 2, top: 60, left: 10, color: '#ec4899', dur: 3.8 },
  { size: 2, top: 42, left: 65, color: '#a855f7', dur: 2.4 },
  { size: 3, top: 15, left: 40, color: '#5b8def', dur: 3.0 },
  { size: 2, top: 70, left: 20, color: '#ec4899', dur: 2.6 },
  { size: 3, top: 85, left: 70, color: '#a855f7', dur: 3.4 },
  { size: 2, top: 38, left: 50, color: '#5b8def', dur: 2.0 },
  { size: 2, top: 55, left: 85, color: '#ec4899', dur: 3.2 },
];

const LoadingScreen = ({
  onComplete,
  subtitle = 'Connect • Chat • Call • Belong',
  durationMs = 4500,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [phase, setPhase] = useState(0); // 0=hidden 1=logo 2=bar

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) { if (onComplete) onComplete(); return; }
    }

    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => { setPhase(2); setProgress(100); }, 300);
    const fadeOutDelay = Math.max(800, durationMs - 500);
    const t3 = setTimeout(() => setIsFading(true), fadeOutDelay);
    const t4 = setTimeout(() => {
      document.body.style.overflow = origOverflow;
      if (onComplete) onComplete();
    }, durationMs);

    return () => {
      document.body.style.overflow = origOverflow;
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, [onComplete, durationMs]);

  return (
    <div
      id="loading-screen"
      role="status"
      aria-label="Loading Vibora"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-500 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: '#08041a' }}
    >
      {/* ── Deep radial background ─────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, #1a0836 0%, #08041a 72%)',
        }}
      />

      {/* ── Subtle grid ────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Large blurred orbs ─────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute rounded-full" style={{
          width: '540px', height: '540px', top: '50%', left: '50%',
          background: 'radial-gradient(circle, rgba(91,141,239,0.22) 0%, transparent 70%)',
          transform: 'translate(-70%, -55%)',
          filter: 'blur(45px)',
          animation: 'orbDrift1 4s ease-in-out infinite alternate',
        }} />
        <div className="absolute rounded-full" style={{
          width: '620px', height: '620px', top: '50%', left: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 65%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(55px)',
          animation: 'orbDrift2 5s ease-in-out infinite alternate',
        }} />
        <div className="absolute rounded-full" style={{
          width: '480px', height: '480px', top: '50%', left: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
          transform: 'translate(10%, -45%)',
          filter: 'blur(42px)',
          animation: 'orbDrift3 3.5s ease-in-out infinite alternate',
        }} />
      </div>

      {/* ── Particle dots ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: `${p.size}px`, height: `${p.size}px`,
            top: `${p.top}%`, left: `${p.left}%`,
            background: p.color, opacity: 0.45,
            animation: `particlePulse ${p.dur}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* ── Center content ─────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(22px)',
          transition: 'opacity 0.65s ease-out, transform 0.65s ease-out',
        }}
      >
        {/* Glow ring */}
        <div className="absolute left-1/2 pointer-events-none" aria-hidden="true" style={{
          top: 0, width: '240px', height: '240px',
          transform: 'translate(-50%, -35%)',
          background: 'radial-gradient(circle, rgba(168,85,247,0.38) 0%, transparent 70%)',
          filter: 'blur(32px)',
          animation: 'glowPulse 2.5s ease-in-out infinite alternate',
        }} />

        {/* Logo */}
        <div style={{ animation: phase >= 1 ? 'logoFloat 3s ease-in-out infinite' : 'none' }}>
          <div style={{
            animation: phase >= 1 ? 'logoScaleIn 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
            opacity: phase >= 1 ? 1 : 0,
          }}>
            <img
              src="/logo.png"
              alt="Vibora"
              style={{
                height: '130px', width: 'auto', objectFit: 'contain',
                filter: 'drop-shadow(0 0 24px rgba(168,85,247,0.65)) drop-shadow(0 0 70px rgba(168,85,247,0.28))',
              }}
            />
          </div>
        </div>

        {/* Tagline / Subtitle */}
        <p style={{
          color: 'rgba(245,237,224,0.65)',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.72rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginTop: '20px',
          opacity: phase >= 2 ? 0.8 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.7s ease-out 0.1s, transform 0.7s ease-out 0.1s',
        }}>
          {subtitle}
        </p>

        {/* Progress bar */}
        <div style={{
          marginTop: '26px', width: '220px', height: '3px',
          borderRadius: '9999px', background: 'rgba(255,255,255,0.07)',
          overflow: 'hidden', padding: '1px',
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.4s ease-out',
        }}>
          <div style={{
            height: '100%', borderRadius: '9999px',
            background: 'linear-gradient(90deg, #5b8def 0%, #a855f7 50%, #ec4899 100%)',
            width: `${progress}%`,
            transition: `width ${Math.max(600, durationMs - 700)}ms cubic-bezier(0.4,0,0.2,1)`,
            boxShadow: '0 0 18px rgba(168,85,247,0.7), 0 0 6px rgba(236,72,153,0.55)',
          }} />
        </div>

        {/* Bounce dots */}
        <div className="flex gap-1.5 mt-5" style={{
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.4s ease-out 0.25s',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-full" style={{
              width: '5px', height: '5px',
              background: 'rgba(168,85,247,0.7)',
              animation: `dotBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* ── Keyframe styles ─────────────────────────────────────── */}
      <style>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes logoScaleIn {
          0%   { opacity: 0; transform: scale(0.68); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%   { opacity: 0.5; transform: translate(-50%, -35%) scale(0.88); }
          100% { opacity: 1;   transform: translate(-50%, -35%) scale(1.18); }
        }
        @keyframes orbDrift1 {
          0%   { opacity: 0.6; transform: translate(-70%,-55%) scale(0.93); }
          100% { opacity: 1;   transform: translate(-68%,-58%) scale(1.09); }
        }
        @keyframes orbDrift2 {
          0%   { opacity: 0.7; transform: translate(-50%,-50%) scale(0.94); }
          100% { opacity: 1;   transform: translate(-50%,-52%) scale(1.11); }
        }
        @keyframes orbDrift3 {
          0%   { opacity: 0.5; transform: translate(10%,-45%) scale(0.9); }
          100% { opacity: 0.9; transform: translate(12%,-42%) scale(1.06); }
        }
        @keyframes particlePulse {
          0%   { opacity: 0.18; transform: scale(0.7); }
          100% { opacity: 0.65; transform: scale(1.4); }
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0);    opacity: 0.35; }
          30%            { transform: translateY(-7px); opacity: 1;    }
        }
        @media (prefers-reduced-motion: reduce) {
          #loading-screen { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
