import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Shield, Zap, Dumbbell, BookOpen, Heart, Eye } from 'lucide-react';

const STATS = [
  { id: 'STR', label: 'STR (Strength & Fitness)', icon: Dumbbell },
  { id: 'INT', label: 'INT (Intellect & Study)', icon: BookOpen },
  { id: 'VIT', label: 'VIT (Vitality & Health)', icon: Heart },
  { id: 'AGI', label: 'AGI (Speed & Cardio)', icon: Zap },
  { id: 'SENSE', label: 'SENSE (Focus & Awareness)', icon: Eye },
];

const DIFFICULTIES = [
  { id: 'Easy', xp: 10, desc: 'Minor habit (e.g. hydration, 10 min read)' },
  { id: 'Normal', xp: 20, desc: 'Standard daily workout or core task' },
  { id: 'Hard', xp: 35, desc: 'Demanding session (e.g. 2hr deep work)' },
  { id: 'Epic', xp: 100, desc: 'Monumental milestone challenge' },
];

export default function QuestModal({
  isOpen,
  onClose,
  onSubmit,
  questToEdit,
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statLink, setStatLink] = useState('STR');
  const [difficulty, setDifficulty] = useState('Normal');
  const [isDaily, setIsDaily] = useState(true);

  useEffect(() => {
    if (questToEdit) {
      setTitle(questToEdit.title || '');
      setDescription(questToEdit.description || '');
      setStatLink(questToEdit.stat_link || 'STR');
      setDifficulty(questToEdit.difficulty || 'Normal');
      setIsDaily(questToEdit.is_daily ?? true);
    } else {
      setTitle('');
      setDescription('');
      setStatLink('STR');
      setDifficulty('Normal');
      setIsDaily(true);
    }
  }, [questToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      stat_link: statLink,
      difficulty,
      is_daily: isDaily,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="cyber-panel modal-content w-full max-w-lg rounded-lg p-6 relative border-cyan-400/50 shadow-[0_0_35px_rgba(79,216,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-5">
          <h3 className="text-lg font-bold font-system text-cyan-300 tracking-wider flex items-center gap-2">
            <Plus size={18} className="text-cyan-400" />
            {questToEdit ? 'EDIT SYSTEM QUEST' : 'COMMISSION NEW QUEST'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-400 font-bold mb-1.5 uppercase">
              Quest Directive (Title) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., 100 Pushups / Calisthenics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#060913] border border-cyan-500/30 rounded text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Target Parameters (Description)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Complete 4 sets of 25 pushups with clean form"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#060913] border border-cyan-500/30 rounded text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
            />
          </div>

          {/* Stat Link */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 font-bold mb-1.5 uppercase">
              Linked Attribute (Stat Gain)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATS.map((s) => {
                const Icon = s.icon;
                const isSelected = statLink === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setStatLink(s.id)}
                    className={`p-2 rounded border text-left text-xs transition flex items-center gap-2 ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300 font-bold shadow-[0_0_10px_rgba(79,216,255,0.3)]'
                        : 'border-slate-800 bg-[#070B16] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-cyan-400' : 'text-slate-500'} />
                    <span>{s.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 font-bold mb-1.5 uppercase">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map((d) => {
                const isSelected = difficulty === d.id;
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`p-2.5 rounded border text-left text-xs transition ${
                      isSelected
                        ? 'border-purple-400 bg-purple-950/40 text-purple-200 font-bold shadow-[0_0_10px_rgba(123,92,250,0.3)]'
                        : 'border-slate-800 bg-[#070B16] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-system">{d.id}</span>
                      <span className="text-[11px] font-mono text-cyan-400">+{d.xp} XP</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans">{d.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recurring Daily Toggle */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_daily"
              checked={isDaily}
              onChange={(e) => setIsDaily(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="is_daily" className="text-xs font-mono text-slate-300 cursor-pointer">
              Recurring Daily Quest (Subject to daily evaluation & penalties)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-cyan-500/20 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="cyber-button text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>{questToEdit ? 'UPDATE QUEST' : 'INITIALIZE QUEST'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
