import React from 'react';
import { AlertOctagon, ShieldAlert, Flame } from 'lucide-react';

export default function PenaltyBanner({ hunter }) {
  if (!hunter?.penalty_zone_active) return null;

  const progress = hunter.redemption_progress || 0;

  return (
    <div className="w-full bg-red-950/40 border border-red-500/60 p-4 rounded-lg shadow-[0_0_30px_rgba(255,59,78,0.25)] penalty-alert-pulse mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-900/60 rounded-md border border-red-500/80 text-red-400 animate-pulse">
            <AlertOctagon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-900/90 text-red-200 border border-red-600 font-bold uppercase tracking-wider">
                PENALTY ACTIVE
              </span>
              <h2 className="text-base font-bold font-system text-red-400 tracking-wide">
                SYSTEM PENALTY ZONE TRIGGERED
              </h2>
            </div>
            <p className="text-xs text-red-200/80 mt-1 max-w-xl leading-relaxed">
              You failed 3 or more daily quests in a single cycle. Sustained penalties apply. Complete all daily quests for 3 consecutive days to escape the Penalty Zone and unlock the <strong>+15 XP Comeback Bonus</strong>.
            </p>
          </div>
        </div>

        {/* 3-Day Redemption Tracker */}
        <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
          <div className="text-[11px] font-mono text-red-300 flex items-center gap-1.5">
            <Flame size={13} className="text-red-400" />
            <span>Redemption: <strong>{progress} / 3 Days</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => {
              const completed = progress >= step;
              return (
                <div
                  key={step}
                  className={`w-8 h-3 rounded-sm border transition-all ${
                    completed
                      ? 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(255,59,78,0.8)]'
                      : 'bg-red-950/80 border-red-800'
                  }`}
                  title={`Day ${step}: ${completed ? 'Completed' : 'Pending'}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
