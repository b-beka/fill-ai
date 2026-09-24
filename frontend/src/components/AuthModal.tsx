import React, { useState } from 'react';
import { 
  X, 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Radio,
  Layers
} from 'lucide-react';
import { User, UserRole } from '../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User, targetScreen?: 'live' | 'student') => void;
  initialRole?: UserRole;
}

interface DemoProfile {
  id: string;
  name: string;
  role: UserRole;
  org_id: string;
  discipline: string;
  groupOrDept: string;
  tag: string;
  avatarSeed: string;
}

const TEACHER_PROFILES: DemoProfile[] = [
  {
    id: 'teacher-bio',
    name: 'Д-р Аскар Ибраев',
    role: 'teacher',
    org_id: 'org-kaznu',
    discipline: 'Биофизика и биомембраны',
    groupOrDept: 'Кафедра биофизики КазНУ',
    tag: 'Слайды + VLM',
    avatarSeed: 'AI'
  },
  {
    id: 'teacher-cs',
    name: 'Тимур Касымов',
    role: 'teacher',
    org_id: 'org-aitu',
    discipline: 'Python & AI Engineering',
    groupOrDept: 'Astana IT University',
    tag: 'Код + LaTeX',
    avatarSeed: 'TK'
  },
  {
    id: 'teacher-ielts',
    name: 'Елена Ким',
    role: 'teacher',
    org_id: 'org-lingua',
    discipline: 'IELTS Academic Writing',
    groupOrDept: 'Lingua Premier Academy',
    tag: 'Аудио ASR',
    avatarSeed: 'EK'
  }
];

const STUDENT_PROFILES: DemoProfile[] = [
  {
    id: 'student-1',
    name: 'Алихан Смагулов',
    role: 'student',
    org_id: 'org-kaznu',
    discipline: 'Биофизика мембран',
    groupOrDept: 'Группа БФ-22',
    tag: 'Онлайн · 96% посещаемость',
    avatarSeed: 'AS'
  },
  {
    id: 'student-2',
    name: 'Айгерим Нурланова',
    role: 'student',
    org_id: 'org-aitu',
    discipline: 'Python & AI',
    groupOrDept: 'Группа CS-21',
    tag: 'Онлайн · Интерактив',
    avatarSeed: 'AN'
  },
  {
    id: 'student-3',
    name: 'Ернар Маратов',
    role: 'student',
    org_id: 'org-lingua',
    discipline: 'IELTS Academic',
    groupOrDept: 'Группа IELTS-Pro',
    tag: 'Смысловой Catch-up',
    avatarSeed: 'EM'
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  initialRole = 'student'
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');

  if (!isOpen) return null;

  const currentProfiles = selectedRole === 'teacher' ? TEACHER_PROFILES : STUDENT_PROFILES;

  const handleProfileClick = (profile: DemoProfile) => {
    const user: User = {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      org_id: profile.org_id,
      email: `${profile.id}@fill.ai`
    };
    onSelectUser(user, profile.role === 'teacher' ? 'live' : 'student');
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const user: User = {
      id: `user-${Date.now()}`,
      name: customName.trim(),
      role: selectedRole,
      org_id: customCode.trim() || 'demo-school',
      email: `${customName.toLowerCase().replace(/\s+/g, '.')}@fill.ai`
    };
    onSelectUser(user, selectedRole === 'teacher' ? 'live' : 'student');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all animate-fadeIn">
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-xl bg-[#090a0c] border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col gap-6 text-white"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Subtle ambient gradient ring */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="liquid-badge text-[11px] py-1 px-2.5">
                <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                Авторизация FILL AI
              </span>
              <span className="text-xs text-white/40 font-mono">v1.2 Live</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-head tracking-tight text-white">
              Выберите роль для входа в систему
            </h2>
            <p className="text-xs sm:text-sm text-[#9a9a9a] mt-1 leading-relaxed">
              Мгновенный вход в демо-профиль в один клик или персональная регистрация
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Role Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-[#14171a] rounded-xl border border-white/10 relative z-10 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedRole('teacher')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-head text-xs sm:text-sm font-semibold transition-all relative ${
              selectedRole === 'teacher'
                ? 'bg-gradient-to-b from-[#242424] to-[#121212] text-white shadow-lg border border-white/20'
                : 'text-[#9a9a9a] hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${selectedRole === 'teacher' ? 'text-white' : 'text-[#9a9a9a]'}`} />
            <span>Преподаватель</span>
            {selectedRole === 'teacher' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-head text-xs sm:text-sm font-semibold transition-all relative ${
              selectedRole === 'student'
                ? 'bg-gradient-to-b from-[#242424] to-[#121212] text-white shadow-lg border border-white/20'
                : 'text-[#9a9a9a] hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${selectedRole === 'student' ? 'text-white' : 'text-[#9a9a9a]'}`} />
            <span>Студент / Ученик</span>
            {selectedRole === 'student' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        </div>

        {/* Role Highlights Subtext */}
        <div className="bg-[#121417] border border-white/10 rounded-xl p-3.5 text-xs text-[#9a9a9a] flex items-center justify-between gap-3 relative z-10">
          {selectedRole === 'teacher' ? (
            <>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 flex-none animate-pulse" />
                <span>Эфирный пульт: захват речи, авто-генерация конспекта и опросников.</span>
              </div>
              <span className="font-mono text-[10px] text-white/50 uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 flex-none">
                Studio View
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400 flex-none" />
                <span>YouTube-формат эфира + живые конспекты и моментальные квизы.</span>
              </div>
              <span className="font-mono text-[10px] text-white/50 uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 flex-none">
                Cinema View
              </span>
            </>
          )}
        </div>

        {/* 1-Click Fast Demo Profiles */}
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            <span>Быстрый вход в 1 клик (Демо-персоны)</span>
            <span>Готовые сценарии</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {currentProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProfileClick(p)}
                className="group p-3 rounded-xl bg-[#111316] border border-white/10 hover:border-white/35 transition-all text-left flex flex-col justify-between gap-2.5 hover:bg-[#181b20] hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-6 h-6 rounded-md bg-white/10 border border-white/15 text-[10px] font-bold text-white flex items-center justify-center font-mono">
                      {p.avatarSeed}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/90 font-medium">
                      Демо
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white group-hover:text-white line-clamp-1">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-[#9a9a9a] line-clamp-1">
                    {p.discipline}
                  </div>
                </div>
                <div className="text-[10px] text-white/40 group-hover:text-white/70 flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="truncate">{p.tag}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform flex-none ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-0.5">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#090a0c] px-3 text-[11px] text-[#6e7681] uppercase tracking-wider absolute">
            или ввести имя
          </span>
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#9a9a9a] mb-1">
                ФИО или никнейм
              </label>
              <input
                type="text"
                placeholder={selectedRole === 'teacher' ? 'Напр.: Проф. Ахметов' : 'Напр.: Данияр С.'}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#13161a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#9a9a9a] mb-1">
                Код группы / Аудитории
              </label>
              <input
                type="text"
                placeholder="Напр.: ROOM-101"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full bg-[#13161a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-liquid-ghost text-xs h-9 px-4"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!customName.trim()}
              className="btn-liquid-solid text-xs h-9 px-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>Войти как {selectedRole === 'teacher' ? 'Преподаватель' : 'Студент'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
