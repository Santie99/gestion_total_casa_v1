"use client";

import { useEffect } from "react";

export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "gtc-theme-mode";
const DAY_START_HOUR = 7;
const NIGHT_START_HOUR = 19;

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "auto" || stored === "light" ? stored : "light";
}

function resolveTheme(mode: ThemeMode) {
  if (mode !== "auto") return mode;
  const hour = new Date().getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "light" : "dark";
}

function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function setAppThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
  window.dispatchEvent(new CustomEvent("gtc-theme-change", { detail: { mode } }));
}

export function getAppThemeMode() {
  return getStoredMode();
}

export function ThemeRuntime() {
  useEffect(() => {
    const sync = () => applyTheme(getStoredMode());

    sync();

    const intervalId = window.setInterval(() => {
      if (getStoredMode() === "auto") sync();
    }, 60_000);

    window.addEventListener("storage", sync);
    window.addEventListener("gtc-theme-change", sync as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", sync);
      window.removeEventListener("gtc-theme-change", sync as EventListener);
    };
  }, []);

  return null;
}
