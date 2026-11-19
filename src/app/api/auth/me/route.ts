import { NextResponse } from "next/server";
import db, { Eragilea, User, syncDbFromCloud } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false, user: null },
        { status: 401 }
      );
    }

    await syncDbFromCloud();

    const user = db
      .prepare("SELECT id, email, name, role, eragile_id, created_at FROM users WHERE id = ?")
      .get(session.id) as User | undefined;

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, user: null },
        { status: 401 }
      );
    }

    let eragilea: Eragilea | null = null;
    if (user.eragile_id) {
      eragilea = db
        .prepare("SELECT * FROM eragileak WHERE id = ?")
        .get(user.eragile_id) as Eragilea | null;
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user,
        eragilea,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Errorea erabiltzailea egiaztatzean:", error);
    return NextResponse.json(
      { success: false, error: "Errore ezezaguna" },
      { status: 500 }
    );
  }
}
