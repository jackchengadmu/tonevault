# ToneVault Member 4 Revenue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an 8% marketplace commission and optional ₱2,800/₱8,500 verification add-ons that are calculated by ToneVault's server, persisted with orders, tested, and documented.

**Architecture:** A pure TypeScript module owns the active rule values and centavo math. Server code reads the current catalog price, creates a pricing snapshot, and passes it to a service-role-only Postgres RPC that validates the locked listing, saves the order, and reduces stock atomically. A read-only quote endpoint exposes the same calculation to checkout without trusting browser totals.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Zod 4, Supabase PostgreSQL/RPC, Node test runner through `tsx`, Google Docs connector, PDF verification tooling.

## Global Constraints

- Work from `main` in isolated `g2/m4-*` branches; do not edit Member 2's open branches.
- Use the GC1 values exactly: 8% commission, ₱2,800 remote verification, ₱8,500 physical verification.
- Use integer centavos in TypeScript and `numeric(12,2)` pesos in Postgres.
- Never trust browser-supplied money fields.
- Keep order insert and stock reduction in one database transaction.
- Payment stays simulated; do not add PayMongo, real escrow, authentication, subscriptions, or boosted listings.
- Preserve historical order pricing snapshots when active rules change.
- Do not claim deployed, Postman, phone, database, or human-review evidence unless it was actually collected.
- Member 4 must personally prepare Challenge 5 predictions and make the unedited recording without AI assistance.
- Use `apply_patch` for repository edits. Never commit `.env.local`, secrets, or `node_modules/`.

## File Map

| File | Responsibility |
| --- | --- |
| `src/lib/pricing/rules.ts` | Single active source for commission and verification-fee values |
| `src/lib/pricing/calculate.ts` | Pure centavo calculator and peso snapshot conversion |
| `src/lib/pricing/catalog.ts` | Load current product price/stock and produce a server quote |
| `src/lib/validators/catalog.ts` | Validate quote/order inputs |
| `src/lib/catalog/queries.ts` | Submit the server pricing snapshot to the atomic order RPC |
| `app/api/pricing/quote/route.ts` | Read-only pricing endpoint |
| `supabase/migrations/20261108090000_add_revenue_pricing.sql` | Persist pricing and replace the order RPC |
| `src/types/index.ts`, `src/types/database.ts` | Application and Supabase contracts |
| `tests/pricing*.test.ts`, `tests/revenue-migration.test.ts` | Pricing, validation, HTTP, and SQL contract checks |
| `docs/business.md`, `docs/routes.md`, `docs/schema.md`, `docs/challenges.md` | Member 4 submission documentation |
| `docs/final-business-summary.md`, `docs/ToneVault-GC2-Business-Summary.pdf` | Two-page submission summary |

---

### Task 1: Pricing engine and PR 1

**Files:**
- Create: `src/lib/pricing/rules.ts`
- Create: `src/lib/pricing/calculate.ts`
- Create: `tests/pricing.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: pure numeric inputs.
- Produces: `VerificationOption`, `ACTIVE_PRICING_RULES`, `calculateOrderPricing(input, rules?)`, and `pricingBreakdownToPesos(breakdown)`.

- [ ] **Step 1: Prepare the fork and isolated branch**

After invoking `using-git-worktrees`, run:

```bash
gh repo fork perez234910/tonevault --remote --remote-name fork
git fetch origin --prune
git fetch fork --prune
git switch g2/m4-revenue-design
git switch -c g2/m4-pricing-engine
```

Expected: `origin` remains the upstream repository, `fork` belongs to `jackchengadmu`, and the branch contains design commit `6084c94` with a clean status.

- [ ] **Step 2: Add test scripts**

Preserve existing scripts and add:

```json
"test": "node --import tsx --test tests/*.test.ts",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 3: Write failing tests**

Create `tests/pricing.test.ts` with these exact assertions:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { calculateOrderPricing, pricingBreakdownToPesos } from "../src/lib/pricing/calculate";

test("calculates the PRS 8% commission", () => {
  const result = calculateOrderPricing({ unitPriceCentavos: 16_800_000, quantity: 1, verificationOption: "none" });
  assert.deepEqual(pricingBreakdownToPesos(result), {
    unit_price: 168_000, subtotal_amount: 168_000, verification_option: "none",
    verification_fee: 0, commission_rate_bps: 800, commission_amount: 13_440,
    seller_payout_amount: 154_560, platform_revenue_amount: 13_440,
    total_amount: 168_000,
  });
});

