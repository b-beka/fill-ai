import React, { useState } from 'react';
import { Logo } from './ui/Logo';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Chip } from './ui/Chip';
import { Stamp } from './ui/Stamp';
import { Ruler } from './ui/Ruler';
import { CircleBadge } from './ui/CircleBadge';
import { NotebookBackground } from './ui/NotebookBackground';
import { Marginalia } from './ui/Marginalia';
import { RedPenUnderline } from './ui/RedPenUnderline';
import * as Icons from './ui/Icons';

interface DevKitProps {
  onBackToApp: () => void;
}

export const DevKit: React.FC<DevKitProps> = ({ onBackToApp }) => {
  const [theme, setTheme] = useState<'paper' | 'board'>('paper');
  const [inputValue, setInputValue] = useState('Трансмембранный потенциал');

  const isBoard = theme === 'board';

  return (
    <div data-theme={theme} className={isBoard ? 'bg-board text-chalk min-h-screen' : 'bg-paper text-ink min-h-screen'}>
      <NotebookBackground theme={theme} className="min-h-screen py-10 px-4 sm:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Top Bar with Mode Toggle & Back Button */}
          <div className="flex flex-wrap items-center justify-between border-b-2 border-current pb-6 gap-4">
            <div className="flex items-center gap-4">
              <Logo size="lg" />
              <div className="border-l-2 border-current pl-4">
                <h1 className="font-heading font-black text-xl">Витрина компонентов (/dev/kit)</h1>
                <p className="font-body text-xs opacity-60">Дизайн-система: «Тетрадь · Линейка · Круги»</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <Button
                variant={isBoard ? 'sun' : 'primary'}
                size="sm"
                onClick={() => setTheme(isBoard ? 'paper' : 'board')}
                icon={isBoard ? <Icons.IconSun className="w-4 h-4" /> : <Icons.IconMoon className="w-4 h-4" />}
              >
                Режим: {isBoard ? '«Доска» (эфир)' : '«Тетрадь» (светлый)'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onBackToApp}
                icon={<Icons.IconArrowLeft className="w-4 h-4" />}
                iconPosition="left"
              >
                В приложение
              </Button>
            </div>
          </div>

          {/* 1. Логотип и брендинг */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <span>01.</span>
              <span>Бренд-сигнатура: Круги FILL</span>
            </h2>
            <Card variant={isBoard ? 'board' : 'paper'} className="flex flex-wrap items-center gap-8">
              <Logo size="sm" />
              <Logo size="md" />
              <Logo size="lg" />
            </Card>
          </section>

          {/* 2. Линейки */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <span>02.</span>
              <span>Бренд-сигнатура: Измерительная линейка</span>
            </h2>
            <div className="space-y-3">
              <Ruler theme={theme} length={16} unitLabel="см" />
              <Ruler theme="sun" length={16} unitLabel="мм" />
            </div>
          </section>

          {/* 3. Кнопки (Тактильный нео-брутализм с жесткой тенью) */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <span>03.</span>
              <span>Тактильные кнопки (Вдавливание при клике)</span>
            </h2>
            <Card variant={isBoard ? 'board' : 'paper'} className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Кнопка Primary (Синий)</Button>
              <Button variant="sun">Кнопка Sun (Желтый)</Button>
              <Button variant="paper">Кнопка Paper (Бумага)</Button>
              <Button variant="danger">Кнопка Danger (Отказ)</Button>
              <Button variant="outline">Контурная кнопка</Button>
              <Button variant="ghost">Ghost кнопка</Button>
              <Button variant="primary" icon={<Icons.IconArrowRight className="w-4 h-4" />}>
                С иконкой
              </Button>
            </Card>
          </section>

          {/* 4. Поля ввода (Тетрадные строки с маркером и красной ручкой) */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <span>04.</span>
              <span>Поля ввода (Тетрадные строки)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant={isBoard ? 'board' : 'paper'}>
                <Input
                  label="Тема занятия"
                  hint="Как в учебном плане"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Введите название темы"
                />
              </Card>

              <Card variant={isBoard ? 'board' : 'paper'}>
                <Input
                  label="Электронная почта преподавателя"
                  value="prof.askar"
                  error="Неверный формат адреса: укажите @university.kz"
                  placeholder="user@university.kz"
                />
              </Card>
            </div>
          </section>

          {/* 5. Карточки, Штампы и Бейджи */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <span>05.</span>
              <span>Карточки, круглые бейджи и штампы учителя</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="paper" hoverLift>
                <div className="text-xs font-heading font-bold opacity-60">Карточка Paper</div>
                <div className="text-xl font-heading font-black mt-2">84%</div>
                <p className="text-xs mt-1 opacity-70">Экономия времени лектора</p>
              </Card>

              <Card variant="sun" hoverLift>
                <div className="text-xs font-heading font-bold opacity-60">Карточка Sun</div>
                <div className="text-xl font-heading font-black mt-2">&lt; 800 мс</div>
                <p className="text-xs mt-1 opacity-70">Синтез формул в KaTeX</p>
              </Card>

              <Card variant="sky" hoverLift>
                <div className="text-xs font-heading font-bold opacity-60">Карточка Sky</div>
                <div className="text-xl font-heading font-black mt-2">28 студ.</div>
                <p className="text-xs mt-1 opacity-70">Вовлеченность в аудитории</p>
              </Card>

              <Card variant="blue" hoverLift>
                <div className="text-xs font-heading font-bold opacity-80">Карточка Blue</div>
                <div className="text-xl font-heading font-black mt-2">0 сек</div>
                <p className="text-xs mt-1 opacity-80">Запуск опроса со смартфона</p>
              </Card>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              <Stamp label="ПРОВЕРЕНО" variant="green" />
              <Stamp label="ДЕМО-ВЕРСИЯ" variant="red" rotate={5} />
              <Stamp label="ОДОБРЕНО КАФЕДРОЙ" variant="blue" rotate={-8} />
              <CircleBadge value="94%" label="Фокус группы" variant="sun" size="lg" />
              <CircleBadge value="АИ" label="Проф. Ибраев" variant="blue" size="md" />
              <CircleBadge value="01" label="Шаг урока" variant="sky" size="sm" />
            </div>
          </section>

          {/* 6. Пометки на полях и подчеркивания */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <span>06.</span>
              <span>«Красная ручка» учителя: пометки на полях</span>
            </h2>
            <Card variant={isBoard ? 'board' : 'paper'} className="space-y-6">
              <div className="flex flex-wrap items-center gap-8">
                <Marginalia arrowDirection="right-down" color="red">
                  Тут формула Гольдмана!
                </Marginalia>

                <Marginalia arrowDirection="down" color="blue" rotate={2}>
                  Важно к коллоквиуму
                </Marginalia>

                <Marginalia arrowDirection="left-down" color="ink" rotate={-4}>
                  Синхронная запись
                </Marginalia>
              </div>

              <div className="text-lg font-body leading-relaxed">
                На лекции студенты часто упускают главное, поэтому{' '}
                <RedPenUnderline color="red">формулы и ключевые тезисы</RedPenUnderline>{' '}
                выписываются в конспект синхронно с{' '}
                <RedPenUnderline color="sun">живой речью преподавателя</RedPenUnderline>.
              </div>
            </Card>
          </section>

          {/* 7. Собственный SVG-набор школьных предметов */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <span>07.</span>
              <span>Авторские школьные иллюстрации (Чернила 2px + сбитая приводка)</span>
            </h2>
            <Card variant={isBoard ? 'board' : 'paper'}>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Icons.IconCompass className="w-12 h-12" withBackdrop backdropColor="sun" />
                  <span className="font-body text-[11px] font-bold">Циркуль</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconFlask className="w-12 h-12" withBackdrop backdropColor="sky" />
                  <span className="font-body text-[11px] font-bold">Колба</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconAtom className="w-12 h-12" withBackdrop backdropColor="sun" />
                  <span className="font-body text-[11px] font-bold">Атом</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconMicroscope className="w-12 h-12" withBackdrop backdropColor="sky" />
                  <span className="font-body text-[11px] font-bold">Микроскоп</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconDna className="w-12 h-12" withBackdrop backdropColor="sun" />
                  <span className="font-body text-[11px] font-bold">ДНК</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconTriangleRuler className="w-12 h-12" withBackdrop backdropColor="sky" />
                  <span className="font-body text-[11px] font-bold">Угольник</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconProtractor className="w-12 h-12" withBackdrop backdropColor="sun" />
                  <span className="font-body text-[11px] font-bold">Транспортир</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconBook className="w-12 h-12" withBackdrop backdropColor="sky" />
                  <span className="font-body text-[11px] font-bold">Книга</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconPencil className="w-12 h-12" withBackdrop backdropColor="sun" />
                  <span className="font-body text-[11px] font-bold">Карандаш</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconCalculator className="w-12 h-12" withBackdrop backdropColor="sky" />
                  <span className="font-body text-[11px] font-bold">Калькулятор</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconSineWave className="w-12 h-12" withBackdrop backdropColor="sun" />
                  <span className="font-body text-[11px] font-bold">Синусоида</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconBenzene className="w-12 h-12" withBackdrop backdropColor="sky" />
                  <span className="font-body text-[11px] font-bold">Бензол</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Icons.IconPythagoras className="w-12 h-12" withBackdrop backdropColor="sun" />
                  <span className="font-body text-[11px] font-bold">Пифагор</span>
                </div>
              </div>
            </Card>
          </section>

          {/* 8. Таблетки-чипы */}
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <span>08.</span>
              <span>Таблетки-чипы (Chips)</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Chip variant="sun">Синхронный конспект</Chip>
              <Chip variant="sky">Формулы KaTeX</Chip>
              <Chip variant="blue">Опросы аудитории</Chip>
              <Chip variant="green">Проверено</Chip>
              <Chip variant="red">Ошибка</Chip>
              <Chip variant="paper">КазНУ · AITU · NU</Chip>
            </div>
          </section>

        </div>
      </NotebookBackground>
    </div>
  );
};
