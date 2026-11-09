import { NextResponse } from "next/server";
import db, { Pilotua, saveUiTexts, syncDbFromCloud, syncDbToCloud } from "@/lib/db";

interface LatxaRequestBody {
  ekintza:
    | "aholkularia_eta_hipotesia"
    | "hobetu_hipotesia"
    | "elkarrizketa"
    | "ondorioak_eta_analisia"
    | "sortu_nudge_mezua"
    | "komunitate_txostena";
  esperimentu_id?: string;
  eragile_izena?: string;
  eragile_mota?: string;
  erronka_nagusia?: string;
  pilotu_id?: string;
  pilotu_izena?: string;
  pilotu_deskribapena?: string;
  pilotu_urratsak?: string[];
  hipotesia?: string;
  taldea?: string;
  pertsonak?: string;
  gunea?: string;
  xede_portzentajea?: number;
  nudge_mota?: "abisua" | "zoriontzea" | "bultzada";
  t0_stats?: { pct: number; count: number; euskaraz: number; total: number } | null;
  t1_stats?: { pct: number; count: number; euskaraz: number; total: number; gain?: number } | null;
  t2_stats?: { pct: number; count: number; euskaraz: number; total: number; gain?: number } | null;
  oharrak_zerrenda?: Array<{ unea: string; oharra: string; behatzailea: string; data: string; eragilea?: string }>;
  komunitate_datuak?: {
    eragile_kopurua: number;
    esperimentu_kopurua: number;
    neurketa_kopurua: number;
    elkarrizketa_guztira: number;
    global_t0_pct: number | null;
    global_t1_pct: number | null;
    global_t2_pct: number | null;
    eragile_laburpenak: Array<{
      izena: string;
      mota: string;
      erronka: string;
      pilotua: string;
      hipotesia: string;
      t0_pct: number | null;
      t1_pct: number | null;
      t2_pct: number | null;
    }>;
  };
  uneko_testua?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
}

