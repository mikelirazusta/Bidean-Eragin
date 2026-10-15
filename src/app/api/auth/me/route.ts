import { NextResponse } from "next/server";
import db, { Eragilea, User } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId beharrezkoa da" }, { status: 400 });
    }

    const user = db.prepare("SELECT id, email, name, role, eragile_id, created_at FROM users WHERE id = ?").get(userId) as User | undefined;

    if (!user) {
      return NextResponse.json({ success: false, error: "Erabiltzailea ez da aurkitu" }, { status: 404 });
    }

    let eragilea: Eragilea | null = null;
    if (user.eragile_id) {
      eragilea = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(user.eragile_id) as Eragilea | null;
    }

    return NextResponse.json({
      success: true,
      user,
      eragilea,
    });
  } catch (error) {
    console.error("Errorea erabiltzailea egiaztatzean:", error);
    return NextResponse.json({ success: false, error: "Errore ezezaguna" }, { status: 500 });
  }
}
