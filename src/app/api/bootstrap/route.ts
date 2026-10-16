import { NextResponse } from "next/server";
import db, { Eragilea, Pilotua, Esperimentua, Neurketa, Nudge, syncDbFromCloud } from "@/lib/db";

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

    return NextResponse.json(
      {
        success: true,
        data: {
          pilotuak,
          eragileak,
          esperimentuak,
          neurketak,
          nudges,
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
