# ADR-0005 — Local, deterministic automation engine
**Decision.** Server-side rules `When(trigger) → Then(action)` evaluated synchronously after item mutations (event triggers) and in an idempotent sweep for time triggers (`due_soon`, run on inbox/list reads and a 10-minute timer in PC mode). Max chain depth 3, rules applied in creation order. Every run writes `wos_history` (actor `automation:<id>`, before/after) → revertible.
**Rejected.** Client-side rules (unreliable when tab closed), cron daemons (no infra in PC mode), user scripts (security).
