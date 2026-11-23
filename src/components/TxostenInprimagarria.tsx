"use client";

import React from "react";
import type { Eragilea, Esperimentua, Neurketa } from "@/lib/db";
import { formatBehatzaileaDisplay } from "@/context/AppContext";
import {
  wilsonMarjinaPuntu,
  formatDecimalEu,
  formatSignedPuntu,
  formatAldeaTarteaEu,
  parseProtokoloa,
  neurketaEgoera,
  faseSemaforoa,
  type AldeaTartea,
  type OndorioEmaitza,
  type WilsonTartea,
} from "@/lib/estatistika";

export interface TxostenPhaseStats {
  unea: "T0" | "T1" | "T2";
  count: number;
  totalEuskaraz: number;
  totalAldaketa: number;
  totalErdaraz: number;
  totalElebi: number;
  totalInteractions: number;
  pct: number;
  wilson: WilsonTartea;
  neurketak: Neurketa[];
}

export interface LatxaTxostenDatuak {
  ondorio_nagusia?: string;
  oharren_analisia?: string;
  balorazio_kuantitatiboa?: string;
  hurrengo_urratsak?: string[];
  txosten_laburpena?: string;
  sortze_data?: string;
}

interface TxostenInprimagarriaProps {
  eragilea: Eragilea;
  esperimentua: Esperimentua;
  expNeurketak: Neurketa[];
  t0Stats: TxostenPhaseStats | null;
  t1Stats: TxostenPhaseStats | null;
  t2Stats: TxostenPhaseStats | null;
  primaryDiff: AldeaTartea | null;
  primaryOndorioa: OndorioEmaitza | null;
  t2VsT1: AldeaTartea | null;
  observerChangedAcrossPhases: boolean;
  latxaAnalysis: LatxaTxostenDatuak | null;
}

const ASTEKO_EGUNAK_LAB = [
  "Igandea",
  "Astelehena",
  "Asteartea",
  "Asteazkena",
  "Osteguna",
  "Ostirala",
  "Larunbata",
];

