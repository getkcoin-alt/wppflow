"use client";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem("scriwo_theme", dark ? "dark" : "light");
    } catch {}
  };
  return (
    <button type="button" onClick={toggle} aria-label="Switch between light and dark theme" className="grid h-10 w-10 place-items-center rounded-full text-fg-2 hover:bg-surface-2 hover:text-fg">
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
      <Moon className="h-[18px] w-[18px] dark:hidden" />
    </button>
  );
}

// Runs before first paint so the page never flashes the wrong theme.
export const themeScript = `(function(){try{var t=localStorage.getItem("scriwo_theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})();`;
