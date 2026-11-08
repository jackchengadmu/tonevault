# Saved-order Confirmation UI and Member 3 handoff

Routes: `/confirmation` accepts a UUID reference; `/confirmation/[id]` retrieves a saved order only through the own application API. It never derives success from the cart, query-string totals, localStorage or an invented reference. GC1 page 13 informs the restrained header/status progression and pale saved-details panel. A pending order is explicitly pending, not paid or shipped.

The repository currently has POST /api/orders but no GET /api/orders/:id. Its three existing database orders do not make a public read API safe. This UI therefore shows **Order confirmation unavailable** for the actual missing route. It has reference validation, loading/retry, access-required, not-found and malformed-response states. The saved-order layout is implemented behind a validated matching server response, but is not claimed as live functional until Member 3 implements authorized reads.

## Proposed read adapter — requires Member 3 agreement

`fetchSavedOrder` expects GET /api/orders/:id to return the established ActionResult style `{ ok: true, data: { order } }`, with the repository's `Order` fields (id, product_id, buyer_id, quantity, total_amount, escrow_status, tracking_number, created_at). This is an explicit integration proposal, not a claim that the endpoint exists. Numeric fields must be normalized by the server. JSON NOT_FOUND maps to not-found; 401/403 to access-required; HTML route 404/405/501 to missing integration. Malformed, mismatched-ID or invalid money/quantity data cannot display a confirmation.

The authorized server must derive identity from a session and enforce order-participant/admin access before returning private data. No server key is placed in client code and no direct service-role database read is added. Private order details are not fetched for screenshots/tests. Contact/shipping are not available in the current `Order` model, and no invented values are shown.

Product information is fetched separately from the public Detail API; failure does not erase the saved order record. The saved total always comes from the order response, never the current catalog price. Model-reference photography is labeled and is not shipment or inspection evidence. No payment, tracking update, order creation or cart clearing is performed by this page.

Validation: TypeScript/ESLint, adapter unit tests and browser checks. Positive/denied/missing contract cases intercept requests with explicitly synthetic responses; they are not real saved database orders. Actual screenshots show only the genuine unavailable state. See `docs/evidence/confirmation-interface/results.json` for completed cases. Expected 404/403 console resource messages for the missing/intercepted endpoint are recorded separately from unexpected UI errors. Human review and a real authorized server response remain required for end-to-end order confirmation.
