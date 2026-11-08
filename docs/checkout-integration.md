# Checkout interface and Member 3 handoff

`/checkout` adapts GC1 pages 11–12 and Tonely's split form/pale summary into route-based Contact → Shipping → Payment → Review UI. The cart links to the form; Add/Buy Now still preserve stock and persistence. Empty cart, field errors, focus, back/edit navigation, payment selection, reduced motion and responsive summary are implemented. Required details remain in React memory only; neither localStorage, URLs nor a backend receives the contact/address. Refresh intentionally clears form details and preserves the existing cart.

This is a form preview, not a working order-placement flow. The final button is disabled. It never calls POST /api/orders, creates an order reference, clears the cart on fake success or claims payment/escrow. Shipping/fees are uncalculated rather than fabricated as free.

On entry/selection changes, GET /api/products/:id refreshes catalog prices and stock. The amount shown is still a preview; no frontend amount is submitted. The final order server must determine all prices, quantities, shipping/fees and atomic availability again at submission. Unavailable stock or GET errors produce visible summary feedback.

## Existing backend and missing integration

Current POST /api/orders accepts one product_id, buyer_id and quantity and calls the database RPC. It does not provide an authenticated cart-wide contact/shipping/payment contract. Do not send a browser-chosen buyer ID, simulate multi-item success with sequential writes, or trust frontend totals. No production RPC was invoked while building this interface.

Member 3 must agree the authenticated checkout contract, derive buyer identity from the session, support the chosen multi-item/atomic policy, validate and persist appropriate contact/shipping fields, apply server-owned prices/fees and return saved order IDs only after a successful transaction. Confirmation needs an authorized order-read API. Error handling must retain the selection and not report success on a partial failure. Coordinate pricing extensions with Member 4. No schema, RPC, auth policy or backend endpoint is changed by this UI PR.

The sample-data development guard and isolated cart namespaces remain intact. This branch is explicitly stacked on `g2/m2-storefront-polish` (PR #27); it does not merge any dependency. Human Member 3/module-owner review is needed before integration.

Validation: TypeScript, ESLint and 21 automated tests passed. The dedicated browser script tests empty/contact/shipping/payment/review, validation/focus, back/edit values, catalog quote refresh, no PII storage and no API writes across Chrome/WebKit desktop/phone with normal/reduced motion. See `docs/evidence/checkout-interface/results.json` for actual completed cases and real screenshots. Test contact details in screenshots are synthetic, not saved customer records.
