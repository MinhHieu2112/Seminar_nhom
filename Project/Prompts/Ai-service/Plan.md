# AI-Service Refactoring

## 1. Backend Architecture & Providers
- [ ] Refactor [AgentAiService](file:///Users/nguyenvominhhieu/Downloads/Seminar/Project/Backend/src/ai-service/agent-ai.service.ts#90-303) and [AiScheduleGeneratorService](file:///Users/nguyenvominhhieu/Downloads/Seminar/Project/Backend/src/ai-service/ai-schedule-generator.service.ts#127-298) to use a Strategy Pattern.
- [ ] Implement `AiProvider` interface.
- [ ] Implement `GeminiProvider` using `@google/genai`.
- [ ] Implement `OpenAIProvider` using `openai`.
- [ ] Implement `AiServiceManager` that handles fallback (try Gemini -> if fail/quota -> try OpenAI).
- [ ] Ensure API keys are loaded from [.env](file:///Users/nguyenvominhhieu/Downloads/Seminar/Project/Backend/.env) properly.

## 2. DTOs and Validation
- [ ] Implement structured prompts to handle Natural Language for tasks.
- [ ] Implement structured prompts to handle Image Input (e.g. schedules, invoices, notes).
- [ ] Update DTOs to return clear list of missing fields if data is insufficient.
- [ ] Ensure unified result mapping to [scheduler-service](file:///Users/nguyenvominhhieu/Downloads/Seminar/Project/Backend/Dockerfile.scheduler-service).

## 3. Frontend Implementation
- [ ] Add Floating AI button on `scheduler/goals` page.
- [ ] Create AI input modality (Modal or Drawer) with Text Input & Image Upload features.
- [ ] Add Real-time loading indicator and friendly error messages.
- [ ] Add preview screen for AI generated tasks before sending to backend to save.

## 4. Testing & Verification
- [ ] Test text parsing logic with Gemini.
- [ ] Test image parsing logic with Gemini.
- [ ] Intentionally fail Gemini to test OpenAI fallback.
- [ ] Verify Frontend UX and Preview functionality.
