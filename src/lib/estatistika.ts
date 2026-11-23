export interface WilsonTartea {
  p: number;
  behea: number;
  goia: number;
}

export interface AldeaTartea {
  d: number;
  behea: number;
  goia: number;
}

export type OndorioKodea = "zoria" | "txikia" | "argia" | "jaitsiera";

export interface OndorioEmaitza {
  kodea: OndorioKodea;
  testua: string;
}

export interface Protokoloa {
  asteko_egunak: number[]; // 0 = igandea ... 6 = larunbata
  ordu_hasiera: string; // "HH:MM"
  ordu_amaiera: string; // "HH:MM"
  iraupena_min: number;
  tolerantzia_min: number;
}

export type NeurketaEgoeraMota = "osoa" | "lagin_txikia" | "protokolotik_kanpo";

export interface NeurketaEgoeraEmaitza {
  osoa: boolean;
  laginTxikia: boolean;
  protokolotikKanpo: boolean;
  etiketak: NeurketaEgoeraMota[];
  n: number;
}

export interface SemaforoEmaitza {
  kolorea: "gorria" | "horia" | "berdea";
  osoaKopurua: number;
  saioGutxienekoa: number;
  malda: number | null;
  aldakortasuna: number | null;
  pct: number | null;
  totalN: number;
  mezua: string;
}

/**
 * %95eko Wilson tartea. x = euskaraz, n = guztira. 0-1 eskalan itzultzen du.
 */
export function wilson(x: number, n: number, z = 1.96): WilsonTartea {
  if (n <= 0) {
    return { p: 0, behea: 0, goia: 0 };
  }
  const safeX = Math.max(0, Math.min(x, n));
  const p = safeX / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const zentroa = (p + z2 / (2 * n)) / denom;
  const marjina = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return {
    p,
    behea: Math.max(0, zentroa - marjina),
    goia: Math.min(1, zentroa + marjina),
  };
}

/**
 * Wilson tartearen erdia puntu portzentualetan (0-100 eskalan).
 */
export function wilsonMarjinaPuntu(x: number, n: number, z = 1.96): number {
  if (n <= 0) return 0;
  const w = wilson(x, n, z);
  return ((w.goia - w.behea) / 2) * 100;
}

/**
 * Bi faseren arteko aldea (p1 - p0) eta bere %95eko tartea, Newcombe metodoa.
 * 0-1 eskalan itzultzen du.
 */
export function aldea(x0: number, n0: number, x1: number, n1: number, z = 1.96): AldeaTartea {
  const w0 = wilson(x0, n0, z);
  const w1 = wilson(x1, n1, z);
  const d = w1.p - w0.p;
  const behea = d - Math.sqrt((w1.p - w1.behea) ** 2 + (w0.goia - w0.p) ** 2);
  const goia = d + Math.sqrt((w1.goia - w1.p) ** 2 + (w0.p - w0.behea) ** 2);
  return { d, behea, goia };
}

/**
 * Ondorio-esaldia Newcombe aldearen eta xedearen (puntu portzentualetan) arabera.
 */
export function ondorioa(a: AldeaTartea, xede_pp: number): OndorioEmaitza {
  if (a.behea <= 0 && 0 <= a.goia) {
    return {
      kodea: "zoria",
      testua: "Aldea zoriz azal daiteke. Oraindik ez dakigu esku-hartzeak eragin duen. Neurtu gehiago.",
    };
  }
  if (a.goia < 0) {
    return {
      kodea: "jaitsiera",
      testua: "Erabilera jaitsi egin da.",
    };
  }
  const dPuntu = a.d * 100;
  if (a.behea > 0 && dPuntu < xede_pp) {
    return {
      kodea: "txikia",
      testua: `Igoera badago, baina zuen xedea (+${xede_pp} puntu) baino txikiagoa da.`,
    };
  }
  return {
    kodea: "argia",
    testua: "Aldea argia da eta zuen xedea betetzen du.",
  };
}

