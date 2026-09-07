import React, { useState } from 'react';
import { Check, Plus, Trash2, Edit3, Flame, Award, Dumbbell, BookOpen, Heart, Zap, Eye, Clock } from 'lucide-react';

const STAT_ICONS = {
  STR: Dumbbell,
  INT: BookOpen,
  VIT: Heart,
  AGI: Zap,
  SENSE: Eye,
};

const STAT_COLORS = {
  STR: 'text-orange-400 border-orange-500/30 bg-orange-950/20',
  INT: 'text-blue-400 border-blue-500/30 bg-blue-950/20',
  VIT: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
  AGI: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
  SENSE: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
};

const DIFFICULTY_COLORS = {
  Easy: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30',
  Normal: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/30',
  Medium: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/30',
  Hard: 'text-amber-300 border-amber-500/40 bg-amber-950/30',
  Epic: 'text-purple-300 border-purple-500/40 bg-purple-950/30',
};

export default function QuestList({
  quests,
  onToggleQuest,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteQuest,
  isToggling,
}) {
  const [filter, setFilter] = useState('all'); // all, pending, completed

  const filteredQuests = quests.filter((q) => {
    if (filter === 'pending') return !q.completed_today;
    if (filter === 'completed') return q.completed_today;
    return true;
  });

  const completedCount = quests.filter((q) => q.completed_today).length;
  const pendingCount = quests.length - completedCount;

  return (
    <div className="w-full">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-system text-white tracking-wider flex items-center gap-2">
              <Award className="text-cyan-400" size={20} />
              DAILY SYSTEM QUESTS
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-mono">
              {completedCount}/{quests.length} Completed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Protocol: Unfinished quests at rollover incur -50% XP deductions and streak resets.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Filters */}
          <div className="flex items-center p-1 bg-[#090E1C] rounded border border-cyan-500/20 text-xs font-mono">
            {[
              { id: 'all', label: `ALL (${quests.length})` },
              { id: 'pending', label: `ACTIVE (${pendingCount})` },
              { id: 'completed', label: `DONE (${completedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded transition ${
                  filter === f.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_8px_rgba(79,216,255,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Add Quest Button */}
          <button
            onClick={onOpenCreateModal}
            className="cyber-button text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>NEW QUEST</span>
          </button>
        </div>
      </div>

      {/* Quest Cards Grid */}
      {filteredQuests.length === 0 ? (
        <div className="cyber-panel p-12 text-center rounded-lg border-dashed border-slate-800">
          <Clock className="mx-auto text-slate-600 mb-3" size={36} />
          <p className="text-sm font-system font-bold text-slate-400">
            {filter === 'all'
              ? 'No active quests registered. Add a quest to begin the daily protocol.'
              : filter === 'pending'
              ? 'All daily quests completed! Outstanding performance, Hunter.'
              : 'No quests completed yet today. Check in to earn XP!'}
          </p>
          {filter === 'all' && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 cyber-button text-xs inline-flex items-center gap-1"
            >
              <Plus size={13} />
              <span>CREATE INITIAL QUEST</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuests.map((quest) => {
            const isCompleted = quest.completed_today;
            const StatIcon = STAT_ICONS[quest.stat_link] || Zap;
            const statStyle = STAT_COLORS[quest.stat_link] || 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20';
            const diffStyle = DIFFICULTY_COLORS[quest.difficulty] || DIFFICULTY_COLORS.Normal;

            return (
              <div
                key={quest.id}
                className={`cyber-panel p-5 rounded-lg flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-[#09151B]/80 shadow-[0_4px_16px_rgba(16,185,129,0.1)]'
                    : 'hover:border-cyan-400/50 hover:shadow-[0_4px_20px_rgba(79,216,255,0.15)]'
                }`}
              >
                {/* Top Metatags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${diffStyle}`}>
                      {quest.difficulty}
                    </span>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${statStyle}`}>
                      <StatIcon size={11} />
                      <span>{quest.stat_link}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      +{quest.xp_reward} XP
                    </span>

                    {/* Quick Edit/Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditModal(quest);
                      }}
                      className="p-1 text-slate-500 hover:text-cyan-400 transition opacity-0 group-hover:opacity-100"
                      title="Edit Quest"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete quest "${quest.title}"?`)) {
                          onDeleteQuest(quest.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                      title="Delete Quest"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Quest Body */}
                <div className="mb-4">
                  <h3 className={`text-base font-bold font-system tracking-wide transition-colors ${
                    isCompleted ? 'text-emerald-300 line-through opacity-85' : 'text-white'
                  }`}>
                    {quest.title}
                  </h3>
                  {quest.description && (
                    <p className={`text-xs mt-1.5 leading-relaxed font-sans ${
                      isCompleted ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {quest.description}
                    </p>
                  )}
                </div>

                {/* Checkbox Action Button */}
                <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Reward: <strong className="text-white">+{quest.xp_reward} XP</strong> & <strong className="text-cyan-300">+1 {quest.stat_link}</strong>
                  </span>

                  <button
                    onClick={(e) => onToggleQuest(quest, e)}
                    disabled={isToggling}
                    className={`px-3 py-1.5 rounded font-system text-xs font-bold transition flex items-center gap-2 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_rgba(79,216,255,0.6)]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                      isCompleted ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-cyan-400'
                    }`}>
                      {isCompleted && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span>{isCompleted ? 'COMPLETED' : 'COMPLETE'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
