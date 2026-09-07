import React from 'react';
import { Shield, Flame, Volume2, VolumeX, RefreshCw, CalendarCheck, Zap, AlertOctagon } from 'lucide-react';
import { sound } from '../utils/audio';

export default function SystemHeader({
  hunter,
  activeTab,
  setActiveTab,
  onEndDay,
  isEndingDay,
  soundMuted,
  setSoundMuted,
}) {
  const handleToggleSound = () => {
    const nextMute = sound.toggleMute();
    setSoundMuted(nextMute);
  };

  const rank = hunter?.rank || 'E';
  const level = hunter?.level || 1;
  const xp = hunter?.current_xp || 0;
  const xpNext = hunter?.xp_to_next || 100;
  const xpPct = hunter?.xp_percentage || 0;
  const streak = hunter?.streak_count || 0;
  const longest = hunter?.longest_streak || 0;
  const statPoints = hunter?.unallocated_stat_points || 0;

  return (
    <header className="w-full border-b border-cyan-500/20 bg-[#070C18]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Protocol Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/10 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="font-system font-bold text-cyan-400 tracking-wider">SYSTEM HUD // V1.0</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono">STATUS: OPERATIONAL</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSound}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-700 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 transition"
            title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {soundMuted ? <VolumeX size={14} className="text-slate-500" /> : <Volume2 size={14} className="text-cyan-400" />}
            <span className="font-mono text-[11px]">{soundMuted ? 'SFX: OFF' : 'SFX: ON'}</span>
          </button>

          <button
            onClick={onEndDay}
            disabled={isEndingDay}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-500/20 to-amber-500/20 hover:from-red-500/30 hover:to-amber-500/30 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-[11px] font-system font-bold transition rounded shadow-[0_0_10px_rgba(245,158,11,0.15)] disabled:opacity-50"
            title="Adjudicate today's quests and simulate daily rollover"
          >
            <RefreshCw size={12} className={isEndingDay ? 'animate-spin text-amber-300' : 'text-amber-400'} />
            <span>EVALUATE DAY // END DAY</span>
          </button>
        </div>
      </div>

      {/* Main Hunter Status Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Hunter Identity & Rank */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`rank-badge rank-${rank} w-16 h-16 text-3xl font-black rounded-lg bg-[#0B1220] border-2 flex items-center justify-center shadow-lg relative overflow-hidden group`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
            <span className="relative z-10 font-system">{rank}</span>
            <div className="absolute bottom-1 text-[9px] font-mono tracking-tighter opacity-80 z-10">RANK</div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-system tracking-wider text-white">
                {hunter?.username || 'Chandan DK'}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono">
                {hunter?.title || 'Awakened Hunter'}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-cyan-400" />
                <span className="font-system font-bold text-cyan-300 text-sm">LV. {level}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Flame size={14} className={streak > 0 ? "text-orange-400 animate-pulse" : "text-slate-600"} />
                <span className="font-mono text-slate-300">
                  Streak: <strong className="text-orange-400 font-system">{streak}d</strong> (Max: {longest}d)
                </span>
              </div>

              {statPoints > 0 && (
                <div
                  onClick={() => setActiveTab('stats')}
                  className="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/60 text-purple-300 animate-bounce"
                >
                  <Zap size={12} className="text-purple-400" />
                  <span className="font-bold text-[11px]">+{statPoints} STAT POINT{statPoints > 1 ? 'S' : ''}!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="w-full md:w-96 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-cyan-400/90 font-bold flex items-center gap-1">
              <span>EXP PROGRESS</span>
              <span className="text-[10px] text-slate-400">({xpPct}%)</span>
            </span>
            <span className="text-slate-300">
              <strong className="text-white font-bold">{xp.toLocaleString()}</strong> / {xpNext.toLocaleString()} XP
            </span>
          </div>

          <div className="w-full h-3.5 bg-[#050811] rounded-sm p-0.5 border border-cyan-500/30 shadow-[inset_0_0_8px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-purple-500 rounded-sm transition-all duration-500 relative"
              style={{ width: `${xpPct}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] opacity-40 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 border-t border-cyan-500/10">
        {[
          { id: 'quests', label: "TODAY'S QUESTS", icon: CalendarCheck },
          { id: 'stats', label: 'ATTRIBUTES & STATS', icon: Shield, badge: statPoints > 0 ? `+${statPoints}` : null },
          { id: 'analytics', label: 'SYSTEM LOGS & ANALYTICS', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-system font-bold transition-all border-b-2 ${
                isActive
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-950/20 shadow-[0_4px_12px_rgba(79,216,255,0.1)]'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[10px] font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
