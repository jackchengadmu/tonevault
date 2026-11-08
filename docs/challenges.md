# Challenge 1

1.![An order with quantity 0 or -3](<Screenshot 2026-11-08 at 00.42.34.png>)
2.![An order where the browser sends a wrong total](<Screenshot 2026-11-08 at 01.15.46.png>)
3.![An order for more than the stock, or a taken slot](<Screenshot 2026-11-08 at 01.08.27.png>)
4.![An item id that does not exist](<Screenshot 2026-11-08 at 01.07.08.png>)
5.![An order with a required field missing](<Screenshot 2026-11-08 at 00.56.47.png>)
6.![A search that matches nothing](<Screenshot 2026-11-08 at 01.10.31.png>)

# Challenge 4 — The owner changes a rule

## Simulated owner request

> “Change ToneVault's seller commission from 8% to 9%.”

This challenge records the impact **without making the change**. The active value remains 8%.

## Audit before the change

I ran:

```bash
rg -n "commissionRateBps|280_000|850_000|8%|2,800|8,500" src app supabase tests docs README.md
nl -ba src/lib/pricing/rules.ts
```

The audit found formulas, tests and written examples, plus a separate unmerged Member 3 pricing design in PR #37. Member 4 did not edit Member 3's branch. Merging #37 unchanged would create a second active source and is called out in `docs/business.md` §3.4.

## Runtime file and line to edit

Only one production value controls the active commission:

| File and verified line | Current value | Owner's requested value |
| --- | --- | --- |
| `src/lib/pricing/rules.ts:11` | `commissionRateBps: 800` (8%) | `commissionRateBps: 900` (9%) |

No other runtime file needs the new percentage. `calculateOrderPricing` reads the rule; `quoteCatalogPricing` calls that calculator; the order service passes its result to Postgres. The database stores the supplied rate and verifies the arithmetic but does not duplicate 8%. Existing orders keep their saved rate, so a future change would affect new quotes/orders only.

Tests and documents contain the old 8% amounts as expected results and GC2 evidence. After a real approved rule change, those assertions and examples should be refreshed and re-run, but they do not control application behavior and are not additional active rule sources.

## Refactor/PR evidence

[PR #40 — Add shared revenue pricing calculator](https://github.com/perez234910/tonevault/pull/40) introduces `ACTIVE_PRICING_RULES` as the single production source. PRs [#41](https://github.com/perez234910/tonevault/pull/41) and [#42](https://github.com/perez234910/tonevault/pull/42) consume it without repeating the active percentage. All are open and require human review; this document does not claim they are merged or deployed.
