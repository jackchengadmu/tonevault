import { createAdminClient } from "@/src/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await createAdminClient().rpc("checkout_pricing_rules");
    if (error || !data) throw error;
    return Response.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "Unable to load checkout pricing." }, { status: 500 });
  }
}
