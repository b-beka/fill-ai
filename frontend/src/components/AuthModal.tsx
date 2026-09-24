import React, { useState } from 'react';
import { 
  X, 
  ArrowRight
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
  avatarSeed: string;
}

const TEACHER_PROFILES: DemoProfile[] = [
  {
    id: 'teacher-bio',
    name: 'Д-р Аскар Ибраев',
    role: 'teacher',
    org_id: 'org-kaznu',
    discipline: 'Биофизика мембран',
    avatarSeed: 'АИ'
  },
  {
    id: 'teacher-cs',
    name: 'Тимур Касымов',
    role: 'teacher',
    org_id: 'org-aitu',
    discipline: 'Python & AI Engineering',
    avatarSeed: 'ТК'
  },
  {
    id: 'teacher-ielts',
    name: 'Елена Ким',
    role: 'teacher',
    org_id: 'org-lingua',
    discipline: 'IELTS Academic Writing',
    avatarSeed: 'ЕК'
  }
];

const STUDENT_PROFILES: DemoProfile[] = [
  {
    id: 'student-1',
    name: 'Алихан Смагулов',
    role: 'student',
    org_id: 'org-kaznu',
    discipline: 'Группа БФ-22',
    avatarSeed: 'АС'
  },
  {
    id: 'student-2',
    name: 'Айгерим Нурланова',
    role: 'student',
    org_id: 'org-aitu',
    discipline: 'Группа CS-21',
    avatarSeed: 'АН'
  },
  {
    id: 'student-3',
    name: 'Ернар Маратов',
    role: 'student',
    org_id: 'org-lingua',
    discipline: 'Группа IELTS-Pro',
    avatarSeed: 'ЕМ'
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
      org_id: 'demo-school',
      email: `${customName.toLowerCase().replace(/\s+/g, '.')}@fill.ai`
    };
    onSelectUser(user, selectedRole === 'teacher' ? 'live' : 'student');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* ECHOID-Style Minimalist Pure Glass Card */}
      <div 
        className="relative w-full max-w-lg bg-[#0a0c10] border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col gap-6 text-white"
        style={{
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="echoid-tag inline-block mb-2">
              ВХОД В СИСТЕМУ
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-normal text-white">
              Авторизация в FILL AI
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Выберите готовую демо-персону в 1 клик или введите ваше имя
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Role Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#13161c] rounded-xl border border-white/10 gap-1 font-display text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setSelectedRole('teacher')}
            className={`py-2.5 px-3 rounded-lg font-medium transition-all ${
              selectedRole === 'teacher'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Преподаватель
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`py-2.5 px-3 rounded-lg font-medium transition-all ${
              selectedRole === 'student'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Студент / Ученик
          </button>
        </div>

        {/* Fast Demo Profiles (Clean 1-Click Cards) */}
        <div>
          <span className="font-mono-tag text-[10px] text-white/40 uppercase block mb-2.5">
            Быстрый вход в 1 клик:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {currentProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProfileClick(p)}
                className="p-3 rounded-xl bg-[#12151b] border border-white/10 hover:border-white/30 transition-all text-left flex flex-col justify-between gap-2 group hover:bg-[#181c24]"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-md bg-white/10 text-[10px] font-mono-tag text-white flex items-center justify-center font-bold">
                    {p.avatarSeed}
                  </span>
                  <span className="text-[9px] font-mono-tag text-emerald-400">
                    ДЕМО
                  </span>
                </div>
                <div>
                  <div className="font-display font-medium text-xs text-white truncate">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-white/50 truncate">
                    {p.discipline}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0a0c10] px-3 font-mono-tag text-[10px] text-white/40 uppercase tracking-wider absolute">
            или
          </span>
        </div>

        {/* Custom Name Input (ECHOID Bottom-Border Transparent Input) */}
        <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-mono-tag text-[10px] uppercase text-white/40 block mb-1">
              Ваше имя
            </label>
            <input
              type="text"
              placeholder={selectedRole === 'teacher' ? 'Напр.: Проф. Ахметов' : 'Напр.: Данияр С.'}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-2 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-white/50 hover:text-white"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={!customName.trim()}
              className="btn-liquid-solid text-xs h-9 px-5 disabled:opacity-40 flex items-center gap-1.5"
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