/**
 * Formateatu zenbakia euskal hamartar komarekin (adib. 21,4).
 */
export function formatDecimalEu(val: number, decimals = 1): string {
  return val.toFixed(decimals).replace(".", ",");
}

/**
 * Formateatu zeinudun aldea puntutan (adib. +13,5 edo −1,5).
 */
export function formatSignedPuntu(val: number, decimals = 1): string {
  const abs = Math.abs(val).toFixed(decimals).replace(".", ",");
  if (val > 0) return `+${abs}`;
  if (val < 0) return `−${abs}`;
  return abs;
}

/**
 * Formateatu tartearen muturrak euskaraz (adib. "−1,5etik +26,3ra").
 */
export function formatAldeaTarteaEu(a: AldeaTartea, decimals = 1): string {
  const low = formatSignedPuntu(a.behea * 100, decimals);
  const high = formatSignedPuntu(a.goia * 100, decimals);
  return `${low}etik ${high}ra`;
}

/**
 * Parseatu protokoloa JSON kate batetik modu seguruan.
 */
export function parseProtokoloa(protokoloaJson?: string | null): Protokoloa | null {
  if (!protokoloaJson) return null;
  try {
    const p = JSON.parse(protokoloaJson);
    if (!p || typeof p !== "object") return null;
    return {
      asteko_egunak: Array.isArray(p.asteko_egunak) ? p.asteko_egunak.map(Number) : [],
      ordu_hasiera: String(p.ordu_hasiera || ""),
      ordu_amaiera: String(p.ordu_amaiera || ""),
      iraupena_min: Number(p.iraupena_min || 30),
      tolerantzia_min: Number(p.tolerantzia_min ?? 60),
    };
  } catch {
    return null;
  }
}

