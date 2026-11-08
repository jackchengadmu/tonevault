# Challenge 1

1.![An order with quantity 0 or -3](<Screenshot 2026-11-08 at 00.42.34.png>)
2.![An order where the browser sends a wrong total](<Screenshot 2026-11-08 at 01.15.46.png>)
3.![An order for more than the stock, or a taken slot](<Screenshot 2026-11-08 at 01.08.27.png>)
4.![An item id that does not exist](<Screenshot 2026-11-08 at 01.07.08.png>)
5.![An order with a required field missing](<Screenshot 2026-11-08 at 00.56.47.png>)
6.![A search that matches nothing](<Screenshot 2026-11-08 at 01.10.31.png>)

# Challenge 3 — Overrule the AI

The first-person observations and decisions below were supplied by me after personally reviewing the interface. The Git inspections and automated checks are the agent's technical verification; they do not imply that I ran those scripts or conducted additional usability tests.

## 1. Generic native dropdowns

**Original AI implementation:** The reviewed version used five visible HTML `<select>` controls for Brand, Price, Verification, Condition and Availability. See [the original source at 3807979](https://github.com/perez234910/tonevault/blob/38079794cd49cd0bd14dbe881c38b60a42453dbb/src/components/filter-bar.tsx) and its [preserved snapshot](evidence/challenge-3/before/native-filters-3807979.txt).

**My criticism and instruction:** I found the default browser dropdowns inconsistent with ToneVault's minimalist design and wanted custom interactions. I instructed the agent to replace them with accessible dropdown components using consistent styling, smooth opening/closing, and appropriate hover and selection states.

**Correction:** Commit `4640db5` / [PR #27](https://github.com/perez234910/tonevault/pull/27) replaced the visible native controls with the shared [StoreSelect](../src/components/ui/select.tsx), using Radix's focus, keyboard/typeahead, selection and collision-aware portal behavior. [FilterBar](../src/components/filter-bar.tsx) preserves query parameters. Radix's hidden native form bridges are not visible browser dropdowns.

**Verification and evidence:** [Earlier Browse](evidence/gc1-motion/before/1440-browse.png), [custom-filter screenshot](evidence/storefront-refinement/after/390-filter.png), and [eight actual storefront checks](evidence/complete-ui/real-storefront.json). These are agent-run checks, separate from my visual criticism. The focused Challenge 3 script also checks all five labeled controls and working filtering.

## 2. Unsatisfactory navigation hover behavior

**Original AI implementation:** The reviewed motion version at `3807979` tracked pointer/focus targets and translated one 96px background surface between Browse, Verified and Collection. See [original navigation](evidence/challenge-3/before/navigation-3807979.txt). This identifies the actual earlier treatment rather than claiming every earlier revision behaved identically.

**My criticism and instruction:** The interactive response did not match my intended design. My eventual decision was that these three triggers should remain visually stable, while dropdown options should provide smooth hover feedback. I instructed the agent to remove the distracting trigger treatment and retain restrained transitions for options.

**Correction:** `4640db5` / [PR #27](https://github.com/perez234910/tonevault/pull/27) removed the shared surface, target state and pointer-tracking handlers. [SiteHeader](../src/components/site-header.tsx) and [shared CSS](../app/globals.css) retain a quiet active underline and keyboard focus. Collection options retain smooth background/color transitions, selected/focused states, keyboard navigation and dismissal.

**Verification and evidence:** [Recorded storefront checks](evidence/complete-ui/real-storefront.json) verify stable trigger geometry/backgrounds and working dropdown interactions. The focused Challenge 3 checks compare trigger styles before/after hover and verify option feedback and reduced motion. This is my design revision, not a claim that the old treatment caused an accessibility or functional failure.

## 3. Missing search suggestions

**Original AI implementation:** At `55ddb50`, Header/mobile and Browse search were plain submission inputs, with no autocomplete request, suggestion list or combobox behavior. Original [Header](evidence/challenge-3/before/site-header.txt) and [Browse](evidence/challenge-3/before/filter-bar.txt) sources are preserved.

**My criticism and instruction:** When I typed `GI`, the interface did not suggest Gibson even though Gibson guitars existed in the catalog. I had to enter or submit a search without contextual suggestions. I wanted users to discover relevant brands and instruments while typing, so I instructed the agent to add responsive, accessible suggestions from actual catalog data.

**Before evidence:** Actual [desktop `GI`](evidence/challenge-3/before/1440-gi-no-suggestions.png) and [phone Browse `GI`](evidence/challenge-3/before/390-gi-no-suggestions.png) captures were taken before editing. [Recorded observations](evidence/challenge-3/before/observations.json) confirm no visible suggestion list or suggestion requests after typing, and a read-only API check confirmed Gibson records. These were agent checks, not additional tests attributed to me.

**Correction:** The shared [CatalogSearch](../src/components/catalog-search.tsx) and [catalog-search API adapter](../src/lib/catalog-search.ts) now provide real brand/listing suggestions across Header, mobile navigation and Browse. Requests use the own product GET API, a 200ms debounce and cancellation. Combobox/listbox semantics retain input focus; arrows, Enter, Escape, mouse/touch selection, loading/empty/error feedback, viewport positioning and reduced motion are supported. Unselected Enter still submits the typed search. Brand selection retains Browse filters while clearing obsolete keywords/pagination; listing selection opens its actual product ID.

**Verification and evidence:** Corrected and verified. Eight real-catalog Chrome/WebKit cases passed at desktop/phone widths with normal/reduced motion. Actual [desktop Gibson suggestions](evidence/challenge-3/after/1440-gi-header.png), [mobile-menu suggestions](evidence/challenge-3/after/390-gi-mobile.png), [Browse suggestions](evidence/challenge-3/after/390-gi-browse.png), and [recorded results](evidence/challenge-3/after/results.json) are preserved. The desktop Chrome case additionally verified the debounce, stale-request cancellation, empty results and an isolated injected-error response with normal submission still working. [Browser script](../scripts/test-search-suggestions.mjs), [unit tests](../tests/catalog-search.test.ts), and [evidence/reproduction notes](evidence/challenge-3/README.md) distinguish real catalog checks from technical fixtures. No database writes were performed.

## Evidence and scope

The three personal criticisms above are my selected examples. The agent's separate [technical-defect evidence](gc1-ui-findings.md) remains unchanged. No additional personal motivations, accessibility failures, human testing or screenshots are invented.

All three examples now have documented original implementations, my supplied observations/instructions, corrections and actual verification. This completes the requested Challenge 3 implementation/evidence scope; course evaluation and genuine human PR review are still required.

Challenge 1 above is preserved unchanged. No Challenge 2 or Challenge 4 section exists on this inspected branch, so none was overwritten. The separate unmerged foundation-docs PR #19 remains intact; its older Challenge 3 draft will need reconciliation with these user-selected examples during genuine human integration review.
