import { NextResponse } from "next/server";
import db, { Eragilea, User } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Posta elektronikoa eta pasahitza beharrezkoak dira." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail) as User | undefined;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Ez da erabiltzailerik aurkitu helbide elektroniko honekin." },
        { status: 401 }
      );
    }

    if (user.password !== cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Pasahitza ez da zuzena." },
        { status: 401 }
      );
    }

    let eragilea: Eragilea | null = null;
    if (user.eragile_id) {
      eragilea = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(user.eragile_id) as Eragilea | null;
    }

    // Do not return password to client
    const safeUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      eragile_id: user.eragile_id,
      created_at: user.created_at,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
      eragilea,
    });
  } catch (error) {
    console.error("Errorea saioa hastean:", error);
    return NextResponse.json(
      { success: false, error: "Errorea gertatu da saioa hastean." },
      { status: 500 }
    );
  }
}
