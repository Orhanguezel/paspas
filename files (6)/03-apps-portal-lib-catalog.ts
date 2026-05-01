// apps/portal/lib/catalog.ts
// Katalog sorguları. Bayi iskontosu burada hesaplanır, frontend'e güvenmiyoruz.

import { db } from "@/lib/db";
import { products, vehicleCompat, customers } from "@mat-erp/db/schema/erp";
import { eq, and, ilike, sql } from "drizzle-orm";

export type CatalogFilters = {
  make?: string;
  model?: string;
  year?: number;
  paspasType?: "kaucuk" | "havuz_3d" | "hali";
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getDealerDiscount(customerId: number): Promise<number> {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
    columns: { discountRate: true, status: true },
  });
  if (!customer || customer.status === "passive") {
    throw new Error("Müşteri aktif değil");
  }
  return Number(customer.discountRate ?? 0);
}

export function applyDiscount(listPrice: number, discountRate: number): {
  listPrice: number;
  finalPrice: number;
  discountPct: number;
} {
  const finalPrice = Number((listPrice * (1 - discountRate)).toFixed(2));
  return {
    listPrice,
    finalPrice,
    discountPct: Number((discountRate * 100).toFixed(2)),
  };
}

export async function getCatalog(customerId: number, filters: CatalogFilters) {
  const discount = await getDealerDiscount(customerId);
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 24, 100);

  const conditions = [eq(products.active, true)];
  if (filters.paspasType) conditions.push(eq(products.type, filters.paspasType));
  if (filters.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }

  // Eğer araç filtresi varsa vehicleCompat ile join
  let query = db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      type: products.type,
      listPrice: products.basePrice,
      stock: products.stockQuantity,
      image: products.imageUrl,
    })
    .from(products)
    .where(and(...conditions))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .$dynamic();

  if (filters.make || filters.model || filters.year) {
    const compatConditions = [];
    if (filters.make) compatConditions.push(eq(vehicleCompat.make, filters.make));
    if (filters.model) compatConditions.push(eq(vehicleCompat.model, filters.model));
    if (filters.year) {
      compatConditions.push(
        sql`${vehicleCompat.yearStart} <= ${filters.year} AND ${vehicleCompat.yearEnd} >= ${filters.year}`,
      );
    }
    query = query.innerJoin(
      vehicleCompat,
      and(eq(vehicleCompat.productId, products.id), ...compatConditions),
    );
  }

  const rows = await query;

  return rows.map((p) => ({
    ...p,
    pricing: applyDiscount(Number(p.listPrice), discount),
  }));
}

// Marka/model dropdown'ları için
export async function getMakes() {
  const rows = await db
    .selectDistinct({ make: vehicleCompat.make })
    .from(vehicleCompat)
    .orderBy(vehicleCompat.make);
  return rows.map((r) => r.make);
}

export async function getModels(make: string) {
  const rows = await db
    .selectDistinct({ model: vehicleCompat.model })
    .from(vehicleCompat)
    .where(eq(vehicleCompat.make, make))
    .orderBy(vehicleCompat.model);
  return rows.map((r) => r.model);
}