export function isDateInProtokoloa(dateInput: Date | string, protokoloa: Protokoloa | null): boolean {
  if (!protokoloa) return true;
  const dt = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(dt.getTime())) return true;

  if (protokoloa.asteko_egunak.length > 0 && !protokoloa.asteko_egunak.includes(dt.getDay())) {
    return false;
  }

  if (protokoloa.ordu_hasiera && protokoloa.ordu_amaiera) {
    const [h1, m1] = protokoloa.ordu_hasiera.split(":").map(Number);
    const [h2, m2] = protokoloa.ordu_amaiera.split(":").map(Number);
    if (!isNaN(h1) && !isNaN(h2)) {
      const tol = Number(protokoloa.tolerantzia_min ?? 60);
      const mins = dt.getHours() * 60 + dt.getMinutes();
      const startMins = h1 * 60 + (m1 || 0) - tol;
      const endMins = h2 * 60 + (m2 || 0) + tol;
      if (mins < startMins || mins > endMins) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Neurketa baten egoera kalkulatua (ez da datu-basean gordetzen).
 */
export function neurketaEgoera(
  neurketa: {
    euskaraz_count: number;
    erdaraz_count: number;
    elebi_count: number;
    aldaketa_count?: number;
    data_ordu: string;
    hasiera_ordu?: string | null;
  },
  options?: {
    nGutxienekoa?: number;
    protokoloa?: Protokoloa | null;
  }
): NeurketaEgoeraEmaitza {
  const nMin = options?.nGutxienekoa ?? 20;
  const protokoloa = options?.protokoloa ?? null;
  const n =
    (neurketa.euskaraz_count || 0) +
    (neurketa.aldaketa_count || 0) +
    (neurketa.erdaraz_count || 0) +
    (neurketa.elebi_count || 0);

  const laginTxikia = n < nMin;
  const refDate = neurketa.hasiera_ordu || neurketa.data_ordu;
  const protokolotikKanpo = protokoloa ? !isDateInProtokoloa(refDate, protokoloa) : false;

  const etiketak: NeurketaEgoeraMota[] = [];
  if (laginTxikia) etiketak.push("lagin_txikia");
  if (protokolotikKanpo) etiketak.push("protokolotik_kanpo");
  if (etiketak.length === 0) etiketak.push("osoa");

  return {
    osoa: !laginTxikia && !protokolotikKanpo,
    laginTxikia,
    protokolotikKanpo,
    etiketak,
    n,
  };
}

/**
 * Fase baten semaforoa kalkulatzen du azken `saioGutxienekoa` saio osoekin.
 */
export function faseSemaforoa(
  phaseNeurketak: Array<{
    euskaraz_count: number;
    erdaraz_count: number;
    elebi_count: number;
    aldaketa_count?: number;
    data_ordu: string;
    hasiera_ordu?: string | null;
  }>,
  fasea: "T0" | "T1" | "T2",
  options?: {
    nGutxienekoa?: number;
    saioGutxienekoa?: number;
    protokoloa?: Protokoloa | null;
  }
): SemaforoEmaitza {
  const nMin = options?.nGutxienekoa ?? 20;
  const saioMin = options?.saioGutxienekoa ?? 4;
  const protokoloa = options?.protokoloa ?? null;

  const totalEusk = phaseNeurketak.reduce(
    (s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0),
    0
  );
  const totalN = phaseNeurketak.reduce(
    (s, n) =>
      s +
      (n.euskaraz_count || 0) +
      (n.aldaketa_count || 0) +
      (n.erdaraz_count || 0) +
      (n.elebi_count || 0),
    0
  );
  const pct = totalN > 0 ? Math.round((totalEusk / totalN) * 1000) / 10 : null;

  const osoaList = phaseNeurketak
    .filter((n) => neurketaEgoera(n, { nGutxienekoa: nMin, protokoloa }).osoa)
    .sort((a, b) => (a.hasiera_ordu || a.data_ordu).localeCompare(b.hasiera_ordu || b.data_ordu));

  if (osoaList.length < saioMin) {
    return {
      kolorea: "gorria",
      osoaKopurua: osoaList.length,
      saioGutxienekoa: saioMin,
      malda: null,
      aldakortasuna: null,
      pct,
      totalN,
      mezua: `Ez dago prest — ${fasea}: ${osoaList.length}/${saioMin} saio oso.`,
    };
  }

  const recent = osoaList.slice(-saioMin);
  const pcts = recent.map((n) => {
    const eusk = (n.euskaraz_count || 0) + (n.aldaketa_count || 0);
    const tot = eusk + (n.erdaraz_count || 0) + (n.elebi_count || 0);
    return tot > 0 ? (eusk / tot) * 100 : 0;
  });

  const aldakortasuna = Math.max(...pcts) - Math.min(...pcts);
  const k = pcts.length;
  const xMean = (k - 1) / 2;
  const yMean = pcts.reduce((a, b) => a + b, 0) / k;
  let num = 0;
  let den = 0;
  for (let i = 0; i < k; i++) {
    num += (i - xMean) * (pcts[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  const malda = den > 0 ? num / den : 0;

  if (Math.abs(malda) >= 3 || aldakortasuna > 15) {
    return {
      kolorea: "horia",
      osoaKopurua: osoaList.length,
      saioGutxienekoa: saioMin,
      malda,
      aldakortasuna,
      pct,
      totalN,
      mezua:
        fasea === "T0"
          ? "Itxaron — Erabilera igotzen ari da esku-hartu gabe ere. Neurtu beste behin edo bitan."
          : `Itxaron — ${fasea} faseko neurketak oraindik ez daude egonkor. Neurtu beste behin edo bitan.`,
    };
  }

  return {
    kolorea: "berdea",
    osoaKopurua: osoaList.length,
    saioGutxienekoa: saioMin,
    malda,
    aldakortasuna,
    pct,
    totalN,
    mezua:
      fasea === "T0"
        ? `Prest — Oinarri-lerroa egonkor dago: %${pct !== null ? formatDecimalEu(pct) : "0"} (${totalN} elkarrizketa).`
        : `Prest — ${fasea} fasea egonkor dago: %${pct !== null ? formatDecimalEu(pct) : "0"} (${totalN} elkarrizketa).`,
  };
}
