import React from 'react';
import { Server, Sparkles, LogOut, ChevronDown, GraduationCap, BookOpen } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-[#06080b]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 h-[64px] flex items-center transition-colors">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6">
        
        {/* Left: Brand Logo & Title */}
        <div 
          onClick={() => onScreenChange('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none flex-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#14171d] border border-white/20 flex items-center justify-center shadow-sm group-hover:border-white/50 transition-colors">
            {/* Clean SVG mark with -30deg rotated capsules */}
            <svg 
              className="w-5 h-5 text-white" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <g transform="rotate(-30 12 12)">
                <circle cx="7.3" cy="3.2" r="1.45" />
                <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <circle cx="16.7" cy="20.8" r="1.45" />
              </g>
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-display font-semibold text-[15px] tracking-tight text-white flex items-center gap-1.5 leading-none">
              FILL AI
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] text-white/50 font-mono-tag tracking-wider uppercase mt-0.5 hidden sm:block">
              Operational Lecture OS
            </span>
          </div>
        </div>

        {/* Center: Clean Nav Pills (Personal Cabinets) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
          <button
            onClick={() => onScreenChange('landing')}
            className={`composer-chip text-xs ${
              currentScreen === 'landing' ? 'active' : ''
            }`}
          >
            Главная
          </button>

          <button
            onClick={() => onScreenChange('live')}
            className={`composer-chip text-xs ${
              currentScreen === 'live' ? 'active' : ''
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Кабинет преподавателя</span>
            <span className="sm:hidden">Преподаватель</span>
          </button>

          <button
            onClick={() => onScreenChange('student')}
            className={`composer-chip text-xs ${
              currentScreen === 'student' ? 'active' : ''
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Кабинет ученика</span>
            <span className="sm:hidden">Ученик</span>
          </button>

          <button
            onClick={() => onScreenChange('manager')}
            className={`composer-chip text-xs ${
              currentScreen === 'manager' ? 'active' : ''
            }`}
            title="FastAPI Lessons & SSE Pipeline"
          >
            <Server className="w-3 h-3 text-white/50" />
            <span className="hidden md:inline">API Бэкенд</span>
            <span className="md:hidden">API</span>
          </button>
        </div>

        {/* Right: Status Pill & Auth / User Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 flex-none justify-end">
          {/* Backend Connection Live Pill */}
          <div 
            onClick={() => onScreenChange('manager')}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#111317] border border-white/10 text-[11px] text-white/60 cursor-pointer hover:border-white/25 transition-colors font-mono-tag"
            title={isBackendConnected ? 'FastAPI 8000 подключен' : 'Локальный демо-режим'}
          >
            <span 
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
              }`} 
            />
            <span>{isBackendConnected ? 'FastAPI: 8000' : 'Демо'}</span>
          </div>

          {/* User state / Auth Trigger */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div 
                onClick={() => onOpenAuth(currentUser.role)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14171d] border border-white/15 text-xs text-white hover:border-white/35 transition-all cursor-pointer"
                title="Сменить роль или профиль"
              >
                <div className="w-5 h-5 rounded-full bg-white/15 text-[10px] font-bold text-white flex items-center justify-center font-mono-tag">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-medium text-white leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[9.5px] text-white/50 uppercase font-mono-tag leading-none">
                    {currentUser.role === 'teacher' ? 'Преподаватель' : 'Ученик'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('teacher')}
              className="btn-liquid-solid text-xs h-[36px] px-3.5"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-black" />
              <span>Войти в кабинет</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
