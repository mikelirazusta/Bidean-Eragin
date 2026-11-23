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
  EyeOff,
  Volume2,
  VolumeX,
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
import { useApp, parseBehatzaileak } from "@/context/AppContext";
import { playCounterClick } from "@/lib/audio";
import { wilsonMarjinaPuntu, parseProtokoloa, isDateInProtokoloa } from "@/lib/estatistika";

export default function BehatzaileKontagailua() {
  const {
    activeEragilea,
    eragileak,
    esperimentuak,
    neurketak,
    observationConfig,
    setObservationConfig,
    saveNeurketa,
    createQuickPostua,
    updateEragilea,
    refreshData,
    currentUser,
    setCurrentEragileId,
    setActiveTab,
    isOnline,
    uiTexts,
    showToast,
  } = useApp();

  const isAdmin = currentUser?.role === "admin";
  const [isRefreshingStandList, setIsRefreshingStandList] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [stealthMode, setStealthMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      setSoundEnabled(localStorage.getItem("bidean_sound_enabled") === "true");
    } catch {}
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("bidean_sound_enabled", next ? "true" : "false");
    } catch {}
  };

  const handleManualRefresh = async () => {
    setIsRefreshingStandList(true);
    await refreshData();
    setIsRefreshingStandList(false);
  };

  // Strict privacy: non-admin users ONLY see and measure their own center's experiments
  const availableEsperimentuak = isAdmin
    ? esperimentuak
    : activeEragilea?.id
    ? esperimentuak.filter((e) => e.eragile_id === activeEragilea.id)
    : [];

  const currentExp =
    availableEsperimentuak.find((e) => e.id === observationConfig.expId) ||
    availableEsperimentuak.find((e) => e.eragile_id === activeEragilea?.id) ||
    availableEsperimentuak[0];

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
  const [aldaketaCount, setAldaketaCount] = useState<number>(0);
  const [erdarazCount, setErdarazCount] = useState<number>(0);
  const [elebiCount, setElebiCount] = useState<number>(0);
  const [history, setHistory] = useState<Array<"euskaraz" | "aldaketa" | "erdaraz" | "elebi">>([]);
  const isAldaketaTemplate = currentExp?.kontagailu_txantiloia === "aldaketa";

  // Modal for saving
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [behatzailea, setBehatzailea] = useState<string>("");
  const [hasieraOrdu, setHasieraOrdu] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showAddObserver, setShowAddObserver] = useState<boolean>(false);
  const [newObserverName, setNewObserverName] = useState<string>("");
  const [isAddingObserver, setIsAddingObserver] = useState<boolean>(false);

  // Manual (paper / delayed) entry modal state
  const [showPaperModal, setShowPaperModal] = useState<boolean>(false);
  const [paperDate, setPaperDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paperStartTime, setPaperStartTime] = useState<string>("11:00");
  const [paperEndTime, setPaperEndTime] = useState<string>("11:30");
  const [paperEuskaraz, setPaperEuskaraz] = useState<number>(0);
  const [paperErdaraz, setPaperErdaraz] = useState<number>(0);
  const [paperElebi, setPaperElebi] = useState<number>(0);
  const [paperNotes, setPaperNotes] = useState<string>("");
  const [isSavingPaper, setIsSavingPaper] = useState<boolean>(false);

  const currentEragileForExp =
    eragileak.find((e) => e.id === currentExp?.eragile_id) || activeEragilea;

  const behatzaileZerrenda = React.useMemo(() => {
    const fromEntity = parseBehatzaileak(currentEragileForExp?.behatzaileak_json);
    const fromHistory = expNeurketak
      .map((n) => String(n.behatzailea || "").trim())
      .filter((s) => s.length > 0 && s !== "Behatzailea" && s !== "Behatzaile Itsua");
    return Array.from(new Set([...fromEntity, ...fromHistory]));
  }, [currentEragileForExp?.behatzaileak_json, expNeurketak]);

  const handleAddObserver = async () => {
    const trimmed = newObserverName.trim();
    if (!trimmed || trimmed === "Behatzailea" || trimmed === "Behatzaile Itsua") return;
    setIsAddingObserver(true);
    const nextList = Array.from(new Set([...behatzaileZerrenda, trimmed]));
    if (currentEragileForExp) {
      await updateEragilea({
        id: currentEragileForExp.id,
        behatzaileak: nextList,
      });
    }
    handleBehatzaileaChange(trimmed);
    setNewObserverName("");
    setShowAddObserver(false);
    setIsAddingObserver(false);
  };

  // Quick Stand Modal state
  const [showNewStandModal, setShowNewStandModal] = useState<boolean>(false);
  const [newStandName, setNewStandName] = useState<string>("");
  const [newStandManager, setNewStandManager] = useState<string>("");
  const [newStandGunea, setNewStandGunea] = useState<string>("Harrera eta arreta-gunea");
  const [newStandTargetPct, setNewStandTargetPct] = useState<number>(25);
  const [newStandHipotesia, setNewStandHipotesia] = useState<string>(
    "Langileek 'Euskaraz barra-barra' txapa bistan eramanda, harrera-gunean euskararen erabilera 25 puntu igoko da (adib. %30etik %55era)."
  );
  const [isCreatingStand, setIsCreatingStand] = useState<boolean>(false);

  // Restore and persist observer name (never default to "Behatzailea")
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bidean_behatzaile_izena");
      if (saved && saved !== "Behatzaile Itsua" && saved !== "Behatzailea") {
        setBehatzailea(saved);
      } else {
        setBehatzailea("");
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
      gunea: newStandGunea.trim() || undefined,
      hipotesia: newStandHipotesia.trim() || undefined,
      xede_portzentajea: newStandTargetPct,
    });
    setIsCreatingStand(false);

    if (created) {
      setNewStandName("");
      setNewStandManager("");
      setShowNewStandModal(false);
      setPhase("T0");
    }
  };

  // Timer reference & Screen Wake Lock reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  const ACTIVE_SESSION_STORAGE_KEY = "bidean_active_session_v2";

  // Restore in-progress session from localStorage if page was refreshed mid-measurement
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const totalSaved =
          (parsed.euskarazCount || 0) +
          (parsed.aldaketaCount || 0) +
          (parsed.erdarazCount || 0) +
          (parsed.elebiCount || 0);
        if (totalSaved > 0 || parsed.sessionActive) {
          setEuskarazCount(parsed.euskarazCount || 0);
          setAldaketaCount(parsed.aldaketaCount || 0);
          setErdarazCount(parsed.erdarazCount || 0);
          setElebiCount(parsed.elebiCount || 0);
          if (Array.isArray(parsed.history)) setHistory(parsed.history);
          if (parsed.phase) setPhase(parsed.phase);
          if (parsed.timerMode) setTimerMode(parsed.timerMode);
          if (parsed.selectedMinutes) setSelectedMinutes(parsed.selectedMinutes);
          if (typeof parsed.secondsRemaining === "number")
            setSecondsRemaining(parsed.secondsRemaining);
          if (typeof parsed.sessionElapsed === "number")
            setSessionElapsed(parsed.sessionElapsed);
          if (typeof parsed.notes === "string" && parsed.notes)
            setNotes(parsed.notes);
          if (typeof parsed.hasieraOrdu === "string" && parsed.hasieraOrdu)
            setHasieraOrdu(parsed.hasieraOrdu);
          if (parsed.sessionActive) {
            setSessionActive(true);
            setIsPaused(true); // Pause on restore so observer can resume consciously
          }
        }
      }
    } catch {}
  }, []);

  // Save active session state to localStorage
  useEffect(() => {
    try {
      const total = euskarazCount + aldaketaCount + erdarazCount + elebiCount;
      if (sessionActive || total > 0) {
        localStorage.setItem(
          ACTIVE_SESSION_STORAGE_KEY,
          JSON.stringify({
            expId: currentExp?.id,
            phase,
            euskarazCount,
            aldaketaCount,
            erdarazCount,
            elebiCount,
            history,
            timerMode,
            selectedMinutes,
            secondsRemaining,
            sessionElapsed,
            sessionActive,
            notes,
            hasieraOrdu,
            updatedAt: Date.now(),
          })
        );
      } else {
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      }
    } catch {}
  }, [
    currentExp?.id,
    phase,
    euskarazCount,
    erdarazCount,
    elebiCount,
    history,
    timerMode,
    selectedMinutes,
    secondsRemaining,
    sessionElapsed,
    sessionActive,
    notes,
    hasieraOrdu,
  ]);

  // Screen Wake Lock (prevent mobile screen from sleeping during active observation)
  useEffect(() => {
    const requestWakeLock = async () => {
      if (
        typeof navigator !== "undefined" &&
        "wakeLock" in navigator &&
        sessionActive &&
        !isPaused
      ) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          setWakeLockActive(true);
          wakeLockRef.current.addEventListener("release", () => {
            setWakeLockActive(false);
          });
        } catch {
          setWakeLockActive(false);
        }
      } else {
        if (wakeLockRef.current) {
          try {
            await wakeLockRef.current.release();
          } catch {}
          wakeLockRef.current = null;
        }
        setWakeLockActive(false);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
        wakeLockRef.current = null;
      }
    };
  }, [sessionActive, isPaused]);

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
  const handleCount = (type: "euskaraz" | "aldaketa" | "erdaraz" | "elebi") => {
    if (!behatzailea.trim()) {
      showToast("Aukeratu edo gehitu behatzaile bat saioa hasi aurretik.", "error");
      return;
    }
    if (!sessionActive) {
      setHasieraOrdu(new Date().toISOString());
      setSessionActive(true);
      setIsPaused(false);
    } else if (isPaused) {
      setIsPaused(false);
    }

    playCounterClick(type === "aldaketa" ? "euskaraz" : type, { soundEnabled });

    if (type === "euskaraz") setEuskarazCount((c) => c + 1);
    if (type === "aldaketa") setAldaketaCount((c) => c + 1);
    if (type === "erdaraz") setErdarazCount((c) => c + 1);
    if (type === "elebi") setElebiCount((c) => c + 1);

    setHistory((prev) => [...prev, type]);
  };

  // Hardware Volume / Keyboard shortcut support for discreet counting
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showSaveModal || showNewStandModal) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "AudioVolumeUp" || e.key === "VolumeUp" || e.key === "ArrowUp" || e.key === "1") {
        e.preventDefault();
        handleCount("euskaraz");
      } else if (e.key === "AudioVolumeDown" || e.key === "VolumeDown" || e.key === "ArrowDown" || e.key === "2") {
        e.preventDefault();
        handleCount("erdaraz");
      } else if (e.key === "ArrowRight" || e.key === "3") {
        e.preventDefault();
        handleCount("elebi");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleDecrement = (
    e: React.MouseEvent,
    type: "euskaraz" | "aldaketa" | "erdaraz" | "elebi"
  ) => {
    e.stopPropagation();
    playCounterClick("undo", { soundEnabled });
    if (type === "euskaraz" && euskarazCount > 0) setEuskarazCount((c) => c - 1);
    if (type === "aldaketa" && aldaketaCount > 0) setAldaketaCount((c) => c - 1);
    if (type === "erdaraz" && erdarazCount > 0) setErdarazCount((c) => c - 1);
    if (type === "elebi" && elebiCount > 0) setElebiCount((c) => c - 1);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    playCounterClick("undo", { soundEnabled });
    const last = history[history.length - 1];
    if (last === "euskaraz" && euskarazCount > 0) setEuskarazCount((c) => c - 1);
    if (last === "aldaketa" && aldaketaCount > 0) setAldaketaCount((c) => c - 1);
    if (last === "erdaraz" && erdarazCount > 0) setErdarazCount((c) => c - 1);
    if (last === "elebi" && elebiCount > 0) setElebiCount((c) => c - 1);

    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const handleResetSession = () => {
    if (
      euskarazCount + aldaketaCount + erdarazCount + elebiCount > 0 &&
      !window.confirm("Ziur zaude uneko kontagailua 0ra berrabiarazi nahi duzula?")
    ) {
      return;
    }
    setEuskarazCount(0);
    setAldaketaCount(0);
    setErdarazCount(0);
    setElebiCount(0);
    setHistory([]);
    setSecondsRemaining(selectedMinutes * 60);
    setSessionElapsed(0);
    setIsPaused(false);
    setSessionActive(false);
    setHasieraOrdu(null);
    try {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch {}
  };

  const handleStartSession = () => {
    if (!behatzailea.trim()) {
      showToast("Aukeratu edo gehitu behatzaile bat saioa hasi aurretik.", "error");
      return;
    }
    setEuskarazCount(0);
    setAldaketaCount(0);
    setErdarazCount(0);
    setElebiCount(0);
    setHistory([]);
    setSecondsRemaining(selectedMinutes * 60);
    setSessionElapsed(0);
    setIsPaused(false);
    setHasieraOrdu(new Date().toISOString());
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
      alert("Mesedez, lehenik sortu zure esperimentua neurketa honi lotzeko!");
      setActiveTab("katalogoa");
      return;
    }

    if (!behatzailea.trim()) {
      showToast("Behatzailea aukeratu behar da neurketa gordetzeko.", "error");
      return;
    }

    setIsSaving(true);
    const amaieraOrduNow = new Date().toISOString();
    const durationToSave = Math.max(sessionElapsed, 1);

    const success = await saveNeurketa({
      esperimentu_id: expId,
      unea: phase,
      euskaraz_count: euskarazCount,
      aldaketa_count: aldaketaCount,
      erdaraz_count: erdarazCount,
      elebi_count: elebiCount,
      iraupena_segundotan: durationToSave,
      oharrak: notes,
      behatzailea: behatzailea.trim(),
      hasiera_ordu: hasieraOrdu || amaieraOrduNow,
      amaiera_ordu: amaieraOrduNow,
      atzeratua: 0,
    });

    setIsSaving(false);
    if (success) {
      try {
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      } catch {}
      setEuskarazCount(0);
      setAldaketaCount(0);
      setErdarazCount(0);
      setElebiCount(0);
      setHistory([]);
      setNotes("");
      setHasieraOrdu(null);
      setShowSaveModal(false);
      setSessionActive(false);
    }
  };

  const handleSavePaperEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const expId = currentExp?.id;
    if (!expId) {
      showToast("Lehenik sortu esperimentu bat.", "error");
      return;
    }
    if (!behatzailea.trim()) {
      showToast("Aukeratu edo gehitu behatzaile bat lehenik.", "error");
      return;
    }
    if (paperEuskaraz + paperErdaraz + paperElebi <= 0) {
      showToast("Sartu gutxienez elkarrizketa bat.", "error");
      return;
    }
    const startDt = new Date(`${paperDate}T${paperStartTime}:00`);
    const endDt = new Date(`${paperDate}T${paperEndTime}:00`);
    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
      showToast("Data eta orduak zuzenak izan behar dira.", "error");
      return;
    }
    const durationSec = Math.max(60, Math.round((endDt.getTime() - startDt.getTime()) / 1000));

    setIsSavingPaper(true);
    const success = await saveNeurketa({
      esperimentu_id: expId,
      unea: phase,
      euskaraz_count: paperEuskaraz,
      erdaraz_count: paperErdaraz,
      elebi_count: paperElebi,
      iraupena_segundotan: durationSec,
      oharrak: paperNotes.trim(),
      behatzailea: behatzailea.trim(),
      hasiera_ordu: startDt.toISOString(),
      amaiera_ordu: endDt.toISOString(),
      atzeratua: 1,
    });
    setIsSavingPaper(false);
    if (success) {
      setPaperEuskaraz(0);
      setPaperErdaraz(0);
      setPaperElebi(0);
      setPaperNotes("");
      setShowPaperModal(false);
    }
  };

  // Calculations (aldaketaCount euskarazkoen artean zenbatzen da zenbakitzailean eta izendatzailean)
  const totalEuskarazSession = euskarazCount + aldaketaCount;
  const totalInteractions = totalEuskarazSession + erdarazCount + elebiCount;
  const euskaraPct =
    totalInteractions > 0
      ? Math.round((totalEuskarazSession / totalInteractions) * 100)
      : 0;
  const nGutxienekoa = currentExp?.n_gutxienekoa || 20;
  const currentMarjinaPuntu =
    totalInteractions > 0
      ? Math.round(wilsonMarjinaPuntu(totalEuskarazSession, totalInteractions))
      : null;
  const expProtokoloa = parseProtokoloa(currentExp?.protokoloa_json);
  const isOutOfProtocolNow = expProtokoloa ? !isDateInProtokoloa(new Date(), expProtokoloa) : false;

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
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg mb-4 border border-slate-700/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-700/60">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {isAdmin ? "Gaurko neurketaren entitatea eta behatzailea" : "Zure entitateko neurketa-gunea"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                soundEnabled
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  : "bg-slate-800 text-slate-300 border border-slate-700"
              }`}
              title="Soinua aktibatu edo isilarazi (bibrazioa beti aktibo)"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? "Soinua ON" : "Isila (bibrazioa)"}</span>
            </button>

            {/* Stealth / Camouflage Mode Toggle */}
            <button
              type="button"
              onClick={() => setStealthMode(!stealthMode)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                stealthMode
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:bg-slate-700"
              }`}
              title="Modu diskretua: pantaila ilundu eta kolore deigarriak ezkutatu inork ez nabaritzeko"
            >
              {stealthMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{stealthMode ? "Modu diskretua ON" : "  Modu diskretua"}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshingStandList}
                  className="text-xs font-semibold text-sky-300 hover:text-sky-200 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
                  title="Lankideak sortutako entitateak eguneratu"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingStandList ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewStandModal(true)}
                  disabled={sessionActive}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Entitate berria</span>
                </button>
              </>
            )}
          </div>
        </div>

        {availableEsperimentuak.length === 0 ? (
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 text-center">
            <p className="text-xs text-slate-300 mb-3">
              Oraindik ez dago esperimenturik aktibo. Sortu zure hipotesia neurketak hasteko:
            </p>
            <button
              type="button"
              onClick={() => (isAdmin ? setShowNewStandModal(true) : setActiveTab("katalogoa"))}
              className="px-4 py-2 bg-emerald-500 hover:bg-euskara text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdmin ? "+ Sortu 1. entitatea orain" : "Aukeratu pilotua eta hipotesia"}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                 {isAdmin ? "Zein entitatetan zaude?" : "Zure entitatea eta behaketa-gunea:"}
              </label>
              {isAdmin ? (
                <select
                  value={currentExp?.id || ""}
                  disabled={sessionActive}
                  onChange={(e) => {
                    const exp = availableEsperimentuak.find((x) => x.id === e.target.value);
                    if (exp) {
                      setObservationConfig({ expId: exp.id, phase });
                      if (exp.eragile_id) setCurrentEragileId(exp.eragile_id);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-euskara/40 focus:outline-hidden cursor-pointer disabled:opacity-50"
                >
                  {availableEsperimentuak.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.eragile_izena || "Entitatea"} ({exp.gunea || exp.taldea || "Gunea"})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-slate-800/90 border border-slate-700 text-emerald-300 rounded-xl px-3 py-2 text-xs font-bold truncate">
                  {activeEragilea?.izena || "Zure entitatea"} • {currentExp?.gunea || "Harrera"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Behatzailea (nor ari da neurtzen?) *:
              </label>
              {!showAddObserver ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={behatzailea}
                    disabled={sessionActive}
                    onChange={(e) => {
                      if (e.target.value === "__ADD__") {
                        setShowAddObserver(true);
                      } else {
                        handleBehatzaileaChange(e.target.value);
                      }
                    }}
                    className={`w-full bg-slate-800 border text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-euskara/40 focus:outline-hidden cursor-pointer disabled:opacity-50 ${
                      !behatzailea.trim() ? "border-amber-400" : "border-slate-600"
                    }`}
                  >
                    <option value="">— Aukeratu behatzailea —</option>
                    {behatzaileZerrenda.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    {behatzailea && !behatzaileZerrenda.includes(behatzailea) && (
                      <option value={behatzailea}>{behatzailea}</option>
                    )}
                    <option value="__ADD__">+ Gehitu behatzailea</option>
                  </select>
                  <button
                    type="button"
                    disabled={sessionActive}
                    onClick={() => setShowAddObserver(true)}
                    className="px-2.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                    title="Gehitu behatzaile berria"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newObserverName}
                    onChange={(e) => setNewObserverName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddObserver();
                      }
                    }}
                    placeholder="Izena (adib. Ane)"
                    autoFocus
                    className="w-full bg-slate-800 border border-emerald-400 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    disabled={isAddingObserver || !newObserverName.trim()}
                    onClick={handleAddObserver}
                    className="px-2.5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Gorde
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddObserver(false);
                      setNewObserverName("");
                    }}
                    className="p-2 rounded-xl bg-slate-700 text-slate-300 text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {!behatzailea.trim() && (
                <p className="text-[10px] text-amber-300 mt-1">
                  Aukeratu edo gehitu behatzailea saioa hasi aurretik.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top Header Card */}
      <div className="civic-card p-5 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sand border border-line text-euskara flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-editorial font-semibold text-ink text-xl sm:text-2xl">
                {uiTexts.counter_title || "Elkarrizketen kontagailua"}
              </h1>
              <p className="text-xs text-ink-muted">
                {activeEragilea?.izena || "Zure entitatea"} • {uiTexts.counter_subtitle || "Zuzeneko behaketa-saioa"}
              </p>
            </div>
          </div>

          {/* Phase Badge */}
          <div className="flex items-center bg-sand rounded-xl p-1 border border-line">
            {(["T0", "T1", "T2"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (!sessionActive) setPhase(p);
                }}
                disabled={sessionActive}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  phase === p
                    ? p === "T0"
                      ? "bg-sea text-white"
                      : p === "T1"
                      ? "bg-ochre text-white"
                      : "bg-euskara text-white"
                    : "text-ink-muted hover:text-ink"
                } ${sessionActive ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Explanation & Average Status */}
        <div className="space-y-2">
          <div className="text-xs text-ink-muted bg-paper p-2.5 rounded-xl border border-line flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
            <span>
              {phase === "T0" && (
                <strong className="text-ink">T0 (hasierako argazkia):</strong>
              )}
              {phase === "T1" && (
                <strong className="text-ink">T1 (lehen eragina):</strong>
              )}
              {phase === "T2" && (
                <strong className="text-ink">
                  {currentExp?.t2_mota === "kentzea"
                    ? "T2 (esku-hartzea kentzea — ABA):"
                    : "T2 (jarraipena):"}
                </strong>
              )}{" "}
              {phase === "T0" &&
                (uiTexts.counter_t0_desc ||
                  "Pilotua martxan jarri aurretik euskaraz zenbat hitz egiten den neurtzen du, abiapuntua ezagutzeko.")}
              {phase === "T1" &&
                (uiTexts.counter_t1_desc ||
                  "Pilotua martxan jarri berritan egindako neurketa, lehen eragina ikusteko.")}
              {phase === "T2" &&
                (currentExp?.t2_mota === "kentzea"
                  ? uiTexts.counter_t2_kentzea_desc ||
                    "Kendu esku-hartzea (adib. txapak) eta neurtu egun eta ordu berean."
                  : uiTexts.counter_t2_desc ||
                    "Handik 2-3 astera egindako neurketa, ohitura berria egonkortu den ikusteko.")}
            </span>
          </div>

          {/* Existing Sessions Indicator */}
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              existingPhaseCount > 0
                ? "bg-euskara/5 border-euskara/25 text-ink"
                : "bg-sand/70 border-line text-ink"
            }`}
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-4 h-4 text-euskara shrink-0" />
              <span>
                {existingPhaseCount > 0 ? (
                  <span>
                    Dagoeneko <strong className="tabular-nums">{existingPhaseCount} saio</strong> jaso dira fase honetan (faseko emaitza: <strong className="tabular-nums">%{currentPhaseAvg}</strong>). Saio berri honek faseko emaitza osatuko du.
                  </span>
                ) : (
                  <span>
                    Fase honetako <strong>1. behaketa-saioa</strong> egitera zoaz.
                  </span>
                )}
              </span>
            </div>
            {existingPhaseCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-euskara/15 text-euskara shrink-0 tabular-nums">
                {existingPhaseCount + 1}. saioa
              </span>
            )}
          </div>
        </div>

        {/* Experiment Target Details */}
        {currentExp && (
          <div className="mt-3 pt-3 border-t border-line text-xs text-ink-muted flex items-center justify-between">
            <span className="truncate pr-2">
              Gunea: <strong className="text-ink">{currentExp.gunea}</strong>
            </span>
            <span className="shrink-0 font-bold text-euskara tabular-nums">
              Xedea: +{currentExp.xede_portzentajea} puntu
            </span>
          </div>
        )}
      </div>

      {/* Duration Selector (Configurable: 5, 10, 15, 20, 30 min, or Free Mode) */}
      {!sessionActive && (
        <div className="civic-card p-5 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-euskara" />
              <span>Aukeratu behaketaren iraupena:</span>
            </label>
            <span className="text-[11px] text-ink-muted font-medium">
              Nahi beste denboraz neur dezakezu
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
                className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition cursor-pointer tabular-nums ${
                  timerMode === "countdown" && selectedMinutes === m
                    ? "bg-sea text-white border-sea"
                    : "bg-paper border-line text-ink hover:bg-sand"
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
                  ? "bg-sea text-white border-sea"
                  : "bg-paper border-line text-ink hover:bg-sand"
              }`}
              title="Mugarik gabeko behaketa (kronometroa aurrera doa)"
            >
              Librea
            </button>
          </div>

          {/* Custom Minute Input */}
          <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-ink-muted">
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
                className="w-16 px-2 py-1 text-center font-bold text-ink border border-line bg-paper rounded-lg text-xs focus:ring-2 focus:ring-sea focus:outline-hidden tabular-nums"
              />
              <span className="font-semibold text-ink">minutu</span>
            </div>
          </div>
        </div>
      )}

      {/* Timer & Controls Bar */}
      <div className="bg-sea text-white rounded-2xl p-5 mb-5 flex items-center justify-between border border-sea">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Timer className={`w-6 h-6 text-emerald-400 ${sessionActive && !isPaused ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-2">
              <span>
                {sessionActive
                  ? isPaused
                    ? "Etenda"
                    : timerMode === "countdown"
                    ? `Atzerako kontua (${selectedMinutes} min)`
                    : "Denbora librea (aurrera)"
                  : timerMode === "countdown"
                  ? `Hautatutako iraupena: ${selectedMinutes} min`
                  : "Modu librea (mugarik gabe)"}
              </span>
              {wakeLockActive && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                   Pantaila esna
                </span>
              )}
            </div>
            <div className="text-3xl font-mono font-extrabold tracking-wider text-emerald-400 tabular-nums">
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-2">
          {!sessionActive ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPaperModal(true)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer"
                title="Sartu paperean jasotako neurketa eskuz"
              >
                Paperean neurtu dut
              </button>
              <button
                onClick={handleStartSession}
                disabled={!behatzailea.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-euskara text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Hasi saioa</span>
              </button>
            </div>
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
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-euskara text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/30 transition cursor-pointer"
                title="Amaitu eta gorde neurketa"
              >
                <Save className="w-4 h-4" />
                <span>Gorde</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Out-of-protocol notice */}
      {isOutOfProtocolNow && (
        <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-300 px-4 py-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Gaur ez da protokoloko eguna/ordua. Saioa gordeko da, baina ez da semaforoan zenbatuko.
          </span>
        </div>
      )}

      {/* Real-time Counter Stats Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-line mb-5 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Jasotako elkarrizketak
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-ink tabular-nums">
              {totalInteractions}{" "}
              <span className="text-xs font-semibold text-ink-muted">
                elkarrizketa{currentMarjinaPuntu !== null ? ` · ±${currentMarjinaPuntu} puntu` : ""}
              </span>
            </span>
            {totalInteractions >= nGutxienekoa && (
              <span className="px-2 py-0.5 rounded-full bg-euskara/15 text-euskara border border-euskara/30 text-[10px] font-bold">
                Lagin nahikoa
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-euskara uppercase tracking-wider block">
              Euskara %
            </span>
            <span className="text-2xl font-black text-euskara tabular-nums">
              %{euskaraPct}
            </span>
          </div>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2.5 rounded-xl border border-line bg-paper hover:bg-sand text-ink-muted disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Desegin azken klikatzea"
          >
            <Undo2 className="w-5 h-5" />
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetSession}
            disabled={totalInteractions === 0 && !sessionActive}
            className="p-2.5 rounded-xl border border-line bg-paper hover:bg-terracotta/10 hover:text-terracotta hover:border-terracotta/25 text-ink-muted disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Kontagailua 0ra berrabiarazi"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* STEALTH CAMOUFLAGE MODE vs STANDARD 3 GIANT BUTTONS */}
      {stealthMode ? (
        <div className="bg-slate-950 text-ink-muted rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3 select-none">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <EyeOff className="w-4 h-4 text-ink-muted" />
              <span className="text-xs font-bold text-ink-muted">
                Ohar-bloka / zerrenda (modu ezkutua)
              </span>
            </div>
            <span className="text-[11px] font-mono text-ink-muted">
              #{totalInteractions} ({euskarazCount}·{erdarazCount}·{elebiCount})
            </span>
          </div>

          <p className="text-[11px] text-ink-muted leading-relaxed">
            Pantaila ilunduta dago ingurukoek ez nabaritzeko. Sakatu eremu bakoitza begiratu gabe (bibrazio ezberdina du bakoitzak) edo erabili bolumen/gezi teklak:
          </p>

          {/* Zone A: Euskaraz (top half, 1 vibration) */}
          <div
            onClick={() => handleCount("euskaraz")}
            role="button"
            tabIndex={0}
            className="w-full h-36 rounded-2xl bg-slate-900/90 hover:bg-slate-900 active:bg-slate-800 border border-slate-800 flex items-center justify-between px-6 cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-bold text-slate-300 block">
                1. eremua — A aukera
              </span>
              <span className="text-[11px] text-ink-muted">
                Bibrazio 1 (sendoa) • Bolumena + / ↑
              </span>
            </div>
            <div className="flex items-center gap-3">
              {euskarazCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleDecrement(e, "euskaraz")}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-ink-muted text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  -1
                </button>
              )}
              <span className="text-2xl font-mono font-bold text-ink-muted">
                {euskarazCount}
              </span>
            </div>
          </div>

          {/* Zone B: Erdaraz (middle, 2 vibrations) */}
          <div
            onClick={() => handleCount("erdaraz")}
            role="button"
            tabIndex={0}
            className="w-full h-32 rounded-2xl bg-slate-900/90 hover:bg-slate-900 active:bg-slate-800 border border-slate-800 flex items-center justify-between px-6 cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-bold text-slate-300 block">
                2. eremua — B aukera
              </span>
              <span className="text-[11px] text-ink-muted">
                2 bibrazio labur • Bolumena - / ↓
              </span>
            </div>
            <div className="flex items-center gap-3">
              {erdarazCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleDecrement(e, "erdaraz")}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-ink-muted text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  -1
                </button>
              )}
              <span className="text-2xl font-mono font-bold text-ink-muted">
                {erdarazCount}
              </span>
            </div>
          </div>

          {/* Zone C: Elebi (bottom, 3 vibrations) */}
          <div
            onClick={() => handleCount("elebi")}
            role="button"
            tabIndex={0}
            className="w-full h-24 rounded-2xl bg-slate-900/90 hover:bg-slate-900 active:bg-slate-800 border border-slate-800 flex items-center justify-between px-6 cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-bold text-slate-300 block">
                3. eremua — C aukera
              </span>
              <span className="text-[11px] text-ink-muted">
                3 bibrazio labur • → tekla
              </span>
            </div>
            <div className="flex items-center gap-3">
              {elebiCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleDecrement(e, "elebi")}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-ink-muted text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  -1
                </button>
              )}
              <span className="text-2xl font-mono font-bold text-ink-muted">
                {elebiCount}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          
          {/* EUSKARAZ + (AUKERAKO) ALDAKETA BUTTON */}
          <div className={isAldaketaTemplate ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
          <div
            onClick={() => handleCount("euskaraz")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleCount("euskaraz");
            }}
            className="w-full h-32 sm:h-36 rounded-2xl bg-euskara hover:opacity-95 text-white border border-euskara border-b-4 border-b-[#073D2B] active:border-b active:translate-y-0.5 flex items-center justify-between px-6 sm:px-8 transition active-press cursor-pointer relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-euskara focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-black/15 border border-white/15 flex items-center justify-center shrink-0">
                <span className="w-4 h-4 rounded-full bg-emerald-200 block" />
              </div>
              <div className="text-left">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight block">
                  {uiTexts.counter_btn_euskaraz || "Euskaraz"}
                </span>
                <span className="text-xs text-white/80 font-medium">
                  Sakatze bakoitzeko +1 (bibrazio 1)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {euskarazCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleDecrement(e, "euskaraz")}
                  className="px-2.5 py-1.5 rounded-lg bg-black/25 hover:bg-black/40 text-white font-bold text-xs border border-white/15 transition cursor-pointer"
                  title="Kendu 1 euskarazko zenbaketatik"
                >
                  -1
                </button>
              )}
              <div className="text-right tabular-nums">
                <span className="text-4xl sm:text-5xl font-black tracking-tight block">
                  {euskarazCount}
                </span>
                <span className="text-xs font-bold text-white/85">
                  {totalInteractions > 0 ? `${Math.round((euskarazCount / totalInteractions) * 100)}%` : "0%"}
                </span>
              </div>
            </div>
          </div>

          {isAldaketaTemplate && (
            <div
              onClick={() => handleCount("aldaketa")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleCount("aldaketa");
              }}
              className="w-full h-32 sm:h-36 rounded-2xl bg-teal-700 hover:opacity-95 text-white border border-teal-800 border-b-4 border-b-teal-950 active:border-b active:translate-y-0.5 flex items-center justify-between px-5 sm:px-6 transition active-press cursor-pointer relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              <div className="text-left pr-2">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight block leading-snug">
                  {uiTexts.counter_btn_aldaketa || "Erdaraz hasi → euskaraz amaitu"}
                </span>
                <span className="text-[11px] text-white/80 font-medium block mt-0.5">
                  Euskarazkoen artean zenbatzen da
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {aldaketaCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => handleDecrement(e, "aldaketa")}
                    className="px-2 py-1.5 rounded-lg bg-black/25 hover:bg-black/40 text-white font-bold text-xs border border-white/15 transition cursor-pointer"
                    title="Kendu 1"
                  >
                    -1
                  </button>
                )}
                <div className="text-right tabular-nums">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight block">
                    {aldaketaCount}
                  </span>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* ERDARAZ BUTTON */}
          <div
            onClick={() => handleCount("erdaraz")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleCount("erdaraz");
            }}
            className="w-full h-28 sm:h-32 rounded-2xl bg-terracotta hover:opacity-95 text-white border border-terracotta border-b-4 border-b-[#8A2E1B] active:border-b active:translate-y-0.5 flex items-center justify-between px-6 sm:px-8 transition active-press cursor-pointer relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-black/15 border border-white/15 flex items-center justify-center shrink-0">
                <span className="w-3.5 h-3.5 rounded-sm bg-orange-100 block" />
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight block">
                  {uiTexts.counter_btn_erdaraz || "Erdaraz"}
                </span>
                <span className="text-xs text-white/80 font-medium">
                  Gaztelania / beste bat (2 bibrazio)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {erdarazCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleDecrement(e, "erdaraz")}
                  className="px-2.5 py-1.5 rounded-lg bg-black/25 hover:bg-black/40 text-white font-bold text-xs border border-white/15 transition cursor-pointer"
                  title="Kendu 1 erdarazko zenbaketatik"
                >
                  -1
                </button>
              )}
              <div className="text-right tabular-nums">
                <span className="text-3xl sm:text-4xl font-black tracking-tight block">
                  {erdarazCount}
                </span>
                <span className="text-xs font-bold text-white/85">
                  {totalInteractions > 0 ? `${Math.round((erdarazCount / totalInteractions) * 100)}%` : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* ELEBI BUTTON */}
          <div
            onClick={() => handleCount("elebi")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleCount("elebi");
            }}
            className="w-full h-24 sm:h-28 rounded-2xl bg-[#E8A838] hover:bg-[#DF9E2C] text-ink border border-[#C98A1C] border-b-4 border-b-[#99650D] active:border-b active:translate-y-0.5 flex items-center justify-between px-6 sm:px-8 transition active-press cursor-pointer relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/40 border border-amber-600/30 flex items-center justify-center shrink-0">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-900/80 block" />
              </div>
              <div className="text-left">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight block">
                  {uiTexts.counter_btn_elebi || "Elebi (bi hizkuntzatan)"}
                </span>
                <span className="text-xs text-amber-950/80 font-medium">
                  Euskara eta erdara txandakatuta (3 bibrazio)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {elebiCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleDecrement(e, "elebi")}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-slate-950 font-bold text-xs border border-amber-700/30 transition cursor-pointer"
                  title="Kendu 1 elebiko zenbaketatik"
                >
                  -1
                </button>
              )}
              <div className="text-right tabular-nums">
                <span className="text-3xl sm:text-4xl font-black tracking-tight block">
                  {elebiCount}
                </span>
                <span className="text-xs font-bold text-amber-950">
                  {totalInteractions > 0 ? `${Math.round((elebiCount / totalInteractions) * 100)}%` : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Qualitative Notes & Tags Panel (Feeds Latxa Block B) */}
      <div
        className={`mt-6 rounded-2xl p-4 border transition ${
          stealthMode
            ? "bg-slate-900 border-slate-800 text-slate-300"
            : "bg-white border-line shadow-xs text-ink"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className={`w-4 h-4 ${stealthMode ? "text-indigo-400" : "text-sea"}`} />
            <h4 className={`text-xs font-extrabold ${stealthMode ? "text-slate-200" : "text-ink"}`}>
              Behaketa bitarteko ohar kualitatiboak (Latxaren analisirako)
            </h4>
          </div>
          <span className="text-[10px] font-semibold text-ink-muted">
            Sakatu etiketak edo idatzi unean bertan ikusitakoa
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {[
            "  Lehen hitza euskaraz",
            "  Euskaratik erdarara pasa dira",
            "  Herritarrak euskaraz jarraitu du",
            "  Harrera ona dinamikari",
            "⏳ Jende ilara / presa",
            "  Taldeko elkarrizketa",
          ].map((tag) => {
            const isAdded = notes.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setNotes((prev) =>
                    prev.includes(tag)
                      ? prev
                      : prev.trim()
                      ? `${prev.trim()}. ${tag}`
                      : tag
                  )
                }
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                  isAdded
                    ? stealthMode
                      ? "bg-indigo-950 border-indigo-700 text-indigo-300"
                      : "bg-sea/10 border-sea/40 text-sea"
                    : stealthMode
                    ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                    : "bg-paper hover:bg-sea/5 border-line text-ink"
                }`}
              >
                {isAdded ? `✓ ${tag}` : `+ ${tag}`}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Idatzi hemen saioan ikusitako edozein pasadizo, jarrera edo ohar (automatikoki gordeko da)..."
          className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-hidden focus:ring-2 focus:ring-sea/40 ${
            stealthMode
              ? "bg-slate-950 border-slate-800 text-slate-200 placeholder:text-ink-muted"
              : "bg-paper border-line text-ink placeholder:text-ink-muted"
          }`}
        />
      </div>

      {/* Observer Instructions Card */}
      <div className="mt-8 bg-sky-50/70 rounded-2xl p-4 border border-sky-100 text-xs text-ink-muted leading-relaxed">
        <h4 className="font-bold text-sky-900 mb-1 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-sky-600" />
          Behatzailearen gida praktikoa (modu diskretua):
        </h4>
        <ul className="list-disc pl-4 space-y-1 mt-1 text-ink">
          <li>Sakatu goiko <strong>&ldquo;  Modu diskretua&rdquo;</strong> botoia pantaila iluntzeko eta kolore deigarriak ezkutatzeko.</li>
          <li>Soinua lehenetsita <strong>isilik</strong> dago, eta aukera bakoitzak <strong>bibrazio-eredu ezberdina</strong> du pantailari begiratu gabe zenbatu ahal izateko.</li>
          <li>Nahastu bazara, erabili <strong>-1</strong> botoia edo desegin botoia edozein unetan.</li>
          <li>Amaitutakoan, sakatu <strong>&ldquo;Gorde&rdquo;</strong> emaitzak erregistratzeko.</li>
        </ul>
      </div>

      {/* SAVE MEASUREMENT MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg border border-line animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-euskara/15 text-euskara flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-euskara" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">
                  Gorde {phase} neurketa ({existingPhaseCount + 1}. saioa)
                </h3>
                <p className="text-xs text-ink-muted">
                  {currentExp?.gunea || "Espazioa"} • {activeEragilea?.izena}
                </p>
              </div>
            </div>

            {/* Results Recap */}
            <div className="bg-paper rounded-2xl p-4 border border-line mb-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] font-bold text-ink-muted block">  Euskaraz</span>
                <span className="text-xl font-black text-euskara">{euskarazCount}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-ink-muted block">  Erdaraz</span>
                <span className="text-xl font-black text-terracotta">{erdarazCount}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-ink-muted block">  Elebi</span>
                <span className="text-xl font-black text-amber-600">{elebiCount}</span>
              </div>
            </div>

            <div className="bg-euskara/10 rounded-xl p-3 border border-euskara/25 mb-4 text-center">
              <span className="text-xs font-semibold text-euskara block">
                Saio honetako euskara erabilera: <strong>%{euskaraPct}</strong> ({totalInteractions} elkarrizketatatik)
              </span>
              {existingPhaseCount > 0 && (
                <span className="text-[11px] text-euskara mt-1 block">
                  Aurreko {existingPhaseCount} saioekin batera kalkulatuko da {phase} faseko emaitza.
                </span>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Behatzailearen izena / kodea:
                </label>
                <input
                  type="text"
                  value={behatzailea}
                  onChange={(e) => handleBehatzaileaChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line text-xs text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Ohar azkarrak (sakatu gehitzeko):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    "Lehen hitza euskaraz",
                    "Langileak lehen hitza euskaraz",
                    "Txapa bistan zegoen",
                    "Jende asko / lanpetuta",
                    "Giro lasaia",
                    "Adineko herritarrak nagusi",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setNotes((prev) =>
                          prev.includes(tag)
                            ? prev
                            : prev.trim()
                            ? `${prev.trim()}. ${tag}`
                            : tag
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-sand hover:bg-euskara/10 hover:text-euskara hover:border-euskara/25 border border-line text-[11px] font-semibold text-ink transition cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adib. Atsedenaldian, jende asko zegoen elkartuta..."
                  className="w-full px-3 py-2 rounded-xl border border-line text-xs text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                />
              </div>
            </div>

            {!isOnline && (
              <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl p-3 mb-4 text-xs flex items-center gap-2">
                <span className="text-base"> </span>
                <span className="leading-snug">
                  Lineaz kanpo zaude. Neurketa gailuan gordeko da seguru, eta internetera konektatzean automatikoki sinkronizatuko da.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ink-muted hover:bg-sand transition cursor-pointer"
              >
                Jarraitu neurtzen
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-euskara hover:opacity-95 text-white font-bold text-xs shadow-md shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving
                    ? "Gordetzen..."
                    : isOnline
                    ? "Gorde eta ikusi panela"
                    : "Gailuan gorde (lineaz kanpo)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stand Modal */}
      {showNewStandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg border border-line my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-euskara/15 text-euskara rounded-2xl">
                  <Store className="w-5 h-5 text-euskara" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">
                    Gehitu entitatea
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Zehaztu entitatea eta zuen hipotesi erreala
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewStandModal(false)}
                className="text-ink-muted hover:text-ink-muted p-1.5 rounded-lg hover:bg-sand transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStandSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Entitatearen izena *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Adib: Zurriola Ikastola, Kaxilda, Bretxako Harategia..."
                  value={newStandName}
                  onChange={(e) => setNewStandName(e.target.value)}
                  className="w-full border border-line rounded-xl px-3.5 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Arduraduna (hautazkoa)
                  </label>
                  <input
                    type="text"
                    placeholder="Adib: Miren / Koldo"
                    value={newStandManager}
                    onChange={(e) => setNewStandManager(e.target.value)}
                    className="w-full border border-line rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Gunea (non)
                  </label>
                  <input
                    type="text"
                    value={newStandGunea}
                    onChange={(e) => setNewStandGunea(e.target.value)}
                    className="w-full border border-line rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Xede-igoera (puntu):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={newStandTargetPct}
                    onChange={(e) => setNewStandTargetPct(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="font-extrabold text-xs text-euskara bg-euskara/10 px-2 py-1 rounded-lg border border-euskara/25">
                    +{newStandTargetPct} puntu
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Hipotesi erreala (nahi duzun bezala idatzi edo aldatu) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newStandHipotesia}
                  onChange={(e) => setNewStandHipotesia(e.target.value)}
                  className="w-full border border-euskara/40 bg-euskara/10 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewStandModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStand || !newStandName.trim() || !newStandHipotesia.trim()}
                  className="px-5 py-2 bg-euskara hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingStand ? "Sortzen..." : "Sortu eta hasi T0 neurtzen →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paper / Manual Entry Modal (atzeratua = 1) */}
      {showPaperModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-line my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-ink text-base">
                  Paperean neurtutako saioa ({phase})
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Sartu eskuz kontaketak, data eta ordu-tartea (azken 30 egunetakoak).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaperModal(false)}
                className="p-1.5 rounded-lg text-ink-muted hover:bg-sand cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaperEntry} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={paperDate}
                    onChange={(e) => setPaperDate(e.target.value)}
                    className="w-full border border-line rounded-xl px-2.5 py-2 text-xs font-medium text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Hasiera *</label>
                  <input
                    type="time"
                    required
                    value={paperStartTime}
                    onChange={(e) => setPaperStartTime(e.target.value)}
                    className="w-full border border-line rounded-xl px-2.5 py-2 text-xs font-medium text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Amaiera *</label>
                  <input
                    type="time"
                    required
                    value={paperEndTime}
                    onChange={(e) => setPaperEndTime(e.target.value)}
                    className="w-full border border-line rounded-xl px-2.5 py-2 text-xs font-medium text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-euskara mb-1">Euskaraz *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={paperEuskaraz}
                    onChange={(e) => setPaperEuskaraz(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm font-bold text-euskara tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-terracotta mb-1">Erdaraz *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={paperErdaraz}
                    onChange={(e) => setPaperErdaraz(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm font-bold text-terracotta tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-700 mb-1">Elebi</label>
                  <input
                    type="number"
                    min={0}
                    value={paperElebi}
                    onChange={(e) => setPaperElebi(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm font-bold text-amber-700 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Behatzailea</label>
                <div className="text-xs font-semibold text-ink bg-paper border border-line rounded-xl px-3 py-2">
                  {behatzailea.trim() || "Aukeratu behatzailea goiko menuan lehenik"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Oharrak (hautazkoa)</label>
                <textarea
                  rows={2}
                  value={paperNotes}
                  onChange={(e) => setPaperNotes(e.target.value)}
                  placeholder="Behaketan ikusitako oharrak..."
                  className="w-full border border-line rounded-xl px-3 py-2 text-xs text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaperModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isSavingPaper || !behatzailea.trim()}
                  className="px-5 py-2 rounded-xl bg-euskara hover:opacity-95 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingPaper ? "Gordetzen..." : "Gorde neurketa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
