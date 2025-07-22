import { useEffect, useState } from 'react';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="flex items-center gap-2 p-4">
      <span className="text-xs text-muted-foreground">Theme:</span>
      <button
        className={`px-2 py-1 rounded ${theme === 'light' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
      >
        Light
      </button>
      <button
        className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
      >
        Dark
      </button>
    </div>
  );
} 