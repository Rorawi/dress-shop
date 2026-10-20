import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const meta = paymentIntent.metadata;

    // Prevent duplicate orders
    const existing = await prisma.order.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });
    if (existing) {
      return NextResponse.json({ received: true });
    }

    const rawItems = JSON.parse(meta.items ?? "[]") as {
      productId: string;
      variantId: string;
      quantity: number;
      price: number;
      size: string;
    }[];

    const total = paymentIntent.amount / 100;

    try {
      const order = await prisma.order.create({
        data: {
          customerName: meta.customerName,
          customerEmail: meta.customerEmail,
          customerPhone: meta.customerPhone,
          shippingAddress: meta.shippingAddress,
          shippingCity: meta.shippingCity,
          shippingPostcode: meta.shippingPostcode,
          shippingCountry: meta.shippingCountry,
          totalAmount: total,
          stripePaymentId: paymentIntent.id,
          status: "CONFIRMED",
          items: {
            create: rawItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              priceAtPurchase: item.price,
              size: item.size,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // Reduce stock for each variant
      await Promise.all(
        rawItems.map((item) =>
          prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      // Send confirmation email
      await sendOrderConfirmation({
        to: meta.customerEmail,
        customerName: meta.customerName,
        orderId: order.id,
        items: order.items.map((i) => ({
          name: i.product.name,
          size: i.size,
          quantity: i.quantity,
          price: Number(i.priceAtPurchase),
        })),
        total,
      }).catch((e) => console.error("[EMAIL] Failed to send confirmation:", e));

      console.log(`[WEBHOOK] Order created: ${order.id}`);
    } catch (err) {
      console.error("[WEBHOOK] Order creation failed", err);
      return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
