import React from 'react';
import { 
  LogOut, 
  GraduationCap, 
  BookOpen, 
  ArrowRight
} from 'lucide-react';
import { User, UserRole } from '../types/auth';

export type ScreenId = 'landing' | 'auth' | 'live' | 'student' | 'manager';

interface HeaderProps {
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  isBackendConnected: boolean;
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register', role?: UserRole) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onScreenChange,
  isBackendConnected,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const handleNavClick = (sectionId: string) => {
    if (currentScreen !== 'landing') {
      onScreenChange('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#111318] border-b border-white/10 px-4 sm:px-8 h-[64px] flex items-center">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Custom Geometric Brand Logo & FILL AI Typography */}
        <div 
          onClick={() => onScreenChange('landing')}
          className="flex items-center gap-3 cursor-pointer select-none flex-none group"
        >
          {/* Brand Mark: Solid Primary Blue #2A46C7 with Crisp White Emblem */}
          <div className="w-9 h-9 rounded-lg bg-[#2A46C7] flex items-center justify-center text-white font-display font-black text-base shadow-sm group-hover:scale-105 transition-transform">
            F
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base tracking-tight text-white">
                FILL AI
              </span>
              <span className="text-[9px] font-mono-tag px-1.5 py-0.5 bg-[#AEDB00] text-[#111318] font-bold rounded">
                LIVE
              </span>
            </div>
            <span className="text-[10px] font-mono-tag text-white/40 tracking-wider">
              CONTENT TRANSFORMATION
            </span>
          </div>
        </div>

        {/* Center: Clean Landing Page Section Anchors (NO PAGE SWITCHERS!) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-white/70">
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-white transition-colors"
          >
            Как это работает
          </button>

          <button
            onClick={() => handleNavClick('features')}
            className="hover:text-white transition-colors"
          >
            Возможности
          </button>

          <button
            onClick={() => handleNavClick('services')}
            className="hover:text-white transition-colors"
          >
            Услуги и тарифы
          </button>

          <button
            onClick={() => handleNavClick('testimonials')}
            className="hover:text-white transition-colors"
          >
            Отзывы
          </button>

          <button
            onClick={() => handleNavClick('faq')}
            className="hover:text-white transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* Right: Authentication Buttons (Login & Register) OR Active Cabinet */}
        <div className="flex items-center gap-3 flex-none justify-end">
          
          {/* Backend Status Beacon */}
          <div 
            onClick={() => onScreenChange('manager')}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#141822] border border-white/10 text-[10px] font-mono-tag text-white/50 cursor-pointer hover:border-white/30"
            title={isBackendConnected ? "FastAPI 8000 подключен" : "Локальный режим"}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-[#AEDB00]' : 'bg-amber-400'}`} />
            <span>{isBackendConnected ? 'API 8000' : 'DEMO'}</span>
          </div>
          
          {currentUser ? (
            // Logged In State: Direct link to Workspace + User Badge + Logout
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onScreenChange(currentUser.role === 'teacher' ? 'live' : 'student')}
                className={`text-xs h-9 px-3.5 rounded-lg flex items-center gap-2 font-semibold transition-all ${
                  (currentScreen === 'live' || currentScreen === 'student')
                    ? 'bg-[#AEDB00] text-[#111318]'
                    : 'bg-[#2A46C7] text-white hover:opacity-90'
                }`}
              >
                {currentUser.role === 'teacher' ? (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>Кабинет преподавателя</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Кабинет ученика</span>
                  </>
                )}
                <ArrowRight className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* User Initials & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/15">
                <div className="w-8 h-8 rounded-full bg-[#1b202c] border border-white/20 text-white font-mono-tag text-xs font-bold flex items-center justify-center" title={currentUser.name}>
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  title="Выйти из системы"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            // Logged Out State: Login & Register Buttons
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onOpenAuth('login')}
                className="btn-outline h-9 px-4 text-xs font-medium"
              >
                Войти
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="btn-brand-blue h-9 px-4 text-xs font-semibold"
              >
                Регистрация
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
