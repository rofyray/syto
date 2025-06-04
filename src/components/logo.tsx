import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  textColor?: string;
  iconColor?: string;
}

export function Logo({ 
  className, 
  showText = true, 
  size = "md", 
  textColor = "text-foreground dark:text-foreground",
  iconColor = "text-ghana-green dark:text-ghana-green"
}: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };
  
  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <BookOpen size={iconSizes[size]} className={cn(iconColor, "relative z-10")} />
        <div className="absolute top-0 left-0 w-full h-full bg-ghana-gold dark:bg-ghana-gold-dark rounded-full transform scale-75 opacity-20"></div>
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight", sizeClasses[size], textColor)}>
          Syto
        </span>
      )}
    </div>
  );
}