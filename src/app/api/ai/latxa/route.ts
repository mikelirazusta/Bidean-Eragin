import { NextResponse } from "next/server";
import db, { Pilotua } from "@/lib/db";

interface LatxaRequestBody {
  ekintza: "aholkularia_eta_hipotesia" | "hobetu_hipotesia" | "elkarrizketa";
  eragile_izena?: string;
  eragile_mota?: string;
  erronka_nagusia?: string;
  pilotu_id?: string;
  uneko_testua?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
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
    const { ekintza, eragile_izena, eragile_mota, erronka_nagusia, pilotu_id, uneko_testua, messages } = body;

    // Load available pilots from database for context
    const pilotuak = db.prepare("SELECT id, izena, azpititulua, deskribapena, mota FROM pilotuak").all() as Pilotua[];
    const pilotuLaburpenak = pilotuak
      .map((p) => `- ID: "${p.id}", Izena: "${p.izena}", Mota: "${p.mota}", Azalpena: "${p.azpititulua}"`)
      .join("\n");

    let systemPrompt = "";
    const conversationMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    if (ekintza === "aholkularia_eta_hipotesia" || ekintza === "elkarrizketa") {
      systemPrompt = `Bidean Eragin egitasmoko aholkulari soziolinguistikoa eta portaera-ekonomian aditua zara.
Zure helburua da entitate bati (denda, enpresa, ikastetxe, elkarte edo zerbitzu bati) bere erronkari aurre egiteko soluziorik zintzoena, zientifikoena eta aproposena eraikitzen laguntzea, ELKARRIZKETA GIDATU baten bidez.

SISTEMAN DAUDEN PILOTUAK:
${pilotuLaburpenak}

ZURE JOKABIDE-ARAUAK (ZINTZOTASUNA ETA KO-DISEINUA):
1. Aztertu entitatearen erronka eta mezu-historia:
- Katalogoan dagoen piloturen batek bete-betean eta zuzenean balio badio: gomendatu pilotu hori eta sortu hipotesia.
- Katalogoan EZ BADAUKAGU erronka horri zuzenean erantzuten dion piloturik:
  * Erabiltzaileak bere erronka aipatu berri badu eta oraindik xehetasunak falta badira:
    - Ezarri "bat_dator": false
    - Ezarri "egoera": "galderak_behar_dira"
    - "zintzotasun_mezua": "Plataforman ez dago zure erronkari zuzenean erantzuten dion pilotu/hipotesirik sortua. Izan zaitez lehenengoa! Elkarrekin diseinatuko dugu zure neurriko esku-hartzea."
    - "galderak": Egin 2 galdera zehatz eta lagungarri (adib.: 1. Zein espazio edo momentu zehatzetan gertatzen da erdarazko inertzia? 2. Zer ekintza edo material txiki litzateke erosoa eta errealista zuen lantaldearentzat?).
    - "aholkua": Aholku soziolinguistiko labur eta motibagarria.
  * Erabiltzaileak galderak dagoeneko erantzun baditu:
    - Ezarri "bat_dator": false
    - Ezarri "egoera": "pilotua_prest"
    - "zintzotasun_mezua": "Bikain! Zure erantzunekin pilotu berri hau diseinatu dugu elkarrekin:"
    - "pilotu_berria": Diseinatu pilotu osoa (izena, azpititulua, deskribapena, mota, urratsak, ikonoa, kolorea).
    - "hipotesia", "taldea", "pertsonak", "gunea", "xede_portzentajea", "behaketa_aholkuak" sortu erantzunetan oinarrituta.

ERANTZUN BETI ETA SALBUESPENIK GABE JSON FORMATUAN (markdown blokerik gabe, \`\`\` gabe):
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

      // Add conversation history if available
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
- Erronka nagusia: "${erronka_nagusia || "Egunerokoan lehen hitza eta elkarrizketak euskaraz piztea"}"`,
        });
      }
    } else {
      // ekintza === "hobetu_hipotesia"
      systemPrompt = `Bidean Eragin egitasmoko euskal hizkuntza-aholkularia zara.
Erabiltzaileak idatzitako hipotesia edo zirriborroa aztertu eta soziolinguistikoki zehatzagoa, neurgarriagoa eta euskaraz txukunagoa proposatu behar duzu.

Erantzun BETI JSON formatu baliozkoan bakarrik, markdownik gabe:
{
  "hipotesi_hobetua": "Hipotesiaren formulazio hobetua eta profesionala.",
  "azalpena": "Zergatik den hobea formulazio hau (esaldi labur bat)."
}`;

      conversationMessages.push({ role: "system", content: systemPrompt });
      conversationMessages.push({
        role: "user",
        content: `Uneko hipotesia: "${uneko_testua || ""}"
Pilotua: "${pilotu_id || "orokorra"}"
Entitatea: "${eragile_izena || "Entitatea"}" (${eragile_mota || "orokorra"})`,
      });
    }

    const endpoint = `${apiUrl}/chat/completions`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: conversationMessages,
        temperature: 0.3,
        max_tokens: 1100,
      }),
    });

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

    // Parse JSON safely from Latxa's output (stripping any accidental code fences)
    let parsedData = null;
    try {
      const cleanJson = rawContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*$/gi, "")
        .trim();
      parsedData = JSON.parse(cleanJson);
    } catch {
      // If direct parse fails, try extracting first {...} block
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedData = JSON.parse(match[0]);
        } catch {
          parsedData = { raweOutput: rawContent };
        }
      } else {
        parsedData = { rawOutput: rawContent };
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
