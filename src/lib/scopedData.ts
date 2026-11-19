import db, {
  Eragilea,
  Esperimentua,
  Neurketa,
  Nudge,
  Pilotua,
  getUiTexts,
} from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

export interface ScopedBootstrapData {
  pilotuak: Pilotua[];
  eragileak: Eragilea[];
  esperimentuak: (Esperimentua & { eragile_izena?: string })[];
  neurketak: Neurketa[];
  nudges: Nudge[];
  uiTexts: Record<string, string>;
}

export function getScopedBootstrapData(session: SessionPayload | null): ScopedBootstrapData {
  const uiTexts = getUiTexts();

  // Never leak entities, emails, experiments, measurements or nudges to unauthenticated visitors
  if (!session) {
    return {
      pilotuak: [],
      eragileak: [],
      esperimentuak: [],
      neurketak: [],
      nudges: [],
      uiTexts,
    };
  }

  const pilotuak = db.prepare("SELECT * FROM pilotuak").all() as Pilotua[];
  const allEragileak = db
    .prepare("SELECT * FROM eragileak ORDER BY sortze_data DESC")
    .all() as Eragilea[];
  const allEsperimentuak = db
    .prepare(`
      SELECT e.*, p.izena as pilotu_izena, p.ikonoa as pilotu_ikonoa, er.izena as eragile_izena
      FROM esperimentuak e
      LEFT JOIN pilotuak p ON e.pilotu_id = p.id
      LEFT JOIN eragileak er ON e.eragile_id = er.id
      ORDER BY e.hasiera_data DESC
    `)
    .all() as (Esperimentua & { eragile_izena?: string })[];
  const allNeurketak = db
    .prepare("SELECT * FROM neurketak ORDER BY data_ordu DESC")
    .all() as Neurketa[];
  const allNudges = db
    .prepare("SELECT * FROM nudges ORDER BY sortze_data DESC")
    .all() as Nudge[];

  if (session.role === "admin") {
    return {
      pilotuak,
      eragileak: allEragileak,
      esperimentuak: allEsperimentuak,
      neurketak: allNeurketak,
      nudges: allNudges,
      uiTexts,
    };
  }

  // Regular entity user: own entity (full) + public entities (email stripped)
  const ownId = session.eragile_id || "";
  const eragileak = allEragileak
    .filter((er) => er.id === ownId || Number(er.publikoa) === 1)
    .map((er) => (er.id === ownId ? er : { ...er, email: "" }));

  const visibleEragileIds = new Set(eragileak.map((er) => er.id));
  const esperimentuak = allEsperimentuak.filter((exp) =>
    visibleEragileIds.has(exp.eragile_id)
  );
  const visibleExpIds = new Set(esperimentuak.map((exp) => exp.id));
  const neurketak = allNeurketak.filter((neu) => visibleExpIds.has(neu.esperimentu_id));
  const nudges = allNudges.filter((nd) => nd.eragile_id === ownId);

  return {
    pilotuak,
    eragileak,
    esperimentuak,
    neurketak,
    nudges,
    uiTexts,
  };
}
