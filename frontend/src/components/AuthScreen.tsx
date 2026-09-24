import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { id: 'teacher-bio', name: 'Д-р Аскар Ибраев', role: 'teacher', org: 'КазНУ им. аль-Фараби', discipline: 'Биофизика мембран', initials: 'АИ' },
  { id: 'teacher-cs',  name: 'Тимур Касымов',   role: 'teacher', org: 'Astana IT University', discipline: 'Python & AI Engineering', initials: 'ТК' },
  { id: 'teacher-lng', name: 'Елена Ким',        role: 'teacher', org: 'Lingua Premier',       discipline: 'IELTS Academic Writing',  initials: 'ЕК' },
];

const DEMO_STUDENTS: DemoAccount[] = [
  { id: 'student-1', name: 'Алихан Смагулов',  role: 'student', org: 'КазНУ (Группа БФ-22)',  discipline: 'Биофизика',        initials: 'АС' },
  { id: 'student-2', name: 'Айгерим Нурланова', role: 'student', org: 'AITU (Группа CS-21)',   discipline: 'Computer Science', initials: 'АН' },
  { id: 'student-3', name: 'Ернар Маратов',    role: 'student', org: 'Lingua Premier',        discipline: 'IELTS Pro',        initials: 'ЕМ' },
];

const TEACHER_FEATURES = [
  'Управление живым эфиром лекции',
  'Мгновенные квизы для аудитории',
  'Аналитика посещаемости по темам',
  'Экспорт конспекта и карточек Anki',
  'AI-синтез формул из речи < 800 мс',
];

const STUDENT_FEATURES = [
  'Конспект в реальном времени',
  'Участие в интерактивных квизах',
  'Кнопка «Что я пропустил?»',
  'LaTeX формулы и слайды синхронно',
  'История всех пройденных уроков',
];