test("adds physical verification once", () => {
  const result = calculateOrderPricing({ unitPriceCentavos: 19_500_000, quantity: 1, verificationOption: "physical" });
  assert.deepEqual(pricingBreakdownToPesos(result), {
    unit_price: 195_000, subtotal_amount: 195_000, verification_option: "physical",
    verification_fee: 8_500, commission_rate_bps: 800, commission_amount: 15_600,
    seller_payout_amount: 179_400, platform_revenue_amount: 24_100,
    total_amount: 203_500,
  });
});

test("does not multiply the remote fee by quantity", () => {
  const result = calculateOrderPricing({ unitPriceCentavos: 10_000, quantity: 2, verificationOption: "remote" });
  assert.equal(result.subtotalCentavos, 20_000);
  assert.equal(result.verificationFeeCentavos, 280_000);
  assert.equal(result.buyerTotalCentavos, 300_000);
});

test("rounds commission to the nearest centavo", () => {
  const result = calculateOrderPricing(
    { unitPriceCentavos: 101, quantity: 1, verificationOption: "none" },
    { commissionRateBps: 800, verificationFeeCentavos: { none: 0, remote: 280_000, physical: 850_000 } },
  );
  assert.equal(result.commissionCentavos, 8);
});

test("rejects zero quantity", () => {
  assert.throws(
    () => calculateOrderPricing({ unitPriceCentavos: 10_000, quantity: 0, verificationOption: "none" }),
    /quantity must be a positive integer/,
  );
});
```

- [ ] **Step 4: Verify the tests fail before implementation**

Run `npm test`. Expected: FAIL because the pricing module does not exist.

- [ ] **Step 5: Add the single active rules source**

Create `src/lib/pricing/rules.ts`:

```ts
export const VERIFICATION_OPTIONS = ["none", "remote", "physical"] as const;
export type VerificationOption = (typeof VERIFICATION_OPTIONS)[number];
export type PricingRules = Readonly<{
  commissionRateBps: number;
  verificationFeeCentavos: Readonly<Record<VerificationOption, number>>;
}>;
export const ACTIVE_PRICING_RULES = {
  commissionRateBps: 800,
  verificationFeeCentavos: { none: 0, remote: 280_000, physical: 850_000 },
} as const satisfies PricingRules;
```

- [ ] **Step 6: Implement the calculator**

Create `src/lib/pricing/calculate.ts` with these public types and formulas:

```ts
import { ACTIVE_PRICING_RULES, type PricingRules, type VerificationOption } from "./rules";

export type PricingInput = { unitPriceCentavos: number; quantity: number; verificationOption: VerificationOption };
export type PricingBreakdown = PricingInput & {
  subtotalCentavos: number; verificationFeeCentavos: number; commissionRateBps: number;
  commissionCentavos: number; sellerPayoutCentavos: number;
  platformRevenueCentavos: number; buyerTotalCentavos: number;
};
export type PricingSnapshotPesos = {
  unit_price: number; subtotal_amount: number; verification_option: VerificationOption;
  verification_fee: number; commission_rate_bps: number; commission_amount: number;
  seller_payout_amount: number; platform_revenue_amount: number; total_amount: number;
};

export function calculateOrderPricing(input: PricingInput, rules: PricingRules = ACTIVE_PRICING_RULES): PricingBreakdown {
  if (!Number.isSafeInteger(input.unitPriceCentavos) || input.unitPriceCentavos < 0) throw new RangeError("unitPriceCentavos must be a nonnegative safe integer.");
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new RangeError("quantity must be a positive integer.");
  if (!Number.isSafeInteger(rules.commissionRateBps) || rules.commissionRateBps < 0 || rules.commissionRateBps > 10_000) throw new RangeError("commissionRateBps must be between 0 and 10,000.");
  const verificationFeeCentavos = rules.verificationFeeCentavos[input.verificationOption];
  if (!Number.isSafeInteger(verificationFeeCentavos) || verificationFeeCentavos < 0) throw new RangeError("verificationFeeCentavos must be nonnegative.");
  const subtotalCentavos = input.unitPriceCentavos * input.quantity;
  if (!Number.isSafeInteger(subtotalCentavos)) throw new RangeError("subtotalCentavos must be a safe integer.");
  const commissionCentavos = Math.round((subtotalCentavos * rules.commissionRateBps) / 10_000);
  const sellerPayoutCentavos = subtotalCentavos - commissionCentavos;
  const platformRevenueCentavos = commissionCentavos + verificationFeeCentavos;
  const buyerTotalCentavos = subtotalCentavos + verificationFeeCentavos;
  return { ...input, subtotalCentavos, verificationFeeCentavos, commissionRateBps: rules.commissionRateBps, commissionCentavos, sellerPayoutCentavos, platformRevenueCentavos, buyerTotalCentavos };
}

