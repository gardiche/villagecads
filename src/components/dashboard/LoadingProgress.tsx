import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, UserCog, Image as ImageIcon, ListChecks } from "lucide-react";

interface LoadingProgressProps {
  onProfileReady?: () => void;
}

const LoadingProgress = ({ onProfileReady }: LoadingProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showLongMessage, setShowLongMessage] = useState(false);
  const stepStartTimesRef = useRef([Date.now(), 0, 0]);
  const currentStepRef = useRef(0);

  const steps = [
    { icon: UserCog, title: "Analyse de votre profil", duration: 2500 },
    { icon: ImageIcon, title: "Création de votre visuel personnalisé", duration: 3000 },
    { icon: ListChecks, title: "Calcul de votre parcours", duration: 2500 }
  ];

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    stepStartTimesRef.current = [Date.now(), 0, 0];
    
    // Progression fluide et réaliste
    const progressInterval = setInterval(() => {
      const now = Date.now();
      const step = currentStepRef.current;
      const elapsed = now - stepStartTimesRef.current[step];
      const currentStepDuration = steps[step]?.duration || 3000;
      const stepProgress = Math.min((elapsed / currentStepDuration) * 33, 33);
      const baseProgress = step * 33;
      
      setProgress(Math.min(baseProgress + stepProgress, 100));
    }, 100);

    // Progression des étapes
    const stepTimer1 = setTimeout(() => {
      stepStartTimesRef.current[1] = Date.now();
      setCurrentStep(1);
    }, steps[0].duration);
    
    const stepTimer2 = setTimeout(() => {
      stepStartTimesRef.current[2] = Date.now();
      setCurrentStep(2);
      
      if (onProfileReady) {
        setTimeout(() => onProfileReady(), 500);
      }
    }, steps[0].duration + steps[1].duration);

    const longLoadingTimer = setTimeout(() => setShowLongMessage(true), 5000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(longLoadingTimer);
    };
  }, [onProfileReady]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Génération de votre profil entrepreneurial
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Votre coach IA analyse votre situation...
          </p>
          {showLongMessage && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-muted-foreground max-w-md mx-auto italic"
            >
              L'analyse est un peu plus longue que prévu, on finalise...
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            {Math.floor(progress)}%
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: isActive || isCompleted ? 1 : 0.4,
                  x: 0,
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isActive
                    ? "bg-primary/5 border-primary shadow-sm"
                    : isCompleted
                    ? "bg-muted/50 border-border"
                    : "bg-background border-border"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isActive || isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      ✓
                    </motion.div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <h3 className="font-semibold flex-1">{step.title}</h3>
                {isActive && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="flex-shrink-0"
                  >
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingProgress;
