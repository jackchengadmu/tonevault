"use server";

import { updateTag } from "next/cache";
import {
  placeCatalogOrder,
  queryProductById,
  queryProducts,
} from "@/src/lib/catalog/queries";
import type { ProductFiltersInput } from "@/src/lib/validators/catalog";

export async function getProducts(filters: ProductFiltersInput = {}) {
  return queryProducts(filters);
}

export async function getProductById(id: string) {
  return queryProductById(id);
}

export async function createOrder(input: {
  product_id: string;
  buyer_id: string;
  quantity: number;
}) {
  const result = await placeCatalogOrder(input);

  if (result.ok) {
    updateTag("products");
    updateTag(`product-${result.data.order.product_id}`);
  }

  return result;
}