export function pricingBreakdownToPesos(value: PricingBreakdown): PricingSnapshotPesos {
  return {
    unit_price: value.unitPriceCentavos / 100,
    subtotal_amount: value.subtotalCentavos / 100,
    verification_option: value.verificationOption,
    verification_fee: value.verificationFeeCentavos / 100,
    commission_rate_bps: value.commissionRateBps,
    commission_amount: value.commissionCentavos / 100,
    seller_payout_amount: value.sellerPayoutCentavos / 100,
    platform_revenue_amount: value.platformRevenueCentavos / 100,
    total_amount: value.buyerTotalCentavos / 100,
  };
}
```

- [ ] **Step 7: Verify, commit, push, and open PR 1**

Run `npm test`, `npm run typecheck`, `npm run lint`, and `git diff --check`; all must pass. Then commit `Add shared revenue pricing calculator`, push `g2/m4-pricing-engine` to `fork`, and open `[G2-M4] Add shared revenue pricing calculator` against upstream `main`, linked to issue #13. The PR body must disclose Codex and request real human review.

---

### Task 2: Validation, migration, order integration, and PR 2

**Files:**
- Create: `tests/pricing-validation.test.ts`
- Create: `tests/revenue-migration.test.ts`
- Create: `supabase/migrations/20261108090000_add_revenue_pricing.sql`
- Create: `src/lib/pricing/catalog.ts`
- Modify: `src/lib/validators/catalog.ts`
- Modify: `src/types/index.ts`
- Modify: `src/types/database.ts`
- Modify: `src/lib/catalog/queries.ts`

**Interfaces:**
- Consumes: Task 1 pricing types and functions.
- Produces: `pricingQuoteSchema`, expanded `createOrderSchema`, `quoteCatalogPricing`, expanded `Order`, and a 12-argument `place_catalog_order` RPC.

- [ ] **Step 1: Branch from the tested PR 1 head**

Run `git switch -c g2/m4-order-pricing`.

- [ ] **Step 2: Write failing validation tests**

Create `tests/pricing-validation.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createOrderSchema, pricingQuoteSchema } from "../src/lib/validators/catalog";
const product_id = "11111111-1111-4111-8111-111111111111";
const buyer_id = "22222222-2222-4222-8222-222222222222";

test("defaults to no verification and strips browser money", () => {
  assert.deepEqual(createOrderSchema.parse({ product_id, buyer_id, quantity: 1, total: 1, commission_amount: 1 }),
    { product_id, buyer_id, quantity: 1, verification_option: "none" });
});
test("accepts physical verification", () => {
  assert.equal(pricingQuoteSchema.parse({ product_id, quantity: 1, verification_option: "physical" }).verification_option, "physical");
});
test("rejects unknown verification", () => {
  assert.equal(pricingQuoteSchema.safeParse({ product_id, quantity: 1, verification_option: "premium" }).success, false);
});
```

Run `npm test`; expected FAIL because `pricingQuoteSchema` does not exist.

- [ ] **Step 3: Implement shared validation**

Import `VERIFICATION_OPTIONS`, keep the existing `requiredQuantity`, and replace the order-only object with:

```ts
export const verificationOptionSchema = z.enum(VERIFICATION_OPTIONS);
const productIdField = z.string({ error: "product_id is required" }).min(1, "product_id is required").uuid("product_id must be a valid UUID");
export const pricingQuoteSchema = z.object({
  product_id: productIdField,
  quantity: requiredQuantity,
  verification_option: verificationOptionSchema.optional().default("none"),
});
export const createOrderSchema = pricingQuoteSchema.extend({
  buyer_id: z.string({ error: "buyer_id is required" }).min(1, "buyer_id is required").uuid("buyer_id must be a valid UUID"),
});
export type PricingQuoteInput = z.infer<typeof pricingQuoteSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
```

Run `npm test`; expected PASS.

- [ ] **Step 4: Write the failing migration contract test**

Create `tests/revenue-migration.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../supabase/migrations/20261108090000_add_revenue_pricing.sql",
  import.meta.url,
);
const sql = readFileSync(migrationPath, "utf8");

