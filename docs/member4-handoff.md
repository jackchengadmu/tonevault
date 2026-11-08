# Member 4 revenue handoff

## What is ready

1. [PR #40](https://github.com/perez234910/tonevault/pull/40) — single active rules file and centavo calculator.
2. [PR #41](https://github.com/perez234910/tonevault/pull/41) — validation, pricing snapshot fields and atomic order RPC.
3. [PR #42](https://github.com/perez234910/tonevault/pull/42) — read-only server pricing quote endpoint.

All three PRs are open, unmerged and need genuine human review. Merge them in order. Because Member 4 does not have upstream push access, later PRs are stacked against `main` and temporarily show earlier commits too.

## Member 3 coordination before merge

Member 3 PR #37 duplicates the commission/physical-inspection rules and calls the old three-argument order RPC. It cannot be merged unchanged after PR #41.

Keep from Member 3 after review:

- verified buyer identity from the bearer token;
- customer/contact fields;
- simulated payment method and confirmation flow.

Use from Member 4:

- `ACTIVE_PRICING_RULES` for 8%, ₱2,800 and ₱8,500;
- `verification_option` (`none`, `remote`, `physical`);
- `quoteCatalogPricing` for the server price;
- the pricing snapshot fields and new `place_catalog_order` signature.

Remove or replace Member 3's duplicate `checkout_pricing_rules`, `order_pricing` trigger/table and old RPC call during the integration PR. Do not merge both pricing systems as-is.

## Still requires people or deployment access

- Apply the reviewed migration to an authorized test database, then run the six deployed Postman challenge requests.
- Connect the checkout UI after Member 2/3 changes are reconciled.
- Obtain real human PR comments/approvals and merge in order.
- Member 4 must personally write Challenge 5 predictions before running the function and make the unedited voiced recording without AI assistance.
- Rotate the Supabase service key after this work because it was shared in chat; never place it in Git or a `NEXT_PUBLIC_` variable.
