import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TimelineDataPoint {
  date: string;
  score_global: number;
  energie: number;
  temps: number;
  finances: number;
  soutien: number;
  competences: number;
  motivation: number;
}

interface ProgressionTimelineProps {
  data: TimelineDataPoint[];
}

export const ProgressionTimeline = ({ data }: ProgressionTimelineProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Pas encore de données d'évolution disponibles. Continuez à interagir avec votre journal et vos micro-actions pour voir votre progression apparaître ici.
        </p>
      </Card>
    );
  }

  // Calculer la tendance globale
  const firstScore = data[0]?.score_global || 0;
  const lastScore = data[data.length - 1]?.score_global || 0;
  const trend = lastScore > firstScore ? "progression" : lastScore < firstScore ? "regression" : "stable";
  const trendPercent = firstScore > 0 ? Math.round(((lastScore - firstScore) / firstScore) * 100) : 0;

  const getTrendIcon = () => {
    switch (trend) {
      case "progression": return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "regression": return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Minus className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case "progression": return "En progression";
      case "regression": return "En recul";
      default: return "Stable";
    }
  };

  return (
    <div className="space-y-6">
      {/* Carte résumé tendance */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Tendance générale</h3>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`font-medium ${
                trend === "progression" ? "text-green-600" : 
                trend === "regression" ? "text-red-600" : 
                "text-yellow-600"
              }`}>
                {getTrendLabel()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Évolution du score</p>
            <p className={`text-2xl font-bold ${
              trendPercent > 0 ? "text-green-600" : 
              trendPercent < 0 ? "text-red-600" : 
              "text-yellow-600"
            }`}>
              {trendPercent > 0 ? "+" : ""}{trendPercent}%
            </p>
          </div>
        </div>
      </Card>

      {/* Graphique score global */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Évolution du score d'alignement global</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                />
                <Line 
                  type="monotone" 
                  dataKey="score_global" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Score global"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Graphique dimensions détaillées */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Évolution par dimension</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                />
                <Legend />
                <Line type="monotone" dataKey="energie" stroke="#10b981" strokeWidth={2} dot={false} name="Énergie" />
                <Line type="monotone" dataKey="temps" stroke="#3b82f6" strokeWidth={2} dot={false} name="Temps" />
                <Line type="monotone" dataKey="finances" stroke="#f59e0b" strokeWidth={2} dot={false} name="Finances" />
                <Line type="monotone" dataKey="soutien" stroke="#1E3A5F" strokeWidth={2} dot={false} name="Soutien" />
                <Line type="monotone" dataKey="competences" stroke="#6B7280" strokeWidth={2} dot={false} name="Compétences" />
                <Line type="monotone" dataKey="motivation" stroke="#ef4444" strokeWidth={2} dot={false} name="Motivation" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
