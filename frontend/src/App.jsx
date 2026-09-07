import React, { useState, useEffect } from 'react';
import SystemHeader from './components/SystemHeader';
import PenaltyBanner from './components/PenaltyBanner';
import QuestList from './components/QuestList';
import QuestModal from './components/QuestModal';
import StatBlock from './components/StatBlock';
import HistoryAnalytics from './components/HistoryAnalytics';
import SystemNotificationModal from './components/SystemNotificationModal';
import { sound } from './utils/audio';
import {
  fetchHunter,
  fetchQuests,
  fetchAnalytics,
  toggleQuest,
  allocateStat,
  createQuest,
  updateQuest,
  deleteQuest,
  endDay,
  resetHunter,
} from './api';

export default function App() {
  const [hunter, setHunter] = useState(null);
  const [quests, setQuests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('quests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Floating text
  const [modalData, setModalData] = useState(null);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState(null);
  const [combatTexts, setCombatTexts] = useState([]);
  const [soundMuted, setSoundMuted] = useState(sound.isMuted());

  // Action Loading states
  const [isToggling, setIsToggling] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isEndingDay, setIsEndingDay] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initial Load
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hData, qData, aData] = await Promise.all([
        fetchHunter(),
        fetchQuests(),
        fetchAnalytics(),
      ]);
      setHunter(hData);
      setQuests(qData);
      setAnalytics(aData);

      // Check if Missed Login Penalty was applied on this login
      if (hData.missed_login_penalty_applied > 0 && hData.missed_days_count > 0) {
        sound.playPenaltyAlert();
        setModalData({
          type: 'missed_login',
          payload: {
            hunter: hData,
            missed_days_count: hData.missed_days_count,
            missed_login_penalty_applied: hData.missed_login_penalty_applied,
            missed_dates: hData.missed_dates,
          },
        });
      }
    } catch (err) {
      console.error("System Initialization Error:", err);
      setError("Failed to establish link with System backend. Please ensure API server is active on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Floating Combat Text Helper
  const spawnCombatText = (text, color, x, y) => {
    const id = Date.now() + Math.random();
    setCombatTexts((prev) => [...prev, { id, text, color, x, y }]);
    setTimeout(() => {
      setCombatTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // Quest Check-in / Toggle
  const handleToggleQuest = async (quest, e) => {
    try {
      setIsToggling(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top;

      const res = await toggleQuest(quest.id);

      // Sound & floating particle feedback
      if (res.completed) {
        sound.playQuestComplete();
        spawnCombatText(`+${quest.xp_reward} XP`, 'text-cyan-400', clickX, clickY);
        if (res.stat_awarded) {
          setTimeout(() => {
            spawnCombatText(`+1 ${res.stat_awarded}`, 'text-purple-400', clickX + 15, clickY - 15);
          }, 200);
        }
      }

      // Check for Level Up!
      if (res.level_up) {
        sound.playLevelUp();
        setModalData({
          type: 'level_up',
          payload: {
            level: res.hunter.level,
            stat_points_granted: res.stat_points_granted,
          },
        });
      }

      setHunter(res.hunter);
      // Update quests list
      setQuests((prev) =>
        prev.map((q) => (q.id === quest.id ? { ...q, completed_today: res.completed } : q))
      );

      // Refresh analytics in background
      fetchAnalytics().then(setAnalytics).catch(() => {});
    } catch (err) {
      alert(err.message || 'Failed to check in quest');
    } finally {
      setIsToggling(false);
    }
  };

  // Stat Point Allocation
  const handleAllocateStat = async (statKey) => {
    try {
      setIsAllocating(true);
      const updatedHunter = await allocateStat(statKey);
      setHunter(updatedHunter);
    } catch (err) {
      alert(err.message || 'Failed to allocate stat');
    } finally {
      setIsAllocating(false);
    }
  };

  // Create or Edit Quest
  const handleSaveQuest = async (data) => {
    try {
      if (questToEdit) {
        const updated = await updateQuest(questToEdit.id, data);
        setQuests((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      } else {
        const created = await createQuest(data);
        setQuests((prev) => [...prev, created]);
      }
      setIsQuestModalOpen(false);
      setQuestToEdit(null);
    } catch (err) {
      alert(err.message || 'Failed to save quest');
    }
  };

  // Delete Quest
  const handleDeleteQuest = async (questId) => {
    try {
      await deleteQuest(questId);
      setQuests((prev) => prev.filter((q) => q.id !== questId));
    } catch (err) {
      alert(err.message || 'Failed to delete quest');
    }
  };

  // End Day / Daily Rollover Adjudication
  const handleEndDay = async () => {
    if (!confirm("Initiate daily protocol adjudication? Uncompleted quests will incur penalties and streak resets.")) {
      return;
    }

    try {
      setIsEndingDay(true);
      const res = await endDay();
      setHunter(res.hunter);

      // Alert audio if penalty zone triggered
      if (res.evaluation.penalty_zone_triggered) {
        sound.playPenaltyAlert();
      } else {
        sound.playQuestComplete();
      }

      // Show Evaluation Modal
      setModalData({
        type: 'day_evaluation',
        payload: res,
      });

      // Refresh quests and analytics
      const [newQuests, newAnalytics] = await Promise.all([
        fetchQuests(),
        fetchAnalytics(),
      ]);
      setQuests(newQuests);
      setAnalytics(newAnalytics);
    } catch (err) {
      alert(err.message || 'Failed to evaluate day');
    } finally {
      setIsEndingDay(false);
    }
  };

  // Reset Progression
  const handleResetProgress = async () => {
    try {
      setIsResetting(true);
      const resetH = await resetHunter(true);
      setHunter(resetH);
      const [newQuests, newAnalytics] = await Promise.all([
        fetchQuests(),
        fetchAnalytics(),
      ]);
      setQuests(newQuests);
      setAnalytics(newAnalytics);
      alert("System has been reset. Starter quests re-seeded.");
    } catch (err) {
      alert(err.message || 'Failed to reset progress');
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05070D] text-cyan-400 font-system p-4">
        <div className="w-16 h-16 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(79,216,255,0.4)]"></div>
        <div className="text-sm font-bold tracking-widest uppercase">INITIALIZING THE SYSTEM...</div>
        <div className="text-xs text-slate-500 font-mono mt-2">Connecting to Hunter Protocol Data Node</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05070D] text-white p-6">
        <div className="cyber-panel p-8 rounded-lg max-w-md border-red-500 shadow-[0_0_30px_rgba(255,59,78,0.3)] text-center">
          <div className="text-red-400 font-system font-bold text-lg mb-2">COMMUNICATION LINK FAILURE</div>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed font-sans">{error}</p>
          <button
            onClick={loadData}
            className="cyber-button text-xs py-2 px-4"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#05070D] text-slate-100 relative">
      {/* Floating Combat Texts Container */}
      {combatTexts.map((item) => (
        <div
          key={item.id}
          className={`combat-text ${item.color}`}
          style={{ left: `${item.x}px`, top: `${item.y}px` }}
        >
          {item.text}
        </div>
      ))}

      {/* Main HUD Header */}
      <SystemHeader
        hunter={hunter}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onEndDay={handleEndDay}
        isEndingDay={isEndingDay}
        soundMuted={soundMuted}
        setSoundMuted={setSoundMuted}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
        {/* Penalty Zone Alert Banner */}
        <PenaltyBanner hunter={hunter} />

        {/* Tab 1: Today's Quests */}
        {activeTab === 'quests' && (
          <QuestList
            quests={quests}
            onToggleQuest={handleToggleQuest}
            onOpenCreateModal={() => {
              setQuestToEdit(null);
              setIsQuestModalOpen(true);
            }}
            onOpenEditModal={(q) => {
              setQuestToEdit(q);
              setIsQuestModalOpen(true);
            }}
            onDeleteQuest={handleDeleteQuest}
            isToggling={isToggling}
          />
        )}

        {/* Tab 2: Attributes & Stats */}
        {activeTab === 'stats' && (
          <StatBlock
            hunter={hunter}
            onAllocateStat={handleAllocateStat}
            isAllocating={isAllocating}
          />
        )}

        {/* Tab 3: History & Analytics */}
        {activeTab === 'analytics' && (
          <HistoryAnalytics
            analytics={analytics}
            hunter={hunter}
            onResetProgress={handleResetProgress}
            isResetting={isResetting}
          />
        )}
      </main>

      {/* Create / Edit Quest Modal */}
      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => {
          setIsQuestModalOpen(false);
          setQuestToEdit(null);
        }}
        onSubmit={handleSaveQuest}
        questToEdit={questToEdit}
      />

      {/* System Notification Modal (Level Up / Day Evaluation) */}
      <SystemNotificationModal
        modalData={modalData}
        onClose={() => setModalData(null)}
      />

      {/* Footer */}
      <footer className="border-t border-cyan-500/10 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SOLOQUEST // THE SYSTEM &copy; {new Date().getFullYear()}</span>
          <span>"I ALONE LEVEL UP." — ARISE PROTOCOL ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
