/**
 * GET /api/tourism/reservations/[id]/invoice
 * Returns HTML invoice for print/save as PDF.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { differenceInDays, format } from "date-fns";
import { sl } from "date-fns/locale";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        property: { select: { name: true, location: true, currency: true } },
        guest: { select: { name: true, email: true, phone: true } },
        payments: { orderBy: { paidAt: "asc" } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const property = await getPropertyForUser(reservation.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const nights = differenceInDays(reservation.checkOut, reservation.checkIn);
    const totalPrice = reservation.totalPrice ?? 0;
    const touristTax = reservation.touristTax ?? 0;
    const totalPaid = reservation.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = totalPrice + touristTax;
    const outstanding = Math.max(0, totalDue - totalPaid);
    const currency = reservation.property?.currency ?? "EUR";
    const symbol = currency === "EUR" ? "€" : currency + " ";

    const guestName = reservation.guest?.name ?? "Gost";
    const guestEmail = reservation.guest?.email ?? "";
    const guestPhone = reservation.guest?.phone ?? "";
    const propName = reservation.property?.name ?? "Nastanitev";
    const propLocation = reservation.property?.location ?? "";

    const html = `<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Račun – ${propName}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 24px; max-width: 600px; }
    h1 { font-size: 1.5rem; margin: 0 0 8px 0; }
    .subtitle { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 8px 12px; text-align: left; }
    th { font-weight: 600; }
    .border-top { border-top: 1px solid #ddd; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .mt-4 { margin-top: 24px; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>Račun</h1>
  <div class="subtitle">${propName}${propLocation ? ` – ${propLocation}` : ""}</div>

  <table>
    <tr><th>Gost</th><td>${escapeHtml(guestName)}</td></tr>
    ${guestEmail ? `<tr><th>E-pošta</th><td>${escapeHtml(guestEmail)}</td></tr>` : ""}
    ${guestPhone ? `<tr><th>Telefon</th><td>${escapeHtml(guestPhone)}</td></tr>` : ""}
  </table>

  <table>
    <tr><th>Prihod</th><td>${format(reservation.checkIn, "d. MMMM yyyy", { locale: sl })}</td></tr>
    <tr><th>Odhod</th><td>${format(reservation.checkOut, "d. MMMM yyyy", { locale: sl })}</td></tr>
    <tr><th>Št. noči</th><td>${nights}</td></tr>
  </table>

  <table>
    <tr><th>Postavka</th><th class="text-right">Znesek</th></tr>
    <tr><td>Nastanitev (${nights} noči)</td><td class="text-right">${symbol}${totalPrice.toFixed(2)}</td></tr>
    ${touristTax > 0 ? `<tr><td>Turistična taksa</td><td class="text-right">${symbol}${touristTax.toFixed(2)}</td></tr>` : ""}
    <tr class="border-top"><td class="font-bold">Skupaj za plačilo</td><td class="text-right font-bold">${symbol}${totalDue.toFixed(2)}</td></tr>
  </table>

  <table>
    <tr><th>Plačano</th><td class="text-right">${symbol}${totalPaid.toFixed(2)}</td></tr>
    <tr class="border-top"><td class="font-bold">Stanje dolga</td><td class="text-right font-bold">${symbol}${outstanding.toFixed(2)}</td></tr>
  </table>

  ${reservation.payments.length > 0 ? `
  <div class="mt-4">
    <strong>Plačila</strong>
    <table>
      <tr><th>Datum</th><th>Vrsta</th><th>Način</th><th class="text-right">Znesek</th></tr>
      ${reservation.payments.map((p) => `
        <tr>
          <td>${format(new Date(p.paidAt), "d.M.yyyy")}</td>
          <td>${typeLabel(p.type)}</td>
          <td>${methodLabel(p.method)}</td>
          <td class="text-right">${symbol}${p.amount.toFixed(2)}</td>
        </tr>
      `).join("")}
    </table>
  </div>
  ` : ""}

  <p class="mt-4" style="font-size: 0.8rem; color: #888;">
    Račun izdan: ${format(new Date(), "d. MMMM yyyy, HH:mm", { locale: sl })}. Za tiskanje oz. shranitev kot PDF uporabite Ctrl+P / Cmd+P.
  </p>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Invoice error:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    deposit: "Akontacija",
    balance: "Stanje",
    tourist_tax: "Turistična taksa",
    extra: "Dodatno",
  };
  return labels[type] ?? type;
}

function methodLabel(method: string | null): string {
  if (!method) return "—";
  const labels: Record<string, string> = {
    cash: "Gotovina",
    card: "Kartica",
    transfer: "Nakazilo",
  };
  return labels[method] ?? method;
}
