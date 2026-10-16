"use client";

import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  FlaskConical,
  Bell,
  Calendar,
  Share2,
  PlusCircle,
  Plus,
  Trash2,
  Calculator,
  Award,
  Layers,
  BarChart3,
  Pencil,
  Save,
  X,
  Printer,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Esperimentua, Neurketa } from "@/lib/db";

export interface PhaseStats {
  unea: "T0" | "T1" | "T2";
  count: number;
  totalEuskaraz: number;
  totalErdaraz: number;
  totalElebi: number;
  totalInteractions: number;
  pct: number;
  avgSessionPct: number;
  neurketak: Neurketa[];
}

function computePhaseStats(list: Neurketa[], phase: "T0" | "T1" | "T2"): PhaseStats | null {
  const phaseList = list.filter((n) => n.unea === phase);
  if (phaseList.length === 0) return null;

  const totalEuskaraz = phaseList.reduce((sum, n) => sum + (n.euskaraz_count || 0), 0);
  const totalErdaraz = phaseList.reduce((sum, n) => sum + (n.erdaraz_count || 0), 0);
  const totalElebi = phaseList.reduce((sum, n) => sum + (n.elebi_count || 0), 0);
  const totalInteractions = totalEuskaraz + totalErdaraz + totalElebi;
  const pct = totalInteractions > 0 ? Math.round((totalEuskaraz / totalInteractions) * 100) : 0;

  const sessionPcts = phaseList.map((n) => {
    const tot = (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0);
    return tot > 0 ? (n.euskaraz_count / tot) * 100 : 0;
  });
  const avgSessionPct = Math.round(sessionPcts.reduce((a, b) => a + b, 0) / phaseList.length);

  return {
    unea: phase,
    count: phaseList.length,
    totalEuskaraz,
    totalErdaraz,
    totalElebi,
    totalInteractions,
    pct,
    avgSessionPct,
    neurketak: phaseList,
  };
}