test("persists every revenue pricing field", () => {
  for (const column of [
    "unit_price",
    "subtotal_amount",
    "verification_option",
    "verification_fee",
    "commission_rate_bps",
    "commission_amount",
    "seller_payout_amount",
    "platform_revenue_amount",
  ]) {
    assert.match(sql, new RegExp(`add column if not exists ${column}\\b`, "i"));
  }
});

test("keeps stock and order creation atomic and verifies the snapshot", () => {
  assert.match(sql, /for update/i);
  assert.match(sql, /PRICE_CHANGED/);
  assert.match(sql, /INVALID_PRICING_SNAPSHOT/);
  assert.match(sql, /insert into public\.orders/i);
  assert.match(sql, /update public\.products/i);
});

test("does not expose the order function to browser roles", () => {
  assert.match(sql, /revoke all on function[\s\S]+from public/i);
  assert.match(sql, /grant execute on function[\s\S]+to service_role/i);
  assert.doesNotMatch(sql, /grant execute on function[\s\S]+to (anon|authenticated)/i);
});
```

Run `npm test`; expected: FAIL with `ENOENT` before creating the SQL file.

- [ ] **Step 5: Create the additive migration**

Create `supabase/migrations/20261108090000_add_revenue_pricing.sql` with this complete migration:

```sql
do $$
begin
  create type public.verification_option as enum ('none', 'remote', 'physical');
exception
  when duplicate_object then null;
end
$$;

alter table public.orders
  add column if not exists unit_price numeric(12, 2),
  add column if not exists subtotal_amount numeric(12, 2),
  add column if not exists verification_option public.verification_option,
  add column if not exists verification_fee numeric(12, 2),
  add column if not exists commission_rate_bps integer,
  add column if not exists commission_amount numeric(12, 2),
  add column if not exists seller_payout_amount numeric(12, 2),
  add column if not exists platform_revenue_amount numeric(12, 2);

update public.orders
set
  unit_price = round(total_amount / nullif(quantity, 0), 2),
  subtotal_amount = total_amount,
  verification_option = 'none',
  verification_fee = 0,
  commission_rate_bps = 0,
  commission_amount = 0,
  seller_payout_amount = total_amount,
  platform_revenue_amount = 0
where unit_price is null;

alter table public.orders
  alter column unit_price set not null,
  alter column subtotal_amount set not null,
  alter column verification_option set not null,
  alter column verification_fee set not null,
  alter column commission_rate_bps set not null,
  alter column commission_amount set not null,
  alter column seller_payout_amount set not null,
  alter column platform_revenue_amount set not null;

alter table public.orders
  drop constraint if exists orders_revenue_amounts_nonnegative,
  drop constraint if exists orders_commission_rate_valid,
  add constraint orders_revenue_amounts_nonnegative check (
    unit_price >= 0 and subtotal_amount >= 0 and verification_fee >= 0 and
    commission_amount >= 0 and seller_payout_amount >= 0 and platform_revenue_amount >= 0
  ),
  add constraint orders_commission_rate_valid check (
    commission_rate_bps between 0 and 10000
  );

drop function if exists public.place_catalog_order(uuid, uuid, integer);

