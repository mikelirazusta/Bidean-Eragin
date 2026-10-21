import { NextResponse } from "next/server";
import db, { Eragilea, Esperimentua, User, syncDbFromCloud, syncDbToCloud } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await syncDbFromCloud();

    const body = await request.json();
    const {
      izena,
      mota,
      arduraduna,
      email,
      password,
      erronka_nagusia,
      publikoa,
      hipotesia,
      gunea,
      xede_portzentajea,
      pilotu_id,
    } = body;

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
    const expId = "exp-" + Date.now();
    const sortze_data = new Date().toISOString();

    const chosenPilotId = pilotu_id || "barra-barra-txapak";
    const chosenGunea = (gunea || izena).trim();
    const chosenTarget = Number(xede_portzentajea || 20);
    const chosenHipotesia = (
      hipotesia ||
      `${izena.trim()} gunean 'Euskaraz barra-barra' txapa ikusgai erabiltzen badugu, euskarazko elkarrizketak %${chosenTarget} handituko dira.`
    ).trim();

    const insertCenterAndUser = db.transaction(() => {
      // 1. Insert center
      const insertCenter = db.prepare(`
        INSERT INTO eragileak (id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertCenter.run(
        zentroId,
        izena.trim(),
        mota,
        arduraduna.trim(),
        cleanEmail,
        erronka_nagusia.trim(),
        sortze_data,
        Number(publikoa ? 1 : 0)
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

      // 3. Create initial experiment so user lands on a ready-to-use dashboard
      const insertExp = db.prepare(`
        INSERT INTO esperimentuak (id, eragile_id, pilotu_id, hipotesia, taldea, pertsonak, gunea, xede_portzentajea, estatusa, hasiera_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertExp.run(
        expId,
        zentroId,
        chosenPilotId,
        chosenHipotesia,
        izena.trim(),
        arduraduna.trim(),
        chosenGunea,
        chosenTarget,
        "T0_PENDIENTE",
        sortze_data
      );

      // 4. Insert welcome nudge
      const insertNudge = db.prepare(`
        INSERT INTO nudges (id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertNudge.run(
        "nudge-" + Date.now(),
        zentroId,
        "1. Urratsa: Egin T0 Aurre-neurketa Itsua 🕵️",
        `Zure hipotesia prest dago! Txapak jarri aurretik, egin 10 minutuko lehen behaketa (T0) gaur egungo abiapuntua ezagutzeko.`,
        "neurketa_t0",
        new Date(Date.now() + 86400000 * 3).toISOString(),
        0,
        "/kontagailua",
        sortze_data
      );
    });

    insertCenterAndUser();

    const newUser = db.prepare("SELECT id, email, name, role, eragile_id, created_at FROM users WHERE id = ?").get(userId) as User;
    const newEragilea = db.prepare("SELECT * FROM eragileak WHERE id = ?").get(zentroId) as Eragilea;
    const newEsperimentua = db.prepare(`
      SELECT e.*, p.izena as pilotu_izena, p.ikonoa as pilotu_ikonoa, er.izena as eragile_izena
      FROM esperimentuak e
      LEFT JOIN pilotuak p ON e.pilotu_id = p.id
      LEFT JOIN eragileak er ON e.eragile_id = er.id
      WHERE e.id = ?
    `).get(expId) as Esperimentua & { eragile_izena: string };

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      user: newUser,
      eragilea: newEragilea,
      esperimentua: newEsperimentua,
    });
  } catch (error) {
    console.error("Errorea kontua sortzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da kontua sortu sistemaren akats bategatik." },
      { status: 500 }
    );
  }
}
