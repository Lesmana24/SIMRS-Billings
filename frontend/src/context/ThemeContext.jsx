import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 1. Check if user already has a saved preference in localStorage
    const savedTheme = localStorage.getItem('simrs_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // 2. First time access: automatically follow system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [hasCustomPreference, setHasCustomPreference] = useState(() => {
    return !!localStorage.getItem('simrs_theme');
  });

  // Apply theme class and data-theme attribute to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  // Listen to OS system color scheme changes ONLY IF user has NOT set a custom preference yet
  useEffect(() => {
    if (hasCustomPreference) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      if (!localStorage.getItem('simrs_theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, [hasCustomPreference]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setHasCustomPreference(true);
    localStorage.setItem('simrs_theme', nextTheme);
  };

  const setThemeExplicitly = (newTheme) => {
    if (newTheme === 'system') {
      localStorage.removeItem('simrs_theme');
      setHasCustomPreference(false);
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'dark' : 'light');
    } else {
      setTheme(newTheme);
      setHasCustomPreference(true);
      localStorage.setItem('simrs_theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, hasCustomPreference, toggleTheme, setThemeExplicitly }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
