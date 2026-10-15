import { NextResponse } from "next/server";
import db, { Neurketa, Esperimentua } from "@/lib/db";

const HILABETEAK = [
  "Urtarrilak", "Otsailak", "Martxoak", "Apirilak", "Maiatzak", "Ekainak",
  "Uztailak", "Abuztuak", "Irailak", "Urriak", "Azaroak", "Abenduak"
];

function formatEuskalData(date: Date): string {
  const hilabetea = HILABETEAK[date.getMonth()];
  const eguna = date.getDate();
  return `${hilabetea} ${eguna}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      esperimentu_id,
      unea,
      euskaraz_count,
      erdaraz_count,
      elebi_count,
      iraupena_segundotan,
      oharrak,
      behatzailea,
    } = body;

    if (!esperimentu_id || !unea) {
      return NextResponse.json(
        { success: false, error: "Esperimentuaren IDa eta unea beharrezkoak dira" },
        { status: 400 }
      );
    }

    const id = "neu-" + Date.now();
    const now = new Date();
    const data_ordu = now.toISOString();

    const insertNeurketa = db.prepare(`
      INSERT INTO neurketak (
        id, esperimentu_id, unea, euskaraz_count, erdaraz_count, elebi_count, iraupena_segundotan, data_ordu, oharrak, behatzailea
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      behatzailea || "Behatzaile Itsua"
    );

    // Get experiment and Eragile details
    const exp = db.prepare(`
      SELECT e.*, er.id as eragile_id, er.izena as eragile_izena
      FROM esperimentuak e
      JOIN eragileak er ON e.eragile_id = er.id
      WHERE e.id = ?
    `).get(esperimentu_id) as (Esperimentua & { eragile_id: string; eragile_izena: string });

    if (exp) {
      const insertNudge = db.prepare(`
        INSERT INTO nudges (id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const existingSamePhaseCount = (
        db.prepare(
          "SELECT COUNT(*) as c FROM neurketak WHERE esperimentu_id = ? AND unea = ? AND id != ?"
        ).get(esperimentu_id, unea, id) as { c: number }
      ).c;

      if (existingSamePhaseCount === 0) {
        // Lehen neurketa fase honetan
        if (unea === "T0") {
          if (exp.estatusa === "T0_zain" || (exp.estatusa !== "T2_zain" && exp.estatusa !== "Amaituta")) {
            db.prepare("UPDATE esperimentuak SET estatusa = 'T1_zain' WHERE id = ?").run(esperimentu_id);
          }
          const t1DueDate = new Date(now.getTime() + 7 * 86400000);
          insertNudge.run(
            "nudge-" + Date.now(),
            exp.eragile_id,
            "T0 Oinarrizko neurketa eginda! 📊",
            `Bikain! Hasierako argazkia dugu. Orain jarri martxan pilotua espazioan. 7 egun barru (${formatEuskalData(t1DueDate)}) egingo dugu T1 neurketa berehalako eragina ikusteko! Nahi baduzu, T0 fasean beste behaketa saio batzuk ere egin ditzakezu oinarrizko batez bestekoa aberasteko.`,
            "bultzada",
            t1DueDate.toISOString(),
            0,
            `/behaketa?expId=${esperimentu_id}&phase=T1`,
            data_ordu
          );
        } else if (unea === "T1") {
          if (exp.estatusa !== "Amaituta") {
            db.prepare("UPDATE esperimentuak SET estatusa = 'T2_zain' WHERE id = ?").run(esperimentu_id);
          }
          const t2DueDate = new Date(now.getTime() + 14 * 86400000);
          insertNudge.run(
            "nudge-" + Date.now(),
            exp.eragile_id,
            "T1 Neurketa osatuta! 🚀 14 egunera T2 dator",
            `T1 neurketa egin duzu. 14 egun barru T2 neurketa egitea tokatzen zaizu (${formatEuskalData(t2DueDate)}). Izango duzu tarterik ohitura berria sendotu den ikusteko? T1 fasean saio gehiago ere egin ditzakezu nahi izanez gero.`,
            "abisua",
            t2DueDate.toISOString(),
            0,
            `/behaketa?expId=${esperimentu_id}&phase=T2`,
            data_ordu
          );
        } else if (unea === "T2") {
          db.prepare("UPDATE esperimentuak SET estatusa = 'Amaituta' WHERE id = ?").run(esperimentu_id);
          insertNudge.run(
            "nudge-" + Date.now(),
            exp.eragile_id,
            "Esperimentu Zikloa Amaituta! 🎉 Ikasi eta eskalatu!",
            `Zorionak lan bikainagatik! T0, T1 eta T2 neurketak bilduta dituzue. Ikusi lortutako aldaketa panelean eta partekatu lankideekin hurrengo urratsa erabakitzeko.`,
            "zoriontzea",
            new Date(now.getTime() + 30 * 86400000).toISOString(),
            0,
            `/panela`,
            data_ordu
          );
        }
      } else {
        // Dagoeneko bazegoen neurketaren bat fase honetan: batez bestekoa aberastu da!
        insertNudge.run(
          "nudge-" + Date.now(),
          exp.eragile_id,
          `${unea} faseko beste saio bat gehitu da (${existingSamePhaseCount + 1}. saioa) 📈`,
          `${unea} faseko neurketa osagarria erregistratuta. Datu honekin fase honetako batez bestekoa zehatzagoa eta sendoagoa da orain!`,
          "bultzada",
          null,
          0,
          `/panela`,
          data_ordu
        );
      }
    }

    const savedNeurketa = db.prepare("SELECT * FROM neurketak WHERE id = ?").get(id) as Neurketa;

    return NextResponse.json({
      success: true,
      data: savedNeurketa,
    });
  } catch (error) {
    console.error("Errorea neurketa gordetzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da neurketa gorde" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Neurketa IDa beharrezkoa da" },
        { status: 400 }
      );
    }

    db.prepare("DELETE FROM neurketak WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errorea neurketa ezabatzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan da neurketa ezabatu" },
      { status: 500 }
    );
  }
}
