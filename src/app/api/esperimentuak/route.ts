import { NextResponse } from "next/server";
import db, { Esperimentua, syncDbFromCloud, syncDbToCloud } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await syncDbFromCloud();

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

    if (auth.session.role !== "admin" && eragile_id && eragile_id !== auth.session.eragile_id) {
      return NextResponse.json(
        { success: false, error: "Beste entitate baten hipotesirik ezin da sortu." },
        { status: 403 }
      );
    }

    if (!eragile_id || !pilotu_id || !hipotesia) {
      return NextResponse.json(
        { success: false, error: "Hipotesi eta eragile datuak beharrezkoak dira" },
        { status: 400 }
      );
    }

    const id = "exp-" + Date.now();
    const hasiera_data = new Date().toISOString();
    const initialFaseakJson = JSON.stringify([{ fasea: "T0", hasiera: hasiera_data }]);

    const insert = db.prepare(`
      INSERT INTO esperimentuak (
        id, eragile_id, pilotu_id, hipotesia, taldea, pertsonak, gunea, xede_portzentajea, estatusa, hasiera_data,
        ai_txostena_json, protokoloa_json, n_gutxienekoa, saio_gutxienekoa, faseak_json, t2_mota,
        kontagailu_txantiloia, blokeatuta, aldaketa_erregistroa_json, t1_egonkortu_gabe
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      hasiera_data,
      null,
      body.protokoloa_json ?? null,
      body.n_gutxienekoa !== undefined ? Number(body.n_gutxienekoa) : 20,
      body.saio_gutxienekoa !== undefined ? Number(body.saio_gutxienekoa) : 4,
      initialFaseakJson,
      body.t2_mota === "kentzea" ? "kentzea" : "jarraipena",
      body.kontagailu_txantiloia === "aldaketa" ? "aldaketa" : "oinarrizkoa",
      0,
      "[]",
      0
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
      `Egin hasierako behaketa (T0) zure gunean, pilotua martxan jarri aurretiko abiapuntua neurtzeko.`,
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

    await syncDbToCloud();

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

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await syncDbFromCloud();

    const body = await request.json();
    const {
      id,
      pilotu_id,
      hipotesia,
      taldea,
      pertsonak,
      gunea,
      xede_portzentajea,
      estatusa,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Esperimentuaren IDa beharrezkoa da" },
        { status: 400 }
      );
    }

    const existing = db.prepare("SELECT * FROM esperimentuak WHERE id = ?").get(id) as Esperimentua | undefined;
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Esperimentua ez da aurkitu" },
        { status: 404 }
      );
    }

    if (auth.session.role !== "admin" && existing.eragile_id !== auth.session.eragile_id) {
      return NextResponse.json(
        { success: false, error: "Beste entitate baten hipotesia ezin da editatu." },
        { status: 403 }
      );
    }

    // Explicit phase transition: { id, ekintza: "hasi_fasea", fasea: "T1" | "T2" | "Amaituta", egonkortu_gabe?: boolean }
    if (body.ekintza === "hasi_fasea") {
      const targetFasea = String(body.fasea || "").trim();
      if (!["T0", "T1", "T2", "Amaituta"].includes(targetFasea)) {
        return NextResponse.json(
          { success: false, error: "Fase baliogabea. Erabili T0, T1, T2 edo Amaituta." },
          { status: 400 }
        );
      }
      const now = new Date().toISOString();
      let faseak: Array<{ fasea: string; hasiera: string }> = [];
      try {
        if (existing.faseak_json) {
          const parsed = JSON.parse(existing.faseak_json);
          if (Array.isArray(parsed)) faseak = parsed;
        }
      } catch {}
      if (!faseak.some((f) => f.fasea === "T0")) {
        faseak.unshift({ fasea: "T0", hasiera: existing.hasiera_data || now });
      }
      if (targetFasea !== "Amaituta") {
        const idx = faseak.findIndex((f) => f.fasea === targetFasea);
        if (idx >= 0) {
          faseak[idx] = { fasea: targetFasea, hasiera: now };
        } else {
          faseak.push({ fasea: targetFasea, hasiera: now });
        }
      }

      const nextEstatusa =
        targetFasea === "T0"
          ? "T0_zain"
          : targetFasea === "T1"
          ? "T1_zain"
          : targetFasea === "T2"
          ? "T2_zain"
          : "Amaituta";

      let erregistroa: Array<{ data: string; erabiltzailea: string; oharra: string }> = [];
      try {
        if (existing.aldaketa_erregistroa_json) {
          const parsed = JSON.parse(existing.aldaketa_erregistroa_json);
          if (Array.isArray(parsed)) erregistroa = parsed;
        }
      } catch {}

      let t1EgonkortuGabe = Number(existing.t1_egonkortu_gabe || 0);
      if (targetFasea === "T1" && body.egonkortu_gabe) {
        t1EgonkortuGabe = 1;
        erregistroa.push({
          data: now,
          erabiltzailea: auth.session.name || auth.session.email,
          oharra: "T1 oinarri-lerroa egonkortu gabe hasia",
        });
      }

      db.prepare(
        "UPDATE esperimentuak SET estatusa = ?, faseak_json = ?, t1_egonkortu_gabe = ?, aldaketa_erregistroa_json = ? WHERE id = ?"
      ).run(nextEstatusa, JSON.stringify(faseak), t1EgonkortuGabe, JSON.stringify(erregistroa), id);

      const updatedExp = db.prepare(`
        SELECT e.*, p.izena as pilotu_izena, p.ikonoa as pilotu_ikonoa
        FROM esperimentuak e
        LEFT JOIN pilotuak p ON e.pilotu_id = p.id
        WHERE e.id = ?
      `).get(id) as Esperimentua;

      await syncDbToCloud();

      return NextResponse.json({
        success: true,
        data: updatedExp,
      });
    }

    const updatedPilotuId = pilotu_id !== undefined ? String(pilotu_id).trim() : existing.pilotu_id;
    const updatedHipotesia = hipotesia !== undefined ? String(hipotesia).trim() : existing.hipotesia;
    const updatedTaldea = taldea !== undefined ? String(taldea).trim() : existing.taldea;
    const updatedPertsonak = pertsonak !== undefined ? String(pertsonak).trim() : existing.pertsonak;
    const updatedGunea = gunea !== undefined ? String(gunea).trim() : existing.gunea;
    const updatedXedea = xede_portzentajea !== undefined ? Number(xede_portzentajea) : existing.xede_portzentajea;
    const updatedEstatusa = estatusa !== undefined ? String(estatusa).trim() : existing.estatusa;
    const updatedProtokoloa =
      body.protokoloa_json !== undefined
        ? body.protokoloa_json
        : existing.protokoloa_json ?? null;
    const updatedNGutxienekoa =
      body.n_gutxienekoa !== undefined ? Number(body.n_gutxienekoa) : existing.n_gutxienekoa ?? 20;
    const updatedSaioGutxienekoa =
      body.saio_gutxienekoa !== undefined ? Number(body.saio_gutxienekoa) : existing.saio_gutxienekoa ?? 4;
    const updatedT2Mota =
      body.t2_mota !== undefined
        ? body.t2_mota === "kentzea"
          ? "kentzea"
          : "jarraipena"
        : existing.t2_mota || "jarraipena";
    const updatedKontagailuTxantiloia =
      body.kontagailu_txantiloia !== undefined
        ? body.kontagailu_txantiloia === "aldaketa"
          ? "aldaketa"
          : "oinarrizkoa"
        : existing.kontagailu_txantiloia || "oinarrizkoa";

    // Blokeoa: lehen T0 saioaren ondoren hipotesia, xedea edo kontagailuak aldatzeko arrazoia behar da
    const isLocked = Number(existing.blokeatuta || 0) === 1;
    const lockedFieldChanged =
      updatedHipotesia !== existing.hipotesia ||
      updatedXedea !== existing.xede_portzentajea ||
      updatedKontagailuTxantiloia !== (existing.kontagailu_txantiloia || "oinarrizkoa");

    let erregistroa: Array<{ data: string; erabiltzailea: string; oharra: string }> = [];
    try {
      if (existing.aldaketa_erregistroa_json) {
        const parsed = JSON.parse(existing.aldaketa_erregistroa_json);
        if (Array.isArray(parsed)) erregistroa = parsed;
      }
    } catch {}

    if (isLocked && lockedFieldChanged) {
      const arrazoia = String(body.aldaketa_arrazoia || "").trim();
      if (!arrazoia) {
        return NextResponse.json(
          {
            success: false,
            error: "Hipotesia, xedea edo kontagailuak blokeatuta daude lehen T0 saioaren ondoren. Aldatzeko, idatzi arrazoia.",
          },
          { status: 400 }
        );
      }
      const aldaketak: string[] = [];
      if (updatedHipotesia !== existing.hipotesia) aldaketak.push("hipotesia");
      if (updatedXedea !== existing.xede_portzentajea) {
        aldaketak.push(`xedea (${existing.xede_portzentajea} → ${updatedXedea} puntu)`);
      }
      if (updatedKontagailuTxantiloia !== (existing.kontagailu_txantiloia || "oinarrizkoa")) {
        aldaketak.push(`kontagailua (${updatedKontagailuTxantiloia})`);
      }
      erregistroa.push({
        data: new Date().toISOString(),
        erabiltzailea: auth.session.name || auth.session.email,
        oharra: `Aldatuta (${aldaketak.join(", ")}): ${arrazoia}`,
      });
    }

    db.prepare(
      `UPDATE esperimentuak SET
         pilotu_id = ?, hipotesia = ?, taldea = ?, pertsonak = ?, gunea = ?, xede_portzentajea = ?, estatusa = ?,
         protokoloa_json = ?, n_gutxienekoa = ?, saio_gutxienekoa = ?, t2_mota = ?, kontagailu_txantiloia = ?, aldaketa_erregistroa_json = ?
       WHERE id = ?`
    ).run(
      updatedPilotuId,
      updatedHipotesia,
      updatedTaldea,
      updatedPertsonak,
      updatedGunea,
      updatedXedea,
      updatedEstatusa,
      updatedProtokoloa,
      updatedNGutxienekoa,
      updatedSaioGutxienekoa,
      updatedT2Mota,
      updatedKontagailuTxantiloia,
      JSON.stringify(erregistroa),
      id
    );

    const esperimentua = db.prepare(`
      SELECT e.*, p.izena as pilotu_izena, p.ikonoa as pilotu_ikonoa
      FROM esperimentuak e
      LEFT JOIN pilotuak p ON e.pilotu_id = p.id
      WHERE e.id = ?
    `).get(id) as Esperimentua;

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      data: esperimentua,
    });
  } catch (error) {
    console.error("Errorea esperimentua eguneratzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da hipotesia edo esperimentua eguneratu" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await syncDbFromCloud();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hipotesiaren IDa falta da" },
        { status: 400 }
      );
    }

    if (auth.session.role !== "admin") {
      const existing = db.prepare("SELECT * FROM esperimentuak WHERE id = ?").get(id) as Esperimentua | undefined;
      if (existing && existing.eragile_id !== auth.session.eragile_id) {
        return NextResponse.json(
          { success: false, error: "Beste entitate baten hipotesia ezin da ezabatu." },
          { status: 403 }
        );
      }
    }

    db.prepare("DELETE FROM neurketak WHERE esperimentu_id = ?").run(id);
    db.prepare("DELETE FROM esperimentuak WHERE id = ?").run(id);

    await syncDbToCloud();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errorea esperimentua ezabatzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da hipotesia edo esperimentua ezabatu" },
      { status: 500 }
    );
  }
}

