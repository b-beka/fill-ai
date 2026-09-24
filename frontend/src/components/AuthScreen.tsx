import React, { useState } from 'react';
import { 
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp
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
  const [showDemos, setShowDemos] = useState(false);
  
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
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      
      {/* LEFT SIDE - Brand Showcase */}
      <div className="w-full md:w-1/2 bg-[#F5F2E8] text-[#111318] p-8 md:p-16 flex flex-col justify-between">
        <div>
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 text-xs font-mono-tag text-[#111318]/60 hover:text-[#111318] transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>НА ГЛАВНУЮ</span>
          </button>

          <h1 className="font-display font-black text-5xl md:text-7xl leading-tight mb-8">
            FILL AI.
          </h1>
          
          <div className="space-y-6 max-w-md">
            <h2 className="font-display text-xl md:text-2xl font-bold">
              Живая трансформация лекционного контента.
            </h2>
            
            <div className="font-mono-tag text-sm bg-[#111318] text-[#AEDB00] inline-block px-3 py-1.5 rounded-sm">
              SOURCE → FILL AI → TRANSFORMED
            </div>
            
            <p className="font-body text-base text-[#111318]/80 leading-relaxed">
              Интеллектуальная платформа для преподавателей и студентов. 
              Превращаем сырой аудиопоток в структурированные конспекты, карточки и тесты в реальном времени.
            </p>
          </div>
        </div>

        <div className="mt-16 md:mt-0 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[#111318]/10">
          <div>
            <div className="font-display font-black text-3xl text-[#2A46C7] mb-1">84%</div>
            <div className="font-mono-tag text-[10px] uppercase text-[#111318]/70">Экономия времени</div>
          </div>
          <div>
            <div className="font-display font-black text-3xl text-[#2A46C7] mb-1">&lt;800</div>
            <div className="font-mono-tag text-[10px] uppercase text-[#111318]/70">МС Задержка</div>
          </div>
          <div>
            <div className="font-display font-black text-3xl text-[#2A46C7] mb-1">94%</div>
            <div className="font-mono-tag text-[10px] uppercase text-[#111318]/70">Вовлеченность</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="w-full md:w-1/2 bg-[#111318] text-white flex flex-col justify-center items-center p-8 md:p-16">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <div className="w-10 h-10 bg-[#2A46C7] rounded-sm flex items-center justify-center font-display font-black text-lg mb-6">
              F
            </div>
            <h2 className="font-display text-3xl font-bold mb-2">
              {authMode === 'login' ? 'Войти в FILL AI' : 'Создать аккаунт'}
            </h2>
            <p className="font-body text-sm text-white/60">
              {authMode === 'login' 
                ? 'Добро пожаловать назад. Пожалуйста, введите ваши данные.'
                : 'Присоединяйтесь к платформе нового поколения.'}
            </p>
          </div>

          <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
            <button
              onClick={() => setSelectedRole('teacher')}
              className={`font-mono-tag text-xs uppercase px-4 py-2 rounded-sm transition-colors ${
                selectedRole === 'teacher' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Преподаватель
            </button>
            <button
              onClick={() => setSelectedRole('student')}
              className={`font-mono-tag text-xs uppercase px-4 py-2 rounded-sm transition-colors ${
                selectedRole === 'student' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Студент
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="font-mono-tag text-[10px] uppercase text-white/50">Полное имя</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7] transition-colors font-body rounded-none"
                  placeholder="Иван Иванов"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-mono-tag text-[10px] uppercase text-white/50">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7] transition-colors font-body rounded-none"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-mono-tag text-[10px] uppercase text-white/50">Пароль</label>
                {authMode === 'login' && (
                  <button type="button" className="font-mono-tag text-[10px] text-[#AEDB00] hover:underline">
                    Забыли пароль?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7] transition-colors font-body rounded-none"
                placeholder="••••••••"
              />
            </div>

            {authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="font-mono-tag text-[10px] uppercase text-white/50">Организация</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#2A46C7] transition-colors font-body rounded-none"
                  placeholder="Университет / Школа"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#2A46C7] hover:bg-[#3451D8] text-white font-mono-tag text-xs uppercase tracking-wider py-4 rounded-sm transition-colors mt-6 flex justify-center items-center gap-2"
            >
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="font-mono-tag text-[10px] text-white/50 hover:text-white transition-colors"
            >
              {authMode === 'login' 
                ? 'Нет аккаунта? Зарегистрироваться' 
                : 'Уже есть аккаунт? Войти'}
            </button>
          </div>

          <div className="mt-12">
            <button 
              onClick={() => setShowDemos(!showDemos)}
              className="flex items-center gap-2 font-mono-tag text-[10px] uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              Быстрый демо-вход
              {showDemos ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {showDemos && (
              <div className="mt-4 space-y-2">
                {(selectedRole === 'teacher' ? DEMO_TEACHERS : DEMO_STUDENTS).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleDemoLogin(acc)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-sm transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#2A46C7]/20 text-[#2A46C7] font-mono-tag text-xs font-bold flex items-center justify-center rounded-sm">
                        {acc.initials}
                      </div>
                      <div className="text-left">
                        <div className="font-body text-sm text-white group-hover:text-[#AEDB00] transition-colors">{acc.name}</div>
                        <div className="font-mono-tag text-[9px] text-white/40 uppercase">{acc.org}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
