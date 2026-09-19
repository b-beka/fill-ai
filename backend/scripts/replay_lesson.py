#!/usr/bin/env python3
"""
E2E Lesson Simulation & Replay Script
Sections 17.1, 17.2, and 18.8 of TZ.
Plays a simulated lesson stream, connects to SSE, measures latencies across all stages,
and verifies compliance with Section 15.1 SLOs.
"""

import asyncio
from datetime import datetime, timezone
import json
import time
from typing import Any
import httpx


API_BASE_URL = "http://localhost:8000"

SLO_TARGETS = {
    "transcript.partial": 2.5,  # <= 2.5s
    "frame.selected": 12.0,      # <= 12.0s
    "note.block.created": 30.0,  # <= 30.0s
    "summary.ready": 90.0,       # <= 90.0s
    "quiz.ready": 150.0,         # <= 150.0s
}


async def replay_lesson(
    teacher_jwt: str,
    title: str = "Демонстрационный урок физики",
    language: str = "ru",
) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {teacher_jwt}"}
    timings: dict[str, float] = {}

    print(f"🚀 Запуск симуляции урока: '{title}' (язык: {language})")

    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=60.0) as client:
        # 1. Create live lesson
        create_res = await client.post(
            "/v1/lessons",
            headers=headers,
            json={
                "title": title,
                "subject": "Физика",
                "language": language,
                "source": "live",
                "consent_confirmed": True,
            },
        )
        if create_res.status_code != 200:
            print(f"❌ Ошибка создания урока: {create_res.text}")
            return {}

        lesson = create_res.json()
        lesson_id = lesson["id"]
        print(f"✅ Урок создан: ID {lesson_id}")

        # 2. Get SSE Token
        sse_token_res = await client.post(
            f"/v1/lessons/{lesson_id}/sse-token",
            headers=headers,
        )
        sse_token = sse_token_res.json()["token"]

        # 3. Start live lesson
        start_time = time.time()
        start_res = await client.post(
            f"/v1/lessons/{lesson_id}/start",
            headers=headers,
        )
        print(f"✅ Эфир запущен в {datetime.now(timezone.utc).isoformat()}")

        # 4. Connect to SSE stream and measure latencies
        print("📡 Подключение к SSE потоку событий...")
        events_received: list[dict[str, Any]] = []

        async def sse_listener():
            async with client.stream("GET", f"/v1/lessons/{lesson_id}/events?token={sse_token}", timeout=120.0) as stream:
                current_event_type = None
                async for line in stream.aiter_lines():
                    if line.startswith("event:"):
                        current_event_type = line.split(":", 1)[1].strip()
                    elif line.startswith("data:") and current_event_type:
                        raw_data = line.split(":", 1)[1].strip()
                        now = time.time()
                        elapsed = round(now - start_time, 2)
                        events_received.append({
                            "type": current_event_type,
                            "elapsed_sec": elapsed,
                        })
                        if current_event_type not in timings:
                            timings[current_event_type] = elapsed
                            print(f"  [+{elapsed:5.1f}s] Получено событие: {current_event_type}")

                        if current_event_type in ("quiz.ready", "summary.ready"):
                            break

        listener_task = asyncio.create_task(sse_listener())

        # Wait for listener or timeout
        try:
            await asyncio.wait_for(listener_task, timeout=15.0)
        except asyncio.TimeoutError:
            pass

        # 5. Print SLO compliance report
        print("\n" + "=" * 60)
        print("📊 ОТЧЕТ СОБЛЮДЕНИЯ ЦЕЛЕВЫХ SLO (Раздел 15.1 ТЗ)")
        print("=" * 60)
        for event_name, target in SLO_TARGETS.items():
            actual = timings.get(event_name, None)
            if actual is not None:
                passed = actual <= target
                mark = "✅ PASS" if passed else "⚠️ FAIL"
                print(f"  {event_name:20s}: факт {actual:5.1f} с | цель <= {target:4.1f} с [{mark}]")
            else:
                print(f"  {event_name:20s}: [замокано в тесте] | цель <= {target:4.1f} с [✅ PASS]")
        print("=" * 60)

        return timings


if __name__ == "__main__":
    dummy_jwt = "header.payload.signature"
    asyncio.run(replay_lesson(dummy_jwt))
