import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Online card checkout is unavailable. Please place your order through the Charwin WhatsApp flow." },
    { status: 410 },
  );
}
