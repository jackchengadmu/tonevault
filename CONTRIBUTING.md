# Contributing to ToneVault

ToneVault is a team-owned marketplace. Keep changes small, reviewed, and aligned with the module ownership in the [README](./README.md#member-roster-and-ownership).

## Workflow

1. Create a branch from `main`.
2. Keep the change scoped to one concern (schema, API, UI, docs, or tooling).
3. Run `npx tsc --noEmit` and `npm run lint` before you open a pull request.
4. If you touch listings or checkout, exercise the affected flow in the browser (`/`, `/browse`, `/products/[id]`).
5. Open a PR using the GitHub template. Do not merge your own PR.

## Branch naming

Use lowercase kebab-case with a type prefix:

| Prefix | Use for |
| --- | --- |
| `feat/` | New user-facing or API behavior |
| `fix/` | Bug fixes |
| `chore/` | Tooling, deps, refactors with no product change |
| `docs/` | README, contributing, comments |
| `db/` | Supabase migrations and RLS |

Examples:

- `feat/browse-price-filters`
- `fix/product-gallery-sizes`
- `db/add-pending-escrow-status`
- `docs/contributing-guide`

Do not commit directly to `main`.

## Pull request rules

- One PR, one purpose. Do not mix a schema change with an unrelated UI restyle.
- Fill in the PR template completely, including the mandatory checklist and AI disclosure.
- Link the related issue or team task when one exists.
- Migrations live in `supabase/migrations/` and must be additive. Do not rewrite applied migration files.
- Never commit `.env.local`, service role keys, PayMongo secrets, or database passwords.
- Prefer `updateTag` / `revalidateTag` over ad-hoc client refetching when mutating catalog data.
- Request review from the owner of the module you changed (see the roster in the README). Schema changes need Member 1 (or current data owner) on the review.

## Commit messages

Write in the imperative mood and say why the change exists:

```
Add pending escrow status so checkout can reserve a listing before payment
```

Avoid noisy commits such as `wip` or `fix stuff` on the branch that will be merged.

## Local database changes

1. Add a new timestamped SQL file under `supabase/migrations/`.
2. Apply it with `npx supabase db push --yes --remote` against the linked project.
3. Update TypeScript types in `src/types/` in the same PR.
4. Seed data is additive; `npm run seed` must remain safe to re-run.

## AI-assisted work

AI tools may be used to draft code. You are still the author: you must understand the diff, keep secrets out of prompts where possible, and disclose AI assistance on the pull request.
