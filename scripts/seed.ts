import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import type { ProductInsert, VerificationStatus } from "../src/types";

const SEED_SELLER_EMAIL = "vault@tonevault.dev";
const SEED_SELLER_NAME = "ToneVault Vault";
const SEED_BUYER_EMAIL = "buyer@tonevault.dev";
const SEED_BUYER_NAME = "ToneVault Buyer";
const REQUIRED_LISTING_COUNT = 8;

type SeedListing = Omit<ProductInsert, "seller_id"> & {
  brand: string;
  model: string;
  year: number;
  finish: string;
  price: number;
  verification_status: VerificationStatus;
};

const LISTINGS: SeedListing[] = [
  {
    brand: "Fender",
    model: "Stratocaster",
    year: 1965,
    finish: "Olympic White",
    price: 485_000,
    verification_status: "Fully Verified",
    tonevault_score: 94,
    status: "available",
    stock: 1,
    condition_notes:
      "Original CBS-era slab-board Strat with a clean Olympic White finish, intact green guard, and strong L-series stamp. Electronics are period-correct with lively, glassy single-coils. Fully documented and inspected in person.",
    images: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1516924962500-2b4b3da39afd?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    brand: "Gibson",
    model: "Les Paul Standard",
    year: 1959,
    finish: "Cherry Sunburst",
    price: 2_850_000,
    verification_status: "Fully Verified",
    tonevault_score: 96,
    status: "available",
    stock: 1,
    condition_notes:
      "Burst-era Standard with a vivid cherry sunburst top, original PAFs, and a well-preserved neck profile. Checking is honest and unoverpainted. One of the vault's highest-scoring instruments.",
    images: [
      "https://images.unsplash.com/photo-1514649923863-ceaf2794ba05?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1445985543470-41fba5c3144a?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    brand: "Fender",
    model: "Telecaster",
    year: 1972,
    finish: "Olympic White",
    price: 265_000,
    verification_status: "Remote Verified",
    tonevault_score: null,
    status: "available",
    stock: 1,
    condition_notes:
      "Early-70s Tele in Olympic White with the expected large headstock and three-bolt neck. Remote verification confirms serial, pot codes, and original ashtray bridge. Playwear is consistent with a well-kept player-grade vintage piece.",
    images: [
      "https://images.unsplash.com/photo-1508183578693-95d001c0c289?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    brand: "Gibson",
    model: "ES-335",
    year: 1964,
    finish: "Cherry",
    price: 195_000,
    verification_status: "Fully Verified",
    tonevault_score: 91,
    status: "available",
    stock: 1,
    condition_notes:
      "Stop-bar 335 in cherry with a slim '64 neck, original nickel hardware, and airy, uncompressed humbuckers. Fully verified in-hand; binding and center block are clean with only light checking.",
    images: [
      "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1525201548942-d8732f6617f0?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    brand: "PRS",
    model: "Custom 24",
    year: 2016,
    finish: "Cobalt Blue",
    price: 168_000,
    verification_status: "Unverified",
    tonevault_score: null,
    status: "available",
    stock: 1,
    condition_notes:
      "Modern pre-owned Custom 24 in cobalt blue with pattern-regular neck and 85/15 pickups. Seller-supplied photos and description only — ToneVault has not yet completed remote or in-person verification.",
    images: [
      "https://images.unsplash.com/photo-1550291659-44e8d0e8a4b5?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    brand: "Fender",
    model: "Jazzmaster",
    year: 1968,
    finish: "Aquamarine Blue",
    price: 325_000,
    verification_status: "Fully Verified",
    tonevault_score: 92,
    status: "available",
    stock: 1,
    condition_notes:
      "Custom-color 1968 Jazzmaster in aquamarine blue with lead/rhythm circuit intact and original tremolo. Fully verified: nitro is thinning at the edges in a way consistent with age, not a refinish.",
    images: [
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8e3199cd2?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    brand: "Fender",
    model: "Stratocaster",
    year: 1954,
    finish: "Sunburst",
    price: 3_450_000,
    verification_status: "Fully Verified",
    tonevault_score: 98,
    status: "available",
    stock: 1,
    condition_notes:
      "First-year Stratocaster in two-tone sunburst. Original ash body, 1954 serial, and period electronics confirmed during full in-person grading. Exceptional originality; among the highest ToneVault scores issued.",
    images: [
      "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    brand: "Gibson",
    model: "SG Standard",
    year: 1961,
    finish: "Cherry",
    price: 420_000,
    verification_status: "Remote Verified",
    tonevault_score: null,
    status: "available",
    stock: 1,
    condition_notes:
      "Les Paul SG Standard in cherry with the early pointed-end neck and sideways vibrola. Serial, construction details, and hardware were remote-verified from a full photo set and provenance packet.",
    images: [
      "https://images.unsplash.com/photo-1516925043377-52c8fb5c4c1e?auto=format&fit=crop&w=1600&q=80",
    ],
  },
];

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");

  try {
    const contents = readFileSync(envPath, "utf8");

    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    console.warn("Could not read .env.local; using existing process environment.");
  }
}

function listingLabel(listing: SeedListing) {
  return `${listing.year} ${listing.brand} ${listing.model} (${listing.finish})`;
}

async function ensureSeedSeller(supabase: SupabaseClient<Database>) {
  const { data: existingProfile, error: profileError } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("email", SEED_SELLER_EMAIL)
    .maybeSingle();

  if (profileError) {
    if (profileError.message.includes("schema cache")) {
      throw new Error(
        "Core tables are missing. Run supabase/migrations/20241107000000_init_core_tables.sql in the Supabase SQL editor first.",
      );
    }

    throw new Error(`Failed to look up seed seller: ${profileError.message}`);
  }

  let sellerId = existingProfile?.id;

  if (!sellerId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: SEED_SELLER_EMAIL,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: SEED_SELLER_NAME },
    });

    if (createError || !created.user) {
      throw new Error(
        `Failed to create seed seller auth user: ${createError?.message ?? "unknown error"}`,
      );
    }

    sellerId = created.user.id;
    console.log(`Created seed seller auth user ${SEED_SELLER_EMAIL}`);
  } else {
    console.log(`Seed seller already exists (${SEED_SELLER_EMAIL})`);
  }

  const { error: roleError } = await supabase
    .from("users")
    .update({ role: "seller", full_name: SEED_SELLER_NAME })
    .eq("id", sellerId);

  if (roleError) {
    throw new Error(`Failed to promote seed seller: ${roleError.message}`);
  }

  return sellerId;
}

async function ensureSeedBuyer(supabase: SupabaseClient<Database>) {
  const { data: existingProfile, error: profileError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", SEED_BUYER_EMAIL)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to look up seed buyer: ${profileError.message}`);
  }

  if (existingProfile?.id) {
    console.log(`Seed buyer already exists (${SEED_BUYER_EMAIL}) [${existingProfile.id}]`);
    return existingProfile.id;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: SEED_BUYER_EMAIL,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: SEED_BUYER_NAME },
  });

  if (createError || !created.user) {
    throw new Error(
      `Failed to create seed buyer auth user: ${createError?.message ?? "unknown error"}`,
    );
  }

  const { error: nameError } = await supabase
    .from("users")
    .update({ full_name: SEED_BUYER_NAME, role: "buyer" })
    .eq("id", created.user.id);

  if (nameError) {
    throw new Error(`Failed to label seed buyer: ${nameError.message}`);
  }

  console.log(`Created seed buyer ${SEED_BUYER_EMAIL} [${created.user.id}]`);
  return created.user.id;
}

