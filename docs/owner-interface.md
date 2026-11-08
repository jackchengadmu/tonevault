# Owner interface and Member 5 handoff

`/owner` follows the GC1 pages 13–14 seller-studio/sidebar and restrained table structure. It includes functional Overview/Orders anchors, storefront navigation, a saved-order lookup link, a responsive orders table, and all five required metrics: Total orders, Total revenue, Average order value, Top-selling instrument, Low-stock instruments.

All figures explicitly say **Unavailable**, rather than zero or invented sample revenue. No fictitious orders, seller identity, tracking actions, payouts or inventory management are presented as working. Footer links lead to implemented Order status and Owner routes.

The repository has no authenticated owner session, GET /api/orders or GET /api/metrics implementation. This route is a public UI shell and requests no private business data. A supplied service key must not substitute for owner authentication. This interface does not bypass RLS, fetch orders directly from Supabase, or implement Member 5 backend endpoints.

## Loading, empty and error handling

The route has a loading skeleton and a real Next error boundary with retry. `OwnerOrders` distinguishes unavailable, loading, error, and authorized ready/empty results. Only a supplied ready result containing an empty array can show “No orders yet.” An absent API or failed request cannot be misrepresented as zero orders. The live route selects unavailable until the authenticated integration exists; the other presentation states are tested independently without adding fake live metrics or a production preview switch.

Member 5 must provide authenticated owner/admin authorization, session-derived scope, agreed order-list and five-metric contracts, pagination and live loading/error transitions. Agree metric definitions with Member 4: revenue status/time range, refunds/fees, average value, top-selling quantity/ties, and low-stock threshold. Then replace unavailable with validated own-API data. The presentation row type is an integration aid, not an implemented HTTP contract.

Member 3 provides the authorized saved-order lookup used by the functional link. These interfaces create no orders and modify no metrics. Database records and real server pricing remain untouched.

Branch `g2/m2-owner-interface` is explicitly stacked on Confirmation PR #31, so all seven routes can be inspected together locally while the dashboard diff remains separately reviewable. No dependencies were merged. Human owner/Member 5 review remains required.

Actual results and screenshots are recorded in `docs/evidence/owner-interface/`. The browser script checks all five unavailable metrics, table, anchors/lookup navigation, keyboard input, responsive bounds and zero owner private-data requests. Component checks distinguish unavailable/error from an authorized empty result. No real metrics or authenticated-owner results are claimed. WebKit coverage is not a manual Safari or physical-phone test.

All eight Owner cases passed (Chrome/WebKit × 1440/390px × normal/reduced motion). The final combined verification also caught and corrected a residual shared-dialog WebKit scroll leak. Its original source, actual failure and intermediate header-position correction are preserved in the evidence folder; see [combined results](complete-ui-verification.md). That fix changes no Owner API or business data.
