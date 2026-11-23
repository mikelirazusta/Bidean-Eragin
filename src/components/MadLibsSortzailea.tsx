"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  FlaskConical,
  ArrowRight,
  X,
  Target,
  Users,
  MapPin,
  Flame,
  Star,
  MessageCircleHeart,
  HelpCircle,
  Bot,
  RotateCcw,
  Lightbulb,
} from "lucide-react";
import type { Pilotua } from "@/lib/db";
import { useApp } from "@/context/AppContext";

interface MadLibsProps {
  pilotu: Pilotua;
  onClose: () => void;
}

export default function MadLibsSortzailea({ pilotu, onClose }: MadLibsProps) {
  const { createEsperimentua, activeEragilea } = useApp();

  // Smart presets based on pilot type or organization type
  const isIkastetxe = activeEragilea?.mota === "ikastetxea";
  const isDenda = activeEragilea?.mota === "merkataritza" || pilotu.id === "barra-barra-txapak";

  const defaultTaldea = isIkastetxe
    ? "Jantokiko eta harrerako langileek"
    : isDenda
    ? "Entitateko langileek"
    : "Lantaldeko kideek";

  const defaultPertsonak = isIkastetxe
    ? "ikasleekin"
    : isDenda
    ? "herritarrekin"
    : "erabiltzaileekin";

  const defaultGunea =
    pilotu.id === "barra-barra-txapak"
      ? "harreran eta sarreran"
      : pilotu.mota.toLowerCase().includes("pasillo")
      ? "pasillo nagusian eta aldageletan"
      : pilotu.mota.toLowerCase().includes("gela")
      ? "gela barruan eta tailerretan"
      : "gune nagusian";

  const defaultEkintza =
    pilotu.id === "barra-barra-txapak"
      ? "'Euskaraz barra-barra' txapa soinean eramanda"
      : `'${pilotu.izena}' dinamika aktibatuta`;

  const [taldea, setTaldea] = useState(defaultTaldea);
  const [pertsonak, setPertsonak] = useState(defaultPertsonak);
  const [gunea, setGunea] = useState(defaultGunea);
  const [ekintza, setEkintza] = useState(defaultEkintza);
  const [metrika, setMetrika] = useState<number>(25);
  const [customHypothesis, setCustomHypothesis] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protokoloa: Noiz neurtuko duzue?
  const [protokoloEgunak, setProtokoloEgunak] = useState<number[]>([5]); // 5 = ostirala
  const [protokoloOrduHasiera, setProtokoloOrduHasiera] = useState<string>("11:00");
  const [protokoloOrduAmaiera, setProtokoloOrduAmaiera] = useState<string>("12:30");
  const [protokoloIraupena, setProtokoloIraupena] = useState<number>(30);
  const [t2Mota, setT2Mota] = useState<"kentzea" | "jarraipena">("kentzea");

  const toggleProtokoloEguna = (dayIdx: number) => {
    setProtokoloEgunak((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort((a, b) => a - b)
    );
  };

  // Latxa integration state
  const [isLatxaLoading, setIsLatxaLoading] = useState(false);
  const [isImprovingHypo, setIsImprovingHypo] = useState(false);
  const [latxaAdvice, setLatxaAdvice] = useState<string | null>(null);

  const handleFillWithLatxa = async () => {
    setIsLatxaLoading(true);
    setLatxaAdvice(null);
    let parsedUrratsak: string[] = [];
    try {
      parsedUrratsak = JSON.parse(pilotu.urratsak_json || "[]");
    } catch {}

    try {
      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "aholkularia_eta_hipotesia",
          eragile_izena: activeEragilea?.izena || "Entitatea",
          eragile_mota: activeEragilea?.mota || "orokorra",
          erronka_nagusia: activeEragilea?.erronka_nagusia || "Euskarazko elkarrizketak piztea",
          pilotu_id: pilotu.id,
          pilotu_izena: pilotu.izena,
          pilotu_deskribapena: pilotu.deskribapena,
          pilotu_urratsak: parsedUrratsak,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.taldea) setTaldea(json.data.taldea);
        if (json.data.pertsonak) setPertsonak(json.data.pertsonak);
        if (json.data.gunea) setGunea(json.data.gunea);
        if (json.data.xede_portzentajea) setMetrika(Number(json.data.xede_portzentajea));
        if (json.data.hipotesia && isCustomMode) setCustomHypothesis(json.data.hipotesia);
        if (json.data.aholkua) setLatxaAdvice(json.data.aholkua);
      }
    } catch (err) {
      console.error("Errorea Latxarekin betetzean:", err);
    } finally {
      setIsLatxaLoading(false);
    }
  };

  const handleImproveHypothesisWithLatxa = async () => {
    setIsImprovingHypo(true);
    try {
      const currentText =
        isCustomMode && customHypothesis.trim()
          ? customHypothesis.trim()
          : `Gure ustez, ${taldea || "..."} ${pertsonak || "..."}, ${gunea || "..."} ${ekintza}, euskararen erabilera ${metrika} puntu igoko da (adib. %30etik %${30 + metrika}era).`;

      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "hobetu_hipotesia",
          uneko_testua: currentText,
          eragile_izena: activeEragilea?.izena || "Entitatea",
          eragile_mota: activeEragilea?.mota || "orokorra",
          erronka_nagusia: activeEragilea?.erronka_nagusia || "",
          pilotu_id: pilotu.id,
          pilotu_izena: pilotu.izena,
          taldea,
          pertsonak,
          gunea,
          xede_portzentajea: metrika,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.hipotesi_hobetua) {
        setCustomHypothesis(json.data.hipotesi_hobetua);
        setIsCustomMode(true);
        if (json.data.azalpena) {
          setLatxaAdvice(json.data.azalpena);
        }
      }
    } catch (err) {
      console.error("Errorea hipotesia hobetzean:", err);
    } finally {
      setIsImprovingHypo(false);
    }
  };

  useEffect(() => {
    setEkintza(
      pilotu.id === "barra-barra-txapak"
        ? "'Euskaraz barra-barra' txapa soinean eramanda"
        : `'${pilotu.izena}' dinamika aktibatuta`
    );
  }, [pilotu]);

  const generatedHypothesis = `Gure ustez, ${taldea || "..."} ${pertsonak || "..."}, ${gunea || "..."} ${ekintza}, euskararen erabilera ${metrika} puntu igoko da (adib. %30etik %${30 + metrika}era).`;
  const fullHypothesis = isCustomMode && customHypothesis.trim() ? customHypothesis.trim() : generatedHypothesis;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const protokoloaJson =
      protokoloEgunak.length > 0 && protokoloOrduHasiera && protokoloOrduAmaiera
        ? JSON.stringify({
            asteko_egunak: protokoloEgunak,
            ordu_hasiera: protokoloOrduHasiera,
            ordu_amaiera: protokoloOrduAmaiera,
            iraupena_min: protokoloIraupena || 30,
            tolerantzia_min: 60,
          })
        : null;

    await createEsperimentua({
      pilotu_id: pilotu.id,
      hipotesia: fullHypothesis,
      taldea: taldea.trim(),
      pertsonak: pertsonak.trim(),
      gunea: gunea.trim(),
      xede_portzentajea: metrika,
      protokoloa_json: protokoloaJson,
      t2_mota: t2Mota,
    });

    setIsSubmitting(false);
  };

  const getPilotIcon = () => {
    if (pilotu.id === "erreferenteak") return <Star className="w-5 h-5 text-emerald-500" />;
    if (pilotu.id === "kriseilua") return <Flame className="w-5 h-5 text-amber-500" />;
    return <MessageCircleHeart className="w-5 h-5 text-sky-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-lg border border-line overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            <span>Hipotesi-sortzaile gidatua</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            {getPilotIcon()}
            {pilotu.izena}
          </h2>
          <p className="text-xs sm:text-sm text-sky-200 mt-1">
            {activeEragilea?.izena || "Zure entitatea"}: bihurtu zuen asmoa hipotesi zientifiko neurgarri batean!
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Mad Libs Guided Builder Card */}
          <div className="bg-paper border border-line/90 rounded-2xl p-5 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bete hutsuneak zure esperimentua zehazteko:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillWithLatxa}
                  disabled={isLatxaLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sea/10 hover:bg-sea/15 text-sea border border-sea/25 text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                  title="Latxak automatikoki beteko ditu hutsuneak zure entitaterako aproposak diren balioekin"
                >
                  <Bot className="w-3 h-3 text-sea" />
                  <span>{isLatxaLoading ? "Latxa pentsatzen..." : "Bete Latxarekin"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isCustomMode && !customHypothesis.trim()) {
                      setCustomHypothesis(generatedHypothesis);
                    }
                    setIsCustomMode(!isCustomMode);
                  }}
                  className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer"
                >
                  {isCustomMode ? "Txantiloi gidatura itzuli" : "Esaldia libreki idatzi"}
                </button>
              </div>
            </div>

            {latxaAdvice && (
              <div className="mb-3 p-2.5 rounded-xl bg-sea/10 border border-sea/25 text-xs text-sea flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Latxaren aholkua:</strong> {latxaAdvice}
                </span>
              </div>
            )}

            {!isCustomMode ? (
              <div className="text-base sm:text-lg text-ink font-medium leading-loose">
                <span>Gure ustez, </span>

                {/* Box 1: Taldea */}
                <span className="inline-block mx-1">
                  <input
                    type="text"
                    required
                    value={taldea}
                    onChange={(e) => setTaldea(e.target.value)}
                    placeholder="adib. Entitateko langileek"
                    className="bg-white font-bold text-sky-700 border-2 border-sky-300 rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden shadow-xs min-w-[140px]"
                  />
                </span>

                {/* Box 2: Pertsonak */}
                <span className="inline-block mx-1">
                  <input
                    type="text"
                    required
                    value={pertsonak}
                    onChange={(e) => setPertsonak(e.target.value)}
                    placeholder="herritarrekin"
                    className="bg-white font-bold text-sky-700 border-2 border-sky-300 rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden shadow-xs min-w-[110px]"
                  />
                </span>
                <span>, </span>

                {/* Box 3: Gunea */}
                <span className="inline-block mx-1">
                  <input
                    type="text"
                    required
                    value={gunea}
                    onChange={(e) => setGunea(e.target.value)}
                    placeholder="harreran"
                    className="bg-white font-bold text-euskara border-2 border-euskara/40 rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-euskara/40 focus:outline-hidden shadow-xs min-w-[180px]"
                  />
                </span>

                {/* Box 4: Pilotua */}
                <span className="inline-block mx-1 font-bold text-ink bg-slate-200 px-2 py-0.5 rounded-lg text-sm">
                  {ekintza}
                </span>
                <span>, euskararen erabilera </span>

                {/* Box 5: Metrika */}
                <span className="inline-flex items-center mx-1">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="5"
                    required
                    value={metrika}
                    onChange={(e) => setMetrika(Number(e.target.value))}
                    className="bg-white font-extrabold text-amber-700 border-2 border-amber-400 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-xs w-16 text-center"
                  />
                  <span className="font-bold text-amber-700 ml-1">puntu</span>
                </span>

                <span> igoko da (adib. %30etik %{30 + metrika}era).</span>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={customHypothesis}
                  onChange={(e) => setCustomHypothesis(e.target.value)}
                  placeholder="Idatzi hemen zure hipotesia nahi duzun bezala..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-sky-300 text-sm font-semibold text-ink focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink-muted mb-1">Behaketa-gunea</label>
                    <input
                      type="text"
                      value={gunea}
                      onChange={(e) => setGunea(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-line text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink-muted mb-1">Xede-igoera (puntu)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={metrika}
                      onChange={(e) => setMetrika(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-line text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Chip Suggestions */}
            <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-ink-muted">Iradokizun azkarrak:</span>
              {[
                { label: "Harrera eta arreta-gunea", t: "Entitateko langileek", p: "herritarrekin", g: "harreran eta sarreran" },
                { label: "Dendako mostradorea", t: "Dendako langileek", p: "bezeroekin", g: "mostradorean eta ordainlekuan" },
                { label: "Ostalari eta bezeroak", t: "Barrako zerbitzariek", p: "bezeroekin", g: "kafe-orduan" },
                { label: "Ikastetxeko pasilloak", t: "DBH 1-2. mailako irakasleek", p: "ikasleekin", g: "pasillo eta jantokian" },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTaldea(chip.t);
                    setPertsonak(chip.p);
                    setGunea(chip.g);
                    setIsCustomMode(false);
                  }}
                  className="text-[11px] font-medium bg-white hover:bg-sand text-ink px-2.5 py-1 rounded-full border border-line shadow-2xs transition cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Protokoloa: Noiz neurtuko duzue? */}
          <div className="p-4 rounded-2xl bg-paper border border-line space-y-3">
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Noiz neurtuko duzue? (Behaketa-protokoloa)
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Neurtu beti egun eta ordu berean: bestela, bezero desberdinak neurtuko dituzue.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink mb-1.5">Asteko eguna(k):</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 1, label: "Astelehena" },
                  { id: 2, label: "Asteartea" },
                  { id: 3, label: "Asteazkena" },
                  { id: 4, label: "Osteguna" },
                  { id: 5, label: "Ostirala" },
                  { id: 6, label: "Larunbata" },
                  { id: 0, label: "Igandea" },
                ].map((d) => {
                  const active = protokoloEgunak.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleProtokoloEguna(d.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        active
                          ? "bg-sea text-white border-sea"
                          : "bg-white text-ink-muted border-line hover:bg-sand"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Ordu-hasiera</label>
                <input
                  type="time"
                  value={protokoloOrduHasiera}
                  onChange={(e) => setProtokoloOrduHasiera(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-line text-xs font-semibold text-ink"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Ordu-amaiera</label>
                <input
                  type="time"
                  value={protokoloOrduAmaiera}
                  onChange={(e) => setProtokoloOrduAmaiera(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-line text-xs font-semibold text-ink"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Iraupena (min)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  step={5}
                  value={protokoloIraupena}
                  onChange={(e) => setProtokoloIraupena(Math.max(5, Number(e.target.value) || 30))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-line text-xs font-semibold text-ink tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* T2 mota: Kentzea (ABA) vs Jarraipena */}
          <div className="p-4 rounded-2xl bg-paper border border-line space-y-2.5">
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Nola egingo duzue T2 fasea?
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Esku-hartzea kentzean erabilera jaisten bada, badakizue esku-hartzeak eragin duela. Bestela, ezin da hori jakin.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setT2Mota("kentzea")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  t2Mota === "kentzea"
                    ? "bg-euskara/10 border-euskara text-ink"
                    : "bg-white border-line text-ink-muted hover:bg-sand"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Esku-hartzea kentzea (ABA)</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-euskara text-white text-[9px] font-bold">
                    Gomendatua
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted mt-1">
                  Kendu esku-hartzea (adib. txapak) eta neurtu egun eta ordu berean.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setT2Mota("jarraipena")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  t2Mota === "jarraipena"
                    ? "bg-sea/10 border-sea text-ink"
                    : "bg-white border-line text-ink-muted hover:bg-sand"
                }`}
              >
                <span className="text-xs font-bold text-ink block">Jarraipena</span>
                <p className="text-[11px] text-ink-muted mt-1">
                  Esku-hartzearekin jarraitu eta 2-3 astera berriro neurtu.
                </p>
              </button>
            </div>
          </div>

          {/* Real-time Hypothesis Preview Card */}
          <div className="p-4 rounded-2xl bg-euskara/10 border border-euskara/25 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-euskara/15 text-euskara shrink-0 mt-0.5">
              <FlaskConical className="w-5 h-5 text-euskara" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-euskara uppercase tracking-wider">
                    Zure hipotesi zientifikoa:
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-200 text-euskara">
                    Xedea: +{metrika} puntu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleImproveHypothesisWithLatxa}
                  disabled={isImprovingHypo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-euskara hover:bg-emerald-800 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isImprovingHypo ? (
                    <>
                      <RotateCcw className="w-3 h-3 animate-spin" />
                      <span>Fintzen...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Hobetu erredakzioa Latxarekin</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-semibold text-emerald-950 mt-1.5 italic">
                &ldquo;{fullHypothesis}&rdquo;
              </p>
              <p className="text-xs text-euskara/80 mt-1.5">
                 Esperimentua sortzean, zuzenean joango zara <strong>T0 hasierako neurketa</strong> (oinarrizko marra) egitera.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
            >
              Utzi
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !taldea.trim() || !gunea.trim()}
              className="px-6 py-3 rounded-2xl bg-euskara hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? "Gordetzen..." : "Gorde esperimentua eta hasi T0"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
