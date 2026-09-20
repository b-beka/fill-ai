import React, { useState, useEffect } from 'react';
import { Header, ScreenId } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { TeacherLiveScreen } from './components/TeacherLiveScreen';
import { StudentScreen } from './components/StudentScreen';
import { LessonsManager } from './components/LessonsManager';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    // Check dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Healthcheck backend
    api.checkHealth()
      .then(() => setIsBackendConnected(true))
      .catch(() => setIsBackendConnected(false));
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-fill-bg text-fill-text flex flex-col selection:bg-fill-green selection:text-[#14171A]">
      <Header
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        isBackendConnected={isBackendConnected}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1">
        {currentScreen === 'landing' && (
          <LandingScreen onNavigate={setCurrentScreen} />
        )}

        {currentScreen === 'live' && (
          <TeacherLiveScreen />
        )}

        {currentScreen === 'student' && (
          <StudentScreen />
        )}

        {currentScreen === 'manager' && (
          <LessonsManager onBackendStatusChange={setIsBackendConnected} />
        )}
      </main>
    </div>
  );
};
