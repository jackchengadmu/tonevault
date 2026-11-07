"use client";

import { useState } from "react";
import { useCart } from "@/src/components/cart-context";
import { formatPrice, instrumentTitle } from "@/src/lib/format";
import type { Product } from "@/src/types";

export function PurchaseBar({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  const sold = product.status === "sold";
  const inCart = items.some((item) => item.id === product.id);
  const title = instrumentTitle(product);

  function cartPayload() {
    return {
      id: product.id,
      title,
      price: product.price,
      image: product.images[0] ?? null,
      finish: product.finish,
    };
  }

  function addToCart() {
    if (sold) return;
    addItem(cartPayload());
    setNotice("Held in your vault cart. Escrow starts at checkout.");
  }

  function buyNow() {
    if (sold) return;
    addItem(cartPayload());
    setNotice(
      "Buy now queued. Complete escrow checkout to mark this listing sold and release funds only after delivery approval.",
    );
  }

  return (
    <div className="sticky bottom-0 z-30 border-t border-line bg-background/95 p-4 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <div className="flex flex-col gap-3 lg:rounded-2xl lg:border lg:border-line lg:bg-panel lg:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Asking price</p>
            <p className="font-serif text-3xl text-foreground">{formatPrice(product.price)}</p>
          </div>
          <p className="text-xs text-muted">{sold ? "No longer available" : "Protected by ToneVault escrow"}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={sold}
            onClick={buyNow}
            className="rounded-full bg-gold px-5 py-3 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>
          <button
            type="button"
            disabled={sold}
            onClick={addToCart}
            className="rounded-full border border-gold/50 px-5 py-3 text-sm font-medium text-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inCart ? "In cart" : "Add to cart"}
          </button>
        </div>
        {notice ? <p className="text-xs leading-5 text-muted">{notice}</p> : null}
      </div>
    </div>
  );
}
