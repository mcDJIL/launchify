import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'launchify-theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      className="icon-btn"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
