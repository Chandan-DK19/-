import React from 'react';
import { Award, Zap, AlertTriangle, CheckCircle, Flame, Shield, ArrowUpRight, X } from 'lucide-react';

export default function SystemNotificationModal({
  modalData,
  onClose,
}) {
  if (!modalData) return null;

  const { type, payload } = modalData;

  // 1. LEVEL UP POPUP
  if (type === 'level_up') {
    return (
      <div className="modal-overlay">
        <div className="cyber-panel modal-content w-full max-w-md p-8 rounded-xl border-2 border-purple-500 shadow-[0_0_50px_rgba(123,92,250,0.6)] text-center relative overflow-hidden bg-[#0A0E1C]">
          {/* Glowing particle aura */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-600/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="inline-flex p-3 rounded-full bg-purple-950 border border-purple-400 text-purple-300 mb-4 shadow-[0_0_20px_rgba(123,92,250,0.8)] animate-bounce">
            <Zap size={32} />
          </div>

          <div className="text-xs font-mono text-purple-400 tracking-widest uppercase mb-1">
            [ SYSTEM NOTIFICATION // LEVEL ASCENSION ]
          </div>

          <h2 className="text-3xl font-black font-system text-white tracking-wider mb-2">
            LEVEL UP!
          </h2>

          <p className="text-sm text-slate-300 mb-6 font-sans">
            You have crossed the XP threshold. Your Hunter status has grown in power.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6 font-system">
            <div className="p-3 bg-[#060A14] border border-cyan-500/30 rounded">
              <div className="text-[10px] text-slate-400 font-mono">NEW LEVEL</div>
              <div className="text-2xl font-black text-cyan-400">LV. {payload.level}</div>
            </div>

            <div className="p-3 bg-[#060A14] border border-purple-500/30 rounded">
              <div className="text-[10px] text-slate-400 font-mono">STAT POINTS</div>
              <div className="text-2xl font-black text-purple-400">+{payload.stat_points_granted || 1}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full cyber-button cyber-button-violet justify-center py-3 text-sm"
          >
            ACKNOWLEDGE & ALLOCATE
          </button>
        </div>
      </div>
    );
  }

  // 2. DAY EVALUATION REPORT POPUP
  if (type === 'day_evaluation') {
    const res = payload.evaluation;
    const isPenaltyZone = res.penalty_zone_triggered || res.penalty_zone_active;

    return (
      <div className="modal-overlay">
        <div className={`cyber-panel modal-content w-full max-w-lg p-6 rounded-xl border-2 ${
          isPenaltyZone
            ? 'border-red-500 shadow-[0_0_50px_rgba(255,59,78,0.5)] bg-[#12080D]'
            : 'border-cyan-500 shadow-[0_0_50px_rgba(79,216,255,0.4)] bg-[#0A0F1F]'
        } relative overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
            <div className="flex items-center gap-2">
              {isPenaltyZone ? (
                <AlertTriangle className="text-red-400" size={20} />
              ) : (
                <CheckCircle className="text-cyan-400" size={20} />
              )}
              <h3 className="font-system font-bold text-sm tracking-wider text-white">
                {isPenaltyZone ? 'CRITICAL SYSTEM EVALUATION' : 'DAILY PROTOCOL EVALUATION'}
              </h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4">
            {isPenaltyZone && (
              <div className="p-3 bg-red-950/60 border border-red-500/80 rounded text-xs text-red-200">
                <strong className="text-red-400 uppercase font-mono block mb-1 font-bold">
                  ⚠️ PENALTY ZONE ACTIVATED
                </strong>
                You failed 3 or more daily quests ({res.failed_count} incomplete). An extra -20 flat XP penalty has been applied.
              </div>
            )}

            {res.streak_broken && (
              <div className="p-3 bg-amber-950/60 border border-amber-500/80 rounded text-xs text-amber-200">
                <strong className="text-amber-400 uppercase font-mono block mb-1 font-bold">
                  💔 STREAK BROKEN & XP PENALTY
                </strong>
                Daily protocol interrupted. Your {res.streak_before}-day streak has reset to 0, deducting an additional -{res.streak_xp_penalty} XP.
              </div>
            )}

            {res.demoted && (
              <div className="p-3 bg-red-950/80 border border-red-500 rounded text-xs text-red-200">
                <strong className="text-red-400 uppercase font-mono block mb-1 font-bold">
                  🔻 LEVEL DEMOTION
                </strong>
                Penalties reduced your XP below the threshold. You have been demoted to Level {res.level_after}.
              </div>
            )}

            {res.redemption_cleared && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/80 rounded text-xs text-emerald-200">
                <strong className="text-emerald-400 uppercase font-mono block mb-1 font-bold">
                  🎉 PENALTY ZONE CLEARED!
                </strong>
                3 consecutive days of 100% completion achieved! +15 XP Comeback Bonus awarded.
              </div>
            )}

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2.5 bg-[#050811] rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">COMPLETED</div>
                <div className="text-base font-bold text-emerald-400">{res.completed_count}</div>
              </div>

              <div className="p-2.5 bg-[#050811] rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">FAILED</div>
                <div className={`text-base font-bold ${res.failed_count > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {res.failed_count}
                </div>
              </div>

              <div className="p-2.5 bg-[#050811] rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">XP GAINED</div>
                <div className="text-base font-bold text-cyan-400">+{res.xp_gained}</div>
              </div>

              <div className="p-2.5 bg-[#050811] rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">XP PENALTY</div>
                <div className={`text-base font-bold ${res.xp_lost > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  -{res.xp_lost}
                </div>
              </div>
            </div>

            {/* Net Status */}
            <div className="p-3.5 bg-[#070B16] rounded border border-cyan-500/20 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">NET XP ADJUSTMENT</span>
                <span className={`text-base font-black font-system ${
                  res.net_xp_change >= 0 ? 'text-cyan-300' : 'text-red-400'
                }`}>
                  {res.net_xp_change >= 0 ? `+${res.net_xp_change}` : res.net_xp_change} XP
                </span>
              </div>

              <div className="text-right">
                <span className="text-slate-400 block text-[10px] font-mono">STREAK STATUS</span>
                <span className="text-base font-bold font-system text-orange-400 flex items-center gap-1 justify-end">
                  <Flame size={14} />
                  {res.streak_after} Days
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-cyan-500/20 flex justify-end">
            <button
              onClick={onClose}
              className="cyber-button text-xs py-2 px-6"
            >
              CONFIRM & CLOSE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. MISSED LOGIN PENALTY POPUP
  if (type === 'missed_login') {
    const { hunter, missed_days_count, missed_login_penalty_applied, missed_dates } = payload;
    return (
      <div className="modal-overlay">
        <div className="cyber-panel modal-content w-full max-w-lg p-6 rounded-xl border-2 border-red-500 shadow-[0_0_50px_rgba(255,59,78,0.6)] bg-[#14080B] text-center relative overflow-hidden">
          {/* Glowing particle aura */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="inline-flex p-3 rounded-full bg-red-950 border border-red-500 text-red-400 mb-3 shadow-[0_0_20px_rgba(255,59,78,0.8)] animate-pulse">
            <AlertTriangle size={32} />
          </div>

          <div className="text-xs font-mono text-red-400 tracking-widest uppercase mb-1">
            [ SYSTEM WARNING // MISSED LOGIN PENALTY ]
          </div>

          <h2 className="text-2xl font-black font-system text-white tracking-wider mb-2">
            DAILY PROTOCOL NEGLECTED
          </h2>

          <p className="text-sm text-slate-300 mb-5 font-sans leading-relaxed">
            The System detected that you failed to log in for <strong className="text-red-400">{missed_days_count} day{missed_days_count > 1 ? 's' : ''}</strong>. 
            Discipline is required to maintain Hunter rank and power.
          </p>

          <div className="grid grid-cols-3 gap-2.5 mb-5 font-mono text-left">
            <div className="p-3 bg-[#080305] border border-red-500/40 rounded">
              <div className="text-[10px] text-slate-400">MISSED DAYS</div>
              <div className="text-xl font-black text-red-400">{missed_days_count}d</div>
            </div>

            <div className="p-3 bg-[#080305] border border-red-500/40 rounded">
              <div className="text-[10px] text-slate-400">XP PENALTY</div>
              <div className="text-xl font-black text-red-400">-{missed_login_penalty_applied} XP</div>
            </div>

            <div className="p-3 bg-[#080305] border border-amber-500/40 rounded">
              <div className="text-[10px] text-slate-400">STREAK RESET</div>
              <div className="text-xl font-black text-amber-400">0 Days</div>
            </div>
          </div>

          {missed_dates && missed_dates.length > 0 && (
            <div className="p-2.5 bg-red-950/40 border border-red-900/60 rounded text-left mb-5">
              <div className="text-[10px] font-mono text-slate-400 mb-1">PENALIZED DATES:</div>
              <div className="flex flex-wrap gap-1.5">
                {missed_dates.map((d) => (
                  <span key={d} className="text-xs font-mono px-2 py-0.5 rounded bg-red-900/60 border border-red-700/50 text-red-200">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-[#080305] border border-cyan-500/20 rounded mb-6 text-left">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">HUNTER STATUS</span>
              <span className="text-sm font-bold font-system text-cyan-300">
                LV. {hunter?.level} ({hunter?.current_xp} XP)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono block">RANK</span>
              <span className="text-sm font-bold font-system text-amber-400">
                {hunter?.rank} RANK
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full cyber-button cyber-button-red justify-center py-3 text-sm font-bold"
          >
            ACKNOWLEDGE PENALTY & RESUME
          </button>
        </div>
      </div>
    );
  }

  return null;
}
