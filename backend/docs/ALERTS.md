# Спецификация алертов Prometheus / Alertmanager

Документ описывает правила мониторинга и критические алерты для бэкенда сервиса автоматических конспектов (Раздел 15.4 ТЗ).

---

## 1. Критические алерты (Severity: Critical)

### `DLQMessagesPresent`
- **Описание:** Появление сообщений в очереди недоставленных задач `stream:dlq`.
- **Выражение (PromQL):**
  ```promql
  rate(dlq_messages_total[5m]) > 0
  ```
- **Длительность:** `0m` (немедленно)
- **Действие:** Проверить причину сбоя воркера в логах (`error.notice`), перезапустить упавшие consumer-группы или скорректировать лимиты.

### `BotHeartbeatMissing`
- **Описание:** Медиа-бот урока не передает heartbeat более 20 секунд в активном эфире.
- **Выражение (PromQL):**
  ```promql
  active_lessons_total{source="live"} > 0 and (time() - max by (lesson_id) (bot_last_heartbeat_timestamp_seconds) > 20)
  ```
- **Длительность:** `20s`
- **Действие:** Супервизор watchdog автоматически выполняет рестарт бота и восстанавливает контекст из Postgres. Дежурному инженеру проверить доступность LiveKit SFU.

### `AIProviderErrorRateHigh`
- **Описание:** Доля ошибок вызовов внешних ИИ-провайдеров (Gemini / Soniox / Groq) превышает 5% за последние 5 минут.
- **Выражение (PromQL):**
  ```promql
  sum(rate(ai_call_errors_total[5m])) / sum(rate(ai_call_duration_seconds_count[5m])) > 0.05
  ```
- **Длительность:** `2m`
- **Действие:** Проверить статус внешнего API, сработал ли Circuit Breaker, переключиться на резервного провайдера (`FALLBACK_BASE_URL` или Whisper Groq).

---

## 2. Предупреждающие алерты (Severity: Warning)

### `ConsumerQueueLagHigh`
- **Описание:** Задержка обработки в очередях Redis Streams превышает 60 секунд.
- **Выражение (PromQL):**
  ```promql
  max(redis_stream_lag_seconds) > 60
  ```
- **Длительность:** `1m`
- **Действие:** Проверить загрузку CPU воркеров `ai-workers` и `file-processor`, при необходимости увеличить количество реплик воркеров в Docker Compose / K8s.

### `LessonCostBudgetExceeded`
- **Описание:** Стоимость одного урока превысила установленный потолок в $3.00.
- **Выражение (PromQL):**
  ```promql
  increase(ai_call_cost_usd_total[1h]) > 3.0
  ```
- **Длительность:** `0m`
- **Действие:** Автоматический переход в degraded-режим (Flash-Lite). Проверить аномальное количество кадров или транскрипта.

### `SLOViolationRateHigh`
- **Описание:** Доля запросов, нарушающих установленные SLO (транскрипт > 2.5 с, кадр > 12 с, блок > 30 с), превышает 5%.
- **Выражение (PromQL):**
  ```promql
  (1 - (
    sum(rate(slo_transcript_latency_seconds_bucket{le="2.5"}[5m])) /
    sum(rate(slo_transcript_latency_seconds_count[5m]))
  )) > 0.05
  ```
- **Длительность:** `5m`
- **Действие:** Провести профилирование очередей и задержек сети до ASR и Gemini.
