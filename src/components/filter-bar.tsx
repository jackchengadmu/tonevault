"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const PRICE_RANGES = [
  { label: "Any price", value: "" },
  { label: "Under ₱250,000", value: "0-250000" },
  { label: "₱250,000 – ₱500,000", value: "250000-500000" },
  { label: "₱500,000 – ₱1,500,000", value: "500000-1500000" },
  { label: "₱1,500,000+", value: "1500000-" },
];

const CONDITIONS = [
  { label: "Any condition", value: "" },
  { label: "Original", value: "original" },
  { label: "Checking / playwear", value: "checking" },
  { label: "Documented", value: "documented" },
];

function currentPriceValue(minPrice?: string, maxPrice?: string) {
  if (!minPrice && !maxPrice) return "";
  return `${minPrice ?? ""}-${maxPrice ?? ""}`;
}

export function FilterBar({ brands }: { brands: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (name === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
      if (value) {
        const [minPrice, maxPrice] = value.split("-");
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
      }
    } else if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });
  }

  const selectClass =
    "w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold";

  return (
    <form
      className={`grid gap-3 rounded-2xl border border-line bg-panel p-4 sm:grid-cols-2 lg:grid-cols-4 ${
        pending ? "opacity-70" : ""
      }`}
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="block text-[11px] uppercase tracking-[0.18em] text-muted">
        Brand
        <select
          className={`${selectClass} mt-2`}
          value={searchParams.get("brand") ?? ""}
          onChange={(event) => update("brand", event.target.value)}
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em] text-muted">
        Price
        <select
          className={`${selectClass} mt-2`}
          value={currentPriceValue(
            searchParams.get("minPrice") ?? undefined,
            searchParams.get("maxPrice") ?? undefined,
          )}
          onChange={(event) => update("price", event.target.value)}
        >
          {PRICE_RANGES.map((range) => (
            <option key={range.label} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em] text-muted">
        Verification
        <select
          className={`${selectClass} mt-2`}
          value={searchParams.get("verificationStatus") ?? ""}
          onChange={(event) => update("verificationStatus", event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="Fully Verified">Fully Verified</option>
          <option value="Remote Verified">Remote Verified</option>
          <option value="Unverified">Unverified</option>
        </select>
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em] text-muted">
        Condition
        <select
          className={`${selectClass} mt-2`}
          value={searchParams.get("condition") ?? ""}
          onChange={(event) => update("condition", event.target.value)}
        >
          {CONDITIONS.map((condition) => (
            <option key={condition.label} value={condition.value}>
              {condition.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
