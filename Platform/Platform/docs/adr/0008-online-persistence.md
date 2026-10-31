# ADR-0008 — Online persistence unchanged; new tables ride the same SQLite file
**Context.** Online mode stores SQLite in /tmp and syncs to a private Vercel Blob when `BLOB_READ_WRITE_TOKEN` exists.
**Decision.** Work-OS tables live in the same DB file → automatically included in Blob save/restore and backups/export. The persistent trash replaces the in-memory one, so undo also survives cold starts when Blob is configured. If the token is absent, edits remain ephemeral (unchanged behavior, surfaced in the UI).
