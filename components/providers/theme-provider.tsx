"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

const ThemeContext = React.createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "dark", setTheme: () => {} });

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  attribute = "class",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    const stored = localStorage.getItem("tm-theme") as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;

    if (disableTransitionOnChange) {
      root.style.setProperty("transition", "none");
      requestAnimationFrame(() => root.style.removeProperty("transition"));
    }

    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    if (attribute === "class") {
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
    } else {
      root.setAttribute(attribute, resolved);
    }

    localStorage.setItem("tm-theme", theme);
  }, [theme, attribute, disableTransitionOnChange]);

  const setTheme = React.useCallback((t: Theme) => setThemeState(t), []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
