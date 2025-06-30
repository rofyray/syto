import { ReactNode, useEffect } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    // Set initial theme based on saved preference or system preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Set initial theme based on saved preference or system preference
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    
    // Also store in localStorage if it wasn't there already
    if (!savedTheme) {
      localStorage.setItem("theme", initialTheme);
    }
  }, []);

  return <>{children}</>;
}
