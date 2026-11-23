import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  wilson,
  wilsonMarjinaPuntu,
  aldea,
  ondorioa,
  neurketaEgoera,
  faseSemaforoa,
  type Protokoloa,
} from "./estatistika.ts";

function assertNear(actual: number, expected: number, tol = 0.2, label = "") {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${label}: expected ${expected} ± ${tol}, got ${actual.toFixed(3)}`
  );
}

const SAN_MARTIN_PROTOKOLOA: Protokoloa = {
  asteko_egunak: [5], // ostirala
  ordu_hasiera: "11:00",
  ordu_amaiera: "12:30",
  iraupena_min: 30,
  tolerantzia_min: 60,
};

describe("estatistika.ts — §7 onarpen-probak (San Martin)", () => {
  it("Ameri-goikoa: T0, T1, Newcombe aldea eta ondorioa", () => {
    const t0 = wilson(12, 56);
    assertNear(t0.p * 100, 21.4, 0.2, "Ameri T0 p");
    assertNear(t0.behea * 100, 12.7, 0.2, "Ameri T0 behea");
    assertNear(t0.goia * 100, 33.8, 0.2, "Ameri T0 goia");

    const t1 = wilson(37, 106);
    assertNear(t1.p * 100, 34.9, 0.2, "Ameri T1 p");
    assertNear(t1.behea * 100, 26.5, 0.2, "Ameri T1 behea");
    assertNear(t1.goia * 100, 44.4, 0.2, "Ameri T1 goia");

    const diff = aldea(12, 56, 37, 106);
    assertNear(diff.d * 100, 13.5, 0.2, "Ameri aldea d");
    assertNear(diff.behea * 100, -1.5, 0.2, "Ameri aldea behea");
    assertNear(diff.goia * 100, 26.3, 0.2, "Ameri aldea goia");

    const ond = ondorioa(diff, 20);
    assert.equal(ond.kodea, "zoria");
    assert.match(ond.testua, /Aldea zoriz azal daiteke/);
  });

  it("Lizardi: T0, T1, Newcombe aldea eta ondorioa", () => {
    const t0 = wilson(25, 43);
    assertNear(t0.p * 100, 58.1, 0.2, "Lizardi T0 p");
    assertNear(t0.behea * 100, 43.3, 0.2, "Lizardi T0 behea");
    assertNear(t0.goia * 100, 71.6, 0.2, "Lizardi T0 goia");

    const t1 = wilson(42, 59);
    assertNear(t1.p * 100, 71.2, 0.2, "Lizardi T1 p");
    assertNear(t1.behea * 100, 58.6, 0.2, "Lizardi T1 behea");
    assertNear(t1.goia * 100, 81.2, 0.2, "Lizardi T1 goia");

    const diff = aldea(25, 43, 42, 59);
    assertNear(diff.d * 100, 13.0, 0.2, "Lizardi aldea d");
    assertNear(diff.behea * 100, -5.4, 0.2, "Lizardi aldea behea");
    assertNear(diff.goia * 100, 30.9, 0.2, "Lizardi aldea goia");

    const ond = ondorioa(diff, 20);
    assert.equal(ond.kodea, "zoria");
  });

  it("Wilson tartearen erdia p = 0,5 denean (§7 taula)", () => {
    assertNear(wilsonMarjinaPuntu(6.5, 13), 23.9, 0.2, "n=13");
    assertNear(wilsonMarjinaPuntu(7.5, 15), 22.6, 0.2, "n=15");
    assertNear(wilsonMarjinaPuntu(10, 20), 20.1, 0.2, "n=20");
    assertNear(wilsonMarjinaPuntu(15, 30), 16.8, 0.2, "n=30");
    assertNear(wilsonMarjinaPuntu(25, 50), 13.4, 0.2, "n=50");
  });

  it("Ameri-goikoa eta Lizardi T0 semaforoa: gorria 1/4 saio oso", () => {
    const ameriT0 = [
      { euskaraz_count: 5, erdaraz_count: 21, elebi_count: 0, data_ordu: "2026-10-16T11:47:00" }, // ostirala -> osoa
      { euskaraz_count: 7, erdaraz_count: 23, elebi_count: 0, data_ordu: "2026-10-28T15:30:00" }, // asteazkena -> protokolotik kanpo
    ];
    const sAmeri = faseSemaforoa(ameriT0, "T0", { nGutxienekoa: 20, saioGutxienekoa: 4, protokoloa: SAN_MARTIN_PROTOKOLOA });
    assert.equal(sAmeri.kolorea, "gorria");
    assert.equal(sAmeri.osoaKopurua, 1);

    const lizardiT0 = [
      { euskaraz_count: 11, erdaraz_count: 9, elebi_count: 1, data_ordu: "2026-10-16T13:04:00" }, // ostirala, tolerantziaren barruan -> osoa
      { euskaraz_count: 14, erdaraz_count: 7, elebi_count: 1, data_ordu: "2026-10-29T10:36:00" }, // osteguna -> protokolotik kanpo
    ];
    const e1 = neurketaEgoera(lizardiT0[0], { nGutxienekoa: 20, protokoloa: SAN_MARTIN_PROTOKOLOA });
    assert.equal(e1.osoa, true);
    const e2 = neurketaEgoera(lizardiT0[1], { nGutxienekoa: 20, protokoloa: SAN_MARTIN_PROTOKOLOA });
    assert.equal(e2.protokolotikKanpo, true);

    const sLizardi = faseSemaforoa(lizardiT0, "T0", { nGutxienekoa: 20, saioGutxienekoa: 4, protokoloa: SAN_MARTIN_PROTOKOLOA });
    assert.equal(sLizardi.kolorea, "gorria");
    assert.equal(sLizardi.osoaKopurua, 1);
  });

  it("ondorioa(): txikia, argia eta jaitsiera kasuak", () => {
    const txikia = ondorioa({ d: 0.15, behea: 0.05, goia: 0.25 }, 20);
    assert.equal(txikia.kodea, "txikia");
    assert.match(txikia.testua, /\+20 puntu/);

    const argia = ondorioa({ d: 0.25, behea: 0.10, goia: 0.40 }, 20);
    assert.equal(argia.kodea, "argia");

    const jaitsiera = ondorioa({ d: -0.20, behea: -0.35, goia: -0.05 }, 20);
    assert.equal(jaitsiera.kodea, "jaitsiera");
  });
});
