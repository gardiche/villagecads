import { useState, useEffect } from 'react';
import { AchievementType } from '@/components/dashboard/AchievementBadge';

interface AchievementState {
  first_micro_action: boolean;
  all_critical_zones_resolved: boolean;
  first_journal_entry: boolean;
  document_added: boolean;
  milestone_reached: boolean;
}

const STORAGE_KEY = 'astryd_achievements';

export const useAchievementTracking = () => {
  const [achievements, setAchievements] = useState<AchievementState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      first_micro_action: false,
      all_critical_zones_resolved: false,
      first_journal_entry: false,
      document_added: false,
      milestone_reached: false,
    };
  });

  const [currentAchievement, setCurrentAchievement] = useState<AchievementType | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [confettiType, setConfettiType] = useState<'default' | 'star' | 'firework'>('default');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
  }, [achievements]);

  const unlockAchievement = (type: AchievementType, confettiStyle: 'default' | 'star' | 'firework' = 'default') => {
    if (!achievements[type]) {
      setAchievements(prev => ({ ...prev, [type]: true }));
      setCurrentAchievement(type);
      setConfettiType(confettiStyle);
      setTriggerConfetti(true);
      
      // Reset confetti trigger après un court délai
      setTimeout(() => setTriggerConfetti(false), 100);
    }
  };

  const checkAndUnlockMicroAction = (completedCount: number) => {
    if (completedCount === 1 && !achievements.first_micro_action) {
      unlockAchievement('first_micro_action', 'default');
    }
  };

  const checkAndUnlockCriticalZones = (hasCriticalZones: boolean) => {
    if (!hasCriticalZones && !achievements.all_critical_zones_resolved) {
      unlockAchievement('all_critical_zones_resolved', 'firework');
    }
  };

  const checkAndUnlockJournal = (hasJournalEntry: boolean) => {
    if (hasJournalEntry && !achievements.first_journal_entry) {
      unlockAchievement('first_journal_entry', 'default');
    }
  };

  const checkAndUnlockDocument = (hasDocument: boolean) => {
    if (hasDocument && !achievements.document_added) {
      unlockAchievement('document_added', 'default');
    }
  };

  const dismissAchievement = () => {
    setCurrentAchievement(null);
  };

  const resetAchievements = () => {
    const fresh: AchievementState = {
      first_micro_action: false,
      all_critical_zones_resolved: false,
      first_journal_entry: false,
      document_added: false,
      milestone_reached: false,
    };
    setAchievements(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  return {
    achievements,
    currentAchievement,
    triggerConfetti,
    confettiType,
    unlockAchievement,
    checkAndUnlockMicroAction,
    checkAndUnlockCriticalZones,
    checkAndUnlockJournal,
    checkAndUnlockDocument,
    dismissAchievement,
    resetAchievements,
  };
};
