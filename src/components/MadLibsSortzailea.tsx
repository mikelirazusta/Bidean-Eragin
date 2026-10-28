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

  useEffect(() => {
    setEkintza(
      pilotu.id === "barra-barra-txapak"
        ? "'Euskaraz barra-barra' txapa soinean eramanda"
        : `'${pilotu.izena}' dinamika aktibatuta`
    );
  }, [pilotu]);

  const generatedHypothesis = `Gure ustez, ${taldea || "..."} ${pertsonak || "..."}, ${gunea || "..."} ${ekintza}, euskararen erabilera %${metrika} igoko da.`;
  const fullHypothesis = isCustomMode && customHypothesis.trim() ? customHypothesis.trim() : generatedHypothesis;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await createEsperimentua({
      pilotu_id: pilotu.id,
      hipotesia: fullHypothesis,
      taldea: taldea.trim(),
      pertsonak: pertsonak.trim(),
      gunea: gunea.trim(),
      xede_portzentajea: metrika,
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
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
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
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-inner">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bete hutsuneak zure esperimentua zehazteko:</span>
              </div>
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

            {!isCustomMode ? (
              <div className="text-base sm:text-lg text-slate-800 font-medium leading-loose">
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
                    className="bg-white font-bold text-emerald-700 border-2 border-emerald-300 rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-xs min-w-[180px]"
                  />
                </span>

                {/* Box 4: Pilotua */}
                <span className="inline-block mx-1 font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-lg text-sm">
                  {ekintza}
                </span>
                <span>, euskararen erabilera </span>

                {/* Box 5: Metrika */}
                <span className="inline-flex items-center mx-1">
                  <span className="font-bold text-amber-700 mr-0.5">%</span>
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
                </span>

                <span> igoko da.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={customHypothesis}
                  onChange={(e) => setCustomHypothesis(e.target.value)}
                  placeholder="Idatzi hemen zure hipotesia nahi duzun bezala..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-sky-300 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Behaketa-gunea</label>
                    <input
                      type="text"
                      value={gunea}
                      onChange={(e) => setGunea(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Xede-igoera (%)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={metrika}
                      onChange={(e) => setMetrika(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Chip Suggestions */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Iradokizun azkarrak:</span>
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
                  className="text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs transition cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Hypothesis Preview Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
              <FlaskConical className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Zure hipotesi zientifikoa:
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-200 text-emerald-900">
                  Xedea: +%{metrika}
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-950 mt-1 italic">
                &ldquo;{fullHypothesis}&rdquo;
              </p>
              <p className="text-xs text-emerald-800/80 mt-1.5">
                💡 Esperimentua sortzean, zuzenean joango zara <strong>T0 hasierako neurketa</strong> (oinarrizko marra) egitera.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Utzi
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !taldea.trim() || !gunea.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
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