export default function ZentroDashboard() {
  const {
    activeEragilea,
    esperimentuak,
    neurketak,
    nudges,
    markNudgeRead,
    setActiveTab,
    setObservationConfig,
    triggerConfetti,
    deleteNeurketa,
    updateEsperimentua,
  } = useApp();

  // Find all experiments for this organization
  const orgExperiments = esperimentuak.filter(
    (e) => e.eragile_id === activeEragilea?.id
  );

  const [selectedExpId, setSelectedExpId] = useState<string>(
    orgExperiments[0]?.id || ""
  );

  const currentExp =
    orgExperiments.find((e) => e.id === selectedExpId) || orgExperiments[0];

  const [isEditingHypothesis, setIsEditingHypothesis] = useState(false);
  const [editHipotesiaText, setEditHipotesiaText] = useState("");
  const [editTaldeaText, setEditTaldeaText] = useState("");
  const [editPertsonakText, setEditPertsonakText] = useState("");
  const [editGuneaText, setEditGuneaText] = useState("");
  const [editXedeaNum, setEditXedeaNum] = useState<number>(25);
  const [isSavingHypothesis, setIsSavingHypothesis] = useState(false);

  const handleOpenEditHypothesis = () => {
    if (!currentExp) return;
    setEditHipotesiaText(currentExp.hipotesia);
    setEditTaldeaText(currentExp.taldea);
    setEditPertsonakText(currentExp.pertsonak);
    setEditGuneaText(currentExp.gunea);
    setEditXedeaNum(currentExp.xede_portzentajea || 25);
    setIsEditingHypothesis(true);
  };

  const handleSaveHypothesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExp || !editHipotesiaText.trim()) return;
    setIsSavingHypothesis(true);
    await updateEsperimentua({
      id: currentExp.id,
      hipotesia: editHipotesiaText.trim(),
      taldea: editTaldeaText.trim() || currentExp.taldea,
      pertsonak: editPertsonakText.trim() || currentExp.pertsonak,
      gunea: editGuneaText.trim() || currentExp.gunea,
      xede_portzentajea: editXedeaNum,
    });
    setIsSavingHypothesis(false);
    setIsEditingHypothesis(false);
  };

  // Get measurements for current experiment
  const expNeurketak = neurketak.filter(
    (n) => n.esperimentu_id === currentExp?.id
  );

  // Compute Phase Statistics (Aggregated & Averaged across multiple sessions)
  const t0Stats = computePhaseStats(expNeurketak, "T0");
  const t1Stats = computePhaseStats(expNeurketak, "T1");
  const t2Stats = computePhaseStats(expNeurketak, "T2");

  const t0Pct = t0Stats ? t0Stats.pct : null;
  const t1Pct = t1Stats ? t1Stats.pct : null;
  const t2Pct = t2Stats ? t2Stats.pct : null;

  // Growth calculations
  const immediateGain =
    t1Pct !== null && t0Pct !== null ? t1Pct - t0Pct : null;
  const sustainedGain =
    t2Pct !== null && t0Pct !== null ? t2Pct - t0Pct : null;

  // Organization active unread nudges
  const activeNudges = nudges.filter(
    (n) => n.eragile_id === activeEragilea?.id && n.irakurria === 0
  );

  // Hobekuntza urratsak
  const steps = [
    {
      step: 1,
      title: "Hipotesia definitu",
      desc: "Hipotesi-sortzailearen bidez esperimentua zehaztu.",
      completed: !!currentExp,
      current: false,
    },
    {
      step: 2,
      title: "T0 Neurtu (Oinarrizko marra)",
      desc: t0Stats
        ? `${t0Stats.count === 1 ? "Hasierako saio 1 eginda" : `${t0Stats.count} saio eginda (batez bestekoa: %${t0Stats.pct})`}. ${t0Stats.totalInteractions} interakzio neurtuta.`
        : "Esku-hartzea hasi AURRETIKO hasierako behaketa.",
      completed: !!t0Stats,
      current: !t0Stats,
      actionPhase: "T0" as const,
      count: t0Stats?.count || 0,
    },
    {
      step: 3,
      title: "Pilotua martxan jarri",
      desc: "Kartelak/dinamika espazioan aktibatuta.",
      completed: !!t0Stats,
      current: !!t0Stats && !t1Stats,
    },
    {
      step: 4,
      title: "T1 Neurtu (Berehalako eragina)",
      desc: t1Stats
        ? `${t1Stats.count === 1 ? "Saio 1 eginda" : `${t1Stats.count} saio eginda (batez bestekoa: %${t1Stats.pct})`}. ${immediateGain !== null ? (immediateGain >= 0 ? `+${immediateGain}%` : `${immediateGain}%`) : ""}`
        : "Lehen asteko efektu zuzena neurtu.",
      completed: !!t1Stats,
      current: !!t0Stats && !t1Stats,
      actionPhase: "T1" as const,
      count: t1Stats?.count || 0,
    },
    {
      step: 5,
      title: "T2 Neurtu (Ohitura sendotzea)",
      desc: t2Stats
        ? `${t2Stats.count === 1 ? "Saio 1 eginda" : `${t2Stats.count} saio eginda (batez bestekoa: %${t2Stats.pct})`}. ${sustainedGain !== null ? (sustainedGain >= 0 ? `+${sustainedGain}%` : `${sustainedGain}%`) : ""}`
        : "14-21 egunera, epe ertaineko aldaketa finkatu al da?",
      completed: !!t2Stats,
      current: !!t1Stats && !t2Stats,
      actionPhase: "T2" as const,
      count: t2Stats?.count || 0,
    },
  ];

  const completedStepsCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedStepsCount / steps.length) * 100);

  if (!activeEragilea) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Hasi Bidean Eragin 0tik!
          </h2>
          <p className="text-sm text-slate-600 mt-2 mb-6 max-w-md mx-auto leading-relaxed">
            Ez dago zentrorik erregistratuta oraindik. Eman izena zure zentroarekin (ikastetxe, denda edo enpresa) eta hasi zure lehen hipotesia eta neurketa prestatzen.
          </p>
          <button
            onClick={() => setActiveTab("onboarding")}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition cursor-pointer"
          >
            Sortu Zentroa & Diagnostikoa (1. Urratsa) →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Top Organization Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-sky-100 text-sky-800 uppercase tracking-wider">
              {activeEragilea?.mota || "Zentroa"}
            </span>
            <span className="text-xs text-slate-400">• Panela & Aurrerapena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeEragilea?.izena || "Zure Zentroa"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Erronka: <em>&ldquo;{activeEragilea?.erronka_nagusia}&rdquo;</em>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            title="Inprimatu edo gorde PDF gisa saltokiaren txostena"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Inprimatu Txostena (PDF)</span>
          </button>

          <button
            onClick={() => setActiveTab("katalogoa")}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Esperimentu Berria</span>
          </button>

          <button
            onClick={() => {
              setObservationConfig({
                expId: currentExp?.id,
                phase: !t0Stats ? "T0" : !t1Stats ? "T1" : "T2",
              });
              setActiveTab("behaketa");
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Hasi Behaketa</span>
          </button>
        </div>
      </div>

      {/* ACTIVE NUDGE BANNER (if any unread nudge exists) */}
      {activeNudges.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                  🔔 Portaera-bultzada
                </span>
                <h3 className="text-base sm:text-lg font-extrabold mt-0.5">
                  {activeNudges[0].titulua}
                </h3>
                <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl leading-relaxed">
                  {activeNudges[0].mezua}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {activeNudges[0].ekintza_esteka && (
                <button
                  onClick={() => {
                    const link = activeNudges[0].ekintza_esteka!;
                    if (link.includes("phase=T1")) {
                      setObservationConfig({ expId: currentExp?.id, phase: "T1" });
                    } else if (link.includes("phase=T2")) {
                      setObservationConfig({ expId: currentExp?.id, phase: "T2" });
                    }
                    setActiveTab("behaketa");
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Egin Neurketa Orain</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => markNudgeRead(activeNudges[0].id)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition cursor-pointer shrink-0"
              >
                Ados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Hypothesis & Lean Progress), Right Column (Charts) */}
      {currentExp ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (5 cols): Hypothesis & Lean Checklist */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Hypothesis Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Zuen Hipotesia
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Pilotua: {currentExp.pilotu_izena || "Euskaraz barra-barra txapak"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                    Xedea: +%{currentExp.xede_portzentajea}
                  </span>
                  {!isEditingHypothesis && (
                    <button
                      type="button"
                      onClick={handleOpenEditHypothesis}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      title="Editatu hipotesia eta xehetasunak"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      <span>Editatu</span>
                    </button>
                  )}
                </div>
              </div>

              {isEditingHypothesis ? (
                <form onSubmit={handleSaveHypothesis} className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-200 my-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-800">
                        Hipotesi Erreala *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditHipotesiaText(
                            `Gure ustez, ${editTaldeaText || "Saltokiko lantaldea"} ${editPertsonakText || "Bezeroak eta langileak"}, ${editGuneaText || "Saltokiaren mostradorea"} 'Euskaraz barra-barra' txapa soinean eramanda, euskararen erabilera %${editXedeaNum} igoko da.`
                          )
                        }
                        className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        ✨ Sortu azpiko eremuekin
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={editHipotesiaText}
                      onChange={(e) => setEditHipotesiaText(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                        Taldea
                      </label>
                      <input
                        type="text"
                        value={editTaldeaText}
                        onChange={(e) => setEditTaldeaText(e.target.value)}
                        className="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                        Gunea
                      </label>
                      <input
                        type="text"
                        value={editGuneaText}
                        onChange={(e) => setEditGuneaText(e.target.value)}
                        className="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                        Pertsonak
                      </label>
                      <input
                        type="text"
                        value={editPertsonakText}
                        onChange={(e) => setEditPertsonakText(e.target.value)}
                        className="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                        Xedea (+%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editXedeaNum}
                        onChange={(e) => setEditXedeaNum(Number(e.target.value))}
                        className="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingHypothesis(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Utzi</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingHypothesis || !editHipotesiaText.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingHypothesis ? "Gordetzen..." : "Gorde Hipotesia"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 my-3">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 italic leading-relaxed">
                      &ldquo;{currentExp.hipotesia}&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Taldea</span>
                      <span className="font-semibold text-slate-700">{currentExp.taldea}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Gunea</span>
                      <span className="font-semibold text-slate-700">{currentExp.gunea}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Aurrerapen Barra */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Hobekuntza-Zikloaren Aurrerapena
                  </h3>
                  <p className="text-xs text-slate-500">
                    {completedStepsCount} / {steps.length} urrats osatuta
                  </p>
                </div>
                <span className="text-sm font-black text-emerald-600">
                  %{progressPct}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6">
                <div
                  className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Steps List */}
              <div className="space-y-4">
                {steps.map((st) => (
                  <div
                    key={st.step}
                    className={`flex items-start gap-3 p-3 rounded-2xl transition border ${
                      st.completed
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                        : st.current
                        ? "bg-sky-50 border-sky-300 text-sky-950 shadow-2xs"
                        : "bg-slate-50/50 border-slate-200/70 text-slate-400"
                    }`}
                  >
                    <div className="mt-0.5">
                      {st.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : st.current ? (
                        <div className="w-5 h-5 rounded-full border-2 border-sky-600 flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 rounded-full bg-sky-600" />
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold leading-tight">
                          {st.step}. {st.title}
                        </h4>
                        {st.actionPhase && (
                          st.completed ? (
                            <button
                              onClick={() => {
                                setObservationConfig({
                                  expId: currentExp.id,
                                  phase: st.actionPhase!,
                                });
                                setActiveTab("behaketa");
                              }}
                              className="text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs transition cursor-pointer inline-flex items-center gap-1 shrink-0"
                              title="Egin beste behaketa saio bat fase honetako batez bestekoa sendotzeko"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Saio berria</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setObservationConfig({
                                  expId: currentExp.id,
                                  phase: st.actionPhase!,
                                });
                                setActiveTab("behaketa");
                              }}
                              className="text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200 shadow-2xs transition cursor-pointer shrink-0"
                            >
                              Egin orain →
                            </button>
                          )
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Visual Feedback & Charts (T0 vs T1 vs T2) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Chart Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      Neurketa Konparatiboa: T0 vs T1 vs T2
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Euskararen erabileraren eboluzioa fase bakoitzean (%)
                  </p>
                </div>

                {sustainedGain !== null && sustainedGain > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-extrabold shadow-xs">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>+%{sustainedGain} Igoera Egonkorra!</span>
                  </div>
                )}
              </div>

              {/* Visual Bars Container */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 pb-6">
                
                {/* T0 Bar */}
                <div className="flex flex-col items-center">
                  <div className="h-56 w-full max-w-[90px] bg-slate-100 rounded-2xl p-1.5 flex flex-col justify-end relative shadow-inner">
                    {t0Pct !== null ? (
                      <div
                        className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-xl transition-all duration-700 flex flex-col items-center justify-center text-white font-extrabold text-sm shadow-sm"
                        style={{ height: `${Math.max(t0Pct, 15)}%` }}
                      >
                        <span>%{t0Pct}</span>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-400 text-center font-medium p-1">
                        Zain (Ez dago daturik)
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-3 w-full">
                    <span className="font-extrabold text-xs text-slate-900 block">
                      T0 Neurketa
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {t0Stats
                        ? t0Stats.count === 1
                          ? "1 saio erregistratua"
                          : `${t0Stats.count} saioen batez bestekoa`
                        : "Oinarrizkoa (Aurretik)"}
                    </span>
                    {t0Stats && (
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                        %{t0Stats.pct} euskara ({t0Stats.totalEuskaraz}/{t0Stats.totalInteractions})
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setObservationConfig({ expId: currentExp.id, phase: "T0" });
                        setActiveTab("behaketa");
                      }}
                      className={`mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer w-full ${
                        t0Stats
                          ? "text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-200"
                          : "text-white bg-sky-600 hover:bg-sky-700 border-transparent shadow-xs"
                      }`}
                      title="Egin beste behaketa saio bat T0 batez bestekoa sendotzeko"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t0Stats ? "+ Beste saio bat" : "Neurtu T0"}</span>
                    </button>
                  </div>
                </div>

                {/* T1 Bar */}
                <div className="flex flex-col items-center">
                  <div className="h-56 w-full max-w-[90px] bg-slate-100 rounded-2xl p-1.5 flex flex-col justify-end relative shadow-inner">
                    {t1Pct !== null ? (
                      <div
                        className="w-full bg-gradient-to-t from-teal-600 to-emerald-400 rounded-xl transition-all duration-700 flex flex-col items-center justify-center text-white font-extrabold text-sm shadow-sm"
                        style={{ height: `${Math.max(t1Pct, 15)}%` }}
                      >
                        <span>%{t1Pct}</span>
                        {immediateGain !== null && (
                          <span className="text-[10px] bg-white/20 px-1 rounded-sm mt-0.5">
                            {immediateGain >= 0 ? `+${immediateGain}%` : `${immediateGain}%`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[10px] text-slate-400 text-center font-medium p-1">
                        <span>T1 Zain</span>
                        {t0Stats && (
                          <button
                            onClick={() => {
                              setObservationConfig({ expId: currentExp.id, phase: "T1" });
                              setActiveTab("behaketa");
                            }}
                            className="mt-2 text-[10px] text-sky-700 font-bold underline cursor-pointer"
                          >
                            Neurtu T1
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-3 w-full">
                    <span className="font-extrabold text-xs text-slate-900 block">
                      T1 Neurketa
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {t1Stats
                        ? t1Stats.count === 1
                          ? "1 saio erregistratua"
                          : `${t1Stats.count} saioen batez bestekoa`
                        : "Berehalakoa (1. astea)"}
                    </span>
                    {t1Stats && (
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                        %{t1Stats.pct} euskara ({t1Stats.totalEuskaraz}/{t1Stats.totalInteractions})
                      </span>
                    )}

                    {t0Stats && (
                      <button
                        onClick={() => {
                          setObservationConfig({ expId: currentExp.id, phase: "T1" });
                          setActiveTab("behaketa");
                        }}
                        className={`mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer w-full ${
                          t1Stats
                            ? "text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-200"
                            : "text-white bg-teal-600 hover:bg-teal-700 border-transparent shadow-xs"
                        }`}
                        title="Egin beste behaketa saio bat T1 fasean"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t1Stats ? "+ Beste saio bat" : "Neurtu T1"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* T2 Bar */}
                <div className="flex flex-col items-center">
                  <div className="h-56 w-full max-w-[90px] bg-slate-100 rounded-2xl p-1.5 flex flex-col justify-end relative shadow-inner">
                    {t2Pct !== null ? (
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-xl transition-all duration-700 flex flex-col items-center justify-center text-white font-extrabold text-sm shadow-sm"
                        style={{ height: `${Math.max(t2Pct, 15)}%` }}
                      >
                        <span>%{t2Pct}</span>
                        {sustainedGain !== null && (
                          <span className="text-[10px] bg-white/20 px-1 rounded-sm mt-0.5">
                            {sustainedGain >= 0 ? `+${sustainedGain}%` : `${sustainedGain}%`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[10px] text-slate-400 text-center font-medium p-1">
                        <span>T2 Zain</span>
                        {t1Stats && (
                          <button
                            onClick={() => {
                              setObservationConfig({ expId: currentExp.id, phase: "T2" });
                              setActiveTab("behaketa");
                            }}
                            className="mt-2 text-[10px] text-sky-700 font-bold underline cursor-pointer"
                          >
                            Neurtu T2
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-3 w-full">
                    <span className="font-extrabold text-xs text-slate-900 block">
                      T2 Neurketa
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {t2Stats
                        ? t2Stats.count === 1
                          ? "1 saio erregistratua"
                          : `${t2Stats.count} saioen batez bestekoa`
                        : "Epe ertaina (14 egunera)"}
                    </span>
                    {t2Stats && (
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                        %{t2Stats.pct} euskara ({t2Stats.totalEuskaraz}/{t2Stats.totalInteractions})
                      </span>
                    )}

                    {t1Stats && (
                      <button
                        onClick={() => {
                          setObservationConfig({ expId: currentExp.id, phase: "T2" });
                          setActiveTab("behaketa");
                        }}
                        className={`mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer w-full ${
                          t2Stats
                            ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                            : "text-white bg-emerald-600 hover:bg-emerald-700 border-transparent shadow-xs"
                        }`}
                        title="Egin beste behaketa saio bat T2 fasean"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t2Stats ? "+ Beste saio bat" : "Neurtu T2"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scientific Conclusion Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                <div className="flex items-center gap-2 mb-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Ondorio Zientifikoa (Batez bestekoetan oinarritua):
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {t2Pct !== null && t0Pct !== null ? (
                    t2Pct >= t0Pct + currentExp.xede_portzentajea ? (
                      <span className="text-emerald-800 font-semibold">
                        🎉 <strong>Bikain! Hipotesia egiaztatu da.</strong> Euskararen erabilera %{t0Pct}-tik %{t2Pct}-ra igo da (+%{sustainedGain} igoera egonkorra) saioen batez bestekoetan. Aldaketa hau beste espazioetara eskalatzea gomendatzen da.
                      </span>
                    ) : (
                      <span>
                        Datuak bilduta daude (+%{sustainedGain} igoera). Baloratu beste saio bat egitea datuak sendotzeko, edo pilotua moldatzea emaitzak are gehiago indartzeko.
                      </span>
                    )
                  ) : t1Pct !== null && t0Pct !== null ? (
                    <span>
                      T1 neurketek <strong>+%{immediateGain}</strong> berehalako igoera erakusten dute batez beste. Nahi baduzu, egin beste saio bat T1 fasean edo jarraitu pilotuarekin 14 egunera T2 neurketa egiteko!
                    </span>
                  ) : t0Pct !== null ? (
                    <span>
                      T0 hasierako oinarria erregistratuta dago (%{t0Pct} euskara, {t0Stats?.count} saiotan). Orain martxan jarri pilotuaren kartelak edo dinamikak gunean (edo egin beste T0 saio bat oinarria aberasteko)!
                    </span>
                  ) : (
                    <span>
                      Esperimentua prest dago. Lehenik eta behin, egin hasierako T0 behaketa itsua espazioan.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* BATEZ BESTEKOEN LABURPEN KOADROA */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Faseen Batez Bestekoen Laburpena
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {expNeurketak.length} saio guztira erregistratuta
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* T0 Card */}
                <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-sky-950">T0 (Hasierakoa)</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-800">
                        {t0Stats ? `${t0Stats.count} saio` : "0 saio"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-sky-900 my-1">
                      {t0Stats ? `%{t0Stats.pct}` : "—"}
                    </div>
                    <p className="text-[11px] text-sky-700">
                      {t0Stats
                        ? `${t0Stats.totalEuskaraz} euskara / ${t0Stats.totalInteractions} guztira`
                        : "Oraindik ez dago saiorik"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setObservationConfig({ expId: currentExp.id, phase: "T0" });
                      setActiveTab("behaketa");
                    }}
                    className="mt-3 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-white hover:bg-sky-100/80 py-1.5 px-3 rounded-xl border border-sky-200 transition text-center cursor-pointer inline-flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t0Stats ? "Gehitu T0 saioa" : "Hasi T0 saioa"}</span>
                  </button>
                </div>

                {/* T1 Card */}
                <div className="bg-teal-50/70 rounded-2xl p-4 border border-teal-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-teal-950">T1 (Berehalakoa)</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-800">
                        {t1Stats ? `${t1Stats.count} saio` : "0 saio"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-teal-900 my-1">
                      {t1Stats ? `%{t1Stats.pct}` : "—"}
                      {immediateGain !== null && (
                        <span className="text-xs font-bold ml-2 text-teal-600">
                          ({immediateGain >= 0 ? `+${immediateGain}%` : `${immediateGain}%`})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-teal-700">
                      {t1Stats
                        ? `${t1Stats.totalEuskaraz} euskara / ${t1Stats.totalInteractions} guztira`
                        : "Zain"}
                    </p>
                  </div>
                  {t0Stats ? (
                    <button
                      onClick={() => {
                        setObservationConfig({ expId: currentExp.id, phase: "T1" });
                        setActiveTab("behaketa");
                      }}
                      className="mt-3 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-100/80 py-1.5 px-3 rounded-xl border border-teal-200 transition text-center cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t1Stats ? "Gehitu T1 saioa" : "Hasi T1 saioa"}</span>
                    </button>
                  ) : (
                    <span className="mt-3 text-[11px] text-slate-400 text-center py-1.5">
                      T0 neurtu behar da lehenik
                    </span>
                  )}
                </div>

                {/* T2 Card */}
                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-950">T2 (Sendotua)</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800">
                        {t2Stats ? `${t2Stats.count} saio` : "0 saio"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-900 my-1">
                      {t2Stats ? `%{t2Stats.pct}` : "—"}
                      {sustainedGain !== null && (
                        <span className="text-xs font-bold ml-2 text-emerald-600">
                          ({sustainedGain >= 0 ? `+${sustainedGain}%` : `${sustainedGain}%`})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      {t2Stats
                        ? `${t2Stats.totalEuskaraz} euskara / ${t2Stats.totalInteractions} guztira`
                        : "Zain (14 egunera)"}
                    </p>
                  </div>
                  {t1Stats ? (
                    <button
                      onClick={() => {
                        setObservationConfig({ expId: currentExp.id, phase: "T2" });
                        setActiveTab("behaketa");
                      }}
                      className="mt-3 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100/80 py-1.5 px-3 rounded-xl border border-emerald-200 transition text-center cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t2Stats ? "Gehitu T2 saioa" : "Hasi T2 saioa"}</span>
                    </button>
                  ) : (
                    <span className="mt-3 text-[11px] text-slate-400 text-center py-1.5">
                      T1 neurtu behar da lehenik
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Measurements Table */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Jasotako Saio Guztien Zerrenda
                </h4>
                <span className="text-xs text-slate-400">
                  Saio bakoitzak faseko batez bestekoa aberasten du
                </span>
              </div>

              {expNeurketak.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Oraindik ez dago neurketarik erregistratuta.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="pb-2">Fasea eta Saioa</th>
                        <th className="pb-2">Euskaraz</th>
                        <th className="pb-2">Erdaraz</th>
                        <th className="pb-2">Elebi</th>
                        <th className="pb-2">Euskara %</th>
                        <th className="pb-2">Iraupena</th>
                        <th className="pb-2">Behatzailea</th>
                        <th className="pb-2">Data</th>
                        <th className="pb-2 text-right">Ekintzak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...expNeurketak]
                        .sort((a, b) => new Date(b.data_ordu).getTime() - new Date(a.data_ordu).getTime())
                        .map((neu) => {
                          const total = neu.euskaraz_count + neu.erdaraz_count + neu.elebi_count;
                          const pct = total > 0 ? Math.round((neu.euskaraz_count / total) * 100) : 0;
                          const minutes = Math.max(1, Math.round((neu.iraupena_segundotan || 600) / 60));

                          // Determine session number in its phase
                          const samePhaseSorted = [...expNeurketak]
                            .filter((n) => n.unea === neu.unea)
                            .sort((a, b) => new Date(a.data_ordu).getTime() - new Date(b.data_ordu).getTime());
                          const sessionIndex = samePhaseSorted.findIndex((n) => n.id === neu.id) + 1;

                          return (
                            <tr key={neu.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                      neu.unea === "T0"
                                        ? "bg-sky-100 text-sky-800"
                                        : neu.unea === "T1"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    {neu.unea}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-500">
                                    ({sessionIndex}. saioa)
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 font-semibold text-emerald-600">
                                {neu.euskaraz_count}
                              </td>
                              <td className="py-2.5 font-semibold text-rose-600">
                                {neu.erdaraz_count}
                              </td>
                              <td className="py-2.5 font-semibold text-amber-600">
                                {neu.elebi_count}
                              </td>
                              <td className="py-2.5 font-extrabold text-slate-900">
                                %{pct}
                              </td>
                              <td className="py-2.5 text-slate-500 font-medium">
                                {minutes} min
                              </td>
                              <td className="py-2.5 text-slate-600 max-w-[120px] truncate" title={neu.behatzailea}>
                                {neu.behatzailea || "Behatzaile Itsua"}
                              </td>
                              <td className="py-2.5 text-slate-400">
                                {new Date(neu.data_ordu).toLocaleDateString("eu-ES")}
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        `Ziur zaude ${neu.unea} faseko ${sessionIndex}. saio hau ezabatu nahi duzula? Batez bestekoa birkalkulatuko da.`
                                      )
                                    ) {
                                      await deleteNeurketa(neu.id);
                                    }
                                  }}
                                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Ezabatu saio hau"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: No experiment yet */
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Ez duzue esperimentu aktiborik oraindik
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 mb-6">
            Zuen erronkari erantzuteko lehen urratsa katalogoan pilotu bat aukeratu eta hipotesia zehaztea da.
          </p>
          <button
            onClick={() => setActiveTab("katalogoa")}
            className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/30 transition cursor-pointer"
          >
            Aukeratu Pilotu bat Katalogoan →
          </button>
        </div>
      )}
    </div>
  );
}
