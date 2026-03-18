import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationConfettiProps {
  trigger: boolean;
  type?: 'default' | 'star' | 'firework';
}

export const CelebrationConfetti = ({ trigger, type = 'default' }: CelebrationConfettiProps) => {
  useEffect(() => {
    if (!trigger) return;

    const celebrate = () => {
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      if (type === 'firework') {
        // Animation type feu d'artifice
        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }, 250);
      } else if (type === 'star') {
        // Animation étoiles
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          zIndex: 200
        };

        function fire(particleRatio: number, opts: any) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });
        fire(0.2, {
          spread: 60,
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
      } else {
        // Animation par défaut - confettis classiques
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 200,
        });
      }
    };

    celebrate();
  }, [trigger, type]);

  return null;
};
