import { NextResponse } from "next/server";
import db, {
  Eragilea,
  Pilotua,
  Esperimentua,
  Neurketa,
  Nudge,
  getUiTexts,
  saveUiTexts,
  syncDbFromCloud,
  syncDbToCloud,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await syncDbFromCloud();

    const pilotuak = db.prepare("SELECT * FROM pilotuak").all() as Pilotua[];
    const eragileak = db.prepare("SELECT * FROM eragileak ORDER BY sortze_data DESC").all() as Eragilea[];
    
    const esperimentuak = db.prepare(`
      SELECT e.*, p.izena as pilotu_izena, p.ikonoa as pilotu_ikonoa, er.izena as eragile_izena
      FROM esperimentuak e
      LEFT JOIN pilotuak p ON e.pilotu_id = p.id
      LEFT JOIN eragileak er ON e.eragile_id = er.id
      ORDER BY e.hasiera_data DESC
    `).all() as (Esperimentua & { eragile_izena: string })[];

    const neurketak = db.prepare("SELECT * FROM neurketak ORDER BY data_ordu DESC").all() as Neurketa[];
    const nudges = db.prepare("SELECT * FROM nudges ORDER BY sortze_data DESC").all() as Nudge[];
    const uiTexts = getUiTexts();

    return NextResponse.json(
      {
        success: true,
        data: {
          pilotuak,
          eragileak,
          esperimentuak,
          neurketak,
          nudges,
          uiTexts,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Errorea bootstrap datuak eskuratzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan dira datuak kargatu" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await syncDbFromCloud();

    const body = await request.json();
    const { uiTexts, resetAll } = body;

    const updated = saveUiTexts(uiTexts || {}, Boolean(resetAll));
    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Errorea UI testuak gordetzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan dira testuak gorde" },
      { status: 500 }
    );
  }
}
