import { notFound } from "next/navigation";
import { ProductGallery } from "@/src/components/product-gallery";
import { PurchaseBar } from "@/src/components/purchase-bar";
import { ScoreBadge, VerificationBadge } from "@/src/components/verification-badge";
import { getProductById } from "@/src/actions/catalog";
import { instrumentTitle } from "@/src/lib/format";

function inspectionCopy(level: "none" | "remote" | "in_person") {
  if (level === "in_person") {
    return "Inspected in person by ToneVault. Serial, construction, electronics, and finish originality are on file.";
  }
  if (level === "remote") {
    return "Remote verification complete: photos, serial, and provenance packet reviewed. In-person grading not yet performed.";
  }
  return "Seller-submitted listing. ToneVault has not completed remote or in-person verification.";
}

export async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProductById(id);

  if (!result.ok) {
    notFound();
  }

  const product = result.data;
  const title = instrumentTitle(product);
  const sellerSince = product.seller
    ? new Date(product.seller.created_at).getFullYear()
    : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-6">
      <ProductGallery images={product.images} alt={title} />

      <div className="space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">{product.brand}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-2 text-muted">{product.finish ?? "Finish not recorded"}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <VerificationBadge status={product.verification_status} />
            <ScoreBadge score={product.tonevault_score} />
          </div>
        </div>

        <PurchaseBar product={product} />

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gold">Technical specifications</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Spec label="Brand" value={product.brand} />
            <Spec label="Model" value={product.model} />
            <Spec label="Year" value={product.year?.toString() ?? "Undated"} />
            <Spec label="Finish" value={product.finish ?? "—"} />
            <Spec label="Status" value={product.status} />
            <Spec label="Vault ID" value={product.id.slice(0, 8)} />
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gold">Verification documentation</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {inspectionCopy(product.inspection.inspection_level)}
          </p>
          {product.condition_notes ? (
            <p className="mt-3 text-sm leading-6 text-foreground">{product.condition_notes}</p>
          ) : null}
          <p className="mt-4 font-mono text-xs text-gold-soft">
            ToneVault Score{" "}
            {product.inspection.tonevault_score == null
              ? "pending"
              : `${product.inspection.tonevault_score} / ${product.inspection.score_scale}`}
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gold">Seller</h2>
          {product.seller ? (
            <div className="mt-3">
              <p className="font-serif text-2xl text-foreground">{product.seller.full_name}</p>
              <p className="mt-1 text-sm capitalize text-muted">{product.seller.role}</p>
              {sellerSince ? (
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
                  Vault member since {sellerSince}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Seller profile is private.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1 capitalize text-foreground">{value}</dd>
    </div>
  );
}
