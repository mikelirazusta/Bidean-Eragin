import { NextResponse } from "next/server";
import db, { Eragilea, syncDbFromCloud, syncDbToCloud } from "@/lib/db";
import { hashPassword, requireAdmin, requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    await syncDbFromCloud();

    const body = await request.json();
    const { izena, mota, arduraduna, email, erronka_nagusia, publikoa } = body;

    if (!izena || !mota || !erronka_nagusia) {
      return NextResponse.json(
        { success: false, error: "Datu guztiak beharrezkoak dira" },
        { status: 400 }
      );
    }

    const id = "zentro-" + Date.now();
    const sortze_data = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO eragileak (id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      izena.trim(),
      mota,
      (arduraduna || "Arduraduna").trim(),
      (email || "").trim(),
      erronka_nagusia.trim(),
      sortze_data,
      Number(publikoa || 0)
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
          hashPassword(body.password ? body.password.trim() : "bidean123"),
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
      "Ongi etorri Bidean Eragin komunitatera",
      `Zure erronka (${erronka_nagusia}) lantzeko lehen urratsa prest dago: aukeratu pilotu bat katalogoan eta sortu zure lehen hipotesia.`,
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

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await syncDbFromCloud();

    const body = await request.json();
    const { id, izena, mota, arduraduna, email, erronka_nagusia, password, publikoa, behatzaileak_json, behatzaileak } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Entitatearen IDa beharrezkoa da" },
        { status: 400 }
      );
    }

    if (auth.session.role !== "admin" && auth.session.eragile_id !== id) {
      return NextResponse.json(
        { success: false, error: "Beste entitate baten datuak ezin dira aldatu." },
        { status: 403 }
      );
    }

    const existing = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(id) as Eragilea | undefined;
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Entitatea ez da aurkitu" },
        { status: 404 }
      );
    }

    const updatedIzena = izena !== undefined ? String(izena).trim() : existing.izena;
    const updatedMota = mota !== undefined ? String(mota).trim() : existing.mota;
    const updatedArduraduna = arduraduna !== undefined ? String(arduraduna).trim() : existing.arduraduna;
    const updatedEmail = email !== undefined ? String(email).trim() : existing.email;
    const updatedErronka = erronka_nagusia !== undefined ? String(erronka_nagusia).trim() : existing.erronka_nagusia;
    const updatedPublikoa = publikoa !== undefined ? Number(publikoa ? 1 : 0) : Number(existing.publikoa || 0);
    let updatedBehatzaileakJson = existing.behatzaileak_json || "[]";
    if (Array.isArray(behatzaileak)) {
      const cleaned = Array.from(
        new Set(
          behatzaileak
            .map((s: unknown) => String(s || "").trim())
            .filter((s: string) => s.length > 0 && s !== "Behatzailea" && s !== "Behatzaile Itsua")
        )
      );
      updatedBehatzaileakJson = JSON.stringify(cleaned);
    } else if (typeof behatzaileak_json === "string") {
      updatedBehatzaileakJson = behatzaileak_json;
    }

    db.prepare(
      "UPDATE eragileak SET izena = ?, mota = ?, arduraduna = ?, email = ?, erronka_nagusia = ?, publikoa = ?, behatzaileak_json = ? WHERE id = ?"
    ).run(updatedIzena, updatedMota, updatedArduraduna, updatedEmail, updatedErronka, updatedPublikoa, updatedBehatzaileakJson, id);

    // Sync or create shop user account if email is set
    if (updatedEmail) {
      const cleanEmail = updatedEmail.toLowerCase();
      const existingUser = db
        .prepare("SELECT * FROM users WHERE eragile_id = ?")
        .get(id) as { id: string } | undefined;

      if (existingUser) {
        if (password && String(password).trim().length > 0) {
          db.prepare(
            "UPDATE users SET email = ?, password = ?, name = ? WHERE eragile_id = ?"
          ).run(cleanEmail, hashPassword(String(password).trim()), updatedArduraduna || updatedIzena, id);
        } else {
          db.prepare(
            "UPDATE users SET email = ?, name = ? WHERE eragile_id = ?"
          ).run(cleanEmail, updatedArduraduna || updatedIzena, id);
        }
      } else {
        const emailTaken = db
          .prepare("SELECT id FROM users WHERE LOWER(email) = ?")
          .get(cleanEmail);
        if (!emailTaken) {
          db.prepare(`
            INSERT INTO users (id, email, password, name, role, eragile_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            "user-" + Date.now(),
            cleanEmail,
            hashPassword(
              password && String(password).trim().length > 0
                ? String(password).trim()
                : "bidean123"
            ),
            updatedArduraduna || updatedIzena,
            "eragilea",
            id,
            new Date().toISOString()
          );
        }
      }
    }

    const updated = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(id) as Eragilea;

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Errorea eragilea eguneratzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan dira entitatearen datuak eguneratu" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    await syncDbFromCloud();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Entitatearen IDa beharrezkoa da" },
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
      message: "Entitatea eta bere proba-datu guztiak ezabatu dira.",
    });
  } catch (error) {
    console.error("Errorea eragilea ezabatzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da entitatea ezabatu" },
      { status: 500 }
    );
  }
}


