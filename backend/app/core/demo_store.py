import uuid
from datetime import datetime, timezone
from typing import Any
from app.models.attendance import StudentAttendance
from app.models.lesson import Lesson
from app.models.live_task import LiveTask
from app.models.note import NoteBlock
from app.models.slide import LessonSlide

DEMO_ORG_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
DEMO_TEACHER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")

# Fixed IDs for reliable cross-screen linking
BIOLOGY_LESSON_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
IELTS_LESSON_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")
PYTHON_LESSON_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")
BARBER_LESSON_ID = uuid.UUID("66666666-6666-6666-6666-666666666666")


class DemoStore:
    def __init__(self) -> None:
        self.lessons: dict[uuid.UUID, Lesson] = {}
        self.blocks: dict[str, NoteBlock] = {}
        self.slides: dict[uuid.UUID, list[LessonSlide]] = {}
        self.tasks: dict[uuid.UUID, list[LiveTask]] = {}
        self.attendances: dict[uuid.UUID, list[StudentAttendance]] = {}
        self._seed_data()

    def _seed_data(self) -> None:
        now = datetime.now(timezone.utc)

        # 1. Biology Track
        bio = Lesson(
            id=BIOLOGY_LESSON_ID,
            org_id=DEMO_ORG_ID,
            group_id=None,
            teacher_id=DEMO_TEACHER_ID,
            title="Рецепторы и клеточная мембрана",
            subject="Биология (10 класс)",
            language="ru",
            source="live",
            status="active",
            visibility_mode="moderated",
            expected_terms=["мембрана", "рецептор", "лиганд", "фосфолипид", "АТФ"],
            roi=None,
            livekit_room=f"room-{BIOLOGY_LESSON_ID}",
            last_seq=4,
            cost_usd=0.14,
            started_at=now,
            ended_at=None,
            created_at=now,
        )
        self.lessons[bio.id] = bio

        b1_id = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        b1 = NoteBlock(
            id=b1_id,
            lesson_id=bio.id,
            position=0,
            t_start_ms=0,
            t_end_ms=360000,
            title="Строение фосфолипидного бислоя",
            body_md="Основой клеточной мембраны служит двойной слой амфифильных молекул фосфолипидов. Гидрофильные головки ориентированы наружу, контактируя с водной средой цитоплазмы и межклеточного пространства. Гидрофобные хвосты спрятаны внутрь бислоя, обеспечивая барьерную функцию для полярных молекул и ионов.",
            status="approved",
            key_terms=[{"term": "Фосфолипидный бислой", "definition": "Двойной слой амфифильных липидов, формирующий основу биомембран."}],
            callouts=[],
            frame_refs=[],
            version=1,
        )
        self.blocks[str(b1.id)] = b1

        b2_id = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
        b2 = NoteBlock(
            id=b2_id,
            lesson_id=bio.id,
            position=1,
            t_start_ms=360000,
            t_end_ms=780000,
            title="Рецепторные белки на поверхности мембраны",
            body_md="Рецепторы пронизывают бислой и имеют активный центр на внешней стороне. Присоединение сигнальной молекулы (лиганда) вызывает конформационное изменение белка, запускающее каскад вторичных посредников внутри клетки.",
            status="pending_review",
            key_terms=[{"term": "Рецептор", "definition": "Мембранный белок, связывающий лиганд и передающий сигнал внутрь клетки."}],
            callouts=[],
            frame_refs=[],
            version=1,
        )
        self.blocks[str(b2.id)] = b2

        # Live Task for Biology
        task1 = LiveTask(
            id=uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            lesson_id=bio.id,
            question="Какая часть фосфолипида непосредственно контактирует с водным раствором снаружи клетки?",
            kind="single_choice",
            options=[
                {"id": "A", "text": "Гидрофильная полярная головка", "is_correct": True, "percent": 78, "explanation": "Верно! Гидрофильные головки фосфолипидов полярны и контактируют с водой."},
                {"id": "B", "text": "Гидрофобные хвосты жирных кислот", "is_correct": False, "percent": 14, "explanation": "Ошибка: гидрофобные хвосты направлены внутрь бислоя, чтобы избежать контакта с водой."},
                {"id": "C", "text": "Холестериновые мостики", "is_correct": False, "percent": 8, "explanation": "Ошибка: холестерин погружен в толщу мембраны для регуляции ее текучести."},
            ],
            correct_option_id="A",
            status="active",
            time_limit_seconds=30,
            started_at_ms=int(datetime.now(timezone.utc).timestamp() * 1000),
            stats={"answered_count": 28, "total_students": 30},
            ai_commentary="78% класса уверенно усвоили амфифильную структуру мембраны. 14% ошибочно указали хвосты, рекомендуется акцентировать гидрофобный эффект.",
            created_at=now,
        )
        self.tasks[bio.id] = [task1]

        # 2. Python Track
        py_lesson = Lesson(
            id=PYTHON_LESSON_ID,
            org_id=DEMO_ORG_ID,
            group_id=None,
            teacher_id=DEMO_TEACHER_ID,
            title="Асинхронные генераторы и streaming",
            subject="Python / Backend Development",
            language="ru",
            source="live",
            status="active",
            visibility_mode="moderated",
            expected_terms=["async def", "yield", "aiostream", "SSE", "event loop"],
            roi=None,
            livekit_room=f"room-{PYTHON_LESSON_ID}",
            last_seq=2,
            cost_usd=0.15,
            started_at=now,
            ended_at=None,
            created_at=now,
        )
        self.lessons[py_lesson.id] = py_lesson

        # 3. IELTS Track
        ielts = Lesson(
            id=IELTS_LESSON_ID,
            org_id=DEMO_ORG_ID,
            group_id=None,
            teacher_id=DEMO_TEACHER_ID,
            title="IELTS Speaking Part 3: Cohesion & Debate",
            subject="English / Exam Preparation",
            language="en",
            source="live",
            status="active",
            visibility_mode="live",
            expected_terms=["furthermore", "on the other hand", "discourse markers", "fluency"],
            roi=None,
            livekit_room=f"room-{IELTS_LESSON_ID}",
            last_seq=2,
            cost_usd=0.12,
            started_at=now,
            ended_at=None,
            created_at=now,
        )
        self.lessons[ielts.id] = ielts

        # 4. Barbering Track
        barber = Lesson(
            id=BARBER_LESSON_ID,
            org_id=DEMO_ORG_ID,
            group_id=None,
            teacher_id=DEMO_TEACHER_ID,
            title="Фейдинг и тушевка ножницами",
            subject="Парикмахерское искусство",
            language="ru",
            source="live",
            status="active",
            visibility_mode="moderated",
            expected_terms=["фейд", "тушевка", "гайдлайн", "машинка", "сведение"],
            roi=None,
            livekit_room=f"room-{BARBER_LESSON_ID}",
            last_seq=2,
            cost_usd=0.11,
            started_at=now,
            ended_at=None,
            created_at=now,
        )
        self.lessons[barber.id] = barber

        # Seed realistic student attendances for Biology demo
        att1 = StudentAttendance(
            id=uuid.UUID("10000000-0000-0000-0000-000000000001"),
            lesson_id=BIOLOGY_LESSON_ID,
            student_id=uuid.UUID("20000000-0000-0000-0000-000000000001"),
            student_name="Алихан Смагулов",
            status="active",
            joined_at_ms=0,
            left_at_ms=None,
            total_active_ms=42 * 60 * 1000,
            focus_score=0.96,
            intervals=[{"start_ms": 0, "end_ms": 42 * 60 * 1000, "is_focused": True}],
            missed_block_ids=[],
            tasks_answered=1,
            tasks_correct=1,
            catchup_sent=False,
            created_at=now,
            updated_at=now,
        )
        att2 = StudentAttendance(
            id=uuid.UUID("10000000-0000-0000-0000-000000000002"),
            lesson_id=BIOLOGY_LESSON_ID,
            student_id=uuid.UUID("20000000-0000-0000-0000-000000000002"),
            student_name="Айгерим Нурланова",
            status="active",
            joined_at_ms=0,
            left_at_ms=None,
            total_active_ms=40 * 60 * 1000,
            focus_score=0.91,
            intervals=[{"start_ms": 0, "end_ms": 40 * 60 * 1000, "is_focused": True}],
            missed_block_ids=[],
            tasks_answered=1,
            tasks_correct=1,
            catchup_sent=False,
            created_at=now,
            updated_at=now,
        )
        att3 = StudentAttendance(
            id=uuid.UUID("10000000-0000-0000-0000-000000000003"),
            lesson_id=BIOLOGY_LESSON_ID,
            student_id=uuid.UUID("20000000-0000-0000-0000-000000000003"),
            student_name="Данияр Касымов",
            status="active",
            joined_at_ms=10 * 60 * 1000,
            left_at_ms=None,
            total_active_ms=22 * 60 * 1000,
            focus_score=0.58,
            intervals=[
                {"start_ms": 10 * 60 * 1000, "end_ms": 20 * 60 * 1000, "is_focused": False},
                {"start_ms": 30 * 60 * 1000, "end_ms": 42 * 60 * 1000, "is_focused": True},
            ],
            missed_block_ids=[str(b1_id)],
            tasks_answered=1,
            tasks_correct=0,
            catchup_sent=False,
            created_at=now,
            updated_at=now,
        )
        att4 = StudentAttendance(
            id=uuid.UUID("10000000-0000-0000-0000-000000000004"),
            lesson_id=BIOLOGY_LESSON_ID,
            student_id=uuid.UUID("20000000-0000-0000-0000-000000000004"),
            student_name="София Ким",
            status="active",
            joined_at_ms=0,
            left_at_ms=None,
            total_active_ms=43 * 60 * 1000,
            focus_score=0.98,
            intervals=[{"start_ms": 0, "end_ms": 43 * 60 * 1000, "is_focused": True}],
            missed_block_ids=[],
            tasks_answered=1,
            tasks_correct=1,
            catchup_sent=False,
            created_at=now,
            updated_at=now,
        )
        self.attendances[BIOLOGY_LESSON_ID] = [att1, att2, att3, att4]

    def get_lessons(self) -> list[Lesson]:
        return list(self.lessons.values())

    def get_lesson(self, lesson_id: uuid.UUID) -> Lesson | None:
        return self.lessons.get(lesson_id)

    def add_lesson(self, lesson: Lesson) -> Lesson:
        self.lessons[lesson.id] = lesson
        return lesson

    def get_blocks(self, lesson_id: uuid.UUID) -> list[NoteBlock]:
        return [b for b in self.blocks.values() if b.lesson_id == lesson_id]

    def add_block(self, block: NoteBlock) -> NoteBlock:
        self.blocks[str(block.id)] = block
        return block

    def approve_block(self, block_id: str) -> NoteBlock | None:
        block = self.blocks.get(block_id)
        if block:
            block.status = "approved"
        return block

    def get_active_task(self, lesson_id: uuid.UUID) -> LiveTask | None:
        tasks = self.tasks.get(lesson_id, self.tasks.get(BIOLOGY_LESSON_ID, []))
        for t in tasks:
            if t.status == "active":
                return t
        return tasks[0] if tasks else None

    def get_tasks(self, lesson_id: uuid.UUID) -> list[LiveTask]:
        return self.tasks.get(lesson_id, self.tasks.get(BIOLOGY_LESSON_ID, []))

    def get_task(self, task_id: uuid.UUID) -> LiveTask | None:
        for task_list in self.tasks.values():
            for t in task_list:
                if t.id == task_id:
                    return t
        return None

    def add_task(self, task: LiveTask) -> LiveTask:
        if task.lesson_id not in self.tasks:
            self.tasks[task.lesson_id] = []
        self.tasks[task.lesson_id].append(task)
        return task

    def record_task_vote(self, task_id: uuid.UUID, option_id: str | None) -> dict[str, Any]:
        task = self.get_task(task_id)
        if not task:
            return {"is_correct": True, "feedback": "Ответ принят."}
        
        is_correct = (option_id == task.correct_option_id)
        stats = dict(task.stats or {"answered_count": 28, "total_students": 30})
        stats["answered_count"] = min(30, stats.get("answered_count", 0) + 1)
        task.stats = stats

        feedback = "Верно!" if is_correct else "Неверно."
        for opt in (task.options or []):
            if opt.get("id") == option_id and opt.get("explanation"):
                feedback = opt["explanation"]
                break
        return {"is_correct": is_correct, "feedback": feedback}

    def close_task(self, task_id: uuid.UUID) -> LiveTask | None:
        task = self.get_task(task_id)
        if task:
            task.status = "revealed"
            task.closed_at_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
            if not task.ai_commentary:
                task.ai_commentary = "85% класса усвоили материал. Рекомендуется повторить мембранные рецепторы."
        return task

    def get_attendances(self, lesson_id: uuid.UUID) -> list[StudentAttendance]:
        return self.attendances.get(lesson_id, self.attendances.get(BIOLOGY_LESSON_ID, []))


# Global singleton instance for standalone demo mode
demo_store = DemoStore()
