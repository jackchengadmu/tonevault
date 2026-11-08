# AI usage

This log records actual assistance. Human authors must understand every merged line. AI review never replaces the required human run, substantive comment and approval. No Challenge 5 predictions, execution or recording were prepared by the agent.

| Date | Member | Tool | Asked for | Kept/changed | How verified |
| --- | --- | --- | --- | --- | --- |
| 2026-11-08 (Asia/Manila) | Member 2 / shin-ieru | Codex | Audit installation/checks; implement validated cart state | Added pure quantity/storage operations and per-provider store, migrated legacy cart data, fixed hydration lint error, derived preview totals, updated stock payloads and payment copy, disabled unavailable checkout with explanation; added test/typecheck scripts and 7 tests | `npm test`: 7 passed; `npm run typecheck`, `npx tsc --noEmit`, `npm run lint`, `git diff --check`: passed. Build compiled and typechecked, then failed collecting product page data for missing Supabase environment variables. npm audit: 8 moderate development-tool findings, left unchanged; no forced fix. Human/browser/deployed checks pending. |