type Step = 'role' | 'form';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onBackToLanding,
  initialMode = 'login',
  initialRole = 'teacher',
}) => {
  const [step, setStep]           = useState<Step>('role');
  const [authMode, setAuthMode]   = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [showDemos, setShowDemos] = useState(false);

  // Form fields
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [organization, setOrganization] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('form');
  };

  const handleDemoLogin = (account: DemoAccount) => {
    const user: User = {
      id: account.id,
      name: account.name,
      role: account.role,
      org_id: account.org,
      email: `${account.id}@fill.ai`,
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
      email: email.trim() || 'demo@fill.ai',
    };
    onSuccess(user, selectedRole === 'teacher' ? 'live' : 'student');
  };

  const roleLabel  = selectedRole === 'teacher' ? 'Преподаватель' : 'Студент';
  const demoAccounts = selectedRole === 'teacher' ? DEMO_TEACHERS : DEMO_STUDENTS;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#111318]">

      {/* ─── LEFT PANEL (desktop) ───────────────────────────────────── */}
      <div className="hidden md:flex md:w-[42%] lg:w-[38%] bg-[#0a0c10] border-r border-white/8 flex-col justify-between p-10 lg:p-14">
        <div>
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 text-xs font-mono-tag text-white/40 hover:text-white/80 transition-colors mb-12"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            НА ГЛАВНУЮ
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#2A46C7] flex items-center justify-center font-display font-black text-lg text-white">
              F
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg tracking-tight">FILL AI</div>
              <div className="text-[10px] font-mono-tag text-white/40 tracking-wider">CONTENT TRANSFORMATION</div>
            </div>
          </div>

          <h2 className="font-display font-bold text-3xl lg:text-4xl text-white leading-tight mb-4">
            Живая трансформация лекционного контента.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed mb-10">
            Интеллектуальная платформа для преподавателей и студентов.
            Превращаем аудиопоток в структурированные конспекты, карточки и тесты в реальном времени.
          </p>

          {/* Role preview */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="text-[10px] font-mono-tag text-white/40 uppercase">
              {selectedRole === 'teacher' ? '— Возможности преподавателя' : '— Возможности студента'}
            </div>
            {(selectedRole === 'teacher' ? TEACHER_FEATURES : STUDENT_FEATURES).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                <Check className="w-3.5 h-3.5 text-[#AEDB00] flex-none" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/8">
          {[
            { val: '84%',    label: 'Экономия\nвремени' },
            { val: '<800',   label: 'МС задержка' },
            { val: '94%',    label: 'Вовлечённость' },
          ].map((s) => (
            <div key={s.val}>
              <div className="font-display font-black text-2xl text-[#2A46C7]">{s.val}</div>
              <div className="font-mono-tag text-[9px] uppercase text-white/50 mt-0.5 whitespace-pre-line leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RIGHT PANEL ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 min-h-screen md:min-h-0">

        {/* Mobile back */}
        <div className="md:hidden w-full max-w-md mb-6">
          <button onClick={onBackToLanding} className="inline-flex items-center gap-2 text-xs font-mono-tag text-white/40 hover:text-white/80 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> НА ГЛАВНУЮ
          </button>
        </div>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ══════════════ STEP 1: ROLE SELECTOR ══════════════ */}
            {step === 'role' && (
              <motion.div
                key="role-step"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8">
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">
                    Выберите вашу роль
                  </h2>
                  <p className="text-sm text-white/50">
                    Интерфейс и функции будут адаптированы под вас.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Teacher card */}
                  <button
                    onClick={() => handleRoleSelect('teacher')}
                    className="w-full text-left p-6 rounded-2xl border-2 border-[#2A46C7] bg-[#2A46C7]/10 hover:bg-[#2A46C7]/18 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-3xl mb-3">🎓</div>
                        <div className="font-display font-bold text-xl text-white mb-1">Я преподаватель</div>
                        <div className="text-sm text-white/60 mb-4">
                          Веду уроки, запускаю квизы, смотрю аналитику
                        </div>
                        <div className="space-y-1.5">
                          {TEACHER_FEATURES.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2A46C7] flex-none" />
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#2A46C7] flex items-center justify-center text-white flex-none mt-1 group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </button>

                  {/* Student card */}
                  <button
                    onClick={() => handleRoleSelect('student')}
                    className="w-full text-left p-6 rounded-2xl border-2 border-[#AEDB00]/60 bg-[#AEDB00]/8 hover:bg-[#AEDB00]/14 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-3xl mb-3">📚</div>
                        <div className="font-display font-bold text-xl text-white mb-1">Я студент</div>
                        <div className="text-sm text-white/60 mb-4">
                          Слушаю лекцию, отвечаю на квизы, читаю конспект
                        </div>
                        <div className="space-y-1.5">
                          {STUDENT_FEATURES.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#AEDB00] flex-none" />
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#AEDB00] flex items-center justify-center text-[#111318] flex-none mt-1 group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-8 text-center">
                  <span className="text-xs text-white/30 font-mono-tag">
                    FILL AI · СИНХРОННЫЙ АКАДЕМИЧЕСКИЙ СИНТЕЗ
                  </span>
                </div>
              </motion.div>
            )}

            {/* ══════════════ STEP 2: LOGIN / REGISTER FORM ══════════════ */}
            {step === 'form' && (
              <motion.div
                key="form-step"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                {/* Back to role selector */}
                <button
                  onClick={() => setStep('role')}
                  className="inline-flex items-center gap-2 text-xs font-mono-tag text-white/40 hover:text-white/80 transition-colors mb-6"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Сменить роль
                </button>

                {/* Role badge */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-tag font-bold ${
                    selectedRole === 'teacher'
                      ? 'bg-[#2A46C7]/15 text-[#7B98F5] border border-[#2A46C7]/40'
                      : 'bg-[#AEDB00]/12 text-[#AEDB00] border border-[#AEDB00]/35'
                  }`}>
                    {selectedRole === 'teacher' ? '🎓' : '📚'} {roleLabel}
                  </span>
                </div>

                <div className="mb-7">
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">
                    {authMode === 'login' ? `Войти в FILL AI` : `Создать аккаунт`}
                  </h2>
                  <p className="text-sm text-white/50">
                    {authMode === 'login'
                      ? 'Добро пожаловать назад. Введите ваши данные.'
                      : 'Присоединяйтесь к платформе нового поколения.'}
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-1 mb-7 p-1 bg-white/5 rounded-xl border border-white/8">
                  {(['login', 'register'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAuthMode(m)}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono-tag font-bold transition-all ${
                        authMode === m
                          ? 'bg-[#2A46C7] text-white shadow-md'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {m === 'login' ? 'Войти' : 'Регистрация'}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {authMode === 'register' && (
                    <div className="space-y-1">
                      <label className="font-mono-tag text-[10px] uppercase text-white/40">Полное имя</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-transparent border-b border-white/15 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#2A46C7] transition-colors"
                        placeholder="Имя Фамилия"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-mono-tag text-[10px] uppercase text-white/40">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-white/15 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#2A46C7] transition-colors"
                      placeholder="email@university.edu"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="font-mono-tag text-[10px] uppercase text-white/40">Пароль</label>
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
                      className="w-full bg-transparent border-b border-white/15 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#2A46C7] transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div className="space-y-1">
                      <label className="font-mono-tag text-[10px] uppercase text-white/40">Организация</label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="w-full bg-transparent border-b border-white/15 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#2A46C7] transition-colors"
                        placeholder="Университет / Школа"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full btn-brand-blue h-12 text-sm font-semibold mt-2 flex items-center justify-center gap-2"
                  >
                    {authMode === 'login' ? 'Войти в систему' : 'Создать аккаунт'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Demo accounts */}
                <div className="mt-8 pt-6 border-t border-white/8">
                  <button
                    onClick={() => setShowDemos(!showDemos)}
                    className="flex items-center gap-2 text-xs font-mono-tag text-white/40 hover:text-white/70 transition-colors w-full"
                  >
                    <span className="flex-1 text-left">Быстрый демо-вход ({roleLabel})</span>
                    {showDemos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showDemos && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 space-y-2 overflow-hidden"
                    >
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => handleDemoLogin(acc)}
                          className="w-full flex items-center justify-between p-3 bg-white/4 hover:bg-white/8 rounded-xl border border-white/8 hover:border-white/15 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg font-mono-tag text-xs font-bold flex items-center justify-center flex-none ${
                              selectedRole === 'teacher'
                                ? 'bg-[#2A46C7]/20 text-[#7B98F5]'
                                : 'bg-[#AEDB00]/15 text-[#AEDB00]'
                            }`}>
                              {acc.initials}
                            </div>
                            <div className="text-left">
                              <div className="text-sm text-white group-hover:text-[#AEDB00] transition-colors">{acc.name}</div>
                              <div className="text-[10px] font-mono-tag text-white/35">{acc.org} · {acc.discipline}</div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