function parseLatxaJsonSafely(rawContent: string): Record<string, any> | null {
  if (!rawContent || !rawContent.trim()) return null;

  const stripped = rawContent
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(stripped);
  } catch {
    // Continue to extraction
  }

  // 2. Extract first {...} block
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    const candidate = match[0];
    try {
      return JSON.parse(candidate);
    } catch {
      // 3. Try repairing common LLM JSON issues (trailing commas, control chars)
      try {
        const repaired = candidate
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/[\u0000-\u0019]+/g, " ");
        return JSON.parse(repaired);
      } catch {
        return null;
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const apiUrl = process.env.LATXA_API_URL?.replace(/\/+$/, "");
    const apiKey = process.env.LATXA_API_KEY;
    const model = process.env.LATXA_MODEL || "Latxa-Llama-3.1-70B-Instruct-exp_2_101_v2-FP8";

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Latxaren API gakoa edo helbidea ez dago konfiguratuta zerbitzarian (.env.local).",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as LatxaRequestBody;
    const {
      ekintza,
      esperimentu_id,
      eragile_izena,
      eragile_mota,
      erronka_nagusia,
      pilotu_id,
      pilotu_izena,
      pilotu_deskribapena,
      pilotu_urratsak,
      uneko_testua,
      messages,
    } = body;

    // Load available pilots from database for context
    const pilotuak = db.prepare("SELECT id, izena, azpititulua, deskribapena, mota FROM pilotuak").all() as Pilotua[];
    const pilotuLaburpenak = pilotuak
      .map((p) => `- ID: "${p.id}", Izena: "${p.izena}", Mota: "${p.mota}", Azalpena: "${p.azpititulua}"`)
      .join("\n");

    let systemPrompt = "";
    const conversationMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    if (ekintza === "aholkularia_eta_hipotesia" || ekintza === "elkarrizketa") {
      const specificPilotContext =
        pilotu_id && pilotu_izena
          ? `\nOHARRA: Erabiltzaileak dagoeneko "${pilotu_izena}" (ID: "${pilotu_id}") pilotua hautatu du (${pilotu_deskribapena || ""}). Sortu hipotesia zuzenean pilotu horretarako ("bat_dator": true, "egoera": "pilotua_prest", "pilotu_mota": "existitzen_dena", "pilotu_id": "${pilotu_id}", "pilotu_berria": null).`
          : "";

      systemPrompt = `Bidean Eragin egitasmoko aholkulari soziolinguistikoa eta portaera-ekonomian aditua zara.
Zure helburua da entitate bati (denda, enpresa, ikastetxe, elkarte edo zerbitzu bati) bere erronkari aurre egiteko soluziorik zintzoena, zientifikoena eta aproposena eraikitzen laguntzea, ELKARRIZKETA GIDATU baten bidez.

SISTEMAN DAUDEN PILOTUAK:
${pilotuLaburpenak}
${specificPilotContext}

ZURE JOKABIDE-ARAUAK (ZINTZOTASUNA ETA KO-DISEINUA):
1. Aztertu entitatearen erronka eta mezu-historia:
- Katalogoan dagoen piloturen batek bete-betean eta zuzenean balio badio:
  * Ezarri "bat_dator": true
  * Ezarri "egoera": "pilotua_prest"
  * Ezarri "pilotu_mota": "existitzen_dena"
  * Ezarri "pilotu_id": dagokion katalogoko IDa
  * Ezarri "pilotu_berria": null (EZ sortu pilotu berririk katalogokoak balio badu!)
  * Sortu hipotesia eta eremu guztiak.
- Katalogoan EZ BADAUKAGU erronka horri zuzenean erantzuten dion piloturik:
  * Erabiltzaileak bere erronka aipatu berri badu eta oraindik xehetasunak falta badira:
    - Ezarri "bat_dator": false
    - Ezarri "egoera": "galderak_behar_dira"
    - Ezarri "pilotu_berria": null
    - "zintzotasun_mezua": "Plataforman ez dago zure erronkari zuzenean erantzuten dion pilotu/hipotesirik sortua. Izan zaitez lehenengoa! Elkarrekin diseinatuko dugu zure neurriko esku-hartzea."
    - "galderak": Egin 2 edo 3 galdera zehatz eta lagungarri (adib.: 1. Zein espazio edo momentu zehatzetan gertatzen da erdarazko inertzia? 2. Zer ekintza edo euskarri txiki litzateke erosoa eta errealista zuen lantaldearentzat?).
    - "aholkua": Aholku soziolinguistiko labur eta motibagarria.
  * Erabiltzaileak galderak dagoeneko erantzun baditu:
    - Ezarri "bat_dator": false
    - Ezarri "egoera": "pilotua_prest"
    - Ezarri "pilotu_mota": "berria"
    - "zintzotasun_mezua": "Bikain! Zure erantzunekin pilotu berri hau diseinatu dugu elkarrekin:"
    - "pilotu_berria": Diseinatu pilotu osoa (izena, azpititulua, deskribapena, mota, adibidea, urratsak, ikonoa, kolorea).
    - "hipotesia", "taldea", "pertsonak", "gunea", "xede_portzentajea", "behaketa_aholkuak" sortu erantzunetan oinarrituta.

ERANTZUN BETI ETA SALBUESPENIK GABE JSON FORMATU BALIOZKOAN (markdown blokerik gabe, \`\`\` gabe):
{
  "bat_dator": true edo false,
  "egoera": "pilotua_prest" edo "galderak_behar_dira",
  "zintzotasun_mezua": "Azalpen zintzoa erabiltzaileari.",
  "aholkua": "Aholku soziolinguistikoa.",
  "galderak": ["1. galdera zehatza?", "2. galdera zehatza?"],
  "pilotu_mota": "existitzen_dena" edo "berria",
  "pilotu_id": "Existitzen denaren IDa edo null",
  "pilotu_berria": {
    "izena": "Pilotu berriaren izena",
    "azpititulua": "Dinamika zer den laburbiltzen duen esaldi bat",
    "deskribapena": "Portaera-aldaketa zergatik eta nola gertatuko den",
    "mota": "Sektorea",
    "adibidea": "Adibide praktikoa",
    "urratsak": [
      "1. Lantaldearekin erronka adostu eta dinamika aurkeztu.",
      "2. T0 hasierako neurketa egin.",
      "3. Dinamika espazioan aktibatu.",
      "4. T1 neurketa egin.",
      "5. T2 neurketa egin 14-21 egunera."
    ],
    "ikonoa": "Sparkles",
    "kolorea": "emerald"
  },
  "taldea": "Nork",
  "pertsonak": "Norekin",
  "gunea": "Non",
  "xede_portzentajea": 20,
  "hipotesia": "Gure ustez, ...",
  "behaketa_aholkuak": ["1. aholkua", "2. aholkua"]
}`;

      conversationMessages.push({ role: "system", content: systemPrompt });

      if (messages && Array.isArray(messages) && messages.length > 0) {
        for (const msg of messages) {
          conversationMessages.push({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content,
          });
        }
      } else {
        conversationMessages.push({
          role: "user",
          content: `Entitatearen datuak:
- Izena: "${eragile_izena || "Entitatea"}"
- Mota: "${eragile_mota || "orokorra"}"
- Erronka nagusia: "${erronka_nagusia || "Egunerokoan lehen hitza eta elkarrizketak euskaraz piztea"}"${
            pilotu_izena
              ? `\n- Hautatutako pilotua: "${pilotu_izena}" (${pilotu_deskribapena || ""})\n- Pilotuaren urratsak: ${(pilotu_urratsak || []).join(" | ")}`
              : ""
          }`,
        });
      }
    } else if (ekintza === "ondorioak_eta_analisia") {
      const {
        eragile_izena: eIzena,
        erronka_nagusia: eErronka,
        pilotu_izena: pIzena,
        hipotesia: eHipo,
        t0_stats: t0,
        t1_stats: t1,
        t2_stats: t2,
        oharrak_zerrenda: oharrak,
      } = body;

      systemPrompt = `Bidean Eragin egitasmoko ebaluatzaile soziolinguistikoa eta portaera-ekonomian aditua zara.
Zure zeregina da entitate batek burututako esperimentuaren datu kuantitatiboak (% eta faseak) eta behatzaileek idatzitako OHAR KUALITATIBOAK batera aztertzea, eta lantaldearentzako ondorio zientifiko, motibagarri eta sakon bat osatzea.

GARRANTZITSUA:
1. Erreparatu bereziki behatzaileen oharrei (bezeroen erreakzioak, langileen jarrerak, zailtasunak, pasadizoak, etiketa kualitatiboak). Ohar horiek azaldu eta balioetsi behar dituzu, datu hutsetatik harago doan ikuspegia emateko.
2. Ebaluatu hipotesiaren betetze-maila zintzotasunez.
3. Eman hurrengo urrats egingarri eta praktikoak ohitura berria finkatzeko edo zabaltzeko.

ERANTZUN BETI ETA SALBUESPENIK GABE JSON FORMATUAN (markdown gabe, \`\`\` gabe):
{
  "ondorio_nagusia": "Emaitzen eta bilakaeraren interpretazio orokor argia eta soziolinguistikoki aberatsa (1-2 paragrafo).",
  "oharren_analisia": "Behatzaileen ohar kualitatiboetatik ateratako gako nagusiak: zer portaera-aldaketa ikusi diren kalean/espazioan, zer erresistentzia edo inertzia agertu diren eta zer indargune nabarmendu diren.",
  "balorazio_kuantitatiboa": "Faseen arteko datuen (% igoera, saio kopuruaren fidagarritasuna) balorazio zehatza.",
  "hurrengo_urratsak": [
    "Ohitura sendotzeko 1. gomendio praktikoa",
    "Ohitura sendotzeko 2. gomendio praktikoa",
    "Beste gune edo egoeretara zabaltzeko 3. gomendioa"
  ],
  "txosten_laburpena": "Lantaldearekin, zuzendaritzarekin edo bezeroekin partekatzeko orri bateko laburpen narratibo dotorea eta ulergarria."
}`;

      const oharrakTestua =
        oharrak && oharrak.length > 0
          ? oharrak
              .map((o) => `- [${o.unea}] (${o.behatzailea || "Behatzailea"}): "${o.oharra}"`)
              .join("\n")
          : "(Ez dago testuzko ohar kualitatiborik jasoa saioetan)";

      const kuantitatiboaTestua = `
- T0 (hasierakoa): ${t0 ? `%${t0.pct} euskara (${t0.count} saiotan, ${t0.euskaraz}/${t0.total} elkarrizketa)` : "Oraindik ez dago neurtuta"}
- T1 (tartekoa/berehalakoa): ${t1 ? `%${t1.pct} euskara (${t1.count} saiotan, ${t1.euskaraz}/${t1.total} elkarrizketa, igoera: +%${t1.gain ?? 0})` : "Oraindik ez dago neurtuta"}
- T2 (sendotua): ${t2 ? `%${t2.pct} euskara (${t2.count} saiotan, ${t2.euskaraz}/${t2.total} elkarrizketa, igoera: +%${t2.gain ?? 0})` : "Oraindik ez dago neurtuta"}`;

      conversationMessages.push({ role: "system", content: systemPrompt });
      conversationMessages.push({
        role: "user",
        content: `Esperimentuaren datuak:
- Entitatea: "${eIzena || "Entitatea"}"
- Erronka nagusia: "${eErronka || "Euskarazko elkarrizketak piztea"}"
- Pilotua: "${pIzena || "Esku-hartze pilotua"}"
- Hasierako hipotesia: "${eHipo || ""}"

Datu kuantitatiboak:${kuantitatiboaTestua}

Behatzaileen ohar kualitatiboak saioetan:
${oharrakTestua}

Egin ezazu analisi kualitatibo sakona eta idatzi lantaldearentzako txosten narratiboa.`,
      });
    } else if (ekintza === "sortu_nudge_mezua") {
      const {
        eragile_izena: eIzena,
        eragile_mota: eMota,
        erronka_nagusia: eErronka,
        pilotu_izena: pIzena,
        hipotesia: eHipo,
        nudge_mota: nMota,
        t0_stats: t0,
        t1_stats: t1,
        t2_stats: t2,
      } = body;

      systemPrompt = `Bagera Euskaltzaleen Elkarteko Bidean Eragin egitasmoko koordinatzaile soziolinguistikoa zara.
Zure zeregina da entitate bati bidaltzeko bultzada-mezu (nudge) labur, bero, pertsonalizatu eta motibagarri bat idaztea, bere esperimentuaren egungo egoeraren arabera.

Mezu motak:
- "bultzada": Esku-hartzea edo neurketa egitera animatzeko mezu positiboa.
- "zoriontzea": Lortutako urratsak edo igoerak txalotzeko eta ohitura eusteko mezua.
- "abisua": Epeak edo falta den neurketa-fasea (T0, T1 edo T2) gogorarazteko mezu adeitsua.

ERANTZUN BETI JSON FORMATUAN (markdown gabe):
{
  "titulua": "Izenburu labur eta erakargarria (emojiekin, gehienez 65 karaktere)",
  "mezua": "Entitateari zuzendutako 2-3 esaldiko mezu hurbila, bere datu eta erronkari erreferentzia eginez."
}`;

      conversationMessages.push({ role: "system", content: systemPrompt });
      conversationMessages.push({
        role: "user",
        content: `Entitatearen datuak:
- Izena: "${eIzena || "Entitatea"}" (${eMota || "orokorra"})
- Erronka: "${eErronka || "Euskararen erabilera sustatzea"}"
- Pilotua: "${pIzena || "Oraindik aukeratu gabe"}"
- Hipotesia: "${eHipo || "Zehaztu gabe"}"
- Mezu mota: "${nMota || "bultzada"}"
- T0: ${t0 ? `%${t0.pct} (${t0.count} saio)` : "Neurtu gabe"}
- T1: ${t1 ? `%${t1.pct} (${t1.count} saio, +%${t1.gain ?? 0})` : "Neurtu gabe"}
- T2: ${t2 ? `%${t2.pct} (${t2.count} saio, +%${t2.gain ?? 0})` : "Neurtu gabe"}`,
      });
    } else if (ekintza === "komunitate_txostena") {
      const { komunitate_datuak: kDatuak, oharrak_zerrenda: oharrak } = body;

      systemPrompt = `Bagera Euskaltzaleen Elkarteko Bidean Eragin egitasmoko ikertzaile soziolinguistiko nagusia zara.
Donostiako entitate guztiek egindako esperimentuen datu kuantitatiboak eta behatzaileen ohar kualitatiboak gurutzatu behar dituzu, komunitate osoko TXOSTEN EXEKUTIBO BATERATU bat sortzeko.

ERANTZUN BETI JSON FORMATUAN (markdown gabe):
{
  "ondorio_orokorra": "Donostiako komunitatearen bilakaera soziolinguistikoaren balorazio globala (1-2 paragrafo).",
  "joera_kualitatiboak": "Entitate guztietako behatzaileen oharretan errepikatzen diren portaera-ereduak, inertziak eta erreakzioak.",
  "arrakasta_gakoak": "Emaitza onenak lortu dituzten esperimentu eta sektoreetan funtzionatu duten gako praktikoak.",
  "gomendio_estrategikoak": [
    "Koordinazio-taldearentzako 1. gomendio estrategikoa",
    "Koordinazio-taldearentzako 2. gomendio estrategikoa",
    "Hurrengo faseetarako 3. gomendioa"
  ],
  "txosten_exekutiboa": "Udalarekin, bazkideekin edo prentsarekin partekatzeko laburpen narratibo osoa eta profesionala."
}`;

      const entitateZerrenda = (kDatuak?.eragile_laburpenak || [])
        .map(
          (e) =>
            `- ${e.izena} (${e.mota}): Pilotua="${e.pilotua}", T0=${e.t0_pct !== null ? `%${e.t0_pct}` : "-"}, T1=${e.t1_pct !== null ? `%${e.t1_pct}` : "-"}, T2=${e.t2_pct !== null ? `%${e.t2_pct}` : "-"}`
        )
        .join("\n");

      const oharrakTestua =
        oharrak && oharrak.length > 0
          ? oharrak
              .slice(0, 35)
              .map((o) => `- [${o.eragilea || "Entitatea"} | ${o.unea}]: "${o.oharra}"`)
              .join("\n")
          : "(Oraindik ez dago ohar kualitatiborik jasota)";

      conversationMessages.push({ role: "system", content: systemPrompt });
      conversationMessages.push({
        role: "user",
        content: `Komunitate osoko datuak:
- Entitate aktiboak: ${kDatuak?.eragile_kopurua ?? 0}
- Esperimentuak: ${kDatuak?.esperimentu_kopurua ?? 0}
- Behaketa-saioak guztira: ${kDatuak?.neurketa_kopurua ?? 0} (${kDatuak?.elkarrizketa_guztira ?? 0} elkarrizketa behatuta)
- Batez besteko bilakaera: T0=${kDatuak?.global_t0_pct !== null ? `%${kDatuak?.global_t0_pct}` : "-"} -> T1=${kDatuak?.global_t1_pct !== null ? `%${kDatuak?.global_t1_pct}` : "-"} -> T2=${kDatuak?.global_t2_pct !== null ? `%${kDatuak?.global_t2_pct}` : "-"}

Entitateen banakako bilakaera:
${entitateZerrenda || "(Daturik ez)"}

Behatzaileen ohar kualitatiboak:
${oharrakTestua}

Sortu komunitate osoko txosten soziolinguistiko bateratua.`,
      });
    } else {
      // ekintza === "hobetu_hipotesia"
      systemPrompt = `Bidean Eragin egitasmoko euskal hizkuntza-aholkularia eta soziolinguista zara.
Erabiltzaileak idatzitako hipotesia edo zirriborroa aztertu eta soziolinguistikoki zehatzagoa, neurgarriagoa, naturalagoa eta euskaraz bikaina proposatu behar duzu ("Gure ustez, ..." egitura mantenduz).

Erantzun BETI JSON formatu baliozkoan bakarrik, markdownik gabe:
{
  "hipotesi_hobetua": "Gure ustez, ... (hipotesiaren formulazio hobetua eta profesionala)",
  "azalpena": "Zergatik den hobea formulazio hau (esaldi labur bat)."
}`;

      conversationMessages.push({ role: "system", content: systemPrompt });
      conversationMessages.push({
        role: "user",
        content: `Uneko hipotesia: "${uneko_testua || body.hipotesia || ""}"
Pilotua: "${pilotu_izena || pilotu_id || "orokorra"}"
Entitatea: "${eragile_izena || "Entitatea"}" (${eragile_mota || "orokorra"})
Erronka: "${erronka_nagusia || ""}"
Nork (taldea): "${body.taldea || ""}" | Norekin (pertsonak): "${body.pertsonak || ""}" | Non (gunea): "${body.gunea || ""}" | Xede portzentajea: +%${body.xede_portzentajea || 20}`,
      });
    }

    const endpoint = `${apiUrl}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: conversationMessages,
          temperature: 0.3,
          max_tokens: 1300,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Latxa API errorea:", res.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: `Errorea Latxaren zerbitzariarekin konektatzean (${res.status}): ${errText.slice(0, 150)}`,
        },
        { status: 502 }
      );
    }

    const latxaData = await res.json();
    const rawContent = latxaData.choices?.[0]?.message?.content || "";

    let parsedData = parseLatxaJsonSafely(rawContent);

    if (!parsedData) {
      // Friendly structured fallback so the UI never renders blank
      if (ekintza === "ondorioak_eta_analisia") {
        parsedData = {
          ondorio_nagusia: rawContent.trim() || "Ezin izan da analisia formatu egituratuan jaso.",
          oharren_analisia: "Ikus ondorio nagusia.",
          balorazio_kuantitatiboa: "Begiratu goiko grafiko eta taulako portzentajeak.",
          hurrengo_urratsak: ["Jarraitu behaketak egiten eta oharrak jasotzen."],
          txosten_laburpena: rawContent.trim(),
        };
      } else if (ekintza === "hobetu_hipotesia") {
        parsedData = {
          hipotesi_hobetua: rawContent.replace(/["{}]/g, "").trim() || uneko_testua,
          azalpena: "Latxak proposatutako hobekuntza.",
        };
      } else {
        parsedData = {
          bat_dator: false,
          egoera: "pilotua_prest",
          zintzotasun_mezua: "Hona hemen Latxaren proposamena:",
          aholkua: rawContent.trim(),
          hipotesia: uneko_testua || "",
        };
      }
    }

    // Persist Block B experiment report directly in database if esperimentu_id was provided
    if (ekintza === "ondorioak_eta_analisia" && esperimentu_id && parsedData.ondorio_nagusia) {
      try {
        await syncDbFromCloud();
        const reportWithDate = {
          ...parsedData,
          sortze_data: new Date().toISOString(),
        };
        parsedData = reportWithDate;
        db.prepare("UPDATE esperimentuak SET ai_txostena_json = ? WHERE id = ?").run(
          JSON.stringify(reportWithDate),
          esperimentu_id
        );
        await syncDbToCloud();
      } catch (dbErr) {
        console.warn("Ezin izan da ai_txostena_json datu-basean gorde:", dbErr);
      }
    }

    // Persist Block C community executive report in ui_texts
    if (ekintza === "komunitate_txostena" && parsedData.ondorio_orokorra) {
      try {
        await syncDbFromCloud();
        const reportWithDate = {
          ...parsedData,
          sortze_data: new Date().toISOString(),
        };
        parsedData = reportWithDate;
        saveUiTexts({ komunitate_ai_txostena: JSON.stringify(reportWithDate) }, false);
        await syncDbToCloud();
      } catch (dbErr) {
        console.warn("Ezin izan da komunitate_ai_txostena gorde:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error("Errorea Latxa deian:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Errore ezezaguna Latxarekin konektatzean.",
      },
      { status: 500 }
    );
  }
}
