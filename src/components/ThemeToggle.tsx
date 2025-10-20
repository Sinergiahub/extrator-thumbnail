import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { toggleTheme, initTheme, getCurrentTheme } from "@/lib/theme";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const currentTheme = initTheme();
    setTheme(currentTheme);
  }, []);

  const handleToggle = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Alternar tema"
      aria-pressed={theme === "dark"}
      className="inline-flex items-center gap-2 bg-transparent border border-border px-3 py-2 rounded-md text-foreground hover:bg-accent transition-colors"
      title="Alternar tema"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline text-sm">Tema</span>
    </button>
  );
};
