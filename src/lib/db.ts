import path from "path";
import fs from "fs";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "eragilea" | "admin";
  password?: string;
  eragile_id?: string;
  created_at?: string;
}

export interface Eragilea {
  id: string;
  izena: string;
  mota: "ikastetxea" | "merkataritza" | "enpresa" | "aisialdia";
  arduraduna: string;
  email: string;
  erronka_nagusia: string;
  sortze_data: string;
  publikoa?: number; // 0 = Pribatua / Kode anonimoa (#ID), 1 = Izena publikoki ikusgai komunitatean
}

export function getPublicEragileLabel(
  eragile: Eragilea,
  viewerRole?: "admin" | "eragilea",
  viewerEragileId?: string
): string {
  // Admin or the owner of this center always sees the real name
  if (viewerRole === "admin" || (viewerEragileId && eragile.id === viewerEragileId)) {
    return eragile.izena;
  }
  // If the center explicitly opted-in to show its name publicly
  if (eragile.publikoa === 1) {
    return eragile.izena;
  }
  // Otherwise, return a deterministic anonymous ID code
  const suffix = eragile.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "01";
  const prefix =
    eragile.mota === "ikastetxea"
      ? "Ikastetxea"
      : eragile.mota === "enpresa"
      ? "Enpresa"
      : "Entitatea";
  return `${prefix} #${suffix}`;
}

export interface PilotuMateriala {
  id: string;
  izena: string;
  fitxategi_izena: string;
  mota: string;
  tamaina?: number;
  chunk_count?: number;
  data_url: string;
  sortze_data: string;
}

