"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Save,
  Undo2,
  CheckCircle2,
  Eye,
  AlertCircle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Clock,
  Store,
  Plus,
  X,
  BadgeCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { playCounterClick } from "@/lib/audio";

export default function BehatzaileKontagailua() {
  const {
    activeEragilea,
    esperimentuak,
    neurketak,
    observationConfig,
    setObservationConfig,
    saveNeurketa,
    createQuickPostua,
    refreshData,
    currentUser,
    setCurrentEragileId,
    setActiveTab,
    isOnline,
  } = useApp();

  const [isRefreshingStandList, setIsRefreshingStandList] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshingStandList(true);
    await refreshData();
    setIsRefreshingStandList(false);
  };

  // Find suitable experiment: either configured or active organization's experiment
  const currentExp =
    esperimentuak.find((e) => e.id === observationConfig.expId) ||
    esperimentuak.find((e) => e.eragile_id === activeEragilea?.id) ||
    esperimentuak[0];

  const [phase, setPhase] = useState<"T0" | "T1" | "T2">(
    observationConfig.phase || "T0"
  );

  // Existing sessions in current phase
  const expNeurketak = neurketak.filter((n) => n.esperimentu_id === currentExp?.id);
  const currentPhaseNeurketak = expNeurketak.filter((n) => n.unea === phase);
  const existingPhaseCount = currentPhaseNeurketak.length;

  const phaseTotalEuskaraz = currentPhaseNeurketak.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
  const phaseTotalInteractions = currentPhaseNeurketak.reduce(
    (s, n) => s + (n.euskaraz_count + n.erdaraz_count + n.elebi_count),
    0
  );
  const currentPhaseAvg = phaseTotalInteractions > 0 ? Math.round((phaseTotalEuskaraz / phaseTotalInteractions) * 100) : 0;

  // Configurable Timer State: 5, 10, 15, 20, 30 min, custom minutes or free countup
  const [timerMode, setTimerMode] = useState<"countdown" | "free">("countdown");
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30); // Defaults to 30 min as requested
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800); // 30 minutes in seconds
  const [sessionElapsed, setSessionElapsed] = useState<number>(0);

  const [euskarazCount, setEuskarazCount] = useState<number>(0);
  const [erdarazCount, setErdarazCount] = useState<number>(0);
  const [elebiCount, setElebiCount] = useState<number>(0);
  const [history, setHistory] = useState<Array<"euskaraz" | "erdaraz" | "elebi">>([]);

  // Modal for saving
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [behatzailea, setBehatzailea] = useState<string>("Behatzaile Itsua");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Quick Stand Modal state
  const [showNewStandModal, setShowNewStandModal] = useState<boolean>(false);
  const [newStandName, setNewStandName] = useState<string>("");
  const [newStandManager, setNewStandManager] = useState<string>("");
  const [isCreatingStand, setIsCreatingStand] = useState<boolean>(false);

  // Restore and persist observer name
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bidean_behatzaile_izena");
      if (saved) {
        setBehatzailea(saved);
      } else if (currentUser?.name && !currentUser.name.includes("Admin")) {
        setBehatzailea(currentUser.name);
      }
    } catch {}
  }, [currentUser]);

  const handleBehatzaileaChange = (val: string) => {
    setBehatzailea(val);
    try {
      localStorage.setItem("bidean_behatzaile_izena", val);
    } catch {}
  };

  const handleCreateStandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStandName.trim()) return;

    setIsCreatingStand(true);
    const created = await createQuickPostua({
      izena: newStandName.trim(),
      arduraduna: newStandManager.trim() || undefined,
    });
    setIsCreatingStand(false);

    if (created) {
      setNewStandName("");
      setNewStandManager("");
      setShowNewStandModal(false);
      setPhase("T0");
    }
  };

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync phase with observationConfig
  useEffect(() => {
    if (observationConfig.phase) {
      setPhase(observationConfig.phase);
    }
  }, [observationConfig.phase]);

  // Timer interval
  useEffect(() => {
    if (sessionActive && !isPaused) {
      timerRef.current = setInterval(() => {
        if (timerMode === "countdown") {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              setSessionActive(false);
              setShowSaveModal(true);
              return 0;
            }
            return prev - 1;
          });
        }
        setSessionElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionActive, isPaused, timerMode]);

  // Click handlers
  const handleCount = (type: "euskaraz" | "erdaraz" | "elebi") => {
    if (!sessionActive) {
      setSessionActive(true);
    }

    playCounterClick(type);

    if (type === "euskaraz") setEuskarazCount((c) => c + 1);
    if (type === "erdaraz") setErdarazCount((c) => c + 1);
    if (type === "elebi") setElebiCount((c) => c + 1);

    setHistory((prev) => [...prev, type]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    playCounterClick("undo");
    const last = history[history.length - 1];
    if (last === "euskaraz" && euskarazCount > 0) setEuskarazCount((c) => c - 1);
    if (last === "erdaraz" && erdarazCount > 0) setErdarazCount((c) => c - 1);
    if (last === "elebi" && elebiCount > 0) setElebiCount((c) => c - 1);

    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const handleStartSession = () => {
    setEuskarazCount(0);
    setErdarazCount(0);
    setElebiCount(0);
    setHistory([]);
    setSecondsRemaining(selectedMinutes * 60);
    setSessionElapsed(0);
    setIsPaused(false);
    setSessionActive(true);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleAddFiveMinutes = () => {
    setSecondsRemaining((prev) => prev + 300);
  };

  const handleStopAndSave = () => {
    setIsPaused(true);
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    const expId = currentExp?.id;
    if (!expId) {
      alert("Mesedez, lehenik sortu zentroa eta esperimentua neurketa honi lotzeko!");
      setActiveTab("onboarding");
      return;
    }

    setIsSaving(true);
    const durationToSave =
      timerMode === "countdown"
        ? Math.max(sessionElapsed, 1)
        : Math.max(sessionElapsed, 1);

    const success = await saveNeurketa({
      esperimentu_id: expId,
      unea: phase,
      euskaraz_count: euskarazCount,
      erdaraz_count: erdarazCount,
      elebi_count: elebiCount,
      iraupena_segundotan: durationToSave,
      oharrak: notes,
      behatzailea: behatzailea.trim() || "Behatzaile Itsua",
    });

    setIsSaving(false);
    if (success) {
      setShowSaveModal(false);
      setSessionActive(false);
    }
  };

  // Calculations
  const totalInteractions = euskarazCount + erdarazCount + elebiCount;
  const euskaraPct =
    totalInteractions > 0
      ? Math.round((euskarazCount / totalInteractions) * 100)
      : 0;

  const displayMinutes =
    timerMode === "countdown"
      ? Math.floor(secondsRemaining / 60)
      : Math.floor(sessionElapsed / 60);

  const displaySeconds =
    timerMode === "countdown"
      ? secondsRemaining % 60
      : sessionElapsed % 60;

  const timeFormatted = `${String(displayMinutes).padStart(2, "0")}:${String(displaySeconds).padStart(2, "0")}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Stand & Observer Selector Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg mb-4 border border-slate-700/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Gaurko Neurketaren Saltokia & Behatzailea
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshingStandList}
              className="text-xs font-semibold text-sky-300 hover:text-sky-200 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
              title="Lankideak sortutako saltokiak eguneratu"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingStandList ? "animate-spin" : ""}`} />
              <span>{isRefreshingStandList ? "Eguneratzen..." : "Eguneratu"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewStandModal(true)}
              disabled={sessionActive}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Gehitu Postu Berria</span>
            </button>
          </div>
        </div>

        {esperimentuak.length === 0 ? (
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 text-center">
            <p className="text-xs text-slate-300 mb-3">
              Oraindik ez dago posturik sortuta sisteman. Sortu gaur neurtuko duzuen lehen postua:
            </p>
            <button
              type="button"
              onClick={() => setShowNewStandModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Sortu 1. Postua Orain</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                📍 Zein komertzio / postutan zaude?
              </label>
              <select
                value={currentExp?.id || ""}
                disabled={sessionActive}
                onChange={(e) => {
                  const exp = esperimentuak.find((x) => x.id === e.target.value);
                  if (exp) {
                    setObservationConfig({ expId: exp.id, phase });
                    if (exp.eragile_id) setCurrentEragileId(exp.eragile_id);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer disabled:opacity-50"
              >
                {esperimentuak.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.eragile_izena || "Saltokia"} ({exp.gunea || exp.taldea || "Komertzioa"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                👤 Behatzailearen izena (nor zara?):
              </label>
              <input
                type="text"
                value={behatzailea}
                disabled={sessionActive}
                onChange={(e) => handleBehatzaileaChange(e.target.value)}
                placeholder="Adibidez: Mikel / Ane..."
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:opacity-50 placeholder:text-slate-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Eye className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg">
                Behatzaile Itsua (Kontagailua)
              </h1>
              <p className="text-xs text-slate-500">
                {activeEragilea?.izena || "Zentroa"} • Zuzeneko neurketa itsua
              </p>
            </div>
          </div>

          {/* Phase Badge */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            {(["T0", "T1", "T2"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (!sessionActive) setPhase(p);
                }}
                disabled={sessionActive}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                  phase === p
                    ? p === "T0"
                      ? "bg-sky-600 text-white shadow-xs"
                      : p === "T1"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                } ${sessionActive ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Explanation & Average Status */}
        <div className="space-y-2">
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {phase === "T0" && (
                <strong>T0 (Hasierako argazkia):</strong>
              )}
              {phase === "T1" && (
                <strong>T1 (Berehalako eragina):</strong>
              )}
              {phase === "T2" && (
                <strong>T2 (Ohitura sendotua):</strong>
              )}{" "}
              {phase === "T0" &&
                "Pilotua jarri AURRETIKO hizkuntza-erabilera neurtu. Oinarrizko marra ezartzen du."}
              {phase === "T1" &&
                "Esku-hartzea abian jarri ondorengo lehen neurketa. Berehalako eragina jasotzen du."}
              {phase === "T2" &&
                "14-21 egun igarota egindako neurketa. Portaera berria finkatu den aztertzen du."}
            </span>
          </div>

          {/* Existing Sessions Indicator */}
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              existingPhaseCount > 0
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                : "bg-sky-50/60 border-sky-200 text-sky-950"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{existingPhaseCount > 0 ? "📈" : "🎯"}</span>
              <span>
                {existingPhaseCount > 0 ? (
                  <span>
                    Dagoeneko <strong>{existingPhaseCount} saio</strong> erregistratuta fase honetarako (une honetako batez bestekoa: <strong>%{currentPhaseAvg}</strong>). Saio berri honek batez bestekoa fintzeko balioko du!
                  </span>
                ) : (
                  <span>
                    Fase honetako <strong>1. neurketa saioa</strong> egitera zoaz.
                  </span>
                )}
              </span>
            </div>
            {existingPhaseCount > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
                {existingPhaseCount + 1}. saioa
              </span>
            )}
          </div>
        </div>

        {/* Experiment Target Details */}
        {currentExp && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700 flex items-center justify-between">
            <span className="truncate pr-2">
              📍 Gunea: <strong>{currentExp.gunea}</strong>
            </span>
            <span className="shrink-0 font-semibold text-emerald-700">
              Helburua: +%{currentExp.xede_portzentajea}
            </span>
          </div>
        )}
      </div>

      {/* Duration Selector (Configurable: 5, 10, 15, 20, 30 min, or Free Mode) */}
      {!sessionActive && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Aukeratu Behaketaren Iraupena:</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              Ez behartu: nahi adina luza dezakezu!
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            {[5, 10, 15, 20, 30].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setTimerMode("countdown");
                  setSelectedMinutes(m);
                  setSecondsRemaining(m * 60);
                }}
                className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                  timerMode === "countdown" && selectedMinutes === m
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {m} min
              </button>
            ))}

            {/* Free Mode (Count up) */}
            <button
              type="button"
              onClick={() => {
                setTimerMode("free");
              }}
              className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                timerMode === "free"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-500/20"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="Mugarik gabeko behaketa (kronometroa aurrera doa)"
            >
              ⏱️ Librea
            </button>
          </div>

          {/* Custom Minute Input */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Edo zehaztu eskuz nahi duzun denbora:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="120"
                value={selectedMinutes}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setSelectedMinutes(val);
                  setTimerMode("countdown");
                  setSecondsRemaining(val * 60);
                }}
                className="w-16 px-2 py-1 text-center font-bold text-slate-900 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="font-semibold text-slate-700">minutu</span>
            </div>
          </div>
        </div>
      )}

      {/* Timer & Controls Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Timer className={`w-6 h-6 text-emerald-400 ${sessionActive && !isPaused ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {sessionActive
                ? isPaused
                  ? "Geldituta (Pausa)"
                  : timerMode === "countdown"
                  ? `Atzerako kontua (${selectedMinutes} min)`
                  : "Denbora librea (aurrera)"
                : timerMode === "countdown"
                ? `Hautatutako Iraupena: ${selectedMinutes} min`
                : "Modu Librea (Mugarik gabe)"}
            </div>
            <div className="text-3xl font-mono font-extrabold tracking-wider text-emerald-400">
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-2">
          {!sessionActive ? (
            <button
              onClick={handleStartSession}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/30 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Hasi Sesioa</span>
            </button>
          ) : (
            <>
              {timerMode === "countdown" && (
                <button
                  onClick={handleAddFiveMinutes}
                  className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 font-bold text-[11px] transition cursor-pointer"
                  title="Gehitu 5 minutu saioari"
                >
                  +5 min
                </button>
              )}

              <button
                onClick={handlePauseResume}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title={isPaused ? "Jarraitu" : "Eten"}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={handleStopAndSave}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/30 transition cursor-pointer"
                title="Gelditu eta gorde neurketa"
              >
                <Save className="w-4 h-4" />
                <span>Gorde</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Real-time Counter Stats Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Guztira Jasota
          </span>
          <span className="text-2xl font-black text-slate-900">
            {totalInteractions}{" "}
            <span className="text-xs font-semibold text-slate-400">interakzio</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Euskara %
            </span>
            <span className="text-2xl font-black text-emerald-600">
              %{euskaraPct}
            </span>
          </div>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Desegin azken klikatzea"
          >
            <Undo2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3 GIANT BUTTONS FOR FAST MOBILE THUMB TAPPING */}
      <div className="space-y-4">
        
        {/* 🟢 EUSKARAZ BUTTON */}
        <button
          onClick={() => handleCount("euskaraz")}
          className="w-full h-32 sm:h-36 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-between px-6 sm:px-8 transition active-press cursor-pointer border-2 border-emerald-400/40 relative overflow-hidden group select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl font-black shadow-inner">
              🟢
            </div>
            <div className="text-left">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight block">
                Euskaraz
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                Sakatze bakoitzeko +1
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-4xl sm:text-5xl font-black tracking-tight block">
              {euskarazCount}
            </span>
            <span className="text-xs font-bold text-emerald-100">
              {totalInteractions > 0 ? `${Math.round((euskarazCount / totalInteractions) * 100)}%` : "0%"}
            </span>
          </div>
        </button>

        {/* 🔴 ERDARAZ BUTTON */}
        <button
          onClick={() => handleCount("erdaraz")}
          className="w-full h-28 sm:h-32 rounded-3xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-rose-600/25 flex items-center justify-between px-6 sm:px-8 transition active-press cursor-pointer border-2 border-rose-400/40 relative overflow-hidden group select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl font-black shadow-inner">
              🔴
            </div>
            <div className="text-left">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight block">
                Erdaraz
              </span>
              <span className="text-xs text-rose-100 font-medium">
                Gaztelania / Beste hizkuntza bat
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black tracking-tight block">
              {erdarazCount}
            </span>
            <span className="text-xs font-bold text-rose-100">
              {totalInteractions > 0 ? `${Math.round((erdarazCount / totalInteractions) * 100)}%` : "0%"}
            </span>
          </div>
        </button>

        {/* 🟡 ELEBI BUTTON */}
        <button
          onClick={() => handleCount("elebi")}
          className="w-full h-24 sm:h-28 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-between px-6 sm:px-8 transition active-press cursor-pointer border-2 border-amber-300/60 relative overflow-hidden group select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black/10 backdrop-blur-xs flex items-center justify-center text-xl font-black shadow-inner">
              🟡
            </div>
            <div className="text-left">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight block">
                Elebi (Nahastua)
              </span>
              <span className="text-xs text-amber-950/70 font-medium">
                Euskara eta gaztelania txandakatuta
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black tracking-tight block">
              {elebiCount}
            </span>
            <span className="text-xs font-bold text-amber-950">
              {totalInteractions > 0 ? `${Math.round((elebiCount / totalInteractions) * 100)}%` : "0%"}
            </span>
          </div>
        </button>
      </div>

      {/* Observer Instructions Card */}
      <div className="mt-8 bg-sky-50/70 rounded-2xl p-4 border border-sky-100 text-xs text-slate-600 leading-relaxed">
        <h4 className="font-bold text-sky-900 mb-1 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-sky-600" />
          Behatzailearen Gida Praktikoa:
        </h4>
        <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-700">
          <li>Kokatu espazioan modu naturalean eta diskretoan (arretarik piztu gabe).</li>
          <li>Entzuten duzun elkarrizketa edo agur bakoitzeko sakatu dagokion botoia (+1).</li>
          <li>Amaitutakoan, sakatu <strong>&ldquo;Gorde neurketa&rdquo;</strong> emaitzak erregistratzeko.</li>
        </ul>
      </div>

      {/* SAVE MEASUREMENT MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Gorde {phase} Neurketa ({existingPhaseCount + 1}. saioa)
                </h3>
                <p className="text-xs text-slate-500">
                  {currentExp?.gunea || "Espazioa"} • {activeEragilea?.izena}
                </p>
              </div>
            </div>

            {/* Results Recap */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">🟢 Euskaraz</span>
                <span className="text-xl font-black text-emerald-600">{euskarazCount}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">🔴 Erdaraz</span>
                <span className="text-xl font-black text-rose-600">{erdarazCount}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">🟡 Elebi</span>
                <span className="text-xl font-black text-amber-600">{elebiCount}</span>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 mb-4 text-center">
              <span className="text-xs font-semibold text-emerald-800 block">
                Saio honetako euskara erabilera: <strong>%{euskaraPct}</strong> ({totalInteractions} interakziotatik)
              </span>
              {existingPhaseCount > 0 && (
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  Aurreko {existingPhaseCount} saioekin batera kalkulatuko da {phase} faseko batez besteko orokorra.
                </span>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Behatzailearen Izena / Kodea:
                </label>
                <input
                  type="text"
                  value={behatzailea}
                  onChange={(e) => setBehatzailea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Oharrak (Testuingurua, eguraldia, gertakari bereziak):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adib. Atsedenaldian, jende asko zegoen elkartuta..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {!isOnline && (
              <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl p-3 mb-4 text-xs flex items-center gap-2">
                <span className="text-base">📴</span>
                <span className="leading-snug">
                  Lineaz kanpo zaude. Neurketa gailuan gordeko da seguru, eta internetera konektatzean automatikoki sinkronizatuko da.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Jarraitu Neurtzen
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving
                    ? "Gordetzen..."
                    : isOnline
                    ? "Gorde & Ikusi Panela"
                    : "Gailuan Gorde (Lineaz kanpo)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stand Modal */}
      {showNewStandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Store className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Gehitu Saltokia / Postua
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gaurko neurketarako postu berria
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewStandModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStandSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Saltokiaren edo Postuaren Izena *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Adib: Bretxako 1. postua - Harategia"
                  value={newStandName}
                  onChange={(e) => setNewStandName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Arduradunaren izena (hautazkoa)
                </label>
                <input
                  type="text"
                  placeholder="Adib: Miren / Koldo"
                  value={newStandManager}
                  onChange={(e) => setNewStandManager(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Euskaraz barra-barra txapak</span> pilotua automatikoki lotuko zaio, eta <span className="font-bold">T0 neurketa itsua</span> prest geratuko da.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewStandModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStand || !newStandName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingStand ? "Sortzen..." : "Sortu eta hasi T0 neurtzen →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
