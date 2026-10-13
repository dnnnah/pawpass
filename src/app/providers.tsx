"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

const THEME_KEY = "pawpass-theme:v1";
const LEGACY_THEME_KEY = "pawpass-theme";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const storageCache = new Map<string, string | null>();

function getStoredTheme(): Theme | null {
  let stored: string | null = null;
  try {
    if (storageCache.has(THEME_KEY)) {
      stored = storageCache.get(THEME_KEY) as Theme | null;
    } else {
      stored = localStorage.getItem(THEME_KEY);
      // Migración desde la clave anterior sin versión
      if (!stored) {
        const legacy = localStorage.getItem(LEGACY_THEME_KEY);
        if (legacy === "light" || legacy === "dark") {
          stored = legacy;
          localStorage.setItem(THEME_KEY, legacy);
          localStorage.removeItem(LEGACY_THEME_KEY);
        }
      }
      storageCache.set(THEME_KEY, stored);
    }
  } catch {
    stored = null;
  }

  return stored === "light" || stored === "dark" ? (stored as Theme) : null;
}

function resolveTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  return resolveTheme();
}

function getServerSnapshot(): Theme {
  return "light";
}

function applyToDocument(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
      localStorage.removeItem(LEGACY_THEME_KEY);
      storageCache.set(THEME_KEY, next);
    } catch {
      // almacenamiento no disponible
    }
    applyToDocument(next);
    emitChange();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return context;
}
