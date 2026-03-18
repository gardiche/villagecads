import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const RecalculatingProgress = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { icon: Sparkles, title: "Analyse de votre profil..." },
    { icon: TrendingUp, title: "Génération de votre visuel unique..." },
    { icon: Zap, title: "Finalisation de votre espace..." }
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }

        const next = prev + 1.5;

        // Met à jour l'étape active en fonction de l'avancement, comme dans le loader d'onboarding profil
        if (next < 33) {
          setCurrentStep(0);
        } else if (next < 66) {
          setCurrentStep(1);
        } else {
          setCurrentStep(2);
        }

        return next;
      });
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Main message */}
        <div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Sparkles className="w-12 h-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Génération de votre profil entrepreneurial
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Votre coach IA affine votre accompagnement...
          </p>
        </div>

        {/* Progress bar */}
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

        {/* Steps */}
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
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
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

export default RecalculatingProgress;
