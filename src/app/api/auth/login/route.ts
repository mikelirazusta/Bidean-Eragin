import { NextResponse } from "next/server";
import db, { Eragilea, User, syncDbFromCloud, syncDbToCloud } from "@/lib/db";
import {
  hashPassword,
  isHashedPassword,
  requireAdmin,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

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

    if (!verifyPassword(cleanPassword, user.password)) {
      return NextResponse.json(
        { success: false, error: "Pasahitza ez da zuzena." },
        { status: 401 }
      );
    }

    let dbModified = false;
    if (!isHashedPassword(user.password)) {
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
        hashPassword(cleanPassword),
        user.id
      );
      dbModified = true;
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
          const centerName = (user.name || cleanEmail.split("@")[0] || "Entitatea").trim();
          db.prepare(`
            INSERT INTO eragileak (id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            newCenterId,
            centerName,
            "merkataritza",
            centerName,
            cleanEmail,
            "Entitatean lehen hitza eta elkarrizketak euskaraz sustatzea",
            nowIso,
            0
          );
          eragilea = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(newCenterId) as Eragilea | null;
        }

        if (eragilea) {
          resolvedEragileId = eragilea.id;
          db.prepare("UPDATE users SET eragile_id = ? WHERE id = ?").run(resolvedEragileId, user.id);
          dbModified = true;
        }
      }
    }

    if (dbModified) {
      await syncDbToCloud();
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

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      eragilea,
    });
    return setSessionCookie(response, safeUser);
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
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

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

    if (!verifyPassword(String(currentPassword).trim(), adminUser.password)) {
      return NextResponse.json(
        { success: false, error: "Uneko pasahitza ez da zuzena." },
        { status: 401 }
      );
    }

    const updatedEmail = newEmail ? String(newEmail).trim().toLowerCase() : adminUser.email;
    const rawNewPassword = newPassword ? String(newPassword).trim() : "";
    const updatedName = newName ? String(newName).trim() : adminUser.name;

    if (!updatedEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Sartu helbide elektroniko baliozko bat." },
        { status: 400 }
      );
    }

    if (rawNewPassword && rawNewPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: "Pasahitz berriak gutxienez 4 karaktere izan behar ditu." },
        { status: 400 }
      );
    }

    const storedPassword = rawNewPassword
      ? hashPassword(rawNewPassword)
      : isHashedPassword(adminUser.password)
      ? adminUser.password
      : hashPassword(String(currentPassword).trim());

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
      storedPassword,
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

    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });
    return setSessionCookie(response, safeUser);
  } catch (error) {
    console.error("Errorea admin kredentzialak eguneratzean:", error);
    return NextResponse.json(
      { success: false, error: "Errorea gertatu da administratzailearen datuak eguneratzean." },
      { status: 500 }
    );
  }
}
