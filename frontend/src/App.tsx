import React, { useState, useEffect } from 'react';
import { Header, ScreenId } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { TeacherLiveScreen } from './components/TeacherLiveScreen';
import { StudentScreen } from './components/StudentScreen';
import { LessonsManager } from './components/LessonsManager';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { User, UserRole } from './types/auth';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('teacher');
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'teacher-bio',
    name: 'Д-р Аскар Ибраев',
    role: 'teacher',
    org_id: 'org-kaznu',
    email: 'askar.ibrayev@kaznu.kz'
  });

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

  const handleOpenAuth = (role: UserRole = 'teacher') => {
    setAuthInitialRole(role);
    setIsAuthModalOpen(true);
  };

  const handleSelectUser = (user: User, targetScreen?: 'live' | 'student') => {
    setCurrentUser(user);
    if (targetScreen) {
      setCurrentScreen(targetScreen);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col selection:bg-emerald-400 selection:text-black font-body">
      <Header
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        isBackendConnected={isBackendConnected}
        currentUser={currentUser}
        onOpenAuth={(role) => handleOpenAuth(role || 'teacher')}
        onLogout={handleLogout}
      />

      <main className="flex-1 bg-[#000000]">
        {currentScreen === 'landing' && (
          <LandingScreen 
            onNavigate={setCurrentScreen} 
            onOpenAuth={(role) => handleOpenAuth(role || 'teacher')}
          />
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

      {/* Modern Liquid-Metal Auth & Role Selection Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectUser={handleSelectUser}
        initialRole={authInitialRole}
      />
    </div>
  );
};
