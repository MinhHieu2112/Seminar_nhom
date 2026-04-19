# AI Service

## Vai trò

Microservice xử lý mọi tác vụ liên quan đến **Large Language Model (LLM)**. Đây là worker service — không expose HTTP, chỉ lắng nghe jobs từ BullMQ queue. Áp dụng layered fallback để đảm bảo luôn trả về kết quả dù LLM lỗi hoặc hết quota.

---

## Trách nhiệm chính

| Nhiệm vụ | Mô tả |
|---|---|
| **Goal decomposition** | Nhận goal text → gọi LLM → trả về danh sách tasks (title, duration, priority, type) |
| **Re-prioritization** | Nhận danh sách tasks còn lại + available hours → LLM sắp xếp lại priority |
| **Conflict resolution** | Khi auto-shift không đủ chỗ → AI đề xuất tasks nên drop hoặc hoãn |
| **Fallback pipeline** | Template matching → Heuristic NLP → Generic scaffold khi LLM lỗi |
| **Prompt management** | Đọc prompt templates từ config (admin có thể chỉnh qua Admin API) |

---

## Giao tiếp

- **Inbound:** Chỉ nhận jobs từ BullMQ queue (`ai-jobs`). Không nhận TCP trực tiếp.
- **Outbound:**
  - Ghi kết quả tasks vào PostgreSQL (thông qua Scheduler Service hoặc trực tiếp vào DB tùy kiến trúc)
  - Emit `notification.send` → Notification Service khi job hoàn thành
  - Query Vector DB khi cần context tương đồng (optional)

---

## Công nghệ & Thư viện

| Thư viện | Mục đích |
|---|---|
| `@nestjs/bull` + `bull` | BullMQ consumer, xử lý job từ queue |
| `@anthropic-ai/sdk` hoặc `openai` | Gọi LLM API (Claude / GPT) |
| `@nestjs/typeorm` | Ghi kết quả tasks vào DB |
| `natural` hoặc `compromise` | NLP nhẹ cho fallback L3 (keyword extraction) |
| `underthesea` (Python side-car) | NLP tiếng Việt nếu cần (optional, gọi qua subprocess) |
| `ioredis` | Lưu circuit breaker state, cache prompt templates |
| `zod` | Validate và parse JSON output từ LLM |

---

## Layered Fallback Pipeline

```
[L1] LLM Call (Anthropic Claude / OpenAI)
       max_tokens: 800, timeout: 8s
       Retry x2 (backoff: 1s, 3s)
         ↓ FAIL
[L2] Template Matching
       ~20 domain templates (python, english, data-science, ...)
         ↓ NO MATCH
[L3] Keyword/NLP Heuristic
       Extract noun phrases → build generic tasks
         ↓ FALLBACK
[L4] Generic Scaffold
       6 tasks mặc định, luôn thành công
```

**Circuit Breaker:** Sau 3 lần fail liên tiếp → OPEN 60s → skip L1, xuống L2 ngay.

---

## LLM Prompt Structure

```typescript
const systemPrompt = `You are a learning plan assistant.
Decompose the given learning goal into concrete study tasks.
Return ONLY a valid JSON array. No explanation, no markdown.
Each task: { title: string, duration_min: number (30-180), priority: 1-5, type: "theory"|"practice" }
Rules:
- Max 8 tasks
- Alternate theory and practice where possible
- First task always priority 5`;

const userPrompt = `Goal: ${goal.title}
Deadline: ${daysUntilDeadline} days
Context: ${goal.description ?? 'none'}`;
```

---

## Job Handlers

```typescript
// Queue: 'ai-jobs'

@Process('decompose-goal')
async handleDecompose(job: Job<DecomposeGoalPayload>) {
  const { goalId, userId, goalTitle, deadline } = job.data;
  const tasks = await this.fallbackPipeline.run(goalTitle, deadline);
  // Lưu tasks vào DB, emit notification
}

@Process('reprioritize')
async handleReprioritize(job: Job<ReprioritizePayload>) {
  const { userId, tasks, availableHours } = job.data;
  const reordered = await this.fallbackPipeline.reprioritize(tasks, availableHours);
  // Cập nhật priority trong DB
}
```

---

## Template Library Structure

```typescript
// Lưu trong Redis hoặc config file, admin có thể chỉnh
const TEMPLATES: Record<string, TaskTemplate[]> = {
  "python":       [...],  // 6-8 tasks
  "english":      [...],
  "react":        [...],
  "data-science": [...],
  "sql":          [...],
  // ...
};

const KEYWORD_MAP: Record<string, string[]> = {
  "python":  ["python", "lập trình python"],
  "english": ["tiếng anh", "ielts", "toeic"],
  // ...
};
```

---

## Cấu trúc Module

```
ai-service/
├── src/
│   ├── processors/
│   │   ├── decompose.processor.ts      # @Process('decompose-goal')
│   │   └── reprioritize.processor.ts   # @Process('reprioritize')
│   ├── pipeline/
│   │   ├── fallback-pipeline.service.ts # Orchestrate L1→L4
│   │   ├── llm.service.ts              # LLM API call + retry
│   │   ├── template.service.ts         # L2 template matching
│   │   ├── heuristic.service.ts        # L3 NLP extraction
│   │   └── scaffold.service.ts         # L4 generic scaffold
│   ├── circuit-breaker/
│   │   └── circuit-breaker.service.ts  # Redis-backed state
│   ├── prompt/
│   │   └── prompt.repository.ts        # Load templates từ Redis/config
│   └── main.ts                         # Chỉ khởi động Bull worker, không TCP
```

---

## Environment Variables

```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...           # Fallback LLM nếu Anthropic lỗi
LLM_PROVIDER=anthropic       # 'anthropic' | 'openai'
LLM_TIMEOUT_MS=8000
LLM_MAX_TOKENS=800
CIRCUIT_BREAKER_THRESHOLD=3
CIRCUIT_BREAKER_TIMEOUT_MS=60000
```

---

## Notes

- Service này **không expose TCP port**. Hoàn toàn driven bởi queue.
- LLM output luôn được validate bằng `zod` trước khi lưu — nếu JSON malformed → retry L1 một lần, sau đó xuống L2.
- Admin có thể xem job history và failure rate qua Bull Board UI (mount tại API Gateway, admin-only route).
