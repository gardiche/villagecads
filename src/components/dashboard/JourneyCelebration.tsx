import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface JourneyCelebrationProps {
  newlyCompletedSteps: string[];
  onCelebrationComplete: () => void;
}

export const JourneyCelebration = ({ 
  newlyCompletedSteps, 
  onCelebrationComplete 
}: JourneyCelebrationProps) => {
  useEffect(() => {
    if (newlyCompletedSteps.length === 0) return;

    console.log('🎉 Célébration pour étapes complétées:', newlyCompletedSteps);

    // Délai pour laisser le DOM se mettre à jour avant de déclencher les confettis
    const timer = setTimeout(() => {
      // Configuration des confettis
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { 
        startVelocity: 30, 
        spread: 360, 
        ticks: 60, 
        zIndex: 9999,
        colors: ['#10b981', '#3b82f6', '#1E3A5F', '#f59e0b', '#6B7280']
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      // Explosion de confettis en plusieurs vagues
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          onCelebrationComplete();
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confettis depuis le bas gauche
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });

        // Confettis depuis le bas droit
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [newlyCompletedSteps, onCelebrationComplete]);

  return null;
};
