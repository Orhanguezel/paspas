// apps/portal/lib/orders.ts
// Sipariş oluşturma akışı: validation → draft → ERP sync

import { db } from "@/lib/db";
import {
  cart,
  cartItems,
  portalOrderDrafts,
  portalAudit,
} from "@mat-erp/db/schema/portal";
import { customers, orders, orderItems, products } from "@mat-erp/db/schema/erp";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import type { Session } from "@/lib/auth";

const CheckoutSchema = z.object({
  cartId: z.string().uuid(),
  shippingAddress: z.object({
    line1: z.string().min(5),
    city: z.string().min(2),
    district: z.string().min(2),
    postalCode: z.string().optional(),
  }),
  paymentMethod: z.enum(["credit", "transfer", "card"]),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

export async function checkout(session: Session, input: CheckoutInput) {
  const parsed = CheckoutSchema.parse(input);

  return await db.transaction(async (tx) => {
    // 1. Sepeti çek
    const userCart = await tx.query.cart.findFirst({
      where: and(
        eq(cart.id, parsed.cartId),
        eq(cart.userId, session.userId),
        eq(cart.status, "active"),
      ),
      with: { items: true }, // relations kuruluysa
    });

    if (!userCart || !userCart.items?.length) {
      throw new Error("Sepetiniz boş veya geçersiz");
    }

    // 2. Toplam hesapla
    const total = userCart.items.reduce(
      (sum, it) => sum + Number(it.unitPrice) * it.quantity,
      0,
    );

    // 3. Kredi limit & cari kontrol
    const customer = await tx.query.customers.findFirst({
      where: eq(customers.id, session.customerId),
    });
    if (!customer) throw new Error("Müşteri bulunamadı");

    if (parsed.paymentMethod === "credit") {
      const balance = Number(customer.currentBalance ?? 0);
      const limit = Number(customer.creditLimit ?? 0);
      if (balance + total > limit) {
        throw new Error(
          `Kredi limiti aşılıyor. Limit: ${limit.toFixed(2)} ₺, ` +
            `Mevcut bakiye: ${balance.toFixed(2)} ₺. ` +
            `Lütfen havale ile ödeyin veya satış temsilcinizle görüşün.`,
        );
      }
    }

    // 4. Stok kontrolü (lock'lu)
    for (const item of userCart.items) {
      const [{ stock }] = await tx
        .select({ stock: products.stockQuantity })
        .from(products)
        .where(eq(products.id, item.productId))
        .for("update"); // SELECT ... FOR UPDATE
      if (stock < item.quantity) {
        throw new Error(`Stok yetersiz (ürün ${item.productId})`);
      }
    }

    // 5. Draft kaydet (audit için snapshot)
    const [draft] = await tx
      .insert(portalOrderDrafts)
      .values({
        customerId: session.customerId,
        userId: session.userId,
        status: "submitted",
        totalAmount: total.toFixed(2),
        notes: parsed.notes,
        submittedAt: new Date(),
        payload: {
          items: userCart.items,
          shipping: parsed.shippingAddress,
          payment: parsed.paymentMethod,
          dealerDiscount: customer.discountRate,
        },
      })
      .returning();

    // 6. ERP orders tablosuna ekle
    const [erpOrder] = await tx
      .insert(orders)
      .values({
        customerId: session.customerId,
        source: "portal",
        status: "pending",
        totalAmount: total.toFixed(2),
        paymentMethod: parsed.paymentMethod,
        shippingAddress: parsed.shippingAddress,
        portalDraftId: draft.id, // ERP tarafına eklenmesi gereken kolon
      })
      .returning();

    // 7. Order items
    await tx.insert(orderItems).values(
      userCart.items.map((it) => ({
        orderId: erpOrder.id,
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        listPrice: it.listPrice,
        discountPct: it.discountPct,
        vehicleMake: it.vehicleMake,
        vehicleModel: it.vehicleModel,
        vehicleYear: it.vehicleYear,
      })),
    );

    // 8. Stok düş
    for (const item of userCart.items) {
      await tx
        .update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    // 9. Sepeti kapat
    await tx
      .update(cart)
      .set({ status: "checked_out", updatedAt: new Date() })
      .where(eq(cart.id, parsed.cartId));

    // 10. Draft'ı senkronize işaretle
    await tx
      .update(portalOrderDrafts)
      .set({
        status: "erp_synced",
        erpOrderId: erpOrder.id,
        syncedAt: new Date(),
      })
      .where(eq(portalOrderDrafts.id, draft.id));

    // 11. Audit
    await tx.insert(portalAudit).values({
      userId: session.userId,
      customerId: session.customerId,
      action: "order_created",
      entityType: "order",
      entityId: String(erpOrder.id),
      metadata: { total, itemCount: userCart.items.length },
    });

    return {
      orderId: erpOrder.id,
      total,
      itemCount: userCart.items.length,
    };
  });
}
