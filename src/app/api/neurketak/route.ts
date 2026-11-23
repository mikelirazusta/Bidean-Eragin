import { NextResponse } from "next/server";
import db, {
  Neurketa,
  Esperimentua,
  syncDbFromCloud,
  syncDbToCloud,
  runWithCloudRetry,
  writeCustomBlobJson,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const ASTEKO_EGUNAK_EU = [
  "igandean",
  "astelehenean",
  "asteartean",
  "asteazkenean",
  "ostegunean",
  "ostiralean",
  "larunbatean",
];

function formatProtokoloDeskribapena(protokoloaJson?: string | null): string {
  if (!protokoloaJson) return "egun eta ordu berean";
  try {
    const p = JSON.parse(protokoloaJson);
    const egunak: number[] = Array.isArray(p.asteko_egunak) ? p.asteko_egunak : [];
    const egunakText =
      egunak.length > 0
        ? egunak
            .filter((d) => d >= 0 && d <= 6)
            .map((d) => ASTEKO_EGUNAK_EU[d])
            .join("/")
        : "egun berean";
    const orduText =
      p.ordu_hasiera && p.ordu_amaiera
        ? `${p.ordu_hasiera}-${p.ordu_amaiera}`
        : p.ordu_hasiera || "ordu berean";
    return `${egunakText} (${orduText})`;
  } catch {
    return "egun eta ordu berean";
  }
}

function isNeurketaOsoaBasic(n: Neurketa, exp: Esperimentua): boolean {
  const nMin = exp.n_gutxienekoa || 20;
  const total = (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0);
  if (total < nMin) return false;
  if (exp.protokoloa_json) {
    try {
      const p = JSON.parse(exp.protokoloa_json);
      const dt = new Date(n.data_ordu);
      if (!isNaN(dt.getTime())) {
        if (Array.isArray(p.asteko_egunak) && p.asteko_egunak.length > 0) {
          if (!p.asteko_egunak.includes(dt.getDay())) return false;
        }
        if (p.ordu_hasiera && p.ordu_amaiera) {
          const [h1, m1] = String(p.ordu_hasiera).split(":").map(Number);
          const [h2, m2] = String(p.ordu_amaiera).split(":").map(Number);
          const tol = Number(p.tolerantzia_min ?? 60);
          const mins = dt.getHours() * 60 + dt.getMinutes();
          const startMins = h1 * 60 + (m1 || 0) - tol;
          const endMins = h2 * 60 + (m2 || 0) + tol;
          if (mins < startMins || mins > endMins) return false;
        }
      }
    } catch {}
  }
  return true;
}

function isPhaseStable(osoaSessions: Neurketa[], saioMin: number): boolean {
  if (osoaSessions.length < saioMin) return false;
  const sorted = [...osoaSessions].sort((a, b) => a.data_ordu.localeCompare(b.data_ordu));
  const recent = sorted.slice(-saioMin);
  const pcts = recent.map((n) => {
    const tot = (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0);
    return tot > 0 ? ((n.euskaraz_count || 0) / tot) * 100 : 0;
  });
  const maxPct = Math.max(...pcts);
  const minPct = Math.min(...pcts);
  if (maxPct - minPct > 15) return false;
  // Simple linear regression slope of pct vs index (0..k-1)
  const k = pcts.length;
  const xMean = (k - 1) / 2;
  const yMean = pcts.reduce((a, b) => a + b, 0) / k;
  let num = 0;
  let den = 0;
  for (let i = 0; i < k; i++) {
    num += (i - xMean) * (pcts[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  const slope = den > 0 ? num / den : 0;
  return Math.abs(slope) < 3;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      esperimentu_id,
      unea,
      euskaraz_count,
      erdaraz_count,
      elebi_count,
      aldaketa_count,
      iraupena_segundotan,
      oharrak,
      behatzailea,
      hasiera_ordu,
      amaiera_ordu,
      data_ordu: clientDataOrdu,
      lineaz_kanpo,
      atzeratua,
    } = body;

    if (!esperimentu_id || !unea) {
      return NextResponse.json(
        { success: false, error: "Esperimentuaren IDa eta unea beharrezkoak dira" },
        { status: 400 }
      );
    }

    const cleanBehatzailea = String(behatzailea || "").trim();
    if (!cleanBehatzailea || cleanBehatzailea === "Behatzailea" || cleanBehatzailea === "Behatzaile Itsua") {
      return NextResponse.json(
        { success: false, error: "Behatzailea aukeratu behar da neurketa gorde aurretik." },
        { status: 400 }
      );
    }

    const id = "neu-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    const now = new Date();
    const maxFutureMs = now.getTime() + 5 * 60 * 1000; // 5 min clock skew tolerance
    const minPastMs = now.getTime() - 30 * 86400 * 1000; // 30 days

    let resolvedHasiera: string | null = null;
    if (hasiera_ordu) {
      const parsedStart = new Date(String(hasiera_ordu));
      if (isNaN(parsedStart.getTime())) {
        return NextResponse.json(
          { success: false, error: "Hasiera-ordua ez da data zuzena." },
          { status: 400 }
        );
      }
      if (parsedStart.getTime() > maxFutureMs) {
        return NextResponse.json(
          { success: false, error: "Neurketa ezin da etorkizuneko datarekin gorde." },
          { status: 400 }
        );
      }
      if (parsedStart.getTime() < minPastMs) {
        return NextResponse.json(
          { success: false, error: "Neurketa ezin da 30 egun baino lehenagoko datarekin gorde." },
          { status: 400 }
        );
      }
      resolvedHasiera = parsedStart.toISOString();
    }

    let resolvedAmaiera: string | null = null;
    if (amaiera_ordu) {
      const parsedEnd = new Date(String(amaiera_ordu));
      if (isNaN(parsedEnd.getTime())) {
        return NextResponse.json(
          { success: false, error: "Amaiera-ordua ez da data zuzena." },
          { status: 400 }
        );
      }
      if (parsedEnd.getTime() > maxFutureMs) {
        return NextResponse.json(
          { success: false, error: "Amaiera-ordua ezin da etorkizunean egon." },
          { status: 400 }
        );
      }
      resolvedAmaiera = parsedEnd.toISOString();
    }

    let data_ordu = resolvedHasiera || now.toISOString();
    if (!resolvedHasiera && clientDataOrdu) {
      const parsedClientDate = new Date(String(clientDataOrdu));
      if (
        !isNaN(parsedClientDate.getTime()) &&
        parsedClientDate.getTime() <= maxFutureMs &&
        parsedClientDate.getTime() >= minPastMs
      ) {
        data_ordu = parsedClientDate.toISOString();
      }
    }

    const result = await runWithCloudRetry(() => {
      if (auth.session.role !== "admin") {
        const targetExp = db.prepare("SELECT * FROM esperimentuak WHERE id = ?").get(esperimentu_id) as Esperimentua | undefined;
        if (targetExp && targetExp.eragile_id !== auth.session.eragile_id) {
          return { forbidden: true as const };
        }
      }

      const insertNeurketa = db.prepare(`
        INSERT INTO neurketak (
          id, esperimentu_id, unea, euskaraz_count, erdaraz_count, elebi_count, iraupena_segundotan, data_ordu, oharrak, behatzailea,
          hasiera_ordu, amaiera_ordu, aldaketa_count, lineaz_kanpo, atzeratua
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertNeurketa.run(
        id,
        esperimentu_id,
        unea,
        Number(euskaraz_count) || 0,
        Number(erdaraz_count) || 0,
        Number(elebi_count) || 0,
        Number(iraupena_segundotan) || 600,
        data_ordu,
        oharrak || "",
        cleanBehatzailea,
        resolvedHasiera,
        resolvedAmaiera,
        Number(aldaketa_count) || 0,
        lineaz_kanpo ? 1 : 0,
        atzeratua ? 1 : 0
      );

      // Lehen T0 saioa gorde ondoren, hipotesia, xedea eta kontagailuak blokeatu
      if (unea === "T0") {
        db.prepare("UPDATE esperimentuak SET blokeatuta = 1 WHERE id = ?").run(esperimentu_id);
      }

      // Get experiment and Eragile details
      const exp = db.prepare(`
        SELECT e.*, er.id as eragile_id, er.izena as eragile_izena
        FROM esperimentuak e
        JOIN eragileak er ON e.eragile_id = er.id
        WHERE e.id = ?
      `).get(esperimentu_id) as (Esperimentua & { eragile_id: string; eragile_izena: string });

      if (exp) {
        try {
          const insertNudge = db.prepare(`
            INSERT INTO nudges (id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const allNeurketak = db.prepare("SELECT * FROM neurketak").all() as Neurketa[];
          const phaseNeurketak = allNeurketak.filter(
            (n) => n.esperimentu_id === esperimentu_id && n.unea === unea
          );
          const saioGutxienekoa = exp.saio_gutxienekoa || 4;
          const osoaSessions = phaseNeurketak.filter((n) => isNeurketaOsoaBasic(n, exp));
          const osoaCount = osoaSessions.length;
          const totalEusk = phaseNeurketak.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
          const totalN = phaseNeurketak.reduce(
            (s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0),
            0
          );
          const phasePct = totalN > 0 ? Math.round((totalEusk / totalN) * 100) : 0;
          const protokoloTestua = formatProtokoloDeskribapena(exp.protokoloa_json);
          const nextDueDate = new Date(now.getTime() + 7 * 86400000).toISOString();
          const nudgeId = "nudge-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);

          // Ez aldatu estatusa automatikoki lehen saioarekin: fase-aldaketa esplizitua da
          if (unea === "T0") {
            if (osoaCount < saioGutxienekoa) {
              insertNudge.run(
                nudgeId,
                exp.eragile_id,
                `T0: ${osoaCount}/${saioGutxienekoa} saio oso`,
                `T0: ${osoaCount}/${saioGutxienekoa} saio. Neurtu berriro ${protokoloTestua}, esku-hartzea martxan jarri gabe.`,
                "bultzada",
                nextDueDate,
                0,
                `/behaketa?expId=${esperimentu_id}&phase=T0`,
                data_ordu
              );
            } else if (isPhaseStable(osoaSessions, saioGutxienekoa)) {
              insertNudge.run(
                nudgeId,
                exp.eragile_id,
                "T0 oinarri-lerroa egonkor dago",
                `Oinarri-lerroa egonkor dago (%${phasePct}, ${totalN} elkarrizketa). Orain jar dezakezue pilotua martxan.`,
                "zoriontzea",
                nextDueDate,
                0,
                `/panela`,
                data_ordu
              );
            } else {
              insertNudge.run(
                nudgeId,
                exp.eragile_id,
                "T0: itxaron — erabilera aldatzen ari da",
                `Erabilera aldatzen ari da esku-hartu gabe ere. Neurtu berriro ${protokoloTestua}, oinarri-lerroa egonkortu arte.`,
                "abisua",
                nextDueDate,
                0,
                `/behaketa?expId=${esperimentu_id}&phase=T0`,
                data_ordu
              );
            }
          } else if (unea === "T1") {
            if (osoaCount < saioGutxienekoa) {
              insertNudge.run(
                nudgeId,
                exp.eragile_id,
                `T1: ${osoaCount}/${saioGutxienekoa} saio oso`,
                `T1: ${osoaCount}/${saioGutxienekoa} saio oso. Neurtu berriro ${protokoloTestua} (gutxienez ${saioGutxienekoa} saio gomendatzen dira).`,
                "bultzada",
                nextDueDate,
                0,
                `/behaketa?expId=${esperimentu_id}&phase=T1`,
                data_ordu
              );
            } else {
              insertNudge.run(
                nudgeId,
                exp.eragile_id,
                `T1: ${osoaCount} saio oso jasota`,
                `T1 faseko emaitza: %${phasePct} (${totalN} elkarrizketa). Nahi duzuenean T2 has dezakezue paneletik.`,
                "bultzada",
                nextDueDate,
                0,
                `/panela`,
                data_ordu
              );
            }
          } else if (unea === "T2") {
            if (osoaCount < saioGutxienekoa) {
              insertNudge.run(
                nudgeId,
                exp.eragile_id,
                `T2: ${osoaCount}/${saioGutxienekoa} saio oso`,
                `T2: ${osoaCount}/${saioGutxienekoa} saio oso. Neurtu berriro ${protokoloTestua} (gutxienez ${saioGutxienekoa} saio gomendatzen dira).`,
                "bultzada",
                nextDueDate,
                0,
                `/behaketa?expId=${esperimentu_id}&phase=T2`,
                data_ordu
              );
            } else {
              insertNudge.run(
                nudgeId,
                exp.eragile_id,
                `T2: ${osoaCount} saio oso jasota`,
                `T2 faseko emaitza: %${phasePct} (${totalN} elkarrizketa). Ikusi emaitza osoak eta zalantza-tarteak panelean.`,
                "zoriontzea",
                nextDueDate,
                0,
                `/panela`,
                data_ordu
              );
            }
          }
        } catch (nudgeErr) {
          console.warn("Oharra: ezin izan da bultzada automatikoa sortu neurketa gordetzean:", nudgeErr);
        }
      }

      const savedNeurketa = db.prepare("SELECT * FROM neurketak WHERE id = ?").get(id) as Neurketa;
      return { forbidden: false as const, savedNeurketa };
    });

    if (result.forbidden) {
      return NextResponse.json(
        { success: false, error: "Beste entitate baten neurketa ezin da gorde." },
        { status: 403 }
      );
    }

    // Segurtasun-kopia gako propioan (neu-<id>)
    try {
      await writeCustomBlobJson(id, result.savedNeurketa);
    } catch {}

    return NextResponse.json({
      success: true,
      data: result.savedNeurketa,
    });
  } catch (error) {
    console.error("Errorea neurketa gordetzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da neurketa gorde" },
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
      esperimentu_id,
      eragile_id,
      unea,
      euskaraz_count,
      erdaraz_count,
      elebi_count,
      oharrak,
      behatzailea,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Neurketa IDa beharrezkoa da" },
        { status: 400 }
      );
    }

    const existing = db.prepare("SELECT * FROM neurketak WHERE id = ?").get(id) as Neurketa | undefined;
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Neurketa ez da aurkitu" },
        { status: 404 }
      );
    }

    if (auth.session.role !== "admin") {
      const expRow = db.prepare("SELECT * FROM esperimentuak WHERE id = ?").get(existing.esperimentu_id) as Esperimentua | undefined;
      if (expRow && expRow.eragile_id !== auth.session.eragile_id) {
        return NextResponse.json(
          { success: false, error: "Beste entitate baten neurketa ezin da editatu." },
          { status: 403 }
        );
      }
    }

    let updatedExpId = existing.esperimentu_id;

    if (esperimentu_id && String(esperimentu_id).trim()) {
      updatedExpId = String(esperimentu_id).trim();
    } else if (eragile_id && String(eragile_id).trim()) {
      const targetEragileId = String(eragile_id).trim();
      const allExps = db.prepare("SELECT * FROM esperimentuak").all() as Esperimentua[];
      const existingExpForEragile = allExps.find((e) => e.eragile_id === targetEragileId);

      if (existingExpForEragile) {
        updatedExpId = existingExpForEragile.id;
      } else {
        return NextResponse.json(
          { success: false, error: "Entitate honek ez du esperimenturik. Sortu lehenik." },
          { status: 400 }
        );
      }
    }

    const updatedUnea = unea !== undefined ? String(unea).trim() : existing.unea;
    const updatedEusk = euskaraz_count !== undefined ? Math.max(0, Number(euskaraz_count)) : existing.euskaraz_count;
    const updatedErd = erdaraz_count !== undefined ? Math.max(0, Number(erdaraz_count)) : existing.erdaraz_count;
    const updatedElebi = elebi_count !== undefined ? Math.max(0, Number(elebi_count)) : existing.elebi_count;
    const updatedOharrak = oharrak !== undefined ? String(oharrak) : existing.oharrak;
    const updatedBehatzailea = behatzailea !== undefined ? String(behatzailea).trim() : (existing.behatzailea || "Behatzailea");

    db.prepare(
      "UPDATE neurketak SET esperimentu_id = ?, unea = ?, euskaraz_count = ?, erdaraz_count = ?, elebi_count = ?, oharrak = ?, behatzailea = ? WHERE id = ?"
    ).run(updatedExpId, updatedUnea, updatedEusk, updatedErd, updatedElebi, updatedOharrak, updatedBehatzailea, id);

    const updated = db.prepare("SELECT * FROM neurketak WHERE id = ?").get(id) as Neurketa;

    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Errorea neurketa eguneratzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da neurketa eguneratu" },
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
        { success: false, error: "Neurketa IDa beharrezkoa da" },
        { status: 400 }
      );
    }

    if (auth.session.role !== "admin") {
      const existing = db.prepare("SELECT * FROM neurketak WHERE id = ?").get(id) as Neurketa | undefined;
      if (existing) {
        const expRow = db.prepare("SELECT * FROM esperimentuak WHERE id = ?").get(existing.esperimentu_id) as Esperimentua | undefined;
        if (expRow && expRow.eragile_id !== auth.session.eragile_id) {
          return NextResponse.json(
            { success: false, error: "Beste entitate baten neurketa ezin da ezabatu." },
            { status: 403 }
          );
        }
      }
    }

    db.prepare("DELETE FROM neurketak WHERE id = ?").run(id);

    await syncDbToCloud();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errorea neurketa ezabatzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da neurketa ezabatu" },
      { status: 500 }
    );
  }
}

