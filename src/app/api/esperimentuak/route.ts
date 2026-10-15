import { NextResponse } from "next/server";
import db, { Esperimentua } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eragile_id,
      pilotu_id,
      hipotesia,
      taldea,
      pertsonak,
      gunea,
      xede_portzentajea,
    } = body;

    if (!eragile_id || !pilotu_id || !hipotesia) {
      return NextResponse.json(
        { success: false, error: "Hipotesi eta eragile datuak beharrezkoak dira" },
        { status: 400 }
      );
    }

    const id = "exp-" + Date.now();
    const hasiera_data = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO esperimentuak (
        id, eragile_id, pilotu_id, hipotesia, taldea, pertsonak, gunea, xede_portzentajea, estatusa, hasiera_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      eragile_id,
      pilotu_id,
      hipotesia,
      taldea || "Ikasleak / Kideak",
      pertsonak || "Erabiltzaileak",
      gunea || "Espazioa",
      Number(xede_portzentajea) || 20,
      "T0_zain",
      hasiera_data
    );

    // Create a Nudge to encourage taking the T0 baseline measurement
    const insertNudge = db.prepare(`
      INSERT INTO nudges (id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNudge.run(
      "nudge-" + Date.now(),
      eragile_id,
      "Hipotesia prest dago! 🧪 Hurrengo urratsa: T0 neurketa",
      `Zientzialari modua aktibatuta! Egin 10 minutuko behaketa itsua espazioan, esku-hartzea hasi AURRETIKO abiapuntua neurtzeko.`,
      "abisua",
      new Date(Date.now() + 86400000 * 2).toISOString(),
      0,
      `/behaketa?expId=${id}&phase=T0`,
      hasiera_data
    );

    const esperimentua = db.prepare(`
      SELECT e.*, p.izena as pilotu_izena, p.ikonoa as pilotu_ikonoa
      FROM esperimentuak e
      LEFT JOIN pilotuak p ON e.pilotu_id = p.id
      WHERE e.id = ?
    `).get(id) as Esperimentua;

    return NextResponse.json({
      success: true,
      data: esperimentua,
    });
  } catch (error) {
    console.error("Errorea esperimentua sortzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da esperimentua gorde" },
      { status: 500 }
    );
  }
}
