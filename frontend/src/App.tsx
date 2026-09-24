import React, { useState, useEffect } from 'react';
import { Header, ScreenId } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { AuthScreen } from './components/AuthScreen';
import { TeacherLiveScreen } from './components/TeacherLiveScreen';
import { StudentScreen } from './components/StudentScreen';
import { LessonsManager } from './components/LessonsManager';
import { api } from './services/api';
import { User, UserRole } from './types/auth';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<UserRole>('teacher');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Healthcheck FastAPI backend at port 8000
    api.checkHealth()
      .then(() => setIsBackendConnected(true))
      .catch(() => setIsBackendConnected(false));

    // Periodic check every 15 seconds
    const interval = setInterval(() => {
      api.checkHealth()
        .then(() => setIsBackendConnected(true))
        .catch(() => setIsBackendConnected(false));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login', role: UserRole = 'teacher') => {
    setAuthMode(mode);
    setAuthRole(role);
    setCurrentScreen('auth');
  };

  const handleAuthSuccess = (user: User, targetScreen: 'live' | 'student') => {
    setCurrentUser(user);
    setCurrentScreen(targetScreen);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('landing');
  };

  return (
    <div className="min-h-screen bg-[#111318] text-white flex flex-col font-body selection:bg-[#AEDB00] selection:text-[#111318]">
      <Header
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        isBackendConnected={isBackendConnected}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main className="flex-1 bg-[#111318]">
        {currentScreen === 'landing' && (
          <LandingScreen 
            onNavigate={setCurrentScreen} 
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen
            initialMode={authMode}
            initialRole={authRole}
            onSuccess={handleAuthSuccess}
            onBackToLanding={() => setCurrentScreen('landing')}
          />
        )}

        {currentScreen === 'live' && (
          <TeacherLiveScreen 
            onBackToLanding={() => setCurrentScreen('landing')}
          />
        )}

        {currentScreen === 'student' && (
          <StudentScreen 
            onBackToLanding={() => setCurrentScreen('landing')}
          />
        )}

        {currentScreen === 'manager' && (
          <LessonsManager onBackendStatusChange={setIsBackendConnected} />
        )}
      </main>
    </div>
  );
};
