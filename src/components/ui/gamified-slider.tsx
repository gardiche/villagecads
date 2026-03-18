import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface GamifiedSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value: number[];
  onValueChange: (value: number[]) => void;
  label?: string;
}

const GamifiedSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  GamifiedSliderProps
>(({ className, value, onValueChange, label, ...props }, ref) => {
  const currentValue = value[0] || 0;
  
  // Calcul de la taille du thumb (de 16px à 32px)
  const thumbSize = 16 + (currentValue / 100) * 16;
  
  // Calcul de la couleur (du gris au primaire vibrant)
  const getColor = (val: number) => {
    if (val < 20) return "hsl(var(--muted-foreground))";
    if (val < 40) return "hsl(var(--muted-foreground) / 0.7)";
    if (val < 60) return "hsl(var(--primary) / 0.5)";
    if (val < 80) return "hsl(var(--primary) / 0.8)";
    return "hsl(var(--primary))";
  };
  
  // Calcul de l'intensité du glow
  const glowIntensity = Math.max(0, (currentValue - 50) / 50);
  
  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
      )}
      
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center group",
          className
        )}
        value={value}
        onValueChange={onValueChange}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary transition-all">
          <SliderPrimitive.Range 
            className="absolute h-full transition-all duration-300"
            style={{
              background: `linear-gradient(to right, hsl(var(--muted-foreground) / 0.3), ${getColor(currentValue)})`
            }}
          />
        </SliderPrimitive.Track>
        
        <SliderPrimitive.Thumb
          className={cn(
            "block rounded-full border-2 border-background bg-primary",
            "ring-offset-background transition-all duration-300 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:scale-110 active:scale-95",
            "shadow-lg"
          )}
          style={{
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            backgroundColor: getColor(currentValue),
            boxShadow: glowIntensity > 0 
              ? `0 0 ${10 + glowIntensity * 20}px ${getColor(currentValue)}` 
              : undefined
          }}
        />
      </SliderPrimitive.Root>
    </div>
  );
});

GamifiedSlider.displayName = "GamifiedSlider";

export { GamifiedSlider };
