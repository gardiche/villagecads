import { BarChart3, Rocket, CheckSquare, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingNavProps {
  activeTab: "results" | "simulator" | "steps";
  onTabChange: (tab: "results" | "simulator" | "steps") => void;
  stepsLocked: boolean;
}

export const FloatingNav = ({ activeTab, onTabChange, stepsLocked }: FloatingNavProps) => {
  const tabs = [
    { id: "results" as const, label: "Résultats", icon: BarChart3, locked: false },
    { id: "simulator" as const, label: "Simulateur", icon: Rocket, locked: false },
    { id: "steps" as const, label: "Mon feu vert", icon: CheckSquare, locked: stepsLocked },
  ];

  return (
    <nav 
      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-card/80 backdrop-blur-xl border border-border rounded-full px-2 py-2 shadow-[var(--shadow-float)]"
      style={{ boxShadow: "var(--shadow-float)" }}
    >
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isLocked = tab.locked;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isLocked && onTabChange(tab.id)}
              disabled={isLocked}
              className={cn(
                "relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                  : isLocked
                  ? "text-muted-foreground cursor-not-allowed opacity-50"
                  : "text-foreground hover:bg-muted hover:scale-105"
              )}
            >
              {isLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
