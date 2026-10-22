import { NextResponse } from "next/server";
import db, { Eragilea, User, syncDbFromCloud, syncDbToCloud } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await syncDbFromCloud();

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
    let resolvedEragileId = user.eragile_id;

    if (user.role === "eragilea") {
      if (resolvedEragileId) {
        eragilea = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(resolvedEragileId) as Eragilea | null;
      }
      if (!eragilea) {
        eragilea =
          (db.prepare("SELECT * FROM eragileak WHERE LOWER(email) = ?").get(cleanEmail) as Eragilea | null) ||
          (db.prepare("SELECT * FROM eragileak WHERE LOWER(izena) = ?").get((user.name || "").trim().toLowerCase()) as Eragilea | null) ||
          null;

        if (!eragilea) {
          // Create a dedicated center for this eragilea user so they never see another center
          const newCenterId = "zentro-" + Date.now();
          const nowIso = new Date().toISOString();
          const centerName = (user.name || cleanEmail.split("@")[0] || "Saltokia").trim();
          db.prepare(`
            INSERT INTO eragileak (id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            newCenterId,
            centerName,
            "merkataritza",
            centerName,
            cleanEmail,
            "Dendan lehen hitza eta elkarrizketak euskaraz sustatzea",
            nowIso,
            0
          );
          eragilea = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(newCenterId) as Eragilea | null;
        }

        if (eragilea) {
          resolvedEragileId = eragilea.id;
          db.prepare("UPDATE users SET eragile_id = ? WHERE id = ?").run(resolvedEragileId, user.id);
          await syncDbToCloud();
        }
      }
    }

    // Do not return password to client
    const safeUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      eragile_id: resolvedEragileId,
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

export async function PATCH(request: Request) {
  try {
    await syncDbFromCloud();

    const body = await request.json();
    const { currentPassword, newEmail, newPassword, newName } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "Uneko pasahitza sartu behar duzu aldaketa egiaztatzeko." },
        { status: 400 }
      );
    }

    const adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin'").get() as User | undefined;
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Ez da administratzaile konturik aurkitu." },
        { status: 404 }
      );
    }

    if (adminUser.password !== String(currentPassword).trim()) {
      return NextResponse.json(
        { success: false, error: "Uneko pasahitza ez da zuzena." },
        { status: 401 }
      );
    }

    const updatedEmail = newEmail ? String(newEmail).trim().toLowerCase() : adminUser.email;
    const updatedPassword = newPassword ? String(newPassword).trim() : adminUser.password || "bagera2026";
    const updatedName = newName ? String(newName).trim() : adminUser.name;

    if (!updatedEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Sartu helbide elektroniko baliozko bat." },
        { status: 400 }
      );
    }

    if (updatedPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: "Pasahitz berriak gutxienez 4 karaktere izan behar ditu." },
        { status: 400 }
      );
    }

    const existingByEmail = db
      .prepare("SELECT * FROM users WHERE LOWER(email) = ?")
      .get(updatedEmail) as User | undefined;

    if (existingByEmail && existingByEmail.id !== adminUser.id) {
      return NextResponse.json(
        { success: false, error: "Helbide elektroniko hori beste erabiltzaile batek darabil dagoeneko." },
        { status: 409 }
      );
    }

    db.prepare("UPDATE users SET email = ?, password = ?, name = ? WHERE id = ?").run(
      updatedEmail,
      updatedPassword,
      updatedName,
      adminUser.id
    );

    await syncDbToCloud();

    const safeUser: User = {
      id: adminUser.id,
      email: updatedEmail,
      name: updatedName,
      role: "admin",
      eragile_id: undefined,
      created_at: adminUser.created_at,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("Errorea admin kredentzialak eguneratzean:", error);
    return NextResponse.json(
      { success: false, error: "Errorea gertatu da administratzailearen datuak eguneratzean." },
      { status: 500 }
    );
  }
}
