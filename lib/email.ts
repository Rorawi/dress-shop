import { Resend } from "resend";

export async function sendOrderConfirmation({
  to,
  customerName,
  orderId,
  items,
  total,
}: {
  to: string;
  customerName: string;
  orderId: string;
  items: { name: string; size: string; quantity: number; price: number }[];
  total: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const resend = new Resend(apiKey);
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}${item.size.toLowerCase() === "one size" ? "" : ` (${item.size})`}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">£${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  await resend.emails.send({
    from: "Charwin Stores <orders@yourdomain.com>",
    to,
    subject: `Order Confirmed – #${orderId.slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#17141C">
        <div style="background:#55239A;padding:32px;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px">Charwin Stores</h1>
        </div>
        <div style="padding:32px">
          <h2>Thank you, ${customerName}!</h2>
          <p>Your order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <thead>
              <tr style="background:#FCFBFD">
                <th style="padding:8px;text-align:left">Item</th>
                <th style="padding:8px;text-align:center">Qty</th>
                <th style="padding:8px;text-align:right">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="text-align:right;font-size:18px"><strong>Total: £${total.toFixed(2)}</strong></p>
          <p style="color:#625B68;margin-top:32px">We'll send you a shipping confirmation once your order is on its way.</p>
        </div>
      </div>
    `,
  });
}
