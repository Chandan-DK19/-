import React from 'react';
import { Shield, Plus, Zap, Dumbbell, BookOpen, Heart, Eye, Activity } from 'lucide-react';
import { sound } from '../utils/audio';

const ATTRIBUTES = [
  {
    key: 'STR',
    field: 'str_stat',
    name: 'STRENGTH',
    sub: 'Physical power & body discipline',
    icon: Dumbbell,
    color: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    barColor: 'from-orange-600 to-amber-400',
  },
  {
    key: 'INT',
    field: 'int_stat',
    name: 'INTELLIGENCE',
    sub: 'Cognitive bandwidth & learning',
    icon: BookOpen,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    barColor: 'from-blue-600 to-cyan-400',
  },
  {
    key: 'VIT',
    field: 'vit_stat',
    name: 'VITALITY',
    sub: 'Health, stamina & bodily recovery',
    icon: Heart,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    barColor: 'from-emerald-600 to-teal-400',
  },
  {
    key: 'AGI',
    field: 'agi_stat',
    name: 'AGILITY',
    sub: 'Speed, cardio endurance & execution',
    icon: Zap,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    barColor: 'from-cyan-600 to-blue-400',
  },
  {
    key: 'SENSE',
    field: 'sense_stat',
    name: 'SENSE / PERCEPTION',
    sub: 'Focus, mindfulness & mental awareness',
    icon: Eye,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    barColor: 'from-purple-600 to-pink-400',
  },
];

export default function StatBlock({
  hunter,
  onAllocateStat,
  isAllocating,
}) {
  const points = hunter?.unallocated_stat_points || 0;

  const handleAllocate = (key) => {
    sound.playStatAllocate();
    onAllocateStat(key);
  };

  // Compute Radar Polygon Points for STR, INT, VIT, AGI, SENSE
  // Center is (150, 150), radius is 110. Max baseline stat = 40 for 100% scale
  const statValues = {
    STR: hunter?.str_stat || 10,
    INT: hunter?.int_stat || 10,
    VIT: hunter?.vit_stat || 10,
    AGI: hunter?.agi_stat || 10,
    SENSE: hunter?.sense_stat || 10,
  };

  const center = 150;
  const maxR = 100;
  const maxStatCap = Math.max(30, ...Object.values(statValues) + 5);

  const angles = [-90, -18, 54, 126, 198]; // 5 vertices in degrees
  const polygonPoints = angles.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const statKey = ATTRIBUTES[i].key;
    const val = statValues[statKey];
    const r = (val / maxStatCap) * maxR;
    const x = center + r * Math.cos(rad);
    const y = center + r * Math.sin(rad);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="w-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-system text-white tracking-wider flex items-center gap-2">
            <Shield className="text-purple-400" size={20} />
            HUNTER ATTRIBUTES & STAT MATRIX
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Every Level-Up awards +1 Stat Point. Quests also directly strengthen their linked attribute upon daily check-in.
          </p>
        </div>

        {points > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-purple-950/70 border border-purple-500 text-purple-300 animate-pulse shadow-[0_0_15px_rgba(123,92,250,0.4)]">
            <Zap size={15} className="text-purple-400" />
            <span className="font-system font-bold text-xs">
              UNALLOCATED STAT POINTS: <strong className="text-white text-sm">{points}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Attribute Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {ATTRIBUTES.map((attr) => {
            const Icon = attr.icon;
            const currentVal = hunter ? hunter[attr.field] : 10;
            const baseline = 10;
            const growth = Math.max(0, currentVal - baseline);
            const pct = Math.min(100, Math.round((currentVal / 50) * 100));

            return (
              <div
                key={attr.key}
                className="cyber-panel p-4 rounded-lg flex items-center justify-between gap-4 transition hover:border-cyan-500/40"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-md border ${attr.borderColor} bg-[#070D1A] ${attr.color}`}>
                    <Icon size={20} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-system font-bold text-sm text-white tracking-wide">
                        {attr.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {attr.key}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{attr.sub}</p>

                    {/* Progress Bar */}
                    <div className="w-48 sm:w-60 h-1.5 bg-slate-900 rounded-full mt-2 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full bg-gradient-to-r ${attr.barColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xl font-system font-black text-white">
                      {currentVal}
                    </div>
                    {growth > 0 && (
                      <div className="text-[10px] font-mono text-cyan-400">
                        +{growth} trained
                      </div>
                    )}
                  </div>

                  {/* Allocate Button */}
                  <button
                    onClick={() => handleAllocate(attr.key)}
                    disabled={points <= 0 || isAllocating}
                    className={`w-9 h-9 rounded flex items-center justify-center font-bold text-sm transition ${
                      points > 0
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_12px_rgba(123,92,250,0.6)] cursor-pointer hover:scale-105 active:scale-95'
                        : 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                    title={points > 0 ? `Allocate 1 point to ${attr.name}` : 'No stat points available'}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Radar Chart Visualization (5 cols) */}
        <div className="lg:col-span-5 cyber-panel p-6 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full flex justify-between items-center mb-2">
            <span className="text-xs font-system font-bold text-cyan-400 flex items-center gap-1.5">
              <Activity size={14} />
              RADAR PROFILE
            </span>
            <span className="text-[10px] font-mono text-slate-500">SCALE: PENTAGON</span>
          </div>

          <div className="relative w-[300px] h-[300px] flex items-center justify-center">
            <svg width="300" height="300" className="overflow-visible">
              {/* Concentric Pentagon Grids */}
              {gridLevels.map((lvl, idx) => {
                const r = maxR * lvl;
                const gridPts = angles.map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)}`;
                }).join(' ');
                return (
                  <polygon
                    key={idx}
                    points={gridPts}
                    fill="none"
                    stroke="rgba(79, 216, 255, 0.12)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Axis lines from center */}
              {angles.map((deg, idx) => {
                const rad = (deg * Math.PI) / 180;
                const x2 = center + maxR * Math.cos(rad);
                const y2 = center + maxR * Math.sin(rad);
                return (
                  <line
                    key={idx}
                    x1={center}
                    y1={center}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(79, 216, 255, 0.15)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Stat Data Polygon */}
              <polygon
                points={polygonPoints}
                fill="rgba(123, 92, 250, 0.35)"
                stroke="#7B5CFA"
                strokeWidth="2.5"
                filter="drop-shadow(0px 0px 8px rgba(123,92,250,0.8))"
              />

              {/* Stat Data Points */}
              {angles.map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                const statKey = ATTRIBUTES[i].key;
                const val = statValues[statKey];
                const r = (val / maxStatCap) * maxR;
                const x = center + r * Math.cos(rad);
                const y = center + r * Math.sin(rad);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#4FD8FF"
                    stroke="#05070D"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Labels */}
              {angles.map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                const labelR = maxR + 24;
                const lx = center + labelR * Math.cos(rad);
                const ly = center + labelR * Math.sin(rad);
                const attr = ATTRIBUTES[i];
                const val = statValues[attr.key];

                return (
                  <text
                    key={i}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#E7ECF5"
                    className="text-[10px] font-system font-bold"
                  >
                    {attr.key}: {val}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 pt-3 border-t border-cyan-500/10 w-full text-center text-[11px] font-mono text-slate-400">
            Total Attribute Power: <strong className="text-white font-system">{Object.values(statValues).reduce((a, b) => a + b, 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
