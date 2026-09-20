import { Moon, Sun, Server } from 'lucide-react';

export type ScreenId = 'landing' | 'live' | 'student' | 'manager';

interface HeaderProps {
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  isBackendConnected: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onScreenChange,
  isBackendConnected,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-fill-surface border-b border-fill-border shadow-sm">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-8 h-[60px] flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onScreenChange('landing')}
          className="flex items-center gap-2 font-head font-extrabold text-base tracking-tight text-fill-text cursor-pointer hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5 flex-none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 13.2c1.1 1.4 2.3 2.1 4 2.1s2.9-.7 4-2.1M8.4 9.6h.01M15.6 9.6h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          FILL AI
        </div>

        {/* Center Tabs */}
        <div className="flex gap-0.5 bg-fill-surface-alt p-1 rounded-full overflow-x-auto max-w-full">
          <button
            onClick={() => onScreenChange('landing')}
            aria-selected={currentScreen === 'landing'}
            className={`text-xs sm:text-[13px] font-semibold py-1.5 px-3 sm:px-3.5 rounded-full whitespace-nowrap transition-all ${
              currentScreen === 'landing'
                ? 'bg-fill-surface text-fill-text shadow-sm'
                : 'text-fill-text-muted hover:text-fill-text'
            }`}
          >
            Лендинг
          </button>
          <button
            onClick={() => onScreenChange('live')}
            aria-selected={currentScreen === 'live'}
            className={`text-xs sm:text-[13px] font-semibold py-1.5 px-3 sm:px-3.5 rounded-full whitespace-nowrap transition-all ${
              currentScreen === 'live'
                ? 'bg-fill-surface text-fill-text shadow-sm'
                : 'text-fill-text-muted hover:text-fill-text'
            }`}
          >
            Живой урок · Учитель
          </button>
          <button
            onClick={() => onScreenChange('student')}
            aria-selected={currentScreen === 'student'}
            className={`text-xs sm:text-[13px] font-semibold py-1.5 px-3 sm:px-3.5 rounded-full whitespace-nowrap transition-all ${
              currentScreen === 'student'
                ? 'bg-fill-surface text-fill-text shadow-sm'
                : 'text-fill-text-muted hover:text-fill-text'
            }`}
          >
            Вид ученика
          </button>
          <button
            onClick={() => onScreenChange('manager')}
            aria-selected={currentScreen === 'manager'}
            className={`text-xs sm:text-[13px] font-semibold py-1.5 px-3 sm:px-3.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentScreen === 'manager'
                ? 'bg-fill-surface text-fill-text shadow-sm'
                : 'text-fill-text-muted hover:text-fill-text'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Бэкенд API
          </button>
        </div>

        {/* Right Actions: Status & Theme */}
        <div className="flex items-center gap-3 flex-none">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-fill-text-faint">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-fill-success animate-pulse' : 'bg-fill-warning'}`} />
            {isBackendConnected ? 'FastAPI 8000' : 'Демо'}
          </div>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full text-fill-text-muted hover:text-fill-text hover:bg-fill-surface-alt transition-colors"
            title="Переключить тему"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
