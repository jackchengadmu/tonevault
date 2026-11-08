"use client";

import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { BuyerAccount } from "@/src/components/buyer-account";
import { useEffect, useState } from "react";
import type { Order, OrderPricing } from "@/src/types";
import { formatPrice } from "@/src/lib/format";

export function OrderConfirmation({ id }: { id: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [pricing, setPricing] = useState<OrderPricing | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) return;
    const accessToken = session.access_token;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal, headers: { Authorization: `Bearer ${accessToken}` } });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error ?? "Unable to load your order.");
        setError("");
        setOrder(result.data.order);
        setPricing(result.data.pricing);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load your order.");
      }
    }
    void load();
    return () => controller.abort();
  }, [id, session]);

  return <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
    <h1 className="font-serif text-4xl">Order confirmation</h1>
    <BuyerAccount onSession={setSession} />
    {!session ? <p className="mt-6">Sign in to view your saved order.</p> : error ? <p role="alert" className="mt-6">{error} <button className="text-gold underline" onClick={() => window.location.reload()}>Try again</button></p> : !order || order.id !== id || order.buyer_id !== session.user.id ? <p role="status" className="mt-6">Loading your saved order…</p> : <div className="mt-8 space-y-4 rounded-2xl border border-line bg-panel p-6">
      <p className="text-gold">Your order has been saved.</p>
      <dl className="space-y-3 break-words">
        <div><dt className="text-sm text-muted">Order reference</dt><dd>{order.id}</dd></div>
        <div><dt className="text-sm text-muted">Instrument reference</dt><dd>{order.product_id}</dd></div>
        <div><dt className="text-sm text-muted">Quantity</dt><dd>{order.quantity}</dd></div>
        {pricing && <>
          <div><dt className="text-sm text-muted">Guitar subtotal</dt><dd>{formatPrice(Number(pricing.merchandise_amount))}</dd></div>
          <div><dt className="text-sm text-muted">Physical inspection</dt><dd>{formatPrice(Number(pricing.inspection_fee))} · {pricing.inspection_status.replaceAll("_", " ")}</dd></div>
        </>}
        <div><dt className="text-sm text-muted">Saved total</dt><dd className="text-2xl">{formatPrice(order.total_amount)}</dd></div>
        <div><dt className="text-sm text-muted">Order status</dt><dd>{order.escrow_status}</dd></div>
      </dl>
      <p className="text-sm text-muted">Payment was simulated. No funds were charged or held. You can reopen this confirmation while signed in to the buyer account used for this order.</p>
    </div>}
    <Link href="/browse" className="mt-8 inline-block text-gold underline">Continue browsing</Link>
  </section>;
}
