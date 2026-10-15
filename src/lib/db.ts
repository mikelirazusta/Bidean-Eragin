import Database from "better-sqlite3";
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

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "bidean_eragin.db");
const db = new Database(dbPath);

// Initialize tables and seed initial data
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
    sortze_data TEXT NOT NULL
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
    kolorea TEXT NOT NULL
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
`);

// Seed default pilots if empty
const countPilots = db.prepare("SELECT COUNT(*) as count FROM pilotuak").get() as { count: number };
if (countPilots.count === 0) {
  const insertPilot = db.prepare(`
    INSERT INTO pilotuak (id, izena, azpititulua, deskribapena, mota, adibidea, urratsak_json, ikonoa, kolorea)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPilot.run(
    "barra-barra-txapak",
    "Euskaraz barra-barra txapak",
    "Langileek txapa eramatea komertzioetan lehen hitza eta konfiantza euskaraz pizteko",
    "Komertzio eta saltokietako langileek 'Euskaraz barra-barra' txapa ikusgai eramanez gero, bezeroak segurtasuna eta erosotasuna sentitzen du lehen agurra eta elkarrizketa osoa euskaraz egiteko, inertzia gaztelaniara jotzea saihestuz.",
    "Merkataritza, ostalaritza eta saltokiak",
    "Langileak txapa paparrean duenean: bezeroak 'Egun on!' esan eta elkarrizketa naturaltasunez euskaraz abiatzen da.",
    JSON.stringify([
      "1. Saltokiko langileekin dinamika adostu eta 'Euskaraz barra-barra' txapak banatu.",
      "2. T0 neurketa itsua egin (txaparik gabe, bezeroen lehen hitza eta elkarrizketak neurtzeko).",
      "3. Txapak soinean jarri eta bezeroei begi-bistara ikusgarri erakutsi.",
      "4. T1 neurketa egin (txapekin lehen asteko eragina eta euskarazko agurrak neurtzeko).",
      "5. T2 neurketa egin 14-21 egunera, portaera-ohitura sendotu dela balioztatzeko."
    ]),
    "BadgeCheck",
    "emerald"
  );
}

// Safe column migrations for existing SQLite databases
try {
  db.exec("ALTER TABLE pilotuak ADD COLUMN sortzaile_id TEXT;");
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

// Ensure admin user exists with password
const adminUser = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@bagera.eus") as User | undefined;
if (!adminUser) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, name, role, eragile_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run("user-admin", "admin@bagera.eus", "bagera2026", "Mikel (Bagera Admin)", "admin", null, new Date().toISOString());
} else if (!adminUser.password) {
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run("bagera2026", "admin@bagera.eus");
}

// Remove any non-admin demo users if they don't have a matching eragilea
db.prepare("DELETE FROM users WHERE role = 'eragilea' AND (eragile_id IS NULL OR eragile_id NOT IN (SELECT id FROM eragileak))").run();

export function getInitialData() {
  const pilotuak = db.prepare("SELECT * FROM pilotuak").all() as Pilotua[];
  const eragileak = db.prepare("SELECT * FROM eragileak ORDER BY sortze_data DESC").all() as Eragilea[];
  const esperimentuak = db.prepare(`
    SELECT e.*, p.izena as pilotu_izena, p.ikonoa as pilotu_ikonoa, er.izena as eragile_izena
    FROM esperimentuak e
    LEFT JOIN pilotuak p ON e.pilotu_id = p.id
    LEFT JOIN eragileak er ON e.eragile_id = er.id
    ORDER BY e.hasiera_data DESC
  `).all() as (Esperimentua & { eragile_izena: string })[];
  const neurketak = db.prepare("SELECT * FROM neurketak ORDER BY data_ordu DESC").all() as Neurketa[];
  const nudges = db.prepare("SELECT * FROM nudges ORDER BY sortze_data DESC").all() as Nudge[];

  return { pilotuak, eragileak, esperimentuak, neurketak, nudges };
}

export default db;
