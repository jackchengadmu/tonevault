# Business evidence — student completion required

Needs GC1 verification: the original GC1 proposal was not supplied. Do not substitute inferred quotes or AI-written business reasoning. The team must supply exact quotations with page/section references and approve each mapping.

| Exact category | Literal GC1 quote + source | Student explanation of GC2 implementation |
| --- | --- | --- |
| target market | Needs original GC1 | Needs human reasoning/approval |
| problem | Needs original GC1 | Needs human reasoning/approval |
| value prop | Needs original GC1 | Needs human reasoning/approval |
| monetization | Needs original GC1 | Member 4 must decide/approve |
| platform features | Needs original GC1 | Needs human reasoning/approval |

## Funnel map (source facts; rationale and metrics remain human-owned)

| Stage | Current interface | Supporting endpoint | Student UI rationale | Business metric chosen by student |
| --- | --- | --- | --- | --- |
| Browse | `/browse`, URL filters, product cards | `GET /api/products` in remediation PR | Needs human explanation | Needs human decision |
| Select | `/products/[id]`; cart state PR #2 pending | `GET /api/products/:id` exists; current Detail still uses action | Needs human explanation | Needs human decision |
| Confirm | Checkout missing (Member 3) | `POST /api/orders` single-product contract | Needs Member 3 input | Needs human decision |
| Save | Confirmation missing (Member 3) | `GET /api/orders/:id` planned | Needs Member 3 input | Needs human decision |

## Five owner rules and decisions — Member 5

For each of rules 1–5, fill: **observed metric / exact rule / decision / human rationale / saved-data evidence**. All five remain pending; an AI-generated rule is not a student's decision. Planned supporting endpoint: `GET /api/metrics`.

## Two revenue worked examples — Member 4

Example 1 and Example 2 each require: **agreed rule, real test inputs, server/DB calculation, expected total, actual total, endpoint/test evidence, student explanation**. Both remain pending. Do not invent discounts, fees, outcomes or reasoning before the team chooses and implements the two rules.
