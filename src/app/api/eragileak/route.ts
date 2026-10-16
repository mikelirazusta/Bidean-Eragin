import { NextResponse } from "next/server";
import db, { Eragilea, syncDbFromCloud, syncDbToCloud } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await syncDbFromCloud();

    const body = await request.json();
    const { izena, mota, arduraduna, email, erronka_nagusia } = body;

    if (!izena || !mota || !erronka_nagusia) {
      return NextResponse.json(
        { success: false, error: "Datu guztiak beharrezkoak dira" },
        { status: 400 }
      );
    }

    const id = "zentro-" + Date.now();
    const sortze_data = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO eragileak (id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      izena.trim(),
      mota,
      (arduraduna || "Arduraduna").trim(),
      (email || "").trim(),
      erronka_nagusia.trim(),
      sortze_data
    );

    // If email is provided, create/link user
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(cleanEmail);
      if (!existing) {
        db.prepare(`
          INSERT INTO users (id, email, password, name, role, eragile_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          "user-" + Date.now(),
          cleanEmail,
          body.password ? body.password.trim() : "bidean123",
          (arduraduna || "Arduraduna").trim(),
          "eragilea",
          id,
          sortze_data
        );
      }
    }

    // Initial welcome nudge
    const insertNudge = db.prepare(`
      INSERT INTO nudges (id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNudge.run(
      "nudge-" + Date.now(),
      id,
      "Ongi etorri Bidean Eragin komunitatera! 🌟",
      `Zure erronka (${erronka_nagusia}) gainditzeko lehen urratsa prest dago: aukeratu pilotu bat katalogoan eta sortu zure lehen hipotesia!`,
      "bultzada",
      new Date(Date.now() + 86400000 * 3).toISOString(),
      0,
      "/katalogoa",
      sortze_data
    );

    const eragilea = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(id) as Eragilea;

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      data: eragilea,
    });
  } catch (error) {
    console.error("Errorea eragilea sortzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da eragilea erregistratu" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await syncDbFromCloud();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Zentroaren IDa beharrezkoa da" },
        { status: 400 }
      );
    }

    // Find experiments belonging to this eragile and delete their measurements
    const exps = db.prepare("SELECT id FROM esperimentuak WHERE eragile_id = ?").all(id) as { id: string }[];
    for (const exp of exps) {
      db.prepare("DELETE FROM neurketak WHERE esperimentu_id = ?").run(exp.id);
    }

    db.prepare("DELETE FROM esperimentuak WHERE eragile_id = ?").run(id);
    db.prepare("DELETE FROM nudges WHERE eragile_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE eragile_id = ?").run(id);
    db.prepare("DELETE FROM eragileak WHERE id = ?").run(id);

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      message: "Saltokia eta bere proba-datu guztiak ezabatu dira.",
    });
  } catch (error) {
    console.error("Errorea eragilea ezabatzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da saltokia ezabatu" },
      { status: 500 }
    );
  }
}