create or replace function public.place_catalog_order(
  p_product_id uuid,
  p_buyer_id uuid,
  p_quantity integer,
  p_verification_option public.verification_option,
  p_expected_unit_price numeric,
  p_subtotal_amount numeric,
  p_verification_fee numeric,
  p_commission_rate_bps integer,
  p_commission_amount numeric,
  p_seller_payout_amount numeric,
  p_platform_revenue_amount numeric,
  p_total_amount numeric
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  listing public.products%rowtype;
  new_order public.orders%rowtype;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select * into listing
  from public.products
  where id = p_product_id
  for update;

  if not found then raise exception 'LISTING_NOT_FOUND'; end if;
  if listing.seller_id = p_buyer_id then raise exception 'CANNOT_PURCHASE_OWN_LISTING'; end if;
  if not exists (select 1 from public.users where id = p_buyer_id) then raise exception 'BUYER_NOT_FOUND'; end if;
  if listing.status <> 'available' or listing.stock <= 0 then raise exception 'SLOT_TAKEN'; end if;
  if p_quantity > listing.stock then raise exception 'INSUFFICIENT_STOCK'; end if;
  if p_expected_unit_price is distinct from listing.price then raise exception 'PRICE_CHANGED'; end if;

  if
    p_subtotal_amount is distinct from round(listing.price * p_quantity, 2) or
    p_commission_amount is distinct from round(p_subtotal_amount * p_commission_rate_bps / 10000, 2) or
    p_seller_payout_amount is distinct from p_subtotal_amount - p_commission_amount or
    p_platform_revenue_amount is distinct from p_commission_amount + p_verification_fee or
    p_total_amount is distinct from p_subtotal_amount + p_verification_fee
  then
    raise exception 'INVALID_PRICING_SNAPSHOT';
  end if;

  insert into public.orders (
    product_id, buyer_id, quantity, unit_price, subtotal_amount,
    verification_option, verification_fee, commission_rate_bps,
    commission_amount, seller_payout_amount, platform_revenue_amount,
    total_amount, escrow_status, tracking_number
  ) values (
    p_product_id, p_buyer_id, p_quantity, listing.price, p_subtotal_amount,
    p_verification_option, p_verification_fee, p_commission_rate_bps,
    p_commission_amount, p_seller_payout_amount, p_platform_revenue_amount,
    p_total_amount, 'pending', null
  ) returning * into new_order;

  update public.products
  set
    stock = listing.stock - p_quantity,
    status = case
      when listing.stock - p_quantity <= 0 then 'sold'::public.product_status
      else listing.status
    end
  where id = p_product_id;

  return new_order;
end;
$$;

revoke all on function public.place_catalog_order(
  uuid, uuid, integer, public.verification_option, numeric, numeric,
  numeric, integer, numeric, numeric, numeric, numeric
) from public;
grant execute on function public.place_catalog_order(
  uuid, uuid, integer, public.verification_option, numeric, numeric,
  numeric, integer, numeric, numeric, numeric, numeric
) to service_role;
```

Run the migration contract test and expect PASS.

- [ ] **Step 6: Update TypeScript contracts**

Import and re-export `VerificationOption` from `src/lib/pricing/rules.ts` in `src/types/index.ts`, then extend `Order` with:

```ts
unit_price: number;
subtotal_amount: number;
verification_option: VerificationOption;
verification_fee: number;
commission_rate_bps: number;
commission_amount: number;
seller_payout_amount: number;
platform_revenue_amount: number;
```

Import `VerificationOption` in `src/types/database.ts`, add `verification_option: VerificationOption` to `Database["public"]["Enums"]`, and replace the Supabase RPC argument type with:

```ts
{
  p_product_id: string; p_buyer_id: string; p_quantity: number;
  p_verification_option: VerificationOption; p_expected_unit_price: number;
  p_subtotal_amount: number; p_verification_fee: number;
  p_commission_rate_bps: number; p_commission_amount: number;
  p_seller_payout_amount: number; p_platform_revenue_amount: number;
  p_total_amount: number;
}
```

- [ ] **Step 7: Add the server catalog quote adapter**

Create `src/lib/pricing/catalog.ts`:

```ts
import { createAdminClient } from "@/src/lib/supabase/admin";
import { pricingQuoteSchema } from "@/src/lib/validators/catalog";
import type { ActionResult, CatalogErrorCode } from "@/src/types";
import { calculateOrderPricing, pricingBreakdownToPesos, type PricingSnapshotPesos } from "./calculate";

export type CatalogPricingQuote = {
  product_id: string;
  quantity: number;
  pricing: PricingSnapshotPesos;
};

function fail(code: CatalogErrorCode, error: string): ActionResult<never> {
  return { ok: false, code, error };
}

export async function quoteCatalogPricing(
  rawInput: unknown,
): Promise<ActionResult<CatalogPricingQuote>> {
  const parsed = pricingQuoteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: "Invalid input.",
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, price, status, stock")
    .eq("id", parsed.data.product_id)
    .maybeSingle();

  if (error) return fail("INTERNAL_ERROR", error.message);
  if (!data) return fail("NOT_FOUND", "Instrument not found.");

  const stock = Number(data.stock ?? 0);
  if (data.status !== "available" || stock < parsed.data.quantity) {
    return fail("CONFLICT", "Requested quantity exceeds available stock or this listing is already reserved.");
  }

  const unitPrice = Number(data.price);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return fail("INTERNAL_ERROR", "The catalog contains an invalid price.");
  }

  const breakdown = calculateOrderPricing({
    unitPriceCentavos: Math.round(unitPrice * 100),
    quantity: parsed.data.quantity,
    verificationOption: parsed.data.verification_option,
  });

  return {
    ok: true,
    data: {
      product_id: data.id,
      quantity: parsed.data.quantity,
      pricing: pricingBreakdownToPesos(breakdown),
    },
  };
}
```

- [ ] **Step 8: Replace order pricing flow**

Import `quoteCatalogPricing`. In `mapOrder`, preserve the spread and convert every numeric field:

```ts
return {
  ...row,
  quantity: Number(row.quantity),
  unit_price: Number(row.unit_price),
  subtotal_amount: Number(row.subtotal_amount),
  verification_fee: Number(row.verification_fee),
  commission_rate_bps: Number(row.commission_rate_bps),
  commission_amount: Number(row.commission_amount),
  seller_payout_amount: Number(row.seller_payout_amount),
  platform_revenue_amount: Number(row.platform_revenue_amount),
  total_amount: Number(row.total_amount),
};
```

After validating `rawInput` in `placeCatalogOrder`, request the server quote and return its error unchanged:

```ts
const quote = await quoteCatalogPricing({
  product_id: parsed.data.product_id,
  quantity: parsed.data.quantity,
  verification_option: parsed.data.verification_option,
});
if (!quote.ok) return quote;
const pricing = quote.data.pricing;
```

Replace the three-argument RPC call with:

```ts
const { data, error } = await supabase.rpc("place_catalog_order", {
  p_product_id: parsed.data.product_id,
  p_buyer_id: parsed.data.buyer_id,
  p_quantity: parsed.data.quantity,
  p_verification_option: pricing.verification_option,
  p_expected_unit_price: pricing.unit_price,
  p_subtotal_amount: pricing.subtotal_amount,
  p_verification_fee: pricing.verification_fee,
  p_commission_rate_bps: pricing.commission_rate_bps,
  p_commission_amount: pricing.commission_amount,
  p_seller_payout_amount: pricing.seller_payout_amount,
  p_platform_revenue_amount: pricing.platform_revenue_amount,
  p_total_amount: pricing.total_amount,
});
```

Before the generic `INTERNAL_ERROR` mapping, add:

```ts
if (message.includes("PRICE_CHANGED")) {
  return fail("CONFLICT", "The catalog price changed. Request a fresh quote.");
}
if (message.includes("INVALID_PRICING_SNAPSHOT")) {
  return fail("INTERNAL_ERROR", "The server could not verify the pricing breakdown.");
}
```

- [ ] **Step 9: Verify, commit, push, and open PR 2**

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`. Record an environment-related build failure honestly. Commit `Persist commission and verification pricing`, push `g2/m4-order-pricing`, and open `[G2-M4] Persist commission and verification pricing` against `main`, linked to issues #13 and #14. State that PR 1 merges first; request Member 1 and Member 3 review; do not apply the migration to production.

