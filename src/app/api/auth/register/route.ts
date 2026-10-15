import { NextResponse } from "next/server";
import db, { Eragilea, User } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { izena, mota, arduraduna, email, password, erronka_nagusia } = body;

    // Validation
    if (!izena || !mota || !arduraduna || !email || !password || !erronka_nagusia) {
      return NextResponse.json(
        { success: false, error: "Eremu guztiak bete behar dira kontua sortzeko." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: "Pasahitzak gutxienez 4 karaktere izan behar ditu." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(cleanEmail);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Helbide elektroniko honekin badago dagoeneko kontu bat erregistratuta. Hasi saioa." },
        { status: 409 }
      );
    }

    const zentroId = "zentro-" + Date.now();
    const userId = "user-" + Date.now();
    const sortze_data = new Date().toISOString();

    const insertCenterAndUser = db.transaction(() => {
      // 1. Insert center
      const insertCenter = db.prepare(`
        INSERT INTO eragileak (id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertCenter.run(
        zentroId,
        izena.trim(),
        mota,
        arduraduna.trim(),
        cleanEmail,
        erronka_nagusia.trim(),
        sortze_data
      );

      // 2. Insert user
      const insertUser = db.prepare(`
        INSERT INTO users (id, email, password, name, role, eragile_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertUser.run(
        userId,
        cleanEmail,
        cleanPassword,
        arduraduna.trim(),
        "eragilea",
        zentroId,
        sortze_data
      );

      // 3. Insert welcome nudge
      const insertNudge = db.prepare(`
        INSERT INTO nudges (id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertNudge.run(
        "nudge-" + Date.now(),
        zentroId,
        "Ongi etorri Bidean Eragin-era! 🌟",
        `Kontua sortuta! Zure erronka nagusia (${erronka_nagusia.trim()}) gainditzeko lehen urratsa prest duzu: aukeratu pilotu bat katalogoan eta hasi zure lehen hipotesiarekin.`,
        "bultzada",
        new Date(Date.now() + 86400000 * 3).toISOString(),
        0,
        "/katalogoa",
        sortze_data
      );
    });

    insertCenterAndUser();

    const newUser = db.prepare("SELECT id, email, name, role, eragile_id, created_at FROM users WHERE id = ?").get(userId) as User;
    const newEragilea = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(zentroId) as Eragilea;

    return NextResponse.json({
      success: true,
      user: newUser,
      eragilea: newEragilea,
    });
  } catch (error) {
    console.error("Errorea kontua sortzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da kontua sortu sistemaren akats bategatik." },
      { status: 500 }
    );
  }
}
