import { NextResponse } from "next/server";
import db, {
  Pilotua,
  syncDbFromCloud,
  syncDbToCloud,
  offloadInlineMaterialsToStore,
} from "@/lib/db";

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
      materialak,
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
          "2. T0 hasierako neurketa egin (aurretik).",
          "3. Pilotua martxan jarri gunean.",
          "4. T1 neurketa egin (lehen asteko eragina).",
          "5. T2 neurketa egin 14-21 egunera (ohitura egonkortzea)."
        ];
    const cleanMaterials = Array.isArray(materialak)
      ? await offloadInlineMaterialsToStore(materialak)
      : [];
    const materialakJson = JSON.stringify(cleanMaterials);

    const insertPilot = db.prepare(`
      INSERT INTO pilotuak (id, izena, azpititulua, deskribapena, mota, adibidea, urratsak_json, ikonoa, kolorea, sortzaile_id, materialak_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      sortzaile_id || null,
      materialakJson
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

export async function PATCH(request: Request) {
  try {
    await syncDbFromCloud();

    const body = await request.json();
    const {
      id,
      izena,
      azpititulua,
      deskribapena,
      mota,
      adibidea,
      urratsak,
      ikonoa,
      kolorea,
      materialak,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Pilotuaren IDa beharrezkoa da." },
        { status: 400 }
      );
    }

    const existing = db.prepare("SELECT * FROM pilotuak WHERE id = ?").get(id) as Pilotua | undefined;
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Pilotua ez da aurkitu." },
        { status: 404 }
      );
    }

    const updatedIzena = izena !== undefined ? String(izena).trim() : existing.izena;
    const updatedAzpititulua = azpititulua !== undefined ? String(azpititulua).trim() : existing.azpititulua;
    const updatedDeskribapena = deskribapena !== undefined ? String(deskribapena).trim() : existing.deskribapena;
    const updatedMota = mota !== undefined ? String(mota).trim() : existing.mota;
    const updatedAdibidea = adibidea !== undefined ? String(adibidea).trim() : existing.adibidea;
    const updatedUrratsakJson =
      Array.isArray(urratsak) && urratsak.length > 0
        ? JSON.stringify(urratsak)
        : existing.urratsak_json;
    const updatedIkonoa = ikonoa !== undefined ? String(ikonoa).trim() : existing.ikonoa;
    const updatedKolorea = kolorea !== undefined ? String(kolorea).trim() : existing.kolorea;
    const updatedMaterialakJson =
      Array.isArray(materialak)
        ? JSON.stringify(await offloadInlineMaterialsToStore(materialak))
        : existing.materialak_json || "[]";

    db.prepare(
      "UPDATE pilotuak SET izena = ?, azpititulua = ?, deskribapena = ?, mota = ?, adibidea = ?, urratsak_json = ?, ikonoa = ?, kolorea = ?, materialak_json = ? WHERE id = ?"
    ).run(
      updatedIzena,
      updatedAzpititulua,
      updatedDeskribapena,
      updatedMota,
      updatedAdibidea,
      updatedUrratsakJson,
      updatedIkonoa,
      updatedKolorea,
      updatedMaterialakJson,
      id
    );

    const updated = db.prepare("SELECT * FROM pilotuak WHERE id = ?").get(id) as Pilotua;

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Errorea pilotua eguneratzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da pilotua eguneratu." },
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
        { success: false, error: "Pilotuaren IDa beharrezkoa da." },
        { status: 400 }
      );
    }

    db.prepare("DELETE FROM pilotuak WHERE id = ?").run(id);

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      message: "Pilotua katalogotik ezabatu da.",
    });
  } catch (error) {
    console.error("Errorea pilotua ezabatzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da pilotua ezabatu." },
      { status: 500 }
    );
  }
}