export function parsePilotuMaterialak(materialak_json?: string): PilotuMateriala[] {
  if (!materialak_json) return [];
  try {
    const parsed = JSON.parse(materialak_json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface Pilotua {
  id: string;
  izena: string;
  azpititulua: string;
  deskribapena: string;
  mota: string;
  adibidea: string;
  urratsak_json: string;
  ikonoa: string;
  kolorea: string;
  sortzaile_id?: string;
  materialak_json?: string;
}

export interface Esperimentua {
  id: string;
  eragile_id: string;
  pilotu_id: string;
  hipotesia: string;
  taldea: string;
  pertsonak: string;
  gunea: string;
  xede_portzentajea: number;
  estatusa: "Planifikatzen" | "T0_zain" | "T1_zain" | "T2_zain" | "Amaituta";
  hasiera_data: string;
  pilotu_izena?: string;
  pilotu_ikonoa?: string;
}

export interface Neurketa {
  id: string;
  esperimentu_id: string;
  unea: "T0" | "T1" | "T2";
  euskaraz_count: number;
  erdaraz_count: number;
  elebi_count: number;
  iraupena_segundotan: number;
  data_ordu: string;
  oharrak: string;
  behatzailea?: string;
}

export interface Nudge {
  id: string;
  eragile_id: string;
  titulua: string;
  mezua: string;
  mota: "abisua" | "zoriontzea" | "bultzada";
  epemuga: string;
  irakurria: number;
  ekintza_esteka?: string;
  sortze_data: string;
}

// Default seed data
const DEFAULT_PILOT: Pilotua = {
  id: "barra-barra-txapak",
  izena: "Euskaraz barra-barra txapak",
  azpititulua: "Langileek txapa bistan eramatea, herritarrek lehen hitza euskaraz egiteko konfiantza izan dezaten",
  deskribapena:
    "Entitateetako langileek 'Euskaraz barra-barra' txapa bistan eramaten dutenean, herritarrak badaki euskaraz artatuko dutela. Horrek segurtasuna ematen dio lehen agurra eta elkarrizketa euskaraz egiteko, gaztelaniarako inertzia hautsiz.",
  mota: "Merkataritza, ostalaritza eta harrera-guneak",
  adibidea: "Langileak txapa paparrean daramanean, herritarrak 'Egun on!' esan eta elkarrizketa naturaltasunez euskaraz abiatzen da.",
  urratsak_json: JSON.stringify([
    "1. Entitateko lantaldearekin dinamika adostu eta 'Euskaraz barra-barra' txapak banatu.",
    "2. T0 hasierako neurketa egin (txapa jarri aurretik, lehen hitza eta elkarrizketak zein hizkuntzatan diren jasotzeko).",
    "3. Txapak soinean eta leku ikusgarrian jarri.",
    "4. T1 neurketa egin (txapa jarri eta lehen astean izandako eragina neurtzeko).",
    "5. T2 neurketa egin 14-21 egunera, ohitura berria egonkortu dela egiaztatzeko."
  ]),
  ikonoa: "BadgeCheck",
  kolorea: "emerald",
};

export const DEFAULT_UI_TEXTS: Record<string, string> = {
  app_title: "Bidean Eragin",
  app_subtitle: "Euskararen erabilera sustatzeko esperimentu praktikoak • Bagera",
  auth_intro:
    "Euskararen erabilera sustatzeko eta neurtzeko tresna praktikoa. Jarraitu zure entitatearen bilakaera 3 urrats errazetan:",
  auth_step1_title: "Hipotesia zehaztu",
  auth_step1_desc: "Zure entitateko erronka eta helburua finkatu.",
  auth_step2_title: "T0 / T1 / T2 neurtu",
  auth_step2_desc: "Behaketa erraza eta diskretua mugikorrarekin.",
  auth_step3_title: "Bilakaera ikusi",
  auth_step3_desc: "Emaitzak modu pribatuan eta argian aztertu.",
  nav_panela: "Nire panela",
  nav_behaketa: "Neurtu",
  nav_katalogoa: "Pilotuak eta hipotesia",
  nav_komunitatea: "Komunitatea",
  nav_admin: "Koordinazioa",
  counter_badge: "Zuzeneko neurketa • Kontagailua",
  counter_title: "Elkarrizketen kontagailua",
  counter_subtitle: "Zuzeneko behaketa-saioa",
  counter_start_btn: "Hasi saioa",
  counter_pause_btn: "Pausatu",
  counter_save_btn: "Amaitu eta gorde",
  counter_t0_desc:
    "Pilotua martxan jarri aurretik euskaraz zenbat hitz egiten den neurtzen du, abiapuntua ezagutzeko.",
  counter_t1_desc:
    "Pilotua martxan jarri berritan egindako neurketa, lehen eragina ikusteko.",
  counter_t2_desc:
    "Handik 2-3 astera egindako neurketa, ohitura berria egonkortu den egiaztatzeko.",
  counter_btn_euskaraz: "Euskaraz",
  counter_btn_erdaraz: "Erdaraz",
  counter_btn_elebi: "Elebi (bi hizkuntzatan)",
  dashboard_step1_title: "1. urratsa: egin T0 hasierako neurketa (pilotuaren aurretik)",
  dashboard_step1_desc:
    "Pilotua martxan jarri aurretik, neurtu 10-30 minutuz gaur egungo elkarrizketak zein hizkuntzatan diren (abiapuntua ezagutzeko).",
  dashboard_step2_title: "2. urratsa: jarri pilotua martxan eta neurtu T1",
  dashboard_step3_title: "3. urratsa: egin T2 neurketa ohitura egonkortu dela egiaztatzeko",
  katalogoa_title: "Esku-hartze pilotuak",
  katalogoa_subtitle:
    "Aukeratu zure entitatean probatu nahi duzun dinamika, deskargatu materialak eta zehaztu hipotesia.",
  footer_text:
    "Bidean Eragin — Bagera Euskaltzaleen Elkartea • Euskararen erabilera neurgarria eta praktikoa",
};

const DEFAULT_ADMIN: User = {
  id: "user-admin",
  email: "admin@bagera.eus",
  password: "bagera2026",
  name: "Bagera Koordinazioa",
  role: "admin",
  eragile_id: undefined,
  created_at: new Date().toISOString(),
};

interface MemoryStoreData {
  users: User[];
  eragileak: Eragilea[];
  pilotuak: Pilotua[];
  esperimentuak: Esperimentua[];
  neurketak: Neurketa[];
  nudges: Nudge[];
  ui_texts?: Record<string, string>;
}

function createFallbackStore() {
  const storePath = path.join("/tmp", "bidean_eragin_store.json");
  let store: MemoryStoreData = {
    users: [DEFAULT_ADMIN],
    eragileak: [],
    pilotuak: [DEFAULT_PILOT],
    esperimentuak: [],
    neurketak: [],
    nudges: [],
    ui_texts: { ...DEFAULT_UI_TEXTS },
  };

  try {
    if (fs.existsSync(storePath)) {
      const content = fs.readFileSync(storePath, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.users)) {
        store = parsed;
      }
    }
  } catch {}

  function save() {
    try {
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
    } catch {}
  }

  // Ensure admin always exists in fallback
  if (!store.users.some((u) => u.role === "admin")) {
    store.users.push(DEFAULT_ADMIN);
    save();
  }
  if (!store.pilotuak.some((p) => p.id === "barra-barra-txapak")) {
    store.pilotuak.push(DEFAULT_PILOT);
    save();
  }

  return {
    exec: (_sql: string) => {},
    transaction: (fn: (...args: any[]) => any) => (...args: any[]) => fn(...args),
    prepare: (query: string) => {
      const q = query.trim().replace(/\s+/g, " ");

      return {
        get: (...params: any[]): any => {
          // Users
          if (q.includes("FROM users WHERE LOWER(email) = ?") || q.includes("FROM users WHERE email = ?")) {
            const emailParam = String(params[0]).toLowerCase();
            return store.users.find((u) => u.email.toLowerCase() === emailParam);
          }
          if (q.includes("FROM users WHERE role = 'admin'")) {
            return store.users.find((u) => u.role === "admin");
          }
          if (q.includes("FROM users WHERE id = ?")) {
            return store.users.find((u) => u.id === params[0]);
          }
          if (q.includes("FROM users WHERE eragile_id = ?")) {
            return store.users.find((u) => u.eragile_id === params[0]);
          }
          // Pilots count
          if (q.includes("COUNT(*) as count FROM pilotuak")) {
            return { count: store.pilotuak.length };
          }
          if (q.includes("FROM pilotuak WHERE id = ?")) {
            return store.pilotuak.find((p) => p.id === params[0]);
          }
          // Eragileak
          if (q.includes("FROM eragileak WHERE id = ?")) {
            return store.eragileak.find((e) => e.id === params[0]);
          }
          if (q.includes("FROM eragileak WHERE LOWER(email) = ?")) {
            const emailParam = String(params[0]).toLowerCase();
            return store.eragileak.find((e) => (e.email || "").toLowerCase() === emailParam);
          }
          if (q.includes("FROM eragileak WHERE LOWER(izena) = ?")) {
            const nameParam = String(params[0]).toLowerCase();
            return store.eragileak.find(
              (e) =>
                (e.izena || "").toLowerCase() === nameParam ||
                (e.arduraduna || "").toLowerCase() === nameParam
            );
          }
          // Esperimentuak
          if (q.includes("FROM esperimentuak") && q.includes("WHERE e.id = ?")) {
            const exp = store.esperimentuak.find((e) => e.id === params[0]);
            if (!exp) return undefined;
            const pilotu = store.pilotuak.find((p) => p.id === exp.pilotu_id);
            const eragile = store.eragileak.find((er) => er.id === exp.eragile_id);
            return {
              ...exp,
              pilotu_izena: pilotu?.izena,
              pilotu_ikonoa: pilotu?.ikonoa,
              eragile_izena: eragile?.izena,
            };
          }
          if (q.includes("FROM esperimentuak WHERE id = ?")) {
            const exp = store.esperimentuak.find((e) => e.id === params[0]);
            if (!exp) return undefined;
            const pilotu = store.pilotuak.find((p) => p.id === exp.pilotu_id);
            return {
              ...exp,
              pilotu_izena: pilotu?.izena,
              pilotu_ikonoa: pilotu?.ikonoa,
            };
          }
          // Neurketak
          if (q.includes("COUNT(*) as c FROM neurketak WHERE esperimentu_id = ? AND unea = ? AND id != ?")) {
            const [expId, unea, excludeId] = params;
            const c = store.neurketak.filter(
              (n) => n.esperimentu_id === expId && n.unea === unea && n.id !== excludeId
            ).length;
            return { c };
          }
          if (q.includes("FROM neurketak WHERE id = ?")) {
            return store.neurketak.find((n) => n.id === params[0]);
          }
          // Nudges
          if (q.includes("FROM nudges WHERE id = ?")) {
            return store.nudges.find((n) => n.id === params[0]);
          }
          return undefined;
        },
        all: (...params: any[]): any[] => {
          if (q.includes("FROM ui_texts")) {
            const map = { ...DEFAULT_UI_TEXTS, ...(store.ui_texts || {}) };
            return Object.entries(map).map(([key, value]) => ({ key, value }));
          }
          if (q.includes("FROM esperimentuak WHERE eragile_id = ?")) {
            return store.esperimentuak.filter((e) => e.eragile_id === params[0]);
          }
          if (q.includes("FROM users")) {
            return [...store.users];
          }
          if (q.includes("FROM pilotuak")) {
            return [...store.pilotuak];
          }
          if (q.includes("FROM eragileak")) {
            return [...store.eragileak].sort((a, b) => b.sortze_data.localeCompare(a.sortze_data));
          }
          if (q.includes("FROM esperimentuak")) {
            return store.esperimentuak.map((e) => {
              const pilotu = store.pilotuak.find((p) => p.id === e.pilotu_id);
              const eragile = store.eragileak.find((er) => er.id === e.eragile_id);
              return {
                ...e,
                pilotu_izena: pilotu?.izena,
                pilotu_ikonoa: pilotu?.ikonoa,
                eragile_izena: eragile?.izena,
              };
            });
          }
          if (q.includes("FROM neurketak")) {
            return [...store.neurketak].sort((a, b) => b.data_ordu.localeCompare(a.data_ordu));
          }
          if (q.includes("FROM nudges")) {
            return [...store.nudges].sort((a, b) => b.sortze_data.localeCompare(a.sortze_data));
          }
          return [];
        },
        run: (...params: any[]): { changes: number } => {
          if (q.startsWith("INSERT OR REPLACE INTO ui_texts")) {
            const [key, value] = params;
            if (!store.ui_texts) store.ui_texts = { ...DEFAULT_UI_TEXTS };
            store.ui_texts[String(key)] = String(value);
            save();
            return { changes: 1 };
          }
          if (q === "DELETE FROM ui_texts") {
            store.ui_texts = { ...DEFAULT_UI_TEXTS };
            save();
            return { changes: 1 };
          }
          if (q.startsWith("INSERT INTO users")) {
            const [id, email, password, name, role, eragile_id, created_at] = params;
            store.users.push({ id, email, password, name, role, eragile_id, created_at });
            save();
            return { changes: 1 };
          }
          if (q.startsWith("UPDATE users SET eragile_id = ? WHERE id = ?")) {
            const [eragile_id, id] = params;
            const u = store.users.find((user) => user.id === id);
            if (u) {
              u.eragile_id = eragile_id;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("UPDATE users SET password = ? WHERE email = ?")) {
            const [password, email] = params;
            const u = store.users.find((user) => user.email === email);
            if (u) u.password = password;
            save();
            return { changes: 1 };
          }
          if (q.startsWith("UPDATE users SET email = ?, password = ?, name = ? WHERE id = ?")) {
            const [email, password, name, id] = params;
            const u = store.users.find((user) => user.id === id);
            if (u) {
              u.email = email;
              u.password = password;
              u.name = name;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("UPDATE users SET email = ?, password = ?, name = ? WHERE eragile_id = ?")) {
            const [email, password, name, eragile_id] = params;
            const u = store.users.find((user) => user.eragile_id === eragile_id);
            if (u) {
              u.email = email;
              u.password = password;
              u.name = name;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("UPDATE users SET email = ?, name = ? WHERE eragile_id = ?")) {
            const [email, name, eragile_id] = params;
            const u = store.users.find((user) => user.eragile_id === eragile_id);
            if (u) {
              u.email = email;
              u.name = name;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q === "DELETE FROM users") {
            store.users = [];
            save();
            return { changes: 1 };
          }
          if (q === "DELETE FROM pilotuak") {
            store.pilotuak = [];
            save();
            return { changes: 1 };
          }
          if (q === "DELETE FROM pilotuak WHERE id != 'barra-barra-txapak'") {
            store.pilotuak = [DEFAULT_PILOT];
            save();
            return { changes: 1 };
          }
          if (q === "DELETE FROM users WHERE role = 'eragilea'") {
            store.users = store.users.filter((u) => u.role !== "eragilea");
            save();
            return { changes: 1 };
          }
          if (q.startsWith("DELETE FROM users WHERE eragile_id = ?")) {
            const [eragileId] = params;
            store.users = store.users.filter((u) => u.eragile_id !== eragileId || u.role === "admin");
            save();
            return { changes: 1 };
          }
          if (q.startsWith("DELETE FROM users WHERE role = 'eragilea'")) {
            const validEragileIds = new Set(store.eragileak.map((e) => e.id));
            store.users = store.users.filter(
              (u) => u.role !== "eragilea" || (u.eragile_id && validEragileIds.has(u.eragile_id))
            );
            save();
            return { changes: 1 };
          }
          if (q.startsWith("INSERT INTO eragileak")) {
            if (params.length >= 8) {
              const [id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa] = params;
              store.eragileak.push({ id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa: Number(publikoa || 0) });
            } else {
              const [id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data] = params;
              store.eragileak.push({ id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa: 0 });
            }
            save();
            return { changes: 1 };
          }
          if (q.startsWith("UPDATE eragileak SET izena = ?, mota = ?, arduraduna = ?, email = ?, erronka_nagusia = ?, publikoa = ? WHERE id = ?")) {
            const [izena, mota, arduraduna, email, erronka_nagusia, publikoa, id] = params;
            const er = store.eragileak.find((e) => e.id === id);
            if (er) {
              er.izena = izena;
              er.mota = mota;
              er.arduraduna = arduraduna;
              er.email = email;
              er.erronka_nagusia = erronka_nagusia;
              er.publikoa = Number(publikoa || 0);
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("UPDATE eragileak SET izena = ?, mota = ?, arduraduna = ?, email = ?, erronka_nagusia = ? WHERE id = ?")) {
            const [izena, mota, arduraduna, email, erronka_nagusia, id] = params;
            const er = store.eragileak.find((e) => e.id === id);
            if (er) {
              er.izena = izena;
              er.mota = mota;
              er.arduraduna = arduraduna;
              er.email = email;
              er.erronka_nagusia = erronka_nagusia;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("DELETE FROM eragileak WHERE id = ?")) {
            const [id] = params;
            store.eragileak = store.eragileak.filter((e) => e.id !== id);
            save();
            return { changes: 1 };
          }
          if (q.startsWith("INSERT INTO pilotuak")) {
            const [id, izena, azpititulua, deskribapena, mota, adibidea, urratsak_json, ikonoa, kolorea, sortzaile_id, materialak_json] = params;
            store.pilotuak.push({
              id,
              izena,
              azpititulua,
              deskribapena,
              mota,
              adibidea,
              urratsak_json,
              ikonoa,
              kolorea,
              sortzaile_id,
              materialak_json: materialak_json || "[]",
            });
            save();
            return { changes: 1 };
          }
          if (q.startsWith("UPDATE pilotuak SET izena = ?, azpititulua = ?, deskribapena = ?, mota = ?, adibidea = ?, urratsak_json = ?, ikonoa = ?, kolorea = ?, materialak_json = ? WHERE id = ?")) {
            const [izena, azpititulua, deskribapena, mota, adibidea, urratsak_json, ikonoa, kolorea, materialak_json, id] = params;
            const p = store.pilotuak.find((pil) => pil.id === id);
            if (p) {
              p.izena = izena;
              p.azpititulua = azpititulua;
              p.deskribapena = deskribapena;
              p.mota = mota;
              p.adibidea = adibidea;
              p.urratsak_json = urratsak_json;
              p.ikonoa = ikonoa;
              p.kolorea = kolorea;
              p.materialak_json = materialak_json || "[]";
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("UPDATE pilotuak SET izena = ?, azpititulua = ?, deskribapena = ?, mota = ?, adibidea = ?, urratsak_json = ?, ikonoa = ?, kolorea = ? WHERE id = ?")) {
            const [izena, azpititulua, deskribapena, mota, adibidea, urratsak_json, ikonoa, kolorea, id] = params;
            const p = store.pilotuak.find((pil) => pil.id === id);
            if (p) {
              p.izena = izena;
              p.azpititulua = azpititulua;
              p.deskribapena = deskribapena;
              p.mota = mota;
              p.adibidea = adibidea;
              p.urratsak_json = urratsak_json;
              p.ikonoa = ikonoa;
              p.kolorea = kolorea;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("DELETE FROM pilotuak WHERE id = ?")) {
            const [id] = params;
            store.pilotuak = store.pilotuak.filter((p) => p.id !== id);
            save();
            return { changes: 1 };
          }
          if (q.startsWith("INSERT INTO esperimentuak")) {
            const [id, eragile_id, pilotu_id, hipotesia, taldea, pertsonak, gunea, xede_portzentajea, estatusa, hasiera_data] = params;
            store.esperimentuak.push({ id, eragile_id, pilotu_id, hipotesia, taldea, pertsonak, gunea, xede_portzentajea, estatusa, hasiera_data });
            save();
            return { changes: 1 };
          }
          if (q.startsWith("UPDATE esperimentuak SET estatusa = ? WHERE id = ?")) {
            const [estatusa, id] = params;
            const exp = store.esperimentuak.find((e) => e.id === id);
            if (exp) exp.estatusa = estatusa;
            save();
            return { changes: 1 };
          }
          if (q.startsWith("UPDATE esperimentuak SET pilotu_id = ?, hipotesia = ?, taldea = ?, pertsonak = ?, gunea = ?, xede_portzentajea = ?, estatusa = ? WHERE id = ?")) {
            const [pilotu_id, hipotesia, taldea, pertsonak, gunea, xede_portzentajea, estatusa, id] = params;
            const exp = store.esperimentuak.find((e) => e.id === id);
            if (exp) {
              exp.pilotu_id = pilotu_id;
              exp.hipotesia = hipotesia;
              exp.taldea = taldea;
              exp.pertsonak = pertsonak;
              exp.gunea = gunea;
              exp.xede_portzentajea = Number(xede_portzentajea);
              exp.estatusa = estatusa;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("DELETE FROM esperimentuak WHERE eragile_id = ?")) {
            const [eragileId] = params;
            store.esperimentuak = store.esperimentuak.filter((e) => e.eragile_id !== eragileId);
            save();
            return { changes: 1 };
          }
          if (q.startsWith("INSERT INTO neurketak")) {
            const [id, esperimentu_id, unea, euskaraz_count, erdaraz_count, elebi_count, iraupena_segundotan, data_ordu, oharrak, behatzailea] = params;
            store.neurketak.push({ id, esperimentu_id, unea, euskaraz_count, erdaraz_count, elebi_count, iraupena_segundotan, data_ordu, oharrak, behatzailea });
            save();
            return { changes: 1 };
          }
          if (q.startsWith("UPDATE neurketak SET unea = ?, euskaraz_count = ?, erdaraz_count = ?, elebi_count = ?, oharrak = ?, behatzailea = ? WHERE id = ?")) {
            const [unea, euskaraz_count, erdaraz_count, elebi_count, oharrak, behatzailea, id] = params;
            const neu = store.neurketak.find((n) => n.id === id);
            if (neu) {
              neu.unea = unea;
              neu.euskaraz_count = Number(euskaraz_count);
              neu.erdaraz_count = Number(erdaraz_count);
              neu.elebi_count = Number(elebi_count);
              neu.oharrak = oharrak;
              neu.behatzailea = behatzailea;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith("DELETE FROM neurketak WHERE esperimentu_id = ?")) {
            const [expId] = params;
            store.neurketak = store.neurketak.filter((n) => n.esperimentu_id !== expId);
            save();
            return { changes: 1 };
          }
          if (q.startsWith("DELETE FROM neurketak WHERE id = ?")) {
            const [id] = params;
            store.neurketak = store.neurketak.filter((n) => n.id !== id);
            save();
            return { changes: 1 };
          }
          if (q.startsWith("INSERT INTO nudges")) {
            const [id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data] = params;
            store.nudges.push({ id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data });
            save();
            return { changes: 1 };
          }
          if (q.startsWith("UPDATE nudges SET irakurria = 1 WHERE id = ?")) {
            const [id] = params;
            const nd = store.nudges.find((n) => n.id === id);
            if (nd) nd.irakurria = 1;
            save();
            return { changes: 1 };
          }
          if (q.startsWith("DELETE FROM nudges WHERE eragile_id = ?")) {
            const [eragileId] = params;
            store.nudges = store.nudges.filter((n) => n.eragile_id !== eragileId);
            save();
            return { changes: 1 };
          }
          if (q.startsWith("DELETE FROM neurketak")) {
            store.neurketak = [];
            save();
            return { changes: 1 };
          }
          if (q.startsWith("DELETE FROM esperimentuak")) {
            store.esperimentuak = [];
            save();
            return { changes: 1 };
          }
          if (q.startsWith("DELETE FROM nudges")) {
            store.nudges = [];
            save();
            return { changes: 1 };
          }
          if (q.startsWith("DELETE FROM eragileak")) {
            store.eragileak = [];
            save();
            return { changes: 1 };
          }
          return { changes: 0 };
        },
      };
    },
  };
}

function initSqliteTables(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT 'bagera2026',
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'eragilea',
      eragile_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS eragileak (
      id TEXT PRIMARY KEY,
      izena TEXT NOT NULL,
      mota TEXT NOT NULL,
      arduraduna TEXT NOT NULL,
      email TEXT NOT NULL,
      erronka_nagusia TEXT NOT NULL,
      sortze_data TEXT NOT NULL,
      publikoa INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pilotuak (
      id TEXT PRIMARY KEY,
      izena TEXT NOT NULL,
      azpititulua TEXT NOT NULL,
      deskribapena TEXT NOT NULL,
      mota TEXT NOT NULL,
      adibidea TEXT NOT NULL,
      urratsak_json TEXT NOT NULL,
      ikonoa TEXT NOT NULL,
      kolorea TEXT NOT NULL,
      sortzaile_id TEXT,
      materialak_json TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS esperimentuak (
      id TEXT PRIMARY KEY,
      eragile_id TEXT NOT NULL,
      pilotu_id TEXT NOT NULL,
      hipotesia TEXT NOT NULL,
      taldea TEXT NOT NULL,
      pertsonak TEXT NOT NULL,
      gunea TEXT NOT NULL,
      xede_portzentajea INTEGER NOT NULL,
      estatusa TEXT NOT NULL,
      hasiera_data TEXT NOT NULL,
      FOREIGN KEY(eragile_id) REFERENCES eragileak(id),
      FOREIGN KEY(pilotu_id) REFERENCES pilotuak(id)
    );

    CREATE TABLE IF NOT EXISTS neurketak (
      id TEXT PRIMARY KEY,
      esperimentu_id TEXT NOT NULL,
      unea TEXT NOT NULL,
      euskaraz_count INTEGER NOT NULL DEFAULT 0,
      erdaraz_count INTEGER NOT NULL DEFAULT 0,
      elebi_count INTEGER NOT NULL DEFAULT 0,
      iraupena_segundotan INTEGER NOT NULL DEFAULT 600,
      data_ordu TEXT NOT NULL,
      oharrak TEXT,
      behatzailea TEXT,
      FOREIGN KEY(esperimentu_id) REFERENCES esperimentuak(id)
    );

    CREATE TABLE IF NOT EXISTS nudges (
      id TEXT PRIMARY KEY,
      eragile_id TEXT NOT NULL,
      titulua TEXT NOT NULL,
      mezua TEXT NOT NULL,
      mota TEXT NOT NULL,
      epemuga TEXT NOT NULL,
      irakurria INTEGER NOT NULL DEFAULT 0,
      ekintza_esteka TEXT,
      sortze_data TEXT NOT NULL,
      FOREIGN KEY(eragile_id) REFERENCES eragileak(id)
    );

    CREATE TABLE IF NOT EXISTS ui_texts (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  try {
    const countPilots = db.prepare("SELECT COUNT(*) as count FROM pilotuak").get() as { count: number };
    if (countPilots.count === 0) {
      db.prepare(`
        INSERT INTO pilotuak (id, izena, azpititulua, deskribapena, mota, adibidea, urratsak_json, ikonoa, kolorea)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        DEFAULT_PILOT.id,
        DEFAULT_PILOT.izena,
        DEFAULT_PILOT.azpititulua,
        DEFAULT_PILOT.deskribapena,
        DEFAULT_PILOT.mota,
        DEFAULT_PILOT.adibidea,
        DEFAULT_PILOT.urratsak_json,
        DEFAULT_PILOT.ikonoa,
        DEFAULT_PILOT.kolorea
      );
    }
  } catch {}

  try {
    db.exec("ALTER TABLE pilotuak ADD COLUMN sortzaile_id TEXT;");
  } catch {}
  try {
    db.exec("ALTER TABLE pilotuak ADD COLUMN materialak_json TEXT DEFAULT '[]';");
  } catch {}
  try {
    db.exec("ALTER TABLE eragileak ADD COLUMN publikoa INTEGER NOT NULL DEFAULT 0;");
  } catch {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'bagera2026';");
  } catch {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN eragile_id TEXT;");
  } catch {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN created_at TEXT;");
  } catch {}

  try {
    const adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin'").get() as User | undefined;
    if (!adminUser) {
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, eragile_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        DEFAULT_ADMIN.id,
        DEFAULT_ADMIN.email,
        DEFAULT_ADMIN.password,
        DEFAULT_ADMIN.name,
        DEFAULT_ADMIN.role,
        DEFAULT_ADMIN.eragile_id ?? null,
        DEFAULT_ADMIN.created_at
      );
    } else if (!adminUser.password) {
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run("bagera2026", adminUser.id);
    }
  } catch {}

  try {
    // Purge yesterday's test records & legacy fake pilots so the database starts 100% clean from 0
    db.prepare("DELETE FROM neurketak WHERE esperimentu_id IN ('exp-1792053345640', 'exp-1792061550571')").run();
    db.prepare("DELETE FROM esperimentuak WHERE eragile_id = 'zentro-1792052519787' OR id IN ('exp-1792053345640', 'exp-1792061550571')").run();
    db.prepare("DELETE FROM nudges WHERE eragile_id = 'zentro-1792052519787' OR id IN ('nudge-1792052519788', 'nudge-1792053345641', 'nudge-1792061550573')").run();
    db.prepare("DELETE FROM eragileak WHERE id = 'zentro-1792052519787'").run();
    db.prepare("DELETE FROM users WHERE id = 'user-1792052519787'").run();
    db.prepare("DELETE FROM pilotuak WHERE id IN ('erreferenteak', 'kriseilua', 'agur-txartelak')").run();
    db.prepare("DELETE FROM users WHERE role = 'eragilea' AND (eragile_id IS NULL OR eragile_id NOT IN (SELECT id FROM eragileak))").run();

    // Clean up any legacy 'itsua' / 'Itsua' wording in existing rows
    db.prepare("UPDATE neurketak SET behatzailea = 'Behatzailea' WHERE behatzailea = 'Behatzaile Itsua'").run();
    const existingPilots = db.prepare("SELECT * FROM pilotuak").all() as Pilotua[];
    for (const p of existingPilots) {
      if (p.urratsak_json && p.urratsak_json.toLowerCase().includes("itsu")) {
        const cleaned = p.urratsak_json
          .replace(/neurketa itsua/gi, "hasierako neurketa")
          .replace(/behaketa itsua/gi, "hasierako behaketa")
          .replace(/behatzaile itsua/gi, "behatzailea");
        db.prepare("UPDATE pilotuak SET urratsak_json = ? WHERE id = ?").run(cleaned, p.id);
      }
    }
    const existingNudges = db.prepare("SELECT * FROM nudges").all() as Nudge[];
    for (const nd of existingNudges) {
      if ((nd.titulua && nd.titulua.toLowerCase().includes("itsu")) || (nd.mezua && nd.mezua.toLowerCase().includes("itsu"))) {
        const cleanTitle = (nd.titulua || "")
          .replace(/Aurre-neurketa Itsua/gi, "Hasierako Neurketa")
          .replace(/neurketa itsua/gi, "hasierako neurketa")
          .replace(/behaketa itsua/gi, "hasierako behaketa");
        const cleanMsg = (nd.mezua || "")
          .replace(/neurketa itsua/gi, "hasierako neurketa")
          .replace(/behaketa itsua/gi, "hasierako behaketa");
        db.prepare("UPDATE nudges SET titulua = ?, mezua = ? WHERE id = ?").run(cleanTitle, cleanMsg, nd.id);
      }
    }
  } catch {}
}

// Global resilient database initialization
let db: any;

function initDb() {
  if (db) return db;

  const isServerless = Boolean(
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.VERCEL
  );

  const localDataDir = path.join(process.cwd(), "data");
  const localDbPath = path.join(localDataDir, "bidean_eragin_v2.db");

  let dbPath = localDbPath;

  if (isServerless) {
    dbPath = path.join("/tmp", "bidean_eragin_v2.db");
  } else {
    try {
      if (!fs.existsSync(localDataDir)) {
        fs.mkdirSync(localDataDir, { recursive: true });
      }
    } catch {
      dbPath = path.join("/tmp", "bidean_eragin_v2.db");
    }
  }

  try {
    // Attempt loading native better-sqlite3
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    db = new Database(dbPath);
    initSqliteTables(db);
    return db;
  } catch (error) {
    console.warn("better-sqlite3 native ez dago erabilgarri ingurune honetan. Memoria/JSON biltegi segurua martxan jartzen:", error);
    db = createFallbackStore();
    return db;
  }
}

// Netlify Blobs Cloud Persistence (so all phones/devices share the same database on Netlify)
interface BlobsContext {
  apiURL?: string;
  edgeURL?: string;
  uncachedEdgeURL?: string;
  siteID?: string;
  token?: string;
  region?: string;
}

const BLOB_STORE_NAME = "site:bidean-eragin";
const BLOB_KEY_NAME = "db-state-clean-v2";

function getNetlifyBlobsContext(): BlobsContext | null {
  try {
    const raw =
      (globalThis as any).netlifyBlobsContext ||
      (globalThis as any).Netlify?.env?.get?.("NETLIFY_BLOBS_CONTEXT") ||
      process.env.NETLIFY_BLOBS_CONTEXT;
    if (!raw || typeof raw !== "string") return null;
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (parsed && parsed.siteID && parsed.token) {
      return parsed;
    }
  } catch (e) {
    console.warn("Errorea Netlify Blobs testuingurua irakurtzean:", e);
  }
  return null;
}

async function readSnapshotFromNetlifyBlobs(): Promise<MemoryStoreData | null> {
  const ctx = getNetlifyBlobsContext();
  if (!ctx || !ctx.siteID || !ctx.token) return null;

  try {
    const baseUrl = ctx.uncachedEdgeURL || ctx.edgeURL;
    if (baseUrl) {
      let urlPath = `/${ctx.siteID}/${BLOB_STORE_NAME}/${BLOB_KEY_NAME}`;
      if (ctx.region) {
        urlPath = `/region:${ctx.region}${urlPath}`;
      }
      const url = new URL(urlPath, baseUrl).toString();
      const res = await fetch(url, {
        method: "GET",
        headers: { authorization: `Bearer ${ctx.token}` },
        cache: "no-store",
      });
      if (res.status === 404) return null;
      if (res.status === 200) {
        return (await res.json()) as MemoryStoreData;
      }
    } else {
      const apiUrl = new URL(
        `/api/v1/blobs/${ctx.siteID}/${BLOB_STORE_NAME}/${BLOB_KEY_NAME}`,
        ctx.apiURL || "https://api.netlify.com"
      );
      if (ctx.region) apiUrl.searchParams.set("region", ctx.region);
      const signedRes = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: {
          authorization: `Bearer ${ctx.token}`,
          accept: "application/json;type=signed-url",
        },
        cache: "no-store",
      });
      if (signedRes.status === 404) return null;
      if (signedRes.status === 200) {
        const { url: signedUrl } = await signedRes.json();
        const dataRes = await fetch(signedUrl, { method: "GET", cache: "no-store" });
        if (dataRes.status === 200) {
          return (await dataRes.json()) as MemoryStoreData;
        }
      }
    }
  } catch (e) {
    console.warn("Errorea Netlify Blobs-etik datuak irakurtzean:", e);
  }
  return null;
}

async function writeSnapshotToNetlifyBlobs(snapshot: MemoryStoreData): Promise<boolean> {
  const ctx = getNetlifyBlobsContext();
  if (!ctx || !ctx.siteID || !ctx.token) return false;

  try {
    const payload = JSON.stringify(snapshot);
    const baseUrl = ctx.uncachedEdgeURL || ctx.edgeURL;
    if (baseUrl) {
      let urlPath = `/${ctx.siteID}/${BLOB_STORE_NAME}/${BLOB_KEY_NAME}`;
      if (ctx.region) {
        urlPath = `/region:${ctx.region}${urlPath}`;
      }
      const url = new URL(urlPath, baseUrl).toString();
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${ctx.token}`,
          "content-type": "application/json",
          "cache-control": "max-age=0, stale-while-revalidate=60",
        },
        body: payload,
      });
      return res.status === 200;
    } else {
      const apiUrl = new URL(
        `/api/v1/blobs/${ctx.siteID}/${BLOB_STORE_NAME}/${BLOB_KEY_NAME}`,
        ctx.apiURL || "https://api.netlify.com"
      );
      if (ctx.region) apiUrl.searchParams.set("region", ctx.region);
      const signedRes = await fetch(apiUrl.toString(), {
        method: "PUT",
        headers: {
          authorization: `Bearer ${ctx.token}`,
          accept: "application/json;type=signed-url",
        },
      });
      if (signedRes.status === 200) {
        const { url: signedUrl } = await signedRes.json();
        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            "cache-control": "max-age=0, stale-while-revalidate=60",
          },
          body: payload,
        });
        return putRes.status === 200;
      }
    }
  } catch (e) {
    console.warn("Errorea Netlify Blobs-en datuak gordetzean:", e);
  }
  return false;
}

const LOCAL_BLOBS_DIR = path.join("/tmp", "bidean_eragin_blobs");

function ensureLocalBlobsDir() {
  try {
    if (!fs.existsSync(LOCAL_BLOBS_DIR)) {
      fs.mkdirSync(LOCAL_BLOBS_DIR, { recursive: true });
    }
  } catch {}
}

export async function writeCustomBlobJson(key: string, value: unknown): Promise<boolean> {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  const payload = JSON.stringify(value);

  try {
    ensureLocalBlobsDir();
    fs.writeFileSync(path.join(LOCAL_BLOBS_DIR, `${safeKey}.json`), payload, "utf-8");
  } catch {}

  const ctx = getNetlifyBlobsContext();
  if (!ctx || !ctx.siteID || !ctx.token) return true;

  try {
    const baseUrl = ctx.uncachedEdgeURL || ctx.edgeURL;
    if (baseUrl) {
      let urlPath = `/${ctx.siteID}/${BLOB_STORE_NAME}/${safeKey}`;
      if (ctx.region) {
        urlPath = `/region:${ctx.region}${urlPath}`;
      }
      const url = new URL(urlPath, baseUrl).toString();
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${ctx.token}`,
          "content-type": "application/json",
          "cache-control": "max-age=0, stale-while-revalidate=60",
        },
        body: payload,
      });
      return res.status === 200;
    } else {
      const apiUrl = new URL(
        `/api/v1/blobs/${ctx.siteID}/${BLOB_STORE_NAME}/${safeKey}`,
        ctx.apiURL || "https://api.netlify.com"
      );
      if (ctx.region) apiUrl.searchParams.set("region", ctx.region);
      const signedRes = await fetch(apiUrl.toString(), {
        method: "PUT",
        headers: {
          authorization: `Bearer ${ctx.token}`,
          accept: "application/json;type=signed-url",
        },
      });
      if (signedRes.status === 200) {
        const { url: signedUrl } = await signedRes.json();
        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            "cache-control": "max-age=0, stale-while-revalidate=60",
          },
          body: payload,
        });
        return putRes.status === 200;
      }
    }
  } catch (e) {
    console.warn(`Errorea Netlify Blobs-en (${safeKey}) gordetzean:`, e);
  }
  return false;
}

export async function readCustomBlobJson<T = any>(key: string, preferLocalCache = false): Promise<T | null> {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  const localFile = path.join(LOCAL_BLOBS_DIR, `${safeKey}.json`);

  if (preferLocalCache) {
    try {
      if (fs.existsSync(localFile)) {
        return JSON.parse(fs.readFileSync(localFile, "utf-8")) as T;
      }
    } catch {}
  }

  const ctx = getNetlifyBlobsContext();
  if (ctx && ctx.siteID && ctx.token) {
    try {
      const baseUrl = ctx.uncachedEdgeURL || ctx.edgeURL;
      if (baseUrl) {
        let urlPath = `/${ctx.siteID}/${BLOB_STORE_NAME}/${safeKey}`;
        if (ctx.region) {
          urlPath = `/region:${ctx.region}${urlPath}`;
        }
        const url = new URL(urlPath, baseUrl).toString();
        const res = await fetch(url, {
          method: "GET",
          headers: { authorization: `Bearer ${ctx.token}` },
          cache: "no-store",
        });
        if (res.status === 200) {
          const parsed = (await res.json()) as T;
          try {
            ensureLocalBlobsDir();
            fs.writeFileSync(localFile, JSON.stringify(parsed), "utf-8");
          } catch {}
          return parsed;
        }
      } else {
        const apiUrl = new URL(
          `/api/v1/blobs/${ctx.siteID}/${BLOB_STORE_NAME}/${safeKey}`,
          ctx.apiURL || "https://api.netlify.com"
        );
        if (ctx.region) apiUrl.searchParams.set("region", ctx.region);
        const signedRes = await fetch(apiUrl.toString(), {
          method: "GET",
          headers: {
            authorization: `Bearer ${ctx.token}`,
            accept: "application/json;type=signed-url",
          },
          cache: "no-store",
        });
        if (signedRes.status === 200) {
          const { url: signedUrl } = await signedRes.json();
          const dataRes = await fetch(signedUrl, { method: "GET", cache: "no-store" });
          if (dataRes.status === 200) {
            const parsed = (await dataRes.json()) as T;
            try {
              ensureLocalBlobsDir();
              fs.writeFileSync(localFile, JSON.stringify(parsed), "utf-8");
            } catch {}
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn(`Errorea Netlify Blobs-etik (${safeKey}) irakurtzean:`, e);
    }
  }

  try {
    if (fs.existsSync(localFile)) {
      return JSON.parse(fs.readFileSync(localFile, "utf-8")) as T;
    }
  } catch {}

  return null;
}

export interface StoredMaterialMeta {
  id: string;
  izena: string;
  fitxategi_izena: string;
  mota: string;
  tamaina: number;
  totalChunks: number;
  sortze_data: string;
}

export async function saveMaterialChunkToStore(params: {
  id: string;
  izena: string;
  fitxategi_izena: string;
  mota: string;
  tamaina: number;
  chunkIndex: number;
  totalChunks: number;
  chunkData: string;
  sortze_data?: string;
}): Promise<boolean> {
  const { id, izena, fitxategi_izena, mota, tamaina, chunkIndex, totalChunks, chunkData, sortze_data } = params;
  const chunkSaved = await writeCustomBlobJson(`mat-chunk-${id}-${chunkIndex}`, { chunkData });
  if (!chunkSaved) return false;

  if (chunkIndex === totalChunks - 1 || totalChunks === 1) {
    const meta: StoredMaterialMeta = {
      id,
      izena,
      fitxategi_izena,
      mota: mota || "application/pdf",
      tamaina: tamaina || 0,
      totalChunks,
      sortze_data: sortze_data || new Date().toISOString(),
    };
    await writeCustomBlobJson(`mat-meta-${id}`, meta);
  }
  return true;
}

export async function getMaterialMetaFromStore(id: string): Promise<StoredMaterialMeta | null> {
  return readCustomBlobJson<StoredMaterialMeta>(`mat-meta-${id}`, false);
}

export async function getMaterialChunkFromStore(id: string, chunkIndex: number): Promise<string | null> {
  const res = await readCustomBlobJson<{ chunkData: string }>(`mat-chunk-${id}-${chunkIndex}`, true);
  return res?.chunkData || null;
}

export async function offloadInlineMaterialsToStore(
  materialak: PilotuMateriala[]
): Promise<PilotuMateriala[]> {
  const CHUNK_CHAR_SIZE = 1400000; // ~1.4 MB per chunk
  const result: PilotuMateriala[] = [];

  for (const mat of materialak) {
    if (mat.data_url && mat.data_url.startsWith("data:")) {
      const commaIdx = mat.data_url.indexOf(",");
      const base64Raw = commaIdx >= 0 ? mat.data_url.slice(commaIdx + 1) : mat.data_url;
      const totalChunks = Math.max(1, Math.ceil(base64Raw.length / CHUNK_CHAR_SIZE));

      for (let i = 0; i < totalChunks; i++) {
        const slice = base64Raw.slice(i * CHUNK_CHAR_SIZE, (i + 1) * CHUNK_CHAR_SIZE);
        await saveMaterialChunkToStore({
          id: mat.id,
          izena: mat.izena,
          fitxategi_izena: mat.fitxategi_izena,
          mota: mat.mota || "application/pdf",
          tamaina: mat.tamaina || Math.round((base64Raw.length * 3) / 4),
          chunkIndex: i,
          totalChunks,
          chunkData: slice,
          sortze_data: mat.sortze_data,
        });
      }

      result.push({
        ...mat,
        chunk_count: totalChunks,
        data_url: `/api/materialak?id=${encodeURIComponent(mat.id)}`,
      });
    } else {
      result.push(mat);
    }
  }

  return result;
}

const LEGACY_UI_TEXT_VALUES = new Set([
  "Euskararen erabilera sustatzeko eta neurtzeko tresna praktikoa. Jarraitu zure saltoki edo eragilearen bilakaera 3 urrats errazetan:",
  "Euskararen erabilera aktibatzeko tresna praktikoa. Jarraitu zure saltoki edo zentroaren aurrerapena 3 urrats errazetan:",
  "Zure saltokiko erronka eta helburua zehaztu.",
  "Zure guneko erronka eta helburua finkatu.",
  "Nire Panela",
  "Nire Saltokia",
  "Pilotuak eta Hipotesia",
  "Bagera Admin",
  "Zuzeneko Neurketa • Kontagailua",
  "Elkarrizketen Kontagailua",
  "Hizkuntza-Ohituren Kontagailua",
  "Hasi Saioa",
  "Amaitu eta Gorde",
  "Elebi (Nahastua)",
  "1. Urratsa: Egin T0 hasierako neurketa (txapa jarri aurretik)",
  "2. Urratsa: Jarri 'Euskaraz barra-barra' txapa bistan eta neurtu T1",
  "2. Urratsa: Jarri 'Euskaraz barra-barra' txapa ikusgai eta neurtu T1",
  "3. Urratsa: Egin T2 neurketa ohitura egonkortu dela egiaztatzeko",
  "3. Urratsa: Egin T2 neurketa ohitura sendotu dela egiaztatzeko",
  "Esku-hartze Pilotuak",
  "Aukeratu zure gunean probatu nahi duzun dinamika, deskargatu materialak eta zehaztu hipotesia.",
]);

export function getUiTexts(): Record<string, string> {
  try {
    const database = initDb();
    const rows = database.prepare("SELECT * FROM ui_texts").all() as Array<{ key: string; value: string }>;
    const merged: Record<string, string> = { ...DEFAULT_UI_TEXTS };
    for (const r of rows) {
      if (r.key && typeof r.value === "string") {
        if (LEGACY_UI_TEXT_VALUES.has(r.value) && DEFAULT_UI_TEXTS[r.key]) {
          merged[r.key] = DEFAULT_UI_TEXTS[r.key];
        } else {
          merged[r.key] = r.value;
        }
      }
    }
    return merged;
  } catch {
    return { ...DEFAULT_UI_TEXTS };
  }
}

export function saveUiTexts(updates: Record<string, string>, resetAll = false): Record<string, string> {
  const database = initDb();
  if (resetAll) {
    database.prepare("DELETE FROM ui_texts").run();
    return { ...DEFAULT_UI_TEXTS };
  }
  const stmt = database.prepare("INSERT OR REPLACE INTO ui_texts (key, value) VALUES (?, ?)");
  for (const [k, v] of Object.entries(updates)) {
    if (typeof v === "string") {
      stmt.run(k, v);
    }
  }
  return getUiTexts();
}

export function exportDbSnapshot(): MemoryStoreData {
  const database = initDb();
  const users = database.prepare("SELECT * FROM users").all() as User[];
  const eragileak = database.prepare("SELECT * FROM eragileak ORDER BY sortze_data DESC").all() as Eragilea[];
  const pilotuak = database.prepare("SELECT * FROM pilotuak").all() as Pilotua[];
  const esperimentuak = database.prepare("SELECT * FROM esperimentuak").all() as Esperimentua[];
  const neurketak = database.prepare("SELECT * FROM neurketak ORDER BY data_ordu DESC").all() as Neurketa[];
  const nudges = database.prepare("SELECT * FROM nudges ORDER BY sortze_data DESC").all() as Nudge[];
  const ui_texts = getUiTexts();
  return { users, eragileak, pilotuak, esperimentuak, neurketak, nudges, ui_texts };
}

export function importDbSnapshot(snapshot: MemoryStoreData) {
  const database = initDb();
  const apply = database.transaction(() => {
    database.prepare("DELETE FROM neurketak").run();
    database.prepare("DELETE FROM esperimentuak").run();
    database.prepare("DELETE FROM nudges").run();
    database.prepare("DELETE FROM eragileak").run();
    database.prepare("DELETE FROM users").run();
    database.prepare("DELETE FROM pilotuak").run();

    const pilotsToInsert =
      Array.isArray(snapshot.pilotuak) && snapshot.pilotuak.length > 0
        ? [...snapshot.pilotuak]
        : [DEFAULT_PILOT];
    if (!pilotsToInsert.some((p) => p.id === DEFAULT_PILOT.id)) {
      pilotsToInsert.unshift(DEFAULT_PILOT);
    }
    for (const p of pilotsToInsert) {
      const cleanedSteps = (p.urratsak_json || DEFAULT_PILOT.urratsak_json)
        .replace(/neurketa itsua/gi, "hasierako neurketa")
        .replace(/behaketa itsua/gi, "hasierako behaketa")
        .replace(/behatzaile itsua/gi, "behatzailea");
      database
        .prepare(
          `INSERT INTO pilotuak (id, izena, azpititulua, deskribapena, mota, adibidea, urratsak_json, ikonoa, kolorea, sortzaile_id, materialak_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          p.id,
          p.izena,
          p.azpititulua,
          p.deskribapena,
          p.mota,
          p.adibidea,
          cleanedSteps,
          p.ikonoa,
          p.kolorea,
          p.sortzaile_id || null,
          p.materialak_json || "[]"
        );
    }

    const eragileakToInsert = Array.isArray(snapshot.eragileak) ? snapshot.eragileak : [];
    for (const er of eragileakToInsert) {
      database
        .prepare(
          `INSERT INTO eragileak (id, izena, mota, arduraduna, email, erronka_nagusia, sortze_data, publikoa)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          er.id,
          er.izena,
          er.mota,
          er.arduraduna,
          er.email || "",
          er.erronka_nagusia,
          er.sortze_data,
          Number(er.publikoa || 0)
        );
    }

    const usersToInsert =
      Array.isArray(snapshot.users) && snapshot.users.length > 0
        ? [...snapshot.users]
        : [DEFAULT_ADMIN];
    if (!usersToInsert.some((u) => u.role === "admin")) {
      usersToInsert.unshift(DEFAULT_ADMIN);
    }
    for (const u of usersToInsert) {
      // Ensure eragilea users are linked to their matching center if eragile_id was missing
      let resolvedEragileId = u.eragile_id || null;
      if (u.role === "eragilea" && !resolvedEragileId) {
        const matchedCenter = eragileakToInsert.find(
          (er) =>
            (er.email && u.email && er.email.toLowerCase() === u.email.toLowerCase()) ||
            (er.izena && u.name && er.izena.toLowerCase() === u.name.toLowerCase())
        );
        if (matchedCenter) {
          resolvedEragileId = matchedCenter.id;
        }
      }
      database
        .prepare(
          `INSERT INTO users (id, email, password, name, role, eragile_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          u.id,
          u.email,
          u.password || "bagera2026",
          u.name || "Bagera Koordinazioa",
          u.role,
          resolvedEragileId,
          u.created_at || new Date().toISOString()
        );
    }

    const expsToInsert = Array.isArray(snapshot.esperimentuak) ? snapshot.esperimentuak : [];
    for (const e of expsToInsert) {
      database
        .prepare(
          `INSERT INTO esperimentuak (id, eragile_id, pilotu_id, hipotesia, taldea, pertsonak, gunea, xede_portzentajea, estatusa, hasiera_data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          e.id,
          e.eragile_id,
          e.pilotu_id,
          (e.hipotesia || "").replace(/eramanda eginda/g, "eramanda"),
          e.taldea,
          e.pertsonak,
          e.gunea,
          e.xede_portzentajea,
          e.estatusa,
          e.hasiera_data
        );
    }

    const neurketakToInsert = Array.isArray(snapshot.neurketak) ? snapshot.neurketak : [];
    for (const n of neurketakToInsert) {
      const cleanedObserver =
        !n.behatzailea || n.behatzailea === "Behatzaile Itsua"
          ? "Behatzailea"
          : n.behatzailea;
      database
        .prepare(
          `INSERT INTO neurketak (id, esperimentu_id, unea, euskaraz_count, erdaraz_count, elebi_count, iraupena_segundotan, data_ordu, oharrak, behatzailea)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          n.id,
          n.esperimentu_id,
          n.unea,
          n.euskaraz_count || 0,
          n.erdaraz_count || 0,
          n.elebi_count || 0,
          n.iraupena_segundotan || 600,
          n.data_ordu,
          n.oharrak || "",
          cleanedObserver
        );
    }

    const nudgesToInsert = Array.isArray(snapshot.nudges) ? snapshot.nudges : [];
    for (const nd of nudgesToInsert) {
      const cleanTitle = (nd.titulua || "")
        .replace(/Aurre-neurketa Itsua/gi, "Hasierako Neurketa")
        .replace(/neurketa itsua/gi, "hasierako neurketa")
        .replace(/behaketa itsua/gi, "hasierako behaketa");
      const cleanMsg = (nd.mezua || "")
        .replace(/neurketa itsua/gi, "hasierako neurketa")
        .replace(/behaketa itsua/gi, "hasierako behaketa");
      database
        .prepare(
          `INSERT INTO nudges (id, eragile_id, titulua, mezua, mota, epemuga, irakurria, ekintza_esteka, sortze_data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          nd.id,
          nd.eragile_id,
          cleanTitle,
          cleanMsg,
          nd.mota,
          nd.epemuga || new Date().toISOString(),
          nd.irakurria || 0,
          nd.ekintza_esteka || "",
          nd.sortze_data
        );
    }

    if (snapshot.ui_texts && typeof snapshot.ui_texts === "object") {
      const stmt = database.prepare("INSERT OR REPLACE INTO ui_texts (key, value) VALUES (?, ?)");
      for (const [k, v] of Object.entries(snapshot.ui_texts)) {
        if (typeof v === "string") {
          stmt.run(k, v);
        }
      }
    }
  });
  apply();
}

export async function syncDbFromCloud(): Promise<void> {
  try {
    const cloudSnapshot = await readSnapshotFromNetlifyBlobs();
    if (cloudSnapshot && Array.isArray(cloudSnapshot.eragileak)) {
      importDbSnapshot(cloudSnapshot);
    }
  } catch (e) {
    console.warn("Errorea syncDbFromCloud exekutatzean:", e);
  }
}

export async function syncDbToCloud(): Promise<void> {
  try {
    const snapshot = exportDbSnapshot();
    await writeSnapshotToNetlifyBlobs(snapshot);
  } catch (e) {
    console.warn("Errorea syncDbToCloud exekutatzean:", e);
  }
}

// Proxied db export that lazily initializes on first use
const dbProxy = new Proxy({} as any, {
  get(_target, prop) {
    const instance = initDb();
    const value = instance[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export function getInitialData() {
  try {
    const database = initDb();
    const pilotuak = database.prepare("SELECT * FROM pilotuak").all() as Pilotua[];
    const eragileak = database.prepare("SELECT * FROM eragileak ORDER BY sortze_data DESC").all() as Eragilea[];
    const esperimentuak = database.prepare(`
      SELECT e.*, p.izena as pilotu_izena, p.ikonoa as pilotu_ikonoa, er.izena as eragile_izena
      FROM esperimentuak e
      LEFT JOIN pilotuak p ON e.pilotu_id = p.id
      LEFT JOIN eragileak er ON e.eragile_id = er.id
      ORDER BY e.hasiera_data DESC
    `).all() as (Esperimentua & { eragile_izena: string })[];
    const neurketak = database.prepare("SELECT * FROM neurketak ORDER BY data_ordu DESC").all() as Neurketa[];
    const nudges = database.prepare("SELECT * FROM nudges ORDER BY sortze_data DESC").all() as Nudge[];
    const uiTexts = getUiTexts();

    return { pilotuak, eragileak, esperimentuak, neurketak, nudges, uiTexts };
  } catch (err) {
    console.error("Errorea getInitialData kargatzean:", err);
    return {
      pilotuak: [DEFAULT_PILOT],
      eragileak: [],
      esperimentuak: [],
      neurketak: [],
      nudges: [],
      uiTexts: { ...DEFAULT_UI_TEXTS },
    };
  }
}

export default dbProxy;
