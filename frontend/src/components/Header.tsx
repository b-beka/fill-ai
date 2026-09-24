import React from 'react';
import { Server, LogOut, ChevronDown, GraduationCap, BookOpen, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types/auth';

export type ScreenId = 'landing' | 'live' | 'student' | 'manager';

interface HeaderProps {
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  isBackendConnected: boolean;
  currentUser: User | null;
  onOpenAuth: (role?: UserRole) => void;
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
  return (
    <header className="sticky top-0 z-40 bg-[#07080a] border-b border-white/10 px-4 sm:px-8 h-[60px] flex items-center">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo with Solid #2A46C7 & #AEDB00 */}
        <div 
          onClick={() => onScreenChange('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none flex-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2A46C7] flex items-center justify-center text-white font-display font-black text-sm tracking-wider shadow-sm">
            F
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm tracking-tight text-white">
                FILL AI
              </span>
              <span className="text-[9px] font-mono-tag px-1.5 py-0.2 bg-[#AEDB00] text-[#111318] font-bold rounded">
                LIVE
              </span>
            </div>
            <span className="text-[10px] font-mono-tag text-white/40 tracking-wider">
              CONTENT SWAP ENGINE
            </span>
          </div>
        </div>

        {/* Center: Clean Architectural Nav Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => onScreenChange('landing')}
            className={`nav-tab ${currentScreen === 'landing' ? 'active' : ''}`}
          >
            Главная
          </button>

          <button
            onClick={() => onScreenChange('live')}
            className={`nav-tab ${currentScreen === 'live' ? 'active' : ''}`}
          >
            <GraduationCap className="w-4 h-4 text-white/60" />
            <span className="hidden sm:inline">Кабинет преподавателя</span>
            <span className="sm:hidden">Преподаватель</span>
          </button>

          <button
            onClick={() => onScreenChange('student')}
            className={`nav-tab ${currentScreen === 'student' ? 'active' : ''}`}
          >
            <BookOpen className="w-4 h-4 text-white/60" />
            <span className="hidden sm:inline">Кабинет ученика</span>
            <span className="sm:hidden">Ученик</span>
          </button>

          <button
            onClick={() => onScreenChange('manager')}
            className={`nav-tab ${currentScreen === 'manager' ? 'active' : ''}`}
            title="FastAPI Lessons & SSE Pipeline"
          >
            <Server className="w-3.5 h-3.5 text-white/50" />
            <span className="hidden md:inline">API</span>
          </button>
        </div>

        {/* Right: Status & Auth */}
        <div className="flex items-center gap-3 flex-none justify-end">
          {/* Connection status */}
          <div 
            onClick={() => onScreenChange('manager')}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151b] border border-white/10 text-xs text-white/60 cursor-pointer font-mono-tag"
            title={isBackendConnected ? 'FastAPI 8000 подключен' : 'Локальный режим'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isBackendConnected ? 'FastAPI: 8000' : 'Демо'}</span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div 
                onClick={() => onOpenAuth(currentUser.role)}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#14171e] border border-white/15 text-xs text-white hover:border-white/35 transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-white/60" />
                <span className="font-medium text-white truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-white/40 uppercase font-mono-tag">
                  {currentUser.role === 'teacher' ? 'Преподаватель' : 'Ученик'}
                </span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 rounded text-white/50 hover:text-white transition-colors"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('teacher')}
              className="btn-solid text-xs h-8 px-3.5"
            >
              Войти
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
