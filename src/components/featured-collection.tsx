import Link from "next/link";
import { ProductCard } from "@/src/components/product-card";
import { getProducts } from "@/src/actions/catalog";

export async function FeaturedCollection() {
  const result = await getProducts({ limit: 8, status: "available" });

  if (!result.ok || result.data.products.length === 0) {
    return (
      <p className="text-sm text-muted">
        Featured instruments will appear here once the vault is stocked.
      </p>
    );
  }

  const featured = [...result.data.products]
    .sort((a, b) => (b.tonevault_score ?? 0) - (a.tonevault_score ?? 0))
    .slice(0, 4);

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/browse"
          className="inline-flex rounded-full border border-gold/50 px-5 py-2.5 text-sm text-gold-soft hover:border-gold"
        >
          View the full catalog
        </Link>
      </div>
    </div>
  );
}