---

### Task 3: Quote endpoint and PR 3

**Files:**
- Create: `app/api/pricing/quote/route.ts`
- Create: `tests/pricing-http.test.ts`

**Interfaces:**
- Consumes: `quoteCatalogPricing` and `actionResultToResponse`.
- Produces: `POST /api/pricing/quote` with 200/400/404/409/500 JSON.

- [ ] **Step 1: Branch from the tested PR 2 head**

Run `git switch -c g2/m4-pricing-quote`.

- [ ] **Step 2: Write a failing route-source test**

Create `tests/pricing-http.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routePath = new URL("../app/api/pricing/quote/route.ts", import.meta.url);
const source = readFileSync(routePath, "utf8");

test("quote route delegates server pricing and rejects invalid JSON", () => {
  assert.match(source, /request\.json\(\)/);
  assert.match(source, /quoteCatalogPricing\(payload\)/);
  assert.match(source, /actionResultToResponse\(result\)/);
  assert.match(source, /status:\s*400/);
});

test("quote route does not accept a browser total", () => {
  assert.doesNotMatch(source, /\btotal\s*:/);
});
```

Run `npm test`; expected: FAIL with `ENOENT`.

- [ ] **Step 3: Implement the route**

Create:

```ts
import { actionResultToResponse } from "@/src/lib/catalog/http";
import { quoteCatalogPricing } from "@/src/lib/pricing/catalog";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, code: "VALIDATION_ERROR", error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const result = await quoteCatalogPricing(payload);
  return actionResultToResponse(result);
}
```