async function seedListing(
  supabase: SupabaseClient<Database>,
  sellerId: string,
  listing: SeedListing,
) {
  const label = listingLabel(listing);

  const { data: existing, error: lookupError } = await supabase
    .from("products")
    .select("id")
    .eq("brand", listing.brand)
    .eq("model", listing.model)
    .eq("year", listing.year)
    .eq("finish", listing.finish)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Lookup failed for ${label}: ${lookupError.message}`);
  }

  const payload = {
    seller_id: sellerId,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    finish: listing.finish,
    price: listing.price,
    verification_status: listing.verification_status,
    tonevault_score: listing.tonevault_score,
    condition_notes: listing.condition_notes,
    status: listing.status ?? "available",
    stock: listing.stock ?? 1,
    images: listing.images ?? [],
  };

  if (existing) {
    const { error: refreshError } = await supabase
      .from("products")
      .update({
        price: payload.price,
        verification_status: payload.verification_status,
        tonevault_score: payload.tonevault_score,
        condition_notes: payload.condition_notes,
        status: payload.status,
        stock: payload.stock,
        images: payload.images,
      })
      .eq("id", existing.id);

    if (refreshError) {
      throw new Error(`Refresh failed for ${label}: ${refreshError.message}`);
    }

    console.log(
      `Refreshed: ${label} [${existing.id}] ₱${payload.price.toLocaleString("en-PH")} stock=${payload.stock}`,
    );
    return "refreshed" as const;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(`Insert failed for ${label}: ${insertError?.message ?? "unknown error"}`);
  }

  console.log(`Inserted: ${label} [${inserted.id}]`);
  return "inserted" as const;
}

async function main() {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local.",
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (LISTINGS.length !== REQUIRED_LISTING_COUNT) {
    throw new Error(
      `Seed catalog must contain exactly ${REQUIRED_LISTING_COUNT} instruments (found ${LISTINGS.length}).`,
    );
  }

  console.log("Seeding ToneVault listings...");

  const sellerId = await ensureSeedSeller(supabase);
  const buyerId = await ensureSeedBuyer(supabase);
  let inserted = 0;
  let refreshed = 0;

  for (const listing of LISTINGS) {
    try {
      const result = await seedListing(supabase, sellerId, listing);
      if (result === "inserted") inserted += 1;
      else refreshed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      throw error;
    }
  }

  console.log(
    `Seed complete. inserted=${inserted} refreshed=${refreshed} total=${LISTINGS.length}`,
  );
  console.log(`Postman buyer_id=${buyerId} (${SEED_BUYER_EMAIL})`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Seed failed: ${message}`);
    process.exit(1);
  });
