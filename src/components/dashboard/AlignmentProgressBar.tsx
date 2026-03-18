import { motion } from "framer-motion";

interface AlignmentProgressBarProps {
  currentScore: number;
}

const AlignmentProgressBar = ({ currentScore }: AlignmentProgressBarProps) => {
  const percentage = Math.min(Math.max(currentScore, 0), 100);
  
  // Déterminer la couleur et le message selon le score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 50) return "text-accent";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Feu vert — tu peux passer à l'action";
    if (score >= 50) return "Tu progresses";
    return "Encore du travail";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 70) return "🚀";
    if (score >= 50) return "💪";
    return "🔧";
  };

  // Calcul pour le cercle SVG
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Cercle de progression animé */}
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          {/* Cercle de fond */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-muted/20"
          />
          
          {/* Cercle de progression avec gradient */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={`${getScoreColor(percentage).split(' ')[0].replace('from-', 'text-')}`} stopColor="currentColor" />
              <stop offset="100%" className={`${getScoreColor(percentage).split(' ')[1].replace('to-', 'text-')}`} stopColor="currentColor" />
            </linearGradient>
          </defs>
          
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Emoji au centre (pas de score) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="text-center"
          >
            <div className="text-6xl">
              {getScoreEmoji(percentage)}
            </div>
          </motion.div>
        </div>

        {/* Icône flottante */}
        <motion.div
          className="absolute -top-2 -right-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: "spring" }}
        >
          <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center shadow-sm`}>
            <span className="text-2xl">{getScoreEmoji(percentage)}</span>
          </div>
        </motion.div>
      </div>

      {/* Label et description */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={`text-xl font-display font-bold ${getScoreColor(percentage)}`}
        >
          {getScoreLabel(percentage)}
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-muted-foreground max-w-md"
        >
          Cette jauge combine ton alignement, tes actions, ton journal et les signaux d'évolution. Plus tu agis, plus la jauge progresse vers le feu vert.
        </motion.p>
      </div>

      {/* Jalons visuels (sans scores numériques) */}
      <div className="flex items-center gap-8 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">Encore du travail</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-xs text-muted-foreground">Tu progresses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Posture solide</span>
        </div>
      </div>
    </div>
  );
};

export default AlignmentProgressBar;
