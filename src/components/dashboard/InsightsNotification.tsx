import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InsightsNotificationProps {
  onViewInsights: () => void;
}

export const InsightsNotification = ({ onViewInsights }: InsightsNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasNewInsights, setHasNewInsights] = useState(false);

  useEffect(() => {
    // Check localStorage for new insights flag
    const checkForNewInsights = () => {
      const newInsightsFlag = localStorage.getItem('astryd_new_insights_available');
      if (newInsightsFlag === 'true') {
        setHasNewInsights(true);
        setIsVisible(true);
      }
    };

    checkForNewInsights();
    
    // Poll every 30 seconds to check for new insights
    const interval = setInterval(checkForNewInsights, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setHasNewInsights(false);
  };

  const handleViewInsights = () => {
    localStorage.removeItem('astryd_new_insights_available');
    setIsVisible(false);
    setHasNewInsights(false);
    onViewInsights();
  };

  if (!hasNewInsights) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <Card className="p-4 shadow-sm border-border bg-background/95 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">
                  Nouveaux insights disponibles
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Votre analyse de progression est prête. Découvrez vos tendances et recommandations personnalisées.
                </p>
                <Button 
                  onClick={handleViewInsights}
                  size="sm"
                  className="w-full"
                >
                  Voir mes insights
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-6 w-6 rounded-full"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
