import { NextResponse } from "next/server";
import db, { Nudge, syncDbFromCloud, syncDbToCloud } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await syncDbFromCloud();

    const body = await request.json();
    const { action, nudge_id, eragile_id, titulua, mezua, mota, epemuga, ekintza_esteka } = body;

    if (action === "mark_read" && nudge_id) {
      db.prepare("UPDATE nudges SET irakurria = 1 WHERE id = ?").run(nudge_id);
      await syncDbToCloud();
      return NextResponse.json({ success: true, message: "Irakurria gisa markatu da" });
    }

    if (action === "create") {
      if (!eragile_id || !titulua || !mezua) {
        return NextResponse.json(
          { success: false, error: "Eragile IDa, titulua eta mezua beharrezkoak dira" },
          { status: 400 }
        );
      }

      const id = "nudge-" + Date.now();
      const sortze_data = new Date().toISOString();
      const insert = db.prepare(`
        INSERT INTO nudges (id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run(
        id,
        eragile_id,
        titulua,
        mezua,
        mota || "bultzada",
        epemuga || new Date(Date.now() + 86400000 * 7).toISOString(),
        0,
        ekintza_esteka || "",
        sortze_data
      );

      const created = db.prepare("SELECT * FROM nudges WHERE id = ?").get(id) as Nudge;
      await syncDbToCloud();
      return NextResponse.json({ success: true, data: created });
    }

    return NextResponse.json({ success: false, error: "Ekintza baliogabea" }, { status: 400 });
  } catch (error) {
    console.error("Errorea nudge-ekin lan egitean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da eragiketa burutu" },
      { status: 500 }
    );
  }
}
