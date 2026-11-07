## Summary

<!-- What changed and why. 1–3 bullets. -->

-

## Test plan

<!-- How a reviewer can verify this. Check every item you actually ran. -->

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] Exercised the affected UI or API path

## Mandatory checklist

- [ ] This PR has a single, stated purpose
- [ ] Branch name follows `feat|fix|chore|docs|db/<short-description>`
- [ ] I did not commit `.env.local`, API keys, or other secrets
- [ ] Schema changes include a new migration **and** matching TypeScript types
- [ ] Catalog or checkout changes were verified in the browser (`/`, `/browse`, and/or `/products/[id]`)
- [ ] RLS / escrow behavior was considered if this touches `users`, `products`, or `orders`
- [ ] The module owner listed in the README is a reviewer

## AI-assisted development disclosure

- [ ] I used AI assistance on this PR: **Yes / No** — tools and scope:

<!-- Example: Yes — Cursor (Grok) drafted the filter bar; I reviewed types, RLS impact, and tested /browse. -->
