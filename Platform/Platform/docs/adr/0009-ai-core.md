# ADR-0009 — AI core: browser-side agent, server-side model gateway, free-first provider chain

**Context.** The owner wants an AI layer that can reach every part of the platform with broad permissions. It should be free first, using the strongest small open model (Qwen), and online it should use the fastest available path. Paid APIs (Claude Opus 5.5 etc.) are an optional last step. The platform has no login, and its online copy is public by URL. Every existing mutation already gets validation (zod), history (`record()`), and the persistent trash plus undo.

**Model choice (Oct 2026).**

- Default local model: **Qwen3.5** through Ollama (Apache-2.0, native tool calling, 262K context).
- Size by RAM: 2B below 7 GB, 4B from 7 GB, 9B from 15 GB. `pickInstalled()` prefers the newest, largest Qwen that fits, so an older qwen2.5:3b already on the PC is used as-is.
- No public Arabic tool-calling benchmark exists. `npm run ai:eval` measures any model on 30 real Arabic platform commands.

**Decision.**

1. **The agent loop runs in the browser** (`web/src/ai/agent.ts`).
   - Tools call the same `api.*` / `wos.*` / `lib.*` clients the UI uses, so every AI action inherits validation, history, trash and undo with zero duplicated logic.
   - The same code works on the PC build and on Vercel, which cannot loop back to itself.
2. **The server is only a model gateway** (`/api/ai/chat`, SSE).
   - It holds the keys: `data/ai-secrets.json` on the PC, outside the DB so keys never ride Blob, backups or exports; env vars on Vercel.
   - It falls back across providers in the configured order, but only before any output was produced.
   - A daily token cap applies to paid tiers. The background brief never uses a paid provider.
3. **One stream format for three adapters** (`shared/aiStream.ts`, isomorphic):
   - Ollama native `/api/chat`, with `num_ctx` 16K and `think:false`. Ollama's default 2–4K context silently truncates tool schemas, and thinking burns small-model latency.
   - OpenAI-compatible (OpenRouter, Groq, LM Studio, llama.cpp, OpenAI…).
   - Anthropic Messages, with prompt caching on the system prompt and the tools.
4. **Permissions by tier** (`shared/aiTools.ts`):
   - `read` runs immediately.
   - `write` shows a preview card, then runs. The policy `auto` runs it directly with an undo button.
   - `danger` always asks for confirmation.
   - Forbidden capabilities are never exposed to the model: backup restore, imports that overwrite, settings, keys, and writes to Rashed sources (life entries are *drafts* Rashed applies).
5. **Audit and undo.**
   - Requests made while a tool runs carry `x-actor: ai`. An AsyncLocalStorage context (`server/actor.ts`) makes `record()` tag history as `ai`; the Activity page shows «بواسطة المساعد».
   - Each write returns an `UndoOp` (trash token, history revert, or an inverse call). The op is stored in `ai_runs` (migration 6, additive), so a whole conversation can be undone.
6. **Small-model routing.** Models ≤ 4.5B get only the ~9 most relevant tools: Arabic-normalised keyword match, plus the current page's line, plus the core tools. Larger and paid models get all 32.
7. **Online lock.** All `/api/ai/*` routes except `/gate` require `AI_ACCESS_KEY`, so nobody can spend the owner's keys or read conversations. Online, "Ollama on this machine" is disabled. "Ollama from the browser" lets the public site use the owner's own PC model directly; it needs `OLLAMA_ORIGINS`, and CSP `connect-src` allows `localhost:11434` only.

**Consequences.**

- Zero new dependencies. The AI module is lazy-loaded (≈58 KB chunk); the initial bundle does not grow.
- Reloading the current page after AI writes (`dataRev`) keeps every page correct without per-page wiring.
- Known limit: a tool run marks *all* concurrent requests from that tab as `ai`. These are sub-second windows, and the result is visible in history.