- [ ] **Step 4: Verify, commit, push, and open PR 3**

Run `npm test`, `npm run typecheck`, `npm run lint`, and `git diff --check`; all must pass. Commit `Add server-owned pricing quote endpoint`, push `g2/m4-pricing-quote`, and open `[G2-M4] Add server pricing quote endpoint` against `main`, linked to issue #14. State that PRs 1–2 merge first and that checkout UI integration waits for Member 2's branch.

---

### Task 4: Repository documentation and Challenge 4

**Files:**
- Create or reconcile: `docs/business.md`, `docs/routes.md`, `docs/schema.md`
- Modify: `docs/challenges.md`
- Create or modify: `AI-USAGE.md`

**Interfaces:**
- Consumes: actual implementation names, outputs, and PR URLs.
- Produces: accurate Member 4 submission documentation.

- [ ] **Step 1: Read Member 2's unmerged docs without editing that branch**

Read `docs/business.md`, `docs/routes.md`, and `docs/schema.md` from `origin/g2/m2-foundation-docs`, plus `docs/challenges.md` from `origin/g2/m2-search-challenge3`. Use `apply_patch` to preserve their content and change only Member 4 sections.

- [ ] **Step 2: Fill the five rules and two worked examples**

Replace `docs/business.md` Section 3 with the exact five owner rules from the design, naming `ACTIVE_PRICING_RULES`, `calculateOrderPricing`, `pricingQuoteSchema`, `quoteCatalogPricing`, and `place_catalog_order`. Include:

- PRS ₱168,000 → ₱13,440 commission, ₱154,560 payout, ₱168,000 buyer total.
- ES-335 ₱195,000 + ₱8,500 physical verification → ₱203,500 buyer total, ₱15,600 commission, ₱179,400 payout, ₱24,100 platform revenue.
- Conclusion: commission aligns revenue with completed sales; verification monetizes trust; GC2 records simulated amounts only.

- [ ] **Step 3: Update route and schema contracts**

Add the quote endpoint row, the order `verification_option`, all eight order fields, historical backfill behavior, and the service-role-only 12-argument RPC. State explicitly that unknown browser totals are stripped and that the quote does not reserve stock.

- [ ] **Step 4: Document Challenge 4 without changing the rule**

Run:

```bash
rg -n "commissionRateBps|280_000|850_000|8%|2,800|8,500" src app supabase tests docs README.md
nl -ba src/lib/pricing/rules.ts
```

Document that the simulated owner request is to change the active 8% rate; the only runtime value requiring an edit is the verified `commissionRateBps` line. Explain that SQL/order rows are historical snapshots and docs/examples are reporting, not active configuration. Link the actual PR 1 URL. Do not make the change.

- [ ] **Step 5: Add AI disclosure**

Append:

```md
| 2026-11-08 (Asia/Manila) | Member 4 / jackchengadmu | Codex | Design and implement commission, verification pricing, persistence, tests and Member 4 documentation | Kept the GC1 8%, ₱2,800 and ₱8,500 rules; used one active rules file, centavo math, server catalog prices and an atomic RPC; left payment/auth and other members' branches unchanged | `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`; human review and deployed evidence remain separate |
```

Adjust the final check list only to commands actually run.

- [ ] **Step 6: Scan and commit docs**

Run `rg -n "Pending — Member 4|Member 4 will fill|TBD|TODO" docs AI-USAGE.md` and `git diff --check`. Preserve placeholders belonging to other members. Commit `Document ToneVault revenue rules and Challenge 4`.

---

### Task 5: Shared Google Doc and two-page PDF

