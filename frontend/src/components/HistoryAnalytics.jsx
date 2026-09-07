import React from 'react';
import { Activity, Award, TrendingUp, AlertTriangle, CheckCircle, Flame, History, RotateCcw } from 'lucide-react';

const RANKS = [
  { rank: 'E', minLvl: 1, maxLvl: 9, title: 'Novice Hunter', color: 'border-slate-500 text-slate-400' },
  { rank: 'D', minLvl: 10, maxLvl: 19, title: 'Developing Hunter', color: 'border-emerald-500 text-emerald-400' },
  { rank: 'C', minLvl: 20, maxLvl: 34, title: 'Consistent Hunter', color: 'border-cyan-500 text-cyan-400' },
  { rank: 'B', minLvl: 35, maxLvl: 49, title: 'Formidable Hunter', color: 'border-purple-500 text-purple-400' },
  { rank: 'A', minLvl: 50, maxLvl: 69, title: 'Elite Awakened', color: 'border-amber-500 text-amber-400' },
  { rank: 'S', minLvl: 70, maxLvl: 999, title: 'Monarch Level', color: 'border-red-500 text-red-400 shadow-[0_0_15px_rgba(255,59,78,0.5)]' },
];

export default function HistoryAnalytics({
  analytics,
  hunter,
  onResetProgress,
  isResetting,
}) {
  const rank = hunter?.rank || 'E';
  const level = hunter?.level || 1;

  const rate7d = analytics?.completion_rate_7d ?? 100;
  const rate30d = analytics?.completion_rate_30d ?? 100;
  const totalXp = analytics?.total_xp_earned ?? 0;
  const totalPen = analytics?.total_penalties_incurred ?? 0;
  const dailyRecords = analytics?.daily_records || [];
  const transactions = analytics?.recent_transactions || [];

  return (
    <div className="w-full space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-system text-white tracking-wider flex items-center gap-2">
            <Activity className="text-cyan-400" size={20} />
            SYSTEM LOGS & ANALYTICS
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Auditable progression telemetry, historical quest records, and rank hierarchy.
          </p>
        </div>

        {/* Reset / Protocol Action */}
        <button
          onClick={() => {
            if (confirm("Reset Hunter progression back to Level 1 and re-seed default quests?")) {
              onResetProgress();
            }
          }}
          disabled={isResetting}
          className="px-3 py-1.5 rounded border border-red-800 bg-red-950/30 text-red-400 hover:bg-red-900/40 text-xs font-mono flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <RotateCcw size={13} />
          <span>RESET PROGRESSION</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cyber-panel p-4 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400 mb-1">7-DAY COMPLETION</div>
          <div className="text-2xl font-black font-system text-cyan-400">{rate7d}%</div>
          <div className="w-full h-1 bg-slate-800 rounded mt-2 overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${rate7d}%` }}></div>
          </div>
        </div>

        <div className="cyber-panel p-4 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400 mb-1">30-DAY CONSISTENCY</div>
          <div className="text-2xl font-black font-system text-emerald-400">{rate30d}%</div>
          <div className="w-full h-1 bg-slate-800 rounded mt-2 overflow-hidden">
            <div className="h-full bg-emerald-400" style={{ width: `${rate30d}%` }}></div>
          </div>
        </div>

        <div className="cyber-panel p-4 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400 mb-1">LIFETIME XP EARNED</div>
          <div className="text-2xl font-black font-system text-purple-400">+{totalXp.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">From quest achievements</div>
        </div>

        <div className="cyber-panel p-4 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400 mb-1">PENALTIES INCURRED</div>
          <div className={`text-2xl font-black font-system ${totalPen > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            -{totalPen.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">From skipped daily duties</div>
        </div>
      </div>

      {/* Hunter Rank Progression Ladder */}
      <div className="cyber-panel p-5 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold font-system text-white tracking-wider flex items-center gap-2">
            <Award className="text-amber-400" size={16} />
            HUNTER RANK PROGRESSION HIERARCHY
          </h3>
          <span className="text-xs font-mono text-cyan-400">Current: Rank {rank} (Lv {level})</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {RANKS.map((r) => {
            const isCurrentRank = rank === r.rank;
            const isPassed = level > r.maxLvl;

            return (
              <div
                key={r.rank}
                className={`p-3 rounded-lg border text-center relative transition ${
                  isCurrentRank
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(79,216,255,0.3)]'
                    : isPassed
                    ? 'border-slate-800 bg-[#070B16] opacity-75'
                    : 'border-slate-900 bg-[#050811] opacity-40'
                }`}
              >
                <div className={`text-2xl font-black font-system mb-1 ${
                  isCurrentRank ? 'text-cyan-300' : 'text-slate-300'
                }`}>
                  {r.rank}
                </div>
                <div className="text-[11px] font-bold text-white font-sans">{r.title}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  {r.rank === 'S' ? 'Lv. 70+' : `Lv. ${r.minLvl}–${r.maxLvl}`}
                </div>

                {isCurrentRank && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-cyan-500 text-black text-[9px] font-black font-system rounded uppercase tracking-wider">
                    CURRENT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Daily Records & XP Transaction Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Records Log */}
        <div className="cyber-panel p-5 rounded-lg">
          <h3 className="text-sm font-bold font-system text-white tracking-wider flex items-center gap-2 mb-4">
            <History className="text-cyan-400" size={16} />
            DAILY ADJUDICATION LOG
          </h3>

          {dailyRecords.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No daily rollover records recorded yet. Click "EVALUATE DAY // END DAY" to generate your first audit record.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {dailyRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-[#070B16] rounded border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-white">{rec.record_date}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {rec.completed_quests}/{rec.total_quests} completed
                      {rec.penalty_zone_triggered && (
                        <span className="ml-2 text-red-400 font-bold">[PENALTY ZONE]</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className={`font-bold ${rec.net_xp >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                      {rec.net_xp >= 0 ? `+${rec.net_xp}` : rec.net_xp} XP
                    </div>
                    <div className="text-[10px] text-slate-400">Streak: {rec.streak_after}d</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* XP Audit Log */}
        <div className="cyber-panel p-5 rounded-lg">
          <h3 className="text-sm font-bold font-system text-white tracking-wider flex items-center gap-2 mb-4">
            <TrendingUp className="text-purple-400" size={16} />
            XP TRANSACTION AUDIT TRAIL
          </h3>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No transactions recorded yet. Complete quests to populate the audit log.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-2.5 rounded border flex items-center justify-between text-xs ${
                    tx.source === 'MISSED_LOGIN_PENALTY'
                      ? 'border-red-500/40 bg-red-950/25 shadow-[0_0_10px_rgba(255,59,78,0.1)]'
                      : 'border-slate-800/80 bg-[#070B16]'
                  }`}
                >
                  <div>
                    <div className="text-white font-sans truncate max-w-xs">{tx.description}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-mono ${
                        tx.source === 'MISSED_LOGIN_PENALTY' ? 'text-red-400 font-bold' : 'text-slate-500'
                      }`}>
                        {tx.source === 'MISSED_LOGIN_PENALTY' ? '⚠️ MISSED LOGIN' : tx.source}
                      </span>
                    </div>
                  </div>

                  <div className={`font-mono font-black text-sm ${
                    tx.amount >= 0 ? 'text-cyan-400' : 'text-red-400'
                  }`}>
                    {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} XP
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