export default function TxostenInprimagarria({
  eragilea,
  esperimentua,
  expNeurketak,
  t0Stats,
  t1Stats,
  t2Stats,
  primaryDiff,
  primaryOndorioa,
  t2VsT1,
  observerChangedAcrossPhases,
  latxaAnalysis,
}: TxostenInprimagarriaProps) {
  const protokoloa = parseProtokoloa(esperimentua.protokoloa_json);
  const nGutxienekoa = esperimentua.n_gutxienekoa || 20;
  const saioGutxienekoa = esperimentua.saio_gutxienekoa || 4;
  const isT2Kentzea = esperimentua.t2_mota === "kentzea";

  const phases: Array<{ label: string; unea: "T0" | "T1" | "T2"; stats: TxostenPhaseStats | null; color: string }> = [
    { label: "T0 (oinarri-lerroa)", unea: "T0", stats: t0Stats, color: "#103C4C" },
    { label: "T1 (esku-hartzea)", unea: "T1", stats: t1Stats, color: "#C97A16" },
    {
      label: isT2Kentzea ? "T2 (kentzea — ABA)" : "T2 (jarraipena)",
      unea: "T2",
      stats: t2Stats,
      color: "#0E6B4B",
    },
  ];

  const totalAldaketaGuztira =
    (t0Stats?.totalAldaketa || 0) + (t1Stats?.totalAldaketa || 0) + (t2Stats?.totalAldaketa || 0);

  const aldaketaErregistroa = React.useMemo(() => {
    if (!esperimentua.aldaketa_erregistroa_json) return [];
    try {
      const parsed = JSON.parse(esperimentua.aldaketa_erregistroa_json);
      return Array.isArray(parsed)
        ? (parsed as Array<{ data: string; erabiltzailea: string; oharra: string }>)
        : [];
    } catch {
      return [];
    }
  }, [esperimentua.aldaketa_erregistroa_json]);

  const sortedSessions = [...expNeurketak].sort((a, b) =>
    (a.hasiera_ordu || a.data_ordu).localeCompare(b.hasiera_ordu || b.data_ordu)
  );

  const gaurkoData = new Date().toLocaleDateString("eu-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="bg-white text-[#162024] font-sans text-[12px] leading-relaxed max-w-[210mm] mx-auto">
      {/* Goiburua */}
      <header className="border-b-2 border-[#0E6B4B] pb-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#0E6B4B]">
              Bidean Eragin · Bagera Euskaltzaleen Elkartea
            </div>
            <h1 className="font-editorial text-2xl font-bold text-[#162024] mt-1">
              Emaitzen txostena — {eragilea.izena}
            </h1>
            <p className="text-xs text-[#556064] mt-0.5">
              Pilotua: <strong className="text-[#162024]">{esperimentua.pilotu_izena || "Esku-hartze pilotua"}</strong>
              {" · "}Gunea: <strong className="text-[#162024]">{esperimentua.gunea}</strong>
            </p>
          </div>
          <div className="text-right text-[11px] text-[#556064] shrink-0">
            <div className="font-semibold text-[#162024]">{gaurkoData}</div>
            <div className="capitalize">{eragilea.mota}</div>
            <div>Xedea: +{esperimentua.xede_portzentajea} puntu</div>
          </div>
        </div>
      </header>

      {/* 1. Laburpen exekutiboa (Latxa edo laburpen automatikoa) */}
      <section className="report-section mb-6">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#103C4C] border-b border-[#E2DDD2] pb-1 mb-2.5">
          1. Laburpena eta ondorio nagusia
        </h2>

        {latxaAnalysis?.txosten_laburpena && (
          <div className="bg-[#F7F5F0] border border-[#E2DDD2] border-l-4 border-l-[#0E6B4B] rounded-lg p-3.5 mb-3">
            <p className="text-[12px] text-[#162024] whitespace-pre-line">
              {latxaAnalysis.txosten_laburpena}
            </p>
          </div>
        )}

        {latxaAnalysis?.ondorio_nagusia && (
          <p className="text-[12px] text-[#162024] whitespace-pre-line mb-2">
            {latxaAnalysis.ondorio_nagusia}
          </p>
        )}

        {/* Datuen ondorio zintzoa (beti ikusgai) */}
        <div className="bg-[#F7F5F0] border border-[#E2DDD2] rounded-lg p-3 space-y-1.5">
          {t0Stats && (t1Stats || t2Stats) && primaryDiff && primaryOndorioa ? (
            <>
              <p className="font-bold text-[#162024] tabular-nums">
                T0: %{formatDecimalEu(t0Stats.pct)} ({t0Stats.totalEuskaraz}/{t0Stats.totalInteractions})
                {" · "}
                {t2Stats && !isT2Kentzea
                  ? `T2: %${formatDecimalEu(t2Stats.pct)} (${t2Stats.totalEuskaraz}/${t2Stats.totalInteractions})`
                  : `T1: %${formatDecimalEu(t1Stats!.pct)} (${t1Stats!.totalEuskaraz}/${t1Stats!.totalInteractions})`}
                {" · "}
                Aldea: {formatSignedPuntu(primaryDiff.d * 100)} puntu ({formatAldeaTarteaEu(primaryDiff)})
              </p>
              <p className="text-[#162024]">{primaryOndorioa.testua}</p>
            </>
          ) : t0Stats ? (
            <p className="text-[#162024] tabular-nums">
              T0 oinarri-lerroa: %{formatDecimalEu(t0Stats.pct)} ({t0Stats.totalEuskaraz}/{t0Stats.totalInteractions},
              tartea %{formatDecimalEu(t0Stats.wilson.behea * 100)}–%{formatDecimalEu(t0Stats.wilson.goia * 100)}).
              Oraindik ez dago bi faseren arteko alderaketarik.
            </p>
          ) : (
            <p className="text-[#556064]">Oraindik ez dago neurketarik erregistratuta.</p>
          )}

          {isT2Kentzea && t1Stats && t2Stats && t2VsT1 && (
            <div className="pt-1.5 border-t border-[#E2DDD2] text-[11px]">
              <p className="font-bold text-[#162024] tabular-nums">
                T2 kentzea (ABA): T1 %{formatDecimalEu(t1Stats.pct)} → T2 %{formatDecimalEu(t2Stats.pct)} ·
                Aldea (T2 − T1): {formatSignedPuntu(t2VsT1.d * 100)} puntu ({formatAldeaTarteaEu(t2VsT1)})
              </p>
              <p className="text-[#556064]">
                {t2VsT1.goia < 0
                  ? "Esku-hartzea kentzean erabilera jaitsi da: horrek adierazten du esku-hartzeak eragina zuela."
                  : t2VsT1.behea <= 0 && 0 <= t2VsT1.goia
                  ? "Esku-hartzea kendu eta erabilera antzeko mantendu da. Igoera ez da esku-hartzearen ondorioa, edo ohitura bihurtu da. Oraindik ez dakigu."
                  : "Esku-hartzea kendu eta erabilera igo egin da. Beste faktore batzuek eragin dezakete; oraindik ez dakigu."}
              </p>
            </div>
          )}

          {totalAldaketaGuztira > 0 && (
            <p className="text-[11px] text-[#0E6B4B] font-semibold">
              Horietatik {totalAldaketaGuztira} bezero erdaraz hasi eta euskarara pasatu dira.
            </p>
          )}

          {observerChangedAcrossPhases && (
            <p className="text-[11px] text-[#92400E] font-medium">
              Abisua: Behatzailea aldatu da faseen artean; aldearen zati bat horregatik izan daiteke.
            </p>
          )}
          {Number(esperimentua.t1_egonkortu_gabe || 0) === 1 && (
            <p className="text-[11px] text-[#92400E] font-medium">
              Abisua: Kontuz — oinarri-lerroa egonkortu gabe hasi zen T1. Igoeraren zati bat esku-hartzearen aurrekoa izan daiteke.
            </p>
          )}
        </div>
      </section>

      {/* 2. Hipotesia eta protokoloa */}
      <section className="report-section mb-6">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#103C4C] border-b border-[#E2DDD2] pb-1 mb-2.5">
          2. Hipotesia eta behaketa-protokoloa
        </h2>
        <blockquote className="italic text-[13px] font-editorial text-[#162024] border-l-3 border-[#103C4C] pl-3 py-0.5 mb-2.5">
          &ldquo;{esperimentua.hipotesia}&rdquo;
        </blockquote>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
          <div>
            <span className="text-[#556064]">Erronka nagusia:</span>{" "}
            <strong className="text-[#162024]">{eragilea.erronka_nagusia}</strong>
          </div>
          <div>
            <span className="text-[#556064]">Taldea / Norekin:</span>{" "}
            <strong className="text-[#162024]">
              {esperimentua.taldea} ({esperimentua.pertsonak})
            </strong>
          </div>
          <div>
            <span className="text-[#556064]">Behaketa-protokoloa:</span>{" "}
            <strong className="text-[#162024]">
              {protokoloa
                ? `${protokoloa.asteko_egunak.map((d) => ASTEKO_EGUNAK_LAB[d]).join(", ")} · ${protokoloa.ordu_hasiera}–${protokoloa.ordu_amaiera} (${protokoloa.iraupena_min} min)`
                : "Zehaztu gabe"}
            </strong>
          </div>
          <div>
            <span className="text-[#556064]">Gutxienekoak / T2 mota:</span>{" "}
            <strong className="text-[#162024]">
              N ≥ {nGutxienekoa}, {saioGutxienekoa} saio/fase · T2: {isT2Kentzea ? "Kentzea (ABA)" : "Jarraipena"}
            </strong>
          </div>
        </div>
        {aldaketaErregistroa.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#E2DDD2] text-[10px] text-[#556064]">
            <strong className="text-[#162024]">Aldaketa-erregistroa:</strong>{" "}
            {aldaketaErregistroa
              .map((a) => `${new Date(a.data).toLocaleDateString("eu-ES")} (${a.erabiltzailea}): ${a.oharra}`)
              .join(" · ")}
          </div>
        )}
      </section>

      {/* 3. Emaitza kuantitatiboak (fasez fase) */}
      <section className="report-section mb-6">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#103C4C] border-b border-[#E2DDD2] pb-1 mb-2.5">
          3. Emaitza kuantitatiboak (faseko emaitzak eta %95eko Wilson tarteak)
        </h2>

        <table className="w-full border-collapse text-[11px] mb-3 tabular-nums">
          <thead>
            <tr className="border-b border-[#162024] text-left text-[10px] uppercase text-[#556064]">
              <th className="py-1.5 pr-2">Fasea</th>
              <th className="py-1.5 px-2 text-right">Saioak (osoak)</th>
              <th className="py-1.5 px-2 text-right">Euskaraz</th>
              <th className="py-1.5 px-2 text-right">Erdaraz</th>
              <th className="py-1.5 px-2 text-right">Elebi</th>
              <th className="py-1.5 px-2 text-right">Guztira (N)</th>
              <th className="py-1.5 px-2 text-right">Euskara %</th>
              <th className="py-1.5 pl-2 text-right">%95eko tartea</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DDD2]">
            {phases.map((p) => {
              const sem = faseSemaforoa(
                expNeurketak.filter((n) => n.unea === p.unea),
                p.unea,
                { nGutxienekoa, saioGutxienekoa, protokoloa }
              );
              return (
                <tr key={p.unea}>
                  <td className="py-1.5 pr-2 font-bold text-[#162024]">{p.label}</td>
                  <td className="py-1.5 px-2 text-right">
                    {p.stats ? `${p.stats.count} (${sem.osoaKopurua})` : "0"}
                  </td>
                  <td className="py-1.5 px-2 text-right font-semibold text-[#0E6B4B]">
                    {p.stats ? p.stats.totalEuskaraz : "—"}
                  </td>
                  <td className="py-1.5 px-2 text-right">{p.stats ? p.stats.totalErdaraz : "—"}</td>
                  <td className="py-1.5 px-2 text-right">{p.stats ? p.stats.totalElebi : "—"}</td>
                  <td className="py-1.5 px-2 text-right font-semibold">
                    {p.stats ? p.stats.totalInteractions : "—"}
                  </td>
                  <td className="py-1.5 px-2 text-right font-extrabold text-[#162024]">
                    {p.stats ? `%${formatDecimalEu(p.stats.pct)}` : "—"}
                  </td>
                  <td className="py-1.5 pl-2 text-right text-[#556064]">
                    {p.stats
                      ? `%${formatDecimalEu(p.stats.wilson.behea * 100)} – %${formatDecimalEu(p.stats.wilson.goia * 100)}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Grafiko horizontal sinple eta garbia Wilson tarteekin */}
        <div className="space-y-2 my-3">
          {phases
            .filter((p) => p.stats)
            .map((p) => {
              const s = p.stats!;
              const low = Math.max(0, Math.min(100, s.wilson.behea * 100));
              const high = Math.max(0, Math.min(100, s.wilson.goia * 100));
              return (
                <div key={p.unea} className="flex items-center gap-3 text-[11px]">
                  <span className="w-32 font-bold text-[#162024] shrink-0">{p.label}</span>
                  <div className="flex-1 h-5 bg-[#EFECE4] rounded relative border border-[#E2DDD2]">
                    <div
                      className="h-full rounded-l"
                      style={{ width: `${Math.max(1, s.pct)}%`, backgroundColor: p.color }}
                    />
                    {/* Wilson tartea */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-[#162024]"
                      style={{ left: `${low}%`, width: `${Math.max(0.5, high - low)}%` }}
                    >
                      <div className="absolute -left-px -top-1 w-0.5 h-2.5 bg-[#162024]" />
                      <div className="absolute -right-px -top-1 w-0.5 h-2.5 bg-[#162024]" />
                    </div>
                  </div>
                  <span className="w-28 text-right font-bold tabular-nums shrink-0">
                    %{formatDecimalEu(s.pct)} ({s.totalEuskaraz}/{s.totalInteractions})
                  </span>
                </div>
              );
            })}
        </div>

        {latxaAnalysis?.balorazio_kuantitatiboa && (
          <p className="text-[11.5px] text-[#162024] mt-2 whitespace-pre-line">
            {latxaAnalysis.balorazio_kuantitatiboa}
          </p>
        )}
      </section>

      {/* 4. Analisi kualitatiboa eta hurrengo urratsak (Latxa) */}
      {(latxaAnalysis?.oharren_analisia ||
        (latxaAnalysis?.hurrengo_urratsak && latxaAnalysis.hurrengo_urratsak.length > 0)) && (
        <section className="report-section mb-6">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#103C4C] border-b border-[#E2DDD2] pb-1 mb-2.5">
            4. Behatzaileen oharren analisia eta hurrengo urratsak
          </h2>

          {latxaAnalysis?.oharren_analisia && (
            <div className="mb-3">
              <h3 className="text-[11px] font-bold text-[#162024] mb-1">Ohar kualitatiboen gakoak</h3>
              <p className="text-[11.5px] text-[#162024] whitespace-pre-line">
                {latxaAnalysis.oharren_analisia}
              </p>
            </div>
          )}

          {latxaAnalysis?.hurrengo_urratsak && latxaAnalysis.hurrengo_urratsak.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold text-[#162024] mb-1">Hurrengo urrats gomendatuak</h3>
              <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-[#162024]">
                {latxaAnalysis.hurrengo_urratsak.map((u, idx) => (
                  <li key={idx}>{u}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {/* 5. Eranskina: Saioen zerrenda */}
      {sortedSessions.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#103C4C] border-b border-[#E2DDD2] pb-1 mb-2.5">
            5. Eranskina: Jasotako behaketa-saioak ({sortedSessions.length})
          </h2>
          <table className="w-full border-collapse text-[10px] tabular-nums">
            <thead>
              <tr className="border-b border-[#162024] text-left uppercase text-[#556064]">
                <th className="py-1 pr-1.5">Data</th>
                <th className="py-1 px-1.5">Fasea</th>
                <th className="py-1 px-1.5">Behatzailea</th>
                <th className="py-1 px-1.5 text-right">Eusk.</th>
                <th className="py-1 px-1.5 text-right">Erd.</th>
                <th className="py-1 px-1.5 text-right">Elebi</th>
                <th className="py-1 px-1.5 text-right">% (±p.)</th>
                <th className="py-1 px-1.5">Egoera</th>
                <th className="py-1 pl-1.5">Oharrak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD2]">
              {sortedSessions.map((n) => {
                const eusk = (n.euskaraz_count || 0) + (n.aldaketa_count || 0);
                const tot = eusk + (n.erdaraz_count || 0) + (n.elebi_count || 0);
                const pct = tot > 0 ? Math.round((eusk / tot) * 1000) / 10 : 0;
                const marj = tot > 0 ? Math.round(wilsonMarjinaPuntu(eusk, tot)) : 0;
                const egoera = neurketaEgoera(n, { nGutxienekoa, protokoloa });
                const egoeraText = egoera.osoa
                  ? "Osoa"
                  : [
                      egoera.laginTxikia ? "Lagin txikia" : null,
                      egoera.protokolotikKanpo ? "Protok. kanpo" : null,
                    ]
                      .filter(Boolean)
                      .join(", ");
                const dt = new Date(n.hasiera_ordu || n.data_ordu);
                const dateStr = isNaN(dt.getTime())
                  ? n.data_ordu.slice(0, 16)
                  : `${dt.toISOString().slice(0, 10)} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;

                return (
                  <tr key={n.id}>
                    <td className="py-1 pr-1.5 whitespace-nowrap">{dateStr}</td>
                    <td className="py-1 px-1.5 font-bold">{n.unea}</td>
                    <td className="py-1 px-1.5">{formatBehatzaileaDisplay(n.behatzailea)}</td>
                    <td className="py-1 px-1.5 text-right font-semibold text-[#0E6B4B]">{eusk}</td>
                    <td className="py-1 px-1.5 text-right">{n.erdaraz_count}</td>
                    <td className="py-1 px-1.5 text-right">{n.elebi_count}</td>
                    <td className="py-1 px-1.5 text-right font-semibold whitespace-nowrap">
                      %{formatDecimalEu(pct)} (±{marj})
                    </td>
                    <td className="py-1 px-1.5 whitespace-nowrap">{egoeraText}</td>
                    <td className="py-1 pl-1.5 text-[#556064]">{n.oharrak || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Orri-oina */}
      <footer className="mt-6 pt-3 border-t border-[#E2DDD2] flex items-center justify-between text-[10px] text-[#556064]">
        <span>Bidean Eragin — Bagera Euskaltzaleen Elkartea</span>
        <span>
          {latxaAnalysis?.sortze_data
            ? `Latxa txostena: ${new Date(latxaAnalysis.sortze_data).toLocaleDateString("eu-ES")}`
            : `Sortua: ${gaurkoData}`}
        </span>
      </footer>
    </article>
  );
}
