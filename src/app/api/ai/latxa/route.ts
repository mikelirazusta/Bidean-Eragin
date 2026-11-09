import { NextResponse } from "next/server";
import db, { Pilotua } from "@/lib/db";

interface LatxaRequestBody {
  ekintza: "aholkularia_eta_hipotesia" | "hobetu_hipotesia";
  eragile_izena?: string;
  eragile_mota?: string;
  erronka_nagusia?: string;
  pilotu_id?: string;
  uneko_testua?: string;
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
    const { ekintza, eragile_izena, eragile_mota, erronka_nagusia, pilotu_id, uneko_testua } = body;

    // Load available pilots from database for context
    const pilotuak = db.prepare("SELECT id, izena, azpititulua, deskribapena, mota FROM pilotuak").all() as Pilotua[];
    const pilotuLaburpenak = pilotuak
      .map((p) => `- ID: "${p.id}", Izena: "${p.izena}", Mota: "${p.mota}", Azalpena: "${p.azpititulua}"`)
      .join("\n");

    let systemPrompt = "";
    let userPrompt = "";

    if (ekintza === "aholkularia_eta_hipotesia") {
      systemPrompt = `Bidean Eragin egitasmoko aholkulari soziolinguistikoa eta portaera-ekonomian aditua zara.
Zure helburua da entitate bati (denda, enpresa, ikastetxe, elkarte edo zerbitzu bati) bere erronkari aurre egiteko soluziorik zintzoena, zientifikoena eta aproposena eskaintzea.

GARRANTZITSUA: Jokatu zintzotasun osoz:
1. Konparatu entitatearen erronka plataforman dauden pilotuekin:
${pilotuLaburpenak}

2. Aztertu ea existitzen den pilotuetakoren batek BENETAN eta ZUZENEAN erantzuten dion erronkari:
- Existitzen den pilotu batek bete-betean balio badio: gomendatu pilotu hori eta azaldu zergatik.
- Plataformako pilotuek EZ badiote zuzenean erantzuten erronka horri (adibidez, erronka jangelako giroari, bileretako ohiturei, kafe-orduari, aisialdiari edo beste espazio bati badagokio, eta katalogoan ez badago horretarako pilotu espezifikorik):
  ESAN ZINTZOKI: "Plataforman ez dago zure erronkari zuzenean erantzuten dion pilotu/hipotesirik sortua. Izan zaitez lehenengoa!"
  Eta diseinatu pilotu BERRI bat, erakargarria, portaera-ekonomian oinarritua eta egingarria.

Erantzun BETI JSON formatu baliozkoan bakarrik, inolako markdown blokerik gabe (\`\`\`json gabe), egitura honekin:
{
  "bat_dator": true edo false,
  "zintzotasun_mezua": "Plataforman ez dago zure erronkari zuzenean erantzuten dion pilotu/hipotesirik sortua. Izan zaitez lehenengoa!" (edo dagoen pilotua egokia bada: "Zure erronkarentzat pilotu aproposa dugu jada katalogoan: [Izena]."),
  "aholkua": "Entitatearen egoerari egokitutako 2-3 esaldiko aholkularitza soziolinguistikoa (motibagarria eta portaera-ekonomian oinarritua).",
  "pilotu_mota": "existitzen_dena" edo "berria",
  "pilotu_id": "Existitzen denaren IDa (adib. 'barra-barra-txapak') edo null berria bada",
  "pilotu_berria": {
    "izena": "Pilotu berriaren izen labur eta erakargarria (adib. 'Kafe-orduko Hitzordua', 'Jangelako Euskarazko Mahaia', 'Lehen Agurra Harreran'...).",
    "azpititulua": "Dinamika zer den laburbiltzen duen esaldi bat.",
    "deskribapena": "Portaera-aldaketa zergatik eta nola gertatuko den azaltzen duen deskribapena.",
    "mota": "Sektorea (adib. 'Ikastetxeak', 'Enpresak eta bulegoak', 'Merkataritza eta ostalaritza', 'Aisialdia').",
    "adibidea": "Eguneroko adibide praktiko bat.",
    "urratsak": [
      "1. Lantaldearekin erronka adostu eta dinamika aurkeztu.",
      "2. T0 hasierako neurketa egin (dinamika hasi aurretik).",
      "3. Dinamika espazioan aktibatu.",
      "4. T1 neurketa egin (lehen asteko eragina ikusteko).",
      "5. T2 neurketa egin 14-21 egunera (ohitura egonkortu dela egiaztatzeko)."
    ],
    "ikonoa": "Sparkles",
    "kolorea": "emerald"
  },
  "taldea": "Nork egingo duen (adib. 'Jantokiko langileek' edo 'Harrerako kideek')",
  "pertsonak": "Norekin (adib. 'ikasleekin' edo 'bezeroekin')",
  "gunea": "Non kokatuko den esku-hartzea (adib. 'jantokiko sarreran' edo 'mostradorean')",
  "xede_portzentajea": 20,
  "hipotesia": "Gure ustez, [taldea] [pertsonak], [gunea] [ekintza], euskararen erabilera %[xedea] igoko da.",
  "behaketa_aholkuak": [
    "Behaketa diskretua egiteko 1. aholku laburra",
    "Behaketa egiteko 2. aholku laburra"
  ]
}`;

      userPrompt = `Entitatearen datuak:
- Izena: "${eragile_izena || "Entitatea"}"
- Mota: "${eragile_mota || "orokorra"}"
- Erronka nagusia: "${erronka_nagusia || "Egunerokoan lehen hitza eta elkarrizketak euskaraz piztea"}"

Proposatu entitate honi aholku soziolinguistiko argia eta esperimentu-hipotesi egituratu egokiena.`;
    } else {
      // ekintza === "hobetu_hipotesia"
      systemPrompt = `Bidean Eragin egitasmoko euskal hizkuntza-aholkularia zara.
Erabiltzaileak idatzitako hipotesia edo zirriborroa aztertu eta soziolinguistikoki zehatzagoa, neurgarriagoa eta euskaraz txukunagoa proposatu behar duzu.

Erantzun BETI JSON formatu baliozkoan bakarrik, markdownik gabe, gako hauekin:
{
  "hipotesi_hobetua": "Hipotesiaren formulazio hobetua eta profesionala.",
  "azalpena": "Zergatik den hobea formulazio hau (esaldi labur bat)."
}`;

      userPrompt = `Uneko hipotesia: "${uneko_testua || ""}"
Pilotua: "${pilotu_id || "orokorra"}"
Entitatea: "${eragile_izena || "Entitatea"}" (${eragile_mota || "orokorra"})

Hobetu formulazioa.`;
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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
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
