import { describe, it } from "node:test";
import assert from "node:assert/strict";
import db, { runWithCloudRetry, importDbSnapshot, exportDbSnapshot } from "./db.ts";

describe("db.ts — §7.5 lehiakideak eta §7.10 migrazioa", () => {
  it("bi neurketa aldi berean bidaltzean (Promise.all), biak gordetzen dira", async () => {
    const expId = "exp-test-conc-" + Date.now();
    const eragileId = "er-test-conc-" + Date.now();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO eragileak (id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(eragileId, "Proba Postua", "merkataritza", "Ane", "proba@example.eus", "Erronka", now, 0);

    db.prepare(
      `INSERT INTO esperimentuak (id, eragile_id, pilotu_id, hipotesia, taldea, pertsonak, gunea, xede_portzentajea, estatusa, hasiera_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(expId, eragileId, "barra-barra-txapak", "Hipotesia", "Taldea", "Pertsonak", "Gunea", 20, "T0_zain", now);

    const id1 = "neu-conc-1-" + Date.now();
    const id2 = "neu-conc-2-" + Date.now();

    await Promise.all([
      runWithCloudRetry(() => {
        db.prepare(
          `INSERT INTO neurketak (id, esperimentu_id, unea, euskaraz_count, erdaraz_count, elebi_count, iraupena_segundotan, data_ordu, oharrak, behatzailea)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(id1, expId, "T0", 10, 10, 0, 1800, now, "", "Ane");
      }),
      runWithCloudRetry(() => {
        db.prepare(
          `INSERT INTO neurketak (id, esperimentu_id, unea, euskaraz_count, erdaraz_count, elebi_count, iraupena_segundotan, data_ordu, oharrak, behatzailea)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(id2, expId, "T0", 12, 8, 0, 1800, now, "", "Jon");
      }),
    ]);

    const row1 = db.prepare("SELECT * FROM neurketak WHERE id = ?").get(id1);
    const row2 = db.prepare("SELECT * FROM neurketak WHERE id = ?").get(id2);
    assert.ok(row1, "1. neurketa gorde behar zen");
    assert.ok(row2, "2. neurketa gorde behar zen");

    // Clean up test rows
    db.prepare("DELETE FROM neurketak WHERE esperimentu_id = ?").run(expId);
    db.prepare("DELETE FROM esperimentuak WHERE id = ?").run(expId);
    db.prepare("DELETE FROM eragileak WHERE id = ?").run(eragileId);
  });

  it("ekoizpeneko snapshot zahar bat (eremu berririk gabe) arazorik gabe inportatzen da", () => {
    const before = exportDbSnapshot();
    const legacySnapshot = {
      users: before.users,
      eragileak: [
        {
          id: "er-legacy-1",
          izena: "Ameri-goikoa",
          mota: "merkataritza" as const,
          arduraduna: "Mikel",
          email: "ameri@example.eus",
          erronka_nagusia: "Euskara gehiago",
          sortze_data: "2026-10-01T10:00:00.000Z",
          publikoa: 0,
        },
      ],
      pilotuak: before.pilotuak,
      esperimentuak: [
        {
          id: "exp-legacy-1",
          eragile_id: "er-legacy-1",
          pilotu_id: "barra-barra-txapak",
          hipotesia: "Hipotesi zaharra",
          taldea: "Langileak",
          pertsonak: "Bezeroak",
          gunea: "Postua",
          xede_portzentajea: 20,
          estatusa: "T1_zain" as const,
          hasiera_data: "2026-10-16T10:00:00.000Z",
        },
      ],
      neurketak: [
        {
          id: "neu-legacy-1",
          esperimentu_id: "exp-legacy-1",
          unea: "T0" as const,
          euskaraz_count: 5,
          erdaraz_count: 21,
          elebi_count: 0,
          iraupena_segundotan: 1800,
          data_ordu: "2026-10-16T11:47:00.000Z",
          oharrak: "",
          behatzailea: "Behatzailea",
        },
      ],
      nudges: [],
    };

    try {
      importDbSnapshot(legacySnapshot);
      const exp = db.prepare("SELECT * FROM esperimentuak WHERE id = ?").get("exp-legacy-1");
      assert.ok(exp);
      assert.equal(exp.n_gutxienekoa, 20);
      assert.equal(exp.saio_gutxienekoa, 4);
      assert.equal(exp.t2_mota, "jarraipena");
      assert.equal(exp.kontagailu_txantiloia, "oinarrizkoa");
      const neu = db.prepare("SELECT * FROM neurketak WHERE id = ?").get("neu-legacy-1");
      assert.ok(neu);
      assert.equal(neu.euskaraz_count, 5);
      assert.equal(neu.aldaketa_count, 0);
    } finally {
      // Restore original DB state
      importDbSnapshot(before);
    }
  });
});
