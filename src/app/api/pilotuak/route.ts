import { NextResponse } from "next/server";
import db, { Pilotua, syncDbFromCloud, syncDbToCloud } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await syncDbFromCloud();
    const pilotuak = db.prepare("SELECT * FROM pilotuak ORDER BY id = 'barra-barra-txapak' DESC").all() as Pilotua[];
    return NextResponse.json({ success: true, data: pilotuak });
  } catch (error) {
    console.error("Errorea pilotuak eskuratzean:", error);
    return NextResponse.json({ success: false, error: "Errorea gertatu da" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await syncDbFromCloud();

    const body = await request.json();
    const {
      izena,
      azpititulua,
      deskribapena,
      mota,
      adibidea,
      urratsak,
      ikonoa,
      kolorea,
      sortzaile_id,
    } = body;

    if (!izena || !azpititulua || !deskribapena || !mota) {
      return NextResponse.json(
        { success: false, error: "Izena, azpititulua, deskribapena eta mota beharrezkoak dira." },
        { status: 400 }
      );
    }

    const pilotuId = "pilotu-" + Date.now();
    const stepsArray = Array.isArray(urratsak) && urratsak.length > 0
      ? urratsak
      : [
          "1. Taldearekin dinamika eta erronka adostu.",
          "2. T0 neurketa itsua egin (aurretik).",
          "3. Pilotua martxan jarri espazioan.",
          "4. T1 neurketa egin (lehen asteko eragina).",
          "5. T2 neurketa egin 14-21 egunera (ohitura finkatzea)."
        ];

    const insertPilot = db.prepare(`
      INSERT INTO pilotuak (id, izena, azpititulua, deskribapena, mota, adibidea, urratsak_json, ikonoa, kolorea, sortzaile_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPilot.run(
      pilotuId,
      izena.trim(),
      azpititulua.trim(),
      deskribapena.trim(),
      mota.trim(),
      (adibidea || "Euskarazko ohitura pizteko ekintza zehatza").trim(),
      JSON.stringify(stepsArray),
      ikonoa || "Sparkles",
      kolorea || "emerald",
      sortzaile_id || null
    );

    const newPilot = db.prepare("SELECT * FROM pilotuak WHERE id = ?").get(pilotuId) as Pilotua;

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      data: newPilot,
    });
  } catch (error) {
    console.error("Errorea pilotua sortzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da pilotua sortu." },
      { status: 500 }
    );
  }
}
