import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { User, UserRole } from '../types/auth';

interface AuthScreenProps {
  onSuccess: (user: User, targetScreen: 'live' | 'student') => void;
  onBackToLanding: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
}

interface DemoAccount {
  id: string;
  name: string;
  role: UserRole;
  org: string;
  discipline: string;
  initials: string;
}

const DEMO_TEACHERS: DemoAccount[] = [
  {
    id: 'teacher-bio',
    name: 'Д-р Аскар Ибраев',
    role: 'teacher',
    org: 'КазНУ им. аль-Фараби',
    discipline: 'Биофизика мембран',
    initials: 'АИ'
  },
  {
    id: 'teacher-cs',
    name: 'Тимур Касымов',
    role: 'teacher',
    org: 'Astana IT University',
    discipline: 'Python & AI Engineering',
    initials: 'ТК'
  },
  {
    id: 'teacher-ielts',
    name: 'Елена Ким',
    role: 'teacher',
    org: 'Lingua Premier',
    discipline: 'IELTS Academic Writing',
    initials: 'ЕК'
  }
];

const DEMO_STUDENTS: DemoAccount[] = [
  {
    id: 'student-1',
    name: 'Алихан Смагулов',
    role: 'student',
    org: 'КазНУ (Группа БФ-22)',
    discipline: 'Биофизика',
    initials: 'АС'
  },
  {
    id: 'student-2',
    name: 'Айгерим Нурланова',
    role: 'student',
    org: 'AITU (Группа CS-21)',
    discipline: 'Computer Science',
    initials: 'АН'
  },
  {
    id: 'student-3',
    name: 'Ернар Маратов',
    role: 'student',
    org: 'Lingua Premier',
    discipline: 'IELTS Pro',
    initials: 'ЕМ'
  }
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onBackToLanding,
  initialMode = 'login',
  initialRole = 'teacher'
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');

  const handleDemoLogin = (account: DemoAccount) => {
    const user: User = {
      id: account.id,
      name: account.name,
      role: account.role,
      org_id: account.org,
      email: `${account.id}@fill.ai`
    };
    onSuccess(user, account.role === 'teacher' ? 'live' : 'student');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fullName.trim() || (selectedRole === 'teacher' ? 'Преподаватель FILL AI' : 'Студент FILL AI');
    const user: User = {
      id: `user-${Date.now()}`,
      name: finalName,
      role: selectedRole,
      org_id: organization.trim() || 'Пилотный Университет',
      email: email.trim() || 'demo@fill.ai'
    };
    onSuccess(user, selectedRole === 'teacher' ? 'live' : 'student');
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#111318] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Back button */}
      <div className="max-w-md w-full mx-auto mb-6">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-mono-tag text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Вернуться на главную</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#0a0c10] border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2A46C7] flex items-center justify-center text-white font-display font-black text-sm">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white">FILL AI</span>
                <span className="text-[9px] font-mono-tag px-1.5 py-0.2 bg-[#AEDB00] text-[#111318] font-bold rounded">
                  AUTH
                </span>
              </div>
              <div className="text-[11px] text-white/50 font-mono-tag">
                {authMode === 'login' ? 'Вход в личный кабинет' : 'Регистрация нового пользователя'}
              </div>
            </div>
          </div>
        </div>

        {/* Auth Mode Toggle (Login vs Register) */}
        <div className="grid grid-cols-2 p-1 bg-[#141822] rounded-lg border border-white/10 gap-1 mb-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`py-2 px-3 rounded-md transition-all text-center ${
              authMode === 'login'
                ? 'bg-[#2A46C7] text-white font-semibold shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Вход в систему
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`py-2 px-3 rounded-md transition-all text-center ${
              authMode === 'register'
                ? 'bg-[#2A46C7] text-white font-semibold shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Role Selector Tabs (Teacher vs Student) */}
        <div className="mb-6">
          <label className="text-[10px] font-mono-tag uppercase text-white/50 block mb-2">
            Выберите вашу роль:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                selectedRole === 'teacher'
                  ? 'border-[#2A46C7] bg-[#1a2340] text-white'
                  : 'border-white/10 bg-[#12151c] text-white/60 hover:border-white/20'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${selectedRole === 'teacher' ? 'text-[#AEDB00]' : 'text-white/40'}`} />
              <div>
                <div className="font-semibold">Преподаватель</div>
                <div className="text-[10px] text-white/40">Студия эфира</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                selectedRole === 'student'
                  ? 'border-[#2A46C7] bg-[#1a2340] text-white'
                  : 'border-white/10 bg-[#12151c] text-white/60 hover:border-white/20'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${selectedRole === 'student' ? 'text-[#AEDB00]' : 'text-white/40'}`} />
              <div>
                <div className="font-semibold">Студент / Ученик</div>
                <div className="text-[10px] text-white/40">Плеер лекций</div>
              </div>
            </button>
          </div>
        </div>

        {/* 1-Click Fast Demo Accounts (Best for Fair & Rapid Testing) */}
        <div className="mb-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono-tag uppercase text-white/50">
              Быстрый демо-вход в 1 клик:
            </span>
            <span className="text-[9px] font-mono-tag text-[#AEDB00]">
              ГОТОВЫЕ ПРОФИЛИ
            </span>
          </div>

          <div className="space-y-2">
            {(selectedRole === 'teacher' ? DEMO_TEACHERS : DEMO_STUDENTS).map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleDemoLogin(acc)}
                className="w-full p-2.5 rounded-lg bg-[#141720] border border-white/10 hover:border-[#2A46C7] transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#2A46C7]/30 border border-[#2A46C7]/60 text-white font-mono-tag text-[10px] font-bold flex items-center justify-center">
                    {acc.initials}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-[#AEDB00] transition-colors">
                      {acc.name}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {acc.org} · {acc.discipline}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0a0c10] px-3 font-mono-tag text-[10px] text-white/40 uppercase tracking-wider absolute">
            или введите данные
          </span>
        </div>

        {/* Custom Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="text-[10px] font-mono-tag uppercase text-white/50 block mb-1">
                ФИО пользователя
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={selectedRole === 'teacher' ? 'Проф. Аскар Ибраев' : 'Алихан Смагулов'}
                className="w-full bg-[#12151c] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7]"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-mono-tag uppercase text-white/50 block mb-1">
              Электронная почта
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.kz"
              className="w-full bg-[#12151c] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7]"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono-tag uppercase text-white/50 block mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#12151c] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7]"
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="text-[10px] font-mono-tag uppercase text-white/50 block mb-1">
                Учебное заведение / Организация
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="КазНУ им. аль-Фараби"
                className="w-full bg-[#12151c] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7]"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-brand-blue h-10 text-xs font-semibold flex items-center justify-center gap-2 mt-4"
          >
            <span>{authMode === 'login' ? 'Войти в кабинет' : 'Завершить регистрацию'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[10px] font-mono-tag text-white/40">
          <ShieldCheck className="w-3.5 h-3.5 text-[#AEDB00]" />
          <span>Защищенный шлюз · Соответствует стандартам МОН РК</span>
        </div>

      </div>

    </div>
  );
};
