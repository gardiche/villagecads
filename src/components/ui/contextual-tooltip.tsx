import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContextualTooltipProps {
  content: string
  children: React.ReactNode
  className?: string
  side?: "top" | "bottom" | "left" | "right"
}

export const ContextualTooltip = ({
  content,
  children,
  className,
  side = "top"
}: ContextualTooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasBeenSeen, setHasBeenSeen] = React.useState(false)

  React.useEffect(() => {
    // Vérifier si ce tooltip a déjà été vu
    const tooltipKey = `tooltip_seen_${content.substring(0, 20)}`
    const seen = localStorage.getItem(tooltipKey)
    if (seen === 'true') {
      setHasBeenSeen(true)
    }
  }, [content])

  const handleMouseEnter = () => {
    setIsVisible(true)
    if (!hasBeenSeen) {
      const tooltipKey = `tooltip_seen_${content.substring(0, 20)}`
      localStorage.setItem(tooltipKey, 'true')
      setHasBeenSeen(true)
    }
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  const getPositionClasses = () => {
    switch (side) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2"
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2"
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2"
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2"
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2"
    }
  }

  return (
    <div
      className="relative inline-flex items-center group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {/* Icône d'aide visible pour les nouveaux utilisateurs */}
      {!hasBeenSeen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center pointer-events-none"
        >
          <HelpCircle className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 w-64 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-lg shadow-lg pointer-events-none",
              getPositionClasses(),
              className
            )}
          >
            <div className="relative">
              {content}
              {/* Flèche */}
              <div
                className={cn(
                  "absolute w-2 h-2 bg-primary rotate-45",
                  side === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
                  side === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
                  side === "left" && "right-[-4px] top-1/2 -translate-y-1/2",
                  side === "right" && "left-[-4px] top-1/2 -translate-y-1/2"
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
