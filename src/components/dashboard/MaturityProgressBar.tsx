import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface MaturityProgressBarProps {
  ideaId?: string;
}

const MaturityProgressBar = ({ ideaId }: MaturityProgressBarProps) => {
  const [stats, setStats] = useState({ total: 0, completed: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Écouter les mises à jour
    const handleUpdate = () => loadStats();
    window.addEventListener('astryd-data-update', handleUpdate);
    return () => window.removeEventListener('astryd-data-update', handleUpdate);
  }, [ideaId]);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Mode guest: lire depuis localStorage
        const localResults = localStorage.getItem('astryd_complete_results');
        if (localResults) {
          const parsed = JSON.parse(localResults);
          const actions = parsed.micro_actions || [];
          const total = actions.length;
          const completed = actions.filter((a: any) => a.status === 'done').length;
          setStats({
            total,
            completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
          });
        }
        setLoading(false);
        return;
      }

      // Mode authentifié: lire depuis la DB
      let query = supabase
        .from('micro_commitments')
        .select('status')
        .eq('user_id', user.id)
        .or('archived.is.null,archived.eq.false');

      if (ideaId) {
        query = query.eq('idea_id', ideaId);
      }

      const { data, error } = await query;

      if (!error && data) {
        const total = data.length;
        const completed = data.filter(a => a.status === 'done').length;
        setStats({
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error loading maturity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || stats.total === 0) {
    return null;
  }

  const getMessage = () => {
    if (stats.percentage >= 80) return "Excellent ! Vous êtes sur la bonne voie 🚀";
    if (stats.percentage >= 50) return "Belle progression, continuez ainsi 💪";
    if (stats.percentage >= 25) return "Bon début, chaque action compte 🌱";
    return "Lancez-vous avec une première action 🎯";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Progression Maturité</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {stats.completed}/{stats.total} actions
          </span>
        </div>
      </div>
      
      <Progress value={stats.percentage} className="h-3 mb-2" />
      
      <p className="text-xs text-muted-foreground text-center">
        {getMessage()}
      </p>
    </motion.div>
  );
};

export default MaturityProgressBar;
