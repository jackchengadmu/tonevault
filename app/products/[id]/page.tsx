import { Suspense } from "react";
import { ProductDetail } from "@/src/components/product-detail";
import { getProducts } from "@/src/actions/catalog";

export async function generateStaticParams() {
  const [available, sold] = await Promise.all([
    getProducts({ limit: 100, status: "available" }),
    getProducts({ limit: 100, status: "sold" }),
  ]);

  const products = [
    ...(available.ok ? available.data.products : []),
    ...(sold.ok ? sold.data.products : []),
  ];

  return products.map((product) => ({ id: product.id }));
}

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-[70vh] max-w-6xl animate-pulse bg-panel" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}
