const THEME_KEY = "theme";

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
}

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
    return saved;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = prefersDark ? "dark" : "light";
  applyTheme(theme);
  return theme;
}

export function toggleTheme(): "light" | "dark" {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
  return next;
}

export function getCurrentTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
