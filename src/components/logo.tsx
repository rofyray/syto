import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  className,
  showText = true,
  size = "md"
}: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const emojiSizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={emojiSizes[size]}>🎒</span>
      {showText && (
        <span className={cn("luckiest-guy-regular", sizeClasses[size], "bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent")}>
          Syto
        </span>
      )}
    </div>
  );
}