**Files:**
- Edit: Google Doc `16jAjXNTKm_0h2N9bqhNcttawqBxJIBcLFqhRro1WlVs`
- Create: `docs/final-business-summary.md`
- Create: `docs/ToneVault-GC2-Business-Summary.pdf`

**Interfaces:**
- Consumes: verified implementation and documentation.
- Produces: four filled Member 4 locations and a PDF of no more than two pages.

- [ ] **Step 1: Load the required Google Docs request reference and PDF skill**

Re-read the Google Doc revision/text/tables before editing so concurrent work is not overwritten.

- [ ] **Step 2: Replace only the four exact placeholders**

Use these texts:

**Monetization — In GC2:** `Orders record an 8% seller commission and an optional verification service: ₱2,800 remote or ₱8,500 physical. The server recalculates the breakdown from the catalog price and stores it with the order.`

**Monetization — Business Value & Limitation:** `Commission earns revenue only when a sale completes; verification fees monetize ToneVault's trust service. GC2 records simulated amounts only—no real payment, subscription or promoted listing is implemented.`

**Revenue Features:**

```text
1. Marketplace commission — ToneVault keeps 8% of the guitar subtotal. The server stores the rate, commission and seller payout with each saved order.

2. Verification add-on — the buyer may choose none, remote verification for ₱2,800, or physical verification for ₱8,500. The server validates the option and adds the fee once per order.

Both features use the current database price. A total typed by the browser is ignored.
```

**Numerical Examples:**

```text
Commission example: PRS Custom 24 at ₱168,000. Commission = ₱168,000 × 8% = ₱13,440. With no add-on, the buyer pays ₱168,000, the seller receives ₱154,560, and ToneVault records ₱13,440 revenue. This aligns revenue with completed sales.

Verification example: Gibson ES-335 at ₱195,000 plus physical verification at ₱8,500. Buyer total = ₱203,500. Commission = ₱15,600; seller payout = ₱179,400; ToneVault revenue = ₱15,600 + ₱8,500 = ₱24,100. The add-on supports the trust promise but stays optional.
```

- [ ] **Step 3: Verify the Google Doc edit**

Read back changed cells/paragraphs once. Confirm all four Member 4 markers are gone, nearby content is unchanged, and inserted text matches the Avenir 9–10 pt style.

- [ ] **Step 4: Create and verify the PDF**

Create `docs/final-business-summary.md` with: what was built; GC1 alignment; 8% worked example; verification worked example; conclusion and limitations. Use the PDF skill to render `docs/ToneVault-GC2-Business-Summary.pdf`. Run `pdfinfo`; require two pages or fewer. Render every page with Poppler and visually inspect for clipping, overlap, unreadably small text, or blank pages. Repair until clean.

- [ ] **Step 5: Commit final artifacts**

Commit `Add two-page GC2 business summary` with the Markdown source and verified PDF.

---

### Task 6: Final verification and honest handoff

**Files:**
- Modify PR descriptions only if actual results differ.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: reproducible results, three PRs awaiting human review, and a truthful Challenge 5 guide.

- [ ] **Step 1: Run complete local checks**

Run `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, and `git status --short --branch`. Record every exit code. Use an existing ignored `.env.local` only if present; never print or commit it.

- [ ] **Step 2: Run live checks only with an authorized non-production database**

If available, apply the migration, seed, quote all three options, place one order with a deliberately wrong browser `total`, then verify saved pricing and stock. If unavailable, leave database/deployed evidence explicitly pending; never relabel mocks as live evidence.

- [ ] **Step 3: Verify PR boundaries**

Confirm each PR targets `main`, uses the `[G2-M4]` title, links the relevant issue, discloses AI, and requests human review. Do not merge, approve, or write a teammate's review.

- [ ] **Step 4: Give Member 4 the Challenge 5 guide**

Tell the student to use `calculateOrderPricing`, choose three new inputs not copied from automated tests, write predictions before running, show the function and results, change one quantity or verification option, explain the changed fields, and keep the voiced recording unedited and under three minutes. Do not claim the agent's test run as the student's prediction exercise.

- [ ] **Step 5: Report remaining blockers separately**

Separate completed local code/docs/PDF/Google Doc work from missing live deployment/database evidence, PRs awaiting human review/merge, checkout UI pending Member 2 integration, and the student's own Challenge 5 work. Do not mark human-review, merge, deployment, or recording spreadsheet rows complete.
