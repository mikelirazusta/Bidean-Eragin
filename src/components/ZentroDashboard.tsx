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
  Lock,
  Unlock,
  Users,
  Compass,
  Bot,
  Lightbulb,
  FileText,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { useApp, getPublicEragileLabel, formatBehatzaileaDisplay } from "@/context/AppContext";
import type { Esperimentua, Neurketa } from "@/lib/db";
import TxostenInprimagarria from "@/components/TxostenInprimagarria";
import {
  wilson,
  wilsonMarjinaPuntu,
  aldea,
  ondorioa,
  formatDecimalEu,
  formatSignedPuntu,
  formatAldeaTarteaEu,
  parseProtokoloa,
  neurketaEgoera,
  faseSemaforoa,
  type WilsonTartea,
} from "@/lib/estatistika";

export interface PhaseStats {
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

function computePhaseStats(list: Neurketa[], phase: "T0" | "T1" | "T2"): PhaseStats | null {
  const phaseList = list.filter((n) => n.unea === phase);
  if (phaseList.length === 0) return null;

  const totalAldaketa = phaseList.reduce((sum, n) => sum + (n.aldaketa_count || 0), 0);
  const totalEuskaraz = phaseList.reduce((sum, n) => sum + (n.euskaraz_count || 0) + (n.aldaketa_count || 0), 0);
  const totalErdaraz = phaseList.reduce((sum, n) => sum + (n.erdaraz_count || 0), 0);
  const totalElebi = phaseList.reduce((sum, n) => sum + (n.elebi_count || 0), 0);
  const totalInteractions = totalEuskaraz + totalErdaraz + totalElebi;
  const pct =
    totalInteractions > 0
      ? Math.round((totalEuskaraz / totalInteractions) * 1000) / 10
      : 0;

  return {
    unea: phase,
    count: phaseList.length,
    totalEuskaraz,
    totalAldaketa,
    totalErdaraz,
    totalElebi,
    totalInteractions,
    pct,
    wilson: wilson(totalEuskaraz, totalInteractions),
    neurketak: phaseList,
  };
}

export default function ZentroDashboard() {
  const {
    activeEragilea,
    eragileak,
    esperimentuak,
    neurketak,
    nudges,
    markNudgeRead,
    setActiveTab,
    setObservationConfig,
    triggerConfetti,
    deleteNeurketa,
    updateNeurketa,
    updateEsperimentua,
    startPhase,
    deleteEsperimentua,
    updateEragilea,
    createEsperimentua,
    refreshData,
    currentUser,
    uiTexts,
  } = useApp();

  const isAdmin = currentUser?.role === "admin";

  // Edit Single Measurement Session Modal state
  const [neurketaToEdit, setNeurketaToEdit] = useState<Neurketa | null>(null);
  const [editNeuEragileId, setEditNeuEragileId] = useState<string>("");
  const [editNeuExpId, setEditNeuExpId] = useState<string>("");
  const [editNeuUnea, setEditNeuUnea] = useState<"T0" | "T1" | "T2">("T0");
  const [editNeuBehatzailea, setEditNeuBehatzailea] = useState("");
  const [editNeuEusk, setEditNeuEusk] = useState<number>(0);
  const [editNeuErd, setEditNeuErd] = useState<number>(0);
  const [editNeuElebi, setEditNeuElebi] = useState<number>(0);
  const [editNeuOharrak, setEditNeuOharrak] = useState("");
  const [isSavingNeurketaEdit, setIsSavingNeurketaEdit] = useState(false);

  const openEditNeurketaModal = (n: Neurketa) => {
    const exp = esperimentuak.find((e) => e.id === n.esperimentu_id);
    setNeurketaToEdit(n);
    setEditNeuExpId(n.esperimentu_id);
    setEditNeuEragileId(exp?.eragile_id || activeEragilea?.id || "");
    setEditNeuUnea(n.unea);
    setEditNeuBehatzailea(n.behatzailea || "Behatzailea");
    setEditNeuEusk(n.euskaraz_count || 0);
    setEditNeuErd(n.erdaraz_count || 0);
    setEditNeuElebi(n.elebi_count || 0);
    setEditNeuOharrak(n.oharrak || "");
  };

  const handleSaveEditNeurketa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neurketaToEdit) return;
    setIsSavingNeurketaEdit(true);
    await updateNeurketa({
      id: neurketaToEdit.id,
      eragile_id: isAdmin && editNeuEragileId ? editNeuEragileId : undefined,
      esperimentu_id: isAdmin && editNeuExpId ? editNeuExpId : undefined,
      unea: editNeuUnea,
      behatzailea: editNeuBehatzailea.trim() || "Behatzailea",
      euskaraz_count: editNeuEusk,
      erdaraz_count: editNeuErd,
      elebi_count: editNeuElebi,
      oharrak: editNeuOharrak.trim(),
    });
    setIsSavingNeurketaEdit(false);
    setNeurketaToEdit(null);
  };

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
  const [editT2Mota, setEditT2Mota] = useState<"jarraipena" | "kentzea">("jarraipena");
  const [editAldaketaArrazoia, setEditAldaketaArrazoia] = useState("");
  const [isSavingHypothesis, setIsSavingHypothesis] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [expToDelete, setExpToDelete] = useState<Esperimentua | null>(null);
  const [isDeletingExp, setIsDeletingExp] = useState(false);
  const [neurketaToDeleteConfirm, setNeurketaToDeleteConfirm] = useState<{
    id: string;
    unea: string;
    sessionIndex: number;
  } | null>(null);
  const [isDeletingNeurketa, setIsDeletingNeurketa] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showReportModal) setShowReportModal(false);
      else if (neurketaToDeleteConfirm) setNeurketaToDeleteConfirm(null);
      else if (expToDelete) setExpToDelete(null);
      else if (neurketaToEdit) setNeurketaToEdit(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showReportModal, neurketaToDeleteConfirm, expToDelete, neurketaToEdit]);

  // Latxa qualitative analysis state
  const [isAnalyzingWithLatxa, setIsAnalyzingWithLatxa] = useState(false);
  const [latxaAnalysisResult, setLatxaAnalysisResult] = useState<{
    ondorio_nagusia?: string;
    oharren_analisia?: string;
    balorazio_kuantitatiboa?: string;
    hurrengo_urratsak?: string[];
    txosten_laburpena?: string;
    sortze_data?: string;
  } | null>(null);
  const [latxaAnalysisError, setLatxaAnalysisError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isImprovingHypoWithLatxa, setIsImprovingHypoWithLatxa] = useState(false);

  // Sync saved AI report from database whenever currentExp changes
  React.useEffect(() => {
    setLatxaAnalysisError(null);
    if (currentExp?.ai_txostena_json) {
      try {
        const parsed = JSON.parse(currentExp.ai_txostena_json);
        if (parsed && typeof parsed === "object" && parsed.ondorio_nagusia) {
          setLatxaAnalysisResult(parsed);
          return;
        }
      } catch {
        // ignore invalid json
      }
    }
    setLatxaAnalysisResult(null);
  }, [currentExp?.id, currentExp?.ai_txostena_json]);

  const handleImproveTextWithLatxa = async (mode: "edit" | "quick") => {
    if (isImprovingHypoWithLatxa) return;
    setIsImprovingHypoWithLatxa(true);
    try {
      const currentText = mode === "edit" ? editHipotesiaText : quickHipotesia;
      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "hobetu_hipotesia",
          uneko_testua: currentText,
          eragile_izena: activeEragilea?.izena || "Entitatea",
          eragile_mota: activeEragilea?.mota || "orokorra",
          erronka_nagusia: activeEragilea?.erronka_nagusia || "",
          pilotu_izena: currentExp?.pilotu_izena || "Esku-hartze pilotua",
          taldea: mode === "edit" ? editTaldeaText : activeEragilea?.izena,
          pertsonak: mode === "edit" ? editPertsonakText : "herritarrekin",
          gunea: mode === "edit" ? editGuneaText : quickGunea,
          xede_portzentajea: mode === "edit" ? editXedeaNum : quickXedea,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data?.hipotesi_hobetua) {
        if (mode === "edit") {
          setEditHipotesiaText(json.data.hipotesi_hobetua);
        } else {
          setQuickHipotesia(json.data.hipotesi_hobetua);
        }
      }
    } catch (err) {
      console.error("Errorea hipotesia Latxarekin hobetzean:", err);
    } finally {
      setIsImprovingHypoWithLatxa(false);
    }
  };

  // Quick setup state when !currentExp
  const [quickHipotesia, setQuickHipotesia] = useState(
    `${activeEragilea?.izena || "Gure entitatean"} esku-hartze pilotua aktibatzen badugu, euskararen erabilera 20 puntu igoko da (adib. %30etik %50era).`
  );
  const [quickGunea, setQuickGunea] = useState(activeEragilea?.izena || "Harrera edo gune nagusia");
  const [quickXedea, setQuickXedea] = useState(20);
  const [isCreatingQuickExp, setIsCreatingQuickExp] = useState(false);

  const handleTogglePrivacy = async () => {
    if (!activeEragilea || isUpdatingPrivacy) return;
    setIsUpdatingPrivacy(true);
    const nextPublikoa = Number(activeEragilea.publikoa) === 1 ? 0 : 1;
    await updateEragilea({
      id: activeEragilea.id,
      publikoa: nextPublikoa,
    });
    setIsUpdatingPrivacy(false);
  };

  const handleCreateQuickExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEragilea || !quickHipotesia.trim()) return;
    setIsCreatingQuickExp(true);
    await createEsperimentua({
      eragile_id: activeEragilea.id,
      pilotu_id: "barra-barra-txapak",
      hipotesia: quickHipotesia.trim(),
      taldea: activeEragilea.izena,
      pertsonak: activeEragilea.arduraduna || "Herritarrak eta langileak",
      gunea: quickGunea.trim() || activeEragilea.izena,
      xede_portzentajea: quickXedea,
    });
    setIsCreatingQuickExp(false);
  };

  const handleOpenEditHypothesis = () => {
    if (!currentExp) return;
    setEditHipotesiaText(currentExp.hipotesia);
    setEditTaldeaText(currentExp.taldea);
    setEditPertsonakText(currentExp.pertsonak);
    setEditGuneaText(currentExp.gunea);
    setEditXedeaNum(currentExp.xede_portzentajea || 25);
    setEditT2Mota(currentExp.t2_mota === "kentzea" ? "kentzea" : "jarraipena");
    setEditAldaketaArrazoia("");
    setIsEditingHypothesis(true);
  };

  const handleSaveHypothesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExp || !editHipotesiaText.trim()) return;
    const isExpLocked = Number(currentExp.blokeatuta || 0) === 1;
    const lockedChanged =
      editHipotesiaText.trim() !== currentExp.hipotesia ||
      editXedeaNum !== currentExp.xede_portzentajea;
    if (isExpLocked && lockedChanged && !editAldaketaArrazoia.trim()) {
      alert("Hipotesia edo xedea blokeatuta dago lehen T0 saioaren ondoren. Idatzi aldaketaren arrazoia.");
      return;
    }
    setIsSavingHypothesis(true);
    await updateEsperimentua({
      id: currentExp.id,
      hipotesia: editHipotesiaText.trim(),
      taldea: editTaldeaText.trim() || currentExp.taldea,
      pertsonak: editPertsonakText.trim() || currentExp.pertsonak,
      gunea: editGuneaText.trim() || currentExp.gunea,
      xede_portzentajea: editXedeaNum,
      t2_mota: isAdmin ? editT2Mota : undefined,
      aldaketa_arrazoia: editAldaketaArrazoia.trim() || undefined,
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

  // Growth calculations (Newcombe intervals & percentage points)
  const t1VsT0 =
    t0Stats && t1Stats
      ? aldea(
          t0Stats.totalEuskaraz,
          t0Stats.totalInteractions,
          t1Stats.totalEuskaraz,
          t1Stats.totalInteractions
        )
      : null;
  const t2VsT0 =
    t0Stats && t2Stats
      ? aldea(
          t0Stats.totalEuskaraz,
          t0Stats.totalInteractions,
          t2Stats.totalEuskaraz,
          t2Stats.totalInteractions
        )
      : null;
  const t2VsT1 =
    t1Stats && t2Stats
      ? aldea(
          t1Stats.totalEuskaraz,
          t1Stats.totalInteractions,
          t2Stats.totalEuskaraz,
          t2Stats.totalInteractions
        )
      : null;
  const isT2Kentzea = currentExp?.t2_mota === "kentzea";
  const immediateGain = t1VsT0 ? Math.round(t1VsT0.d * 1000) / 10 : null;
  const sustainedGain = t2VsT0 ? Math.round(t2VsT0.d * 1000) / 10 : null;
  const primaryDiff = isT2Kentzea ? t1VsT0 : t2VsT0 || t1VsT0;
  const primaryOndorioa =
    primaryDiff && currentExp
      ? ondorioa(primaryDiff, currentExp.xede_portzentajea || 20)
      : null;

  // Check if observer changed between phases (ignoring "Ezezaguna")
  const observerChangedAcrossPhases = React.useMemo(() => {
    const phasesPresent = (["T0", "T1", "T2"] as const)
      .map((p) => {
        const obs = new Set(
          expNeurketak
            .filter((n) => n.unea === p)
            .map((n) => formatBehatzaileaDisplay(n.behatzailea))
            .filter((name) => name !== "Ezezaguna")
        );
        return obs;
      })
      .filter((s) => s.size > 0);
    if (phasesPresent.length < 2) return false;
    const base = phasesPresent[0];
    for (let i = 1; i < phasesPresent.length; i++) {
      const other = phasesPresent[i];
      if (base.size !== other.size || [...base].some((x) => !other.has(x))) {
        return true;
      }
    }
    return false;
  }, [expNeurketak]);

  const handleRunLatxaAnalysis = async () => {
    if (!currentExp) return;
    setIsAnalyzingWithLatxa(true);
    setLatxaAnalysisError(null);

    const oharrakList = expNeurketak
      .filter((n) => n.oharrak && n.oharrak.trim().length > 0)
      .map((n) => ({
        unea: n.unea,
        oharra: n.oharrak.trim(),
        behatzailea: n.behatzailea || "Behatzailea",
        data: n.data_ordu,
      }));

    const abisuakList: string[] = [];
    if (observerChangedAcrossPhases) {
      abisuakList.push("Behatzailea aldatu da faseen artean; aldearen zati bat horregatik izan daiteke.");
    }
    if (Number(currentExp.t1_egonkortu_gabe || 0) === 1) {
      abisuakList.push("T1 oinarri-lerroa egonkortu gabe hasi zen.");
    }

    try {
      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "ondorioak_eta_analisia",
          esperimentu_id: currentExp.id,
          eragile_izena: activeEragilea?.izena || "Entitatea",
          erronka_nagusia: activeEragilea?.erronka_nagusia || "",
          pilotu_izena: currentExp.pilotu_izena || "Esku-hartze pilotua",
          hipotesia: currentExp.hipotesia,
          t0_stats: t0Stats
            ? {
                pct: t0Stats.pct,
                count: t0Stats.count,
                euskaraz: t0Stats.totalEuskaraz,
                total: t0Stats.totalInteractions,
                wilson_behea: Math.round(t0Stats.wilson.behea * 1000) / 10,
                wilson_goia: Math.round(t0Stats.wilson.goia * 1000) / 10,
              }
            : null,
          t1_stats: t1Stats
            ? {
                pct: t1Stats.pct,
                count: t1Stats.count,
                euskaraz: t1Stats.totalEuskaraz,
                total: t1Stats.totalInteractions,
                gain: immediateGain ?? undefined,
                wilson_behea: Math.round(t1Stats.wilson.behea * 1000) / 10,
                wilson_goia: Math.round(t1Stats.wilson.goia * 1000) / 10,
              }
            : null,
          t2_stats: t2Stats
            ? {
                pct: t2Stats.pct,
                count: t2Stats.count,
                euskaraz: t2Stats.totalEuskaraz,
                total: t2Stats.totalInteractions,
                gain: sustainedGain ?? undefined,
                wilson_behea: Math.round(t2Stats.wilson.behea * 1000) / 10,
                wilson_goia: Math.round(t2Stats.wilson.goia * 1000) / 10,
              }
            : null,
          aldea_tartea: primaryDiff
            ? {
                d: Math.round(primaryDiff.d * 1000) / 10,
                behea: Math.round(primaryDiff.behea * 1000) / 10,
                goia: Math.round(primaryDiff.goia * 1000) / 10,
                etiketa: t2Stats && !isT2Kentzea ? "T2 − T0" : "T1 − T0",
              }
            : null,
          ondorioa_testua: primaryOndorioa?.testua,
          semaforoa_egoera: `${activePhase}: ${activeSemaforoa.kolorea} — ${activeSemaforoa.mezua}`,
          abisuak: abisuakList,
          oharrak_zerrenda: oharrakList,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Ezin izan da Latxaren analisia jaso.");
      }

      setLatxaAnalysisResult(json.data);
      await refreshData();
      triggerConfetti();
    } catch (err) {
      console.error("Latxa analisiaren errorea:", err);
      setLatxaAnalysisError(err instanceof Error ? err.message : "Errorea gertatu da analisia egitean.");
    } finally {
      setIsAnalyzingWithLatxa(false);
    }
  };

  const handleCopyReport = () => {
    if (!latxaAnalysisResult) return;
    const textToCopy =
      latxaAnalysisResult.txosten_laburpena ||
      `${latxaAnalysisResult.ondorio_nagusia || ""}\n\nOharren analisia:\n${latxaAnalysisResult.oharren_analisia || ""}`;
    try {
      navigator.clipboard.writeText(textToCopy);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      // fallback
    }
  };

  // Organization active unread nudges
  const activeNudges = nudges.filter(
    (n) => n.eragile_id === activeEragilea?.id && n.irakurria === 0
  );

  // Hobekuntza urratsak (4 saio gomendatuta fase bakoitzean, fase-aldaketa esplizitua)
  const saioGutxienekoa = currentExp?.saio_gutxienekoa || 4;
  const nGutxienekoa = currentExp?.n_gutxienekoa || 20;
  const expProtokoloa = parseProtokoloa(currentExp?.protokoloa_json);

  const t0Semaforoa = faseSemaforoa(
    expNeurketak.filter((n) => n.unea === "T0"),
    "T0",
    { nGutxienekoa, saioGutxienekoa, protokoloa: expProtokoloa }
  );
  const t1Semaforoa = faseSemaforoa(
    expNeurketak.filter((n) => n.unea === "T1"),
    "T1",
    { nGutxienekoa, saioGutxienekoa, protokoloa: expProtokoloa }
  );
  const t2Semaforoa = faseSemaforoa(
    expNeurketak.filter((n) => n.unea === "T2"),
    "T2",
    { nGutxienekoa, saioGutxienekoa, protokoloa: expProtokoloa }
  );

  const activePhase: "T0" | "T1" | "T2" =
    currentExp?.estatusa === "T1_zain"
      ? "T1"
      : currentExp?.estatusa === "T2_zain" || currentExp?.estatusa === "Amaituta"
      ? "T2"
      : "T0";

  const activeSemaforoa =
    activePhase === "T0" ? t0Semaforoa : activePhase === "T1" ? t1Semaforoa : t2Semaforoa;

  const isT1Started =
    currentExp?.estatusa === "T1_zain" ||
    currentExp?.estatusa === "T2_zain" ||
    currentExp?.estatusa === "Amaituta" ||
    Boolean(t1Stats);
  const isT2Started =
    currentExp?.estatusa === "T2_zain" ||
    currentExp?.estatusa === "Amaituta" ||
    Boolean(t2Stats);

  const handleExplicitStartPhase = async (targetFasea: "T1" | "T2" | "Amaituta") => {
    if (!currentExp) return;
    let egonkortuGabe = false;
    if (targetFasea === "T1" && t0Semaforoa.kolorea !== "berdea") {
      const ok = window.confirm(
        `${t0Semaforoa.mezua}\n\nZiur zaude T1 hasi nahi duzula oinarri-lerroa egonkortu gabe? Erregistroan gordeko da.`
      );
      if (!ok) return;
      egonkortuGabe = true;
    } else if (targetFasea === "T2" && t1Semaforoa.kolorea !== "berdea") {
      const ok = window.confirm(
        `${t1Semaforoa.mezua}\n\nHala ere T2 hasi nahi duzu?`
      );
      if (!ok) return;
    }
    await startPhase(currentExp.id, targetFasea, egonkortuGabe);
  };

  const aldaketaErregistroa = React.useMemo(() => {
    if (!currentExp?.aldaketa_erregistroa_json) return [];
    try {
      const parsed = JSON.parse(currentExp.aldaketa_erregistroa_json);
      return Array.isArray(parsed) ? (parsed as Array<{ data: string; erabiltzailea: string; oharra: string }>) : [];
    } catch {
      return [];
    }
  }, [currentExp?.aldaketa_erregistroa_json]);

  const steps = [
    {
      step: 1,
      title: "Hipotesia definitu",
      desc: "Pilotuen katalogoan edo hipotesi-sortzailearen bidez esperimentua zehaztu.",
      completed: !!currentExp,
      current: false,
    },
    {
      step: 2,
      title: `T0 neurtu (oinarri-lerroa, gutxienez ${saioGutxienekoa} saio)`,
      desc: t0Stats
        ? `${t0Stats.count}/${saioGutxienekoa} saio eginda (%${t0Stats.pct}, ${t0Stats.totalInteractions} elkarrizketa).`
        : "Esku-hartzea hasi aurretiko hasierako neurketak (egun eta ordu berean).",
      completed: (t0Stats?.count || 0) >= saioGutxienekoa || isT1Started,
      current: activePhase === "T0",
      actionPhase: "T0" as const,
      count: t0Stats?.count || 0,
    },
    {
      step: 3,
      title: "Pilotua martxan jarri (Hasi T1)",
      desc: isT1Started
        ? "Pilotua martxan jarrita eta T1 fasea aktibatuta."
        : "T0 oinarri-lerroa egonkor dagoenean, sakatu 'Hasi T1' eta jarri pilotua martxan.",
      completed: isT1Started,
      current: activePhase === "T0" && (t0Stats?.count || 0) >= saioGutxienekoa,
    },
    {
      step: 4,
      title: `T1 neurtu (gutxienez ${saioGutxienekoa} saio)`,
      desc: t1Stats
        ? `${t1Stats.count}/${saioGutxienekoa} saio eginda (%${t1Stats.pct}, ${t1Stats.totalInteractions} elkarrizketa).`
        : "Pilotua martxan dagoela egindako neurketak (egun eta ordu berean).",
      completed: (t1Stats?.count || 0) >= saioGutxienekoa || isT2Started,
      current: activePhase === "T1",
      actionPhase: "T1" as const,
      count: t1Stats?.count || 0,
    },
    {
      step: 5,
      title: `T2 neurtu (gutxienez ${saioGutxienekoa} saio)`,
      desc: t2Stats
        ? `${t2Stats.count}/${saioGutxienekoa} saio eginda (%${t2Stats.pct}, ${t2Stats.totalInteractions} elkarrizketa).`
        : "T2 faseko neurketak (egun eta ordu berean).",
      completed: (t2Stats?.count || 0) >= saioGutxienekoa || currentExp?.estatusa === "Amaituta",
      current: activePhase === "T2" && currentExp?.estatusa !== "Amaituta",
      actionPhase: "T2" as const,
      count: t2Stats?.count || 0,
    },
  ];

  const completedStepsCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedStepsCount / steps.length) * 100);

  if (!activeEragilea) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-line">
          <div className="w-14 h-14 rounded-xl bg-euskara/10 text-euskara flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="font-editorial text-2xl font-semibold text-ink">
            Oraindik ez dago entitaterik hautatuta
          </h2>
          <p className="text-sm text-ink-muted mt-2 mb-6 max-w-md mx-auto leading-relaxed">
            {isAdmin
              ? "Sortu edo hautatu entitate bat koordinazio-paneletik, bere pilotuak eta neurketak hemen jarraitzeko."
              : "Zure entitatearen datuak kargatu edo pilotuen katalogoa arakatu dezakezu hasteko."}
          </p>
          <button
            onClick={() => setActiveTab(isAdmin ? "admin" : "katalogoa")}
            className="px-6 py-3 rounded-xl bg-euskara hover:opacity-95 text-white font-bold text-sm transition cursor-pointer"
          >
            {isAdmin ? "Joan koordinazio-panelera →" : "Arakatu pilotuen katalogoa →"}
          </button>
        </div>
      </div>
    );
  }

  const handleOpenReportModal = () => {
    setShowReportModal(true);
    // Txostena oraindik Latxarekin sortu gabe badago eta neurketak badaude, automatikoki sortu
    if (!latxaAnalysisResult && !isAnalyzingWithLatxa && currentExp && expNeurketak.length > 0) {
      handleRunLatxaAnalysis();
    }
  };

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 print:hidden">
      
      {/* Top Organization Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-sand text-sea border border-line uppercase tracking-wider">
              {activeEragilea?.mota || "Entitatea"}
            </span>
            <span className="text-xs text-ink-muted">• Panela eta aurrerapena</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
            {activeEragilea?.izena || "Zure entitatea"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Erronka: <em className="text-ink">&ldquo;{activeEragilea?.erronka_nagusia}&rdquo;</em>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
          {currentExp && (
            <button
              type="button"
              onClick={handleOpenReportModal}
              className="px-3.5 py-2.5 rounded-xl border border-line bg-white hover:bg-paper text-ink text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Ikusi eta deskargatu A4 txosten ofiziala (PDF) Latxaren analisiarekin"
            >
              <FileText className="w-4 h-4 text-euskara" />
              <span>Txostena (PDF)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("katalogoa")}
            className="px-4 py-2.5 rounded-xl border border-line bg-white hover:bg-paper text-ink text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Pilotuak eta hipotesia</span>
          </button>

          {currentExp && (
            <button
              onClick={() => {
                setObservationConfig({
                  expId: currentExp?.id,
                  phase: activePhase,
                });
                setActiveTab("behaketa");
              }}
              className="px-4 py-2.5 rounded-xl bg-euskara hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-xs transition cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Hasi behaketa ({activePhase})</span>
            </button>
          )}
        </div>
      </div>

      {/* GUIDED NEXT STEP BANNER (Always clear what to do next) */}
      <div className="mb-6 bg-white text-ink rounded-2xl p-5 sm:p-6 border border-line border-l-4 border-l-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-euskara/10 border border-euskara/25 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-euskara" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-euskara">
              Hurrengo urratsa
            </span>
            <h2 className="text-base sm:text-lg font-bold text-ink mt-0.5">
              {!currentExp
                ? "1. urratsa: aukeratu esku-hartze pilotu bat katalogotik edo sortu hipotesia"
                : currentExp.estatusa === "Amaituta"
                ? "Zikloa amaitutzat markatuta dago (T0, T1 eta T2)"
                : activePhase === "T0"
                ? uiTexts.dashboard_step1_title || "1. urratsa: egin T0 hasierako neurketak (gutxienez 4, pilotuaren aurretik)"
                : activePhase === "T1"
                ? uiTexts.dashboard_step2_title || "2. urratsa: jarri pilotua martxan eta egin T1 neurketak (gutxienez 4)"
                : uiTexts.dashboard_step3_title || "3. urratsa: egin T2 neurketak (gutxienez 4)"}
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
              {!currentExp
                ? "Aztertu esku-hartze pilotuen katalogoa eta aukeratu zuen entitatearen erronkari ondoen egokitzen zaiona."
                : currentExp.estatusa === "Amaituta"
                ? "Nahi baduzue, saio gehiago gehitu ditzakezue edo PDF txostena inprimatu."
                : activePhase === "T0"
                ? t0Semaforoa.kolorea !== "berdea"
                  ? `T0: ${t0Semaforoa.osoaKopurua}/${saioGutxienekoa} saio oso. Neurtu berriro egun eta ordu berean, esku-hartzea martxan jarri gabe.`
                  : `Oinarri-lerroa egonkor dago (%${t0Stats ? formatDecimalEu(t0Stats.pct) : "0"}, ${t0Stats?.totalInteractions || 0} elkarrizketa). Orain jar dezakezue pilotua martxan («Hasi T1»).`
                : activePhase === "T1"
                ? `T1: ${t1Semaforoa.osoaKopurua}/${saioGutxienekoa} saio oso${t1Stats ? ` (%${formatDecimalEu(t1Stats.pct)}, ${t1Stats.totalInteractions} elkarrizketa)` : ""}. Gutxienez ${saioGutxienekoa} saio gomendatzen dira egun eta ordu berean.`
                : `T2: ${t2Semaforoa.osoaKopurua}/${saioGutxienekoa} saio oso${t2Stats ? ` (%${formatDecimalEu(t2Stats.pct)}, ${t2Stats.totalInteractions} elkarrizketa)` : ""}. Gutxienez ${saioGutxienekoa} saio gomendatzen dira egun eta ordu berean.`}
            </p>
            {currentExp && currentExp.estatusa !== "Amaituta" && (
              <div
                className={`mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  activeSemaforoa.kolorea === "berdea"
                    ? "bg-euskara/10 text-euskara border-euskara/30"
                    : activeSemaforoa.kolorea === "horia"
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-terracotta/10 text-terracotta border-terracotta/30"
                }`}
              >
                <span>
                  {activeSemaforoa.kolorea === "berdea"
                    ? "🟢"
                    : activeSemaforoa.kolorea === "horia"
                    ? "🟡"
                    : "🔴"}
                </span>
                <span>{activeSemaforoa.mezua}</span>
              </div>
            )}
          </div>
        </div>

        {currentExp ? (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setObservationConfig({
                  expId: currentExp.id,
                  phase: activePhase,
                });
                setActiveTab("behaketa");
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-euskara hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {currentExp.estatusa === "Amaituta"
                  ? "+ Gehitu beste saio bat"
                  : `Neurtu ${activePhase} orain`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {activePhase === "T0" && (
              <button
                type="button"
                onClick={() => handleExplicitStartPhase("T1")}
                className="px-3.5 py-2.5 rounded-xl bg-paper hover:bg-sand text-ink border border-line font-bold text-xs transition cursor-pointer"
              >
                Hasi T1
              </button>
            )}
            {activePhase === "T1" && (
              <button
                type="button"
                onClick={() => handleExplicitStartPhase("T2")}
                className="px-3.5 py-2.5 rounded-xl bg-paper hover:bg-sand text-ink border border-line font-bold text-xs transition cursor-pointer"
              >
                Hasi T2
              </button>
            )}
            {activePhase === "T2" && currentExp.estatusa !== "Amaituta" && t2Stats && (
              <button
                type="button"
                onClick={() => handleExplicitStartPhase("Amaituta")}
                className="px-3.5 py-2.5 rounded-xl bg-paper hover:bg-sand text-ink border border-line font-bold text-xs transition cursor-pointer"
              >
                Amaitu zikloa
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab("katalogoa")}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-euskara hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Ikusi pilotuen katalogoa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ACTIVE NUDGE BANNER (if any unread nudge exists) */}
      {activeNudges.length > 0 && (
        <div className="mb-8 bg-euskara/10 rounded-2xl p-5 sm:p-6 text-emerald-950 border border-euskara/25 relative overflow-hidden print:hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-euskara/15 border border-euskara/25 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-euskara" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-euskara">
                  Portaera-bultzada
                </span>
                <h3 className="text-base sm:text-lg font-bold mt-0.5 text-ink">
                  {activeNudges[0].titulua}
                </h3>
                <p className="text-xs sm:text-sm text-ink mt-1 max-w-2xl leading-relaxed">
                  {activeNudges[0].mezua}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {activeNudges[0].ekintza_esteka && (
                <button
                  onClick={() => {
                    const link = activeNudges[0].ekintza_esteka!;
                    if (link.includes("/katalogoa")) {
                      setActiveTab("katalogoa");
                    } else {
                      if (link.includes("phase=T1")) {
                        setObservationConfig({ expId: currentExp?.id, phase: "T1" });
                      } else if (link.includes("phase=T2")) {
                        setObservationConfig({ expId: currentExp?.id, phase: "T2" });
                      }
                      setActiveTab("behaketa");
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-euskara hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{activeNudges[0].ekintza_esteka.includes("/katalogoa") ? "Ikusi pilotuak" : "Egin neurketa orain"}</span>
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
            <div className="civic-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sand text-sea border border-line">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm">
                      Zuen hipotesia
                    </h3>
                    <span className="text-[11px] text-ink-muted">
                      Pilotua: {currentExp.pilotu_izena || "Euskaraz barra-barra txapak"}
                    </span>
                  </div>
                </div>

                  <div className="flex items-center gap-1.5">
                    {Number(currentExp.blokeatuta || 0) === 1 && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200"
                        title="Lehen T0 saioaren ondoren blokeatuta; aldatzeko arrazoia erregistratzen da"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Blokeatuta</span>
                      </span>
                    )}
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-euskara/10 text-euskara border border-euskara/20 tabular-nums">
                      Xedea: +{currentExp.xede_portzentajea} puntu
                    </span>
                  {!isEditingHypothesis && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenEditHypothesis}
                        className="px-2.5 py-1 rounded-lg bg-paper hover:bg-sand text-ink border border-line text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer print:hidden"
                        title="Editatu hipotesia eta xehetasunak"
                      >
                        <Pencil className="w-3.5 h-3.5 text-ink-muted" />
                        <span>Editatu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpToDelete(currentExp)}
                        className="p-1.5 rounded-lg bg-paper hover:bg-terracotta/10 text-ink-muted hover:text-terracotta border border-line hover:border-terracotta/25 transition cursor-pointer print:hidden"
                        title="Ezabatu hipotesia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditingHypothesis ? (
                <form onSubmit={handleSaveHypothesis} className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-200 my-2">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                      <label className="block text-[11px] font-bold text-ink">
                        Hipotesi erreala *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleImproveTextWithLatxa("edit")}
                          disabled={isImprovingHypoWithLatxa}
                          className="text-[10px] font-extrabold text-sea bg-sea/10 hover:bg-sea/15 border border-sea/25 px-2 py-0.5 rounded-md cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Bot className="w-3 h-3" />
                          <span>{isImprovingHypoWithLatxa ? "Fintzen..." : "Hobetu Latxarekin"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditHipotesiaText(
                              `Gure ustez, ${editTaldeaText || "entitateko lantaldeak"} ${editPertsonakText || "herritarrekin eta bezeroekin"}, ${editGuneaText || "harrera gunean"} esku-hartze pilotua aktibatuta, euskararen erabilera ${editXedeaNum} puntu igoko da (adib. %30etik %${30 + editXedeaNum}era).`
                            )
                          }
                          className="text-[10px] font-bold text-euskara hover:underline cursor-pointer"
                        >
                          Txantiloia erabili
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={editHipotesiaText}
                      onChange={(e) => setEditHipotesiaText(e.target.value)}
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-ink-muted mb-0.5">
                        Taldea
                      </label>
                      <input
                        type="text"
                        value={editTaldeaText}
                        onChange={(e) => setEditTaldeaText(e.target.value)}
                        className="w-full border border-line bg-white rounded-lg px-2.5 py-1.5 text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-ink-muted mb-0.5">
                        Gunea
                      </label>
                      <input
                        type="text"
                        value={editGuneaText}
                        onChange={(e) => setEditGuneaText(e.target.value)}
                        className="w-full border border-line bg-white rounded-lg px-2.5 py-1.5 text-xs text-ink"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-ink-muted mb-0.5">
                        Pertsonak
                      </label>
                      <input
                        type="text"
                        value={editPertsonakText}
                        onChange={(e) => setEditPertsonakText(e.target.value)}
                        className="w-full border border-line bg-white rounded-lg px-2.5 py-1.5 text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-ink-muted mb-0.5">
                        Xede-igoera (puntu)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editXedeaNum}
                        onChange={(e) => setEditXedeaNum(Number(e.target.value))}
                        className="w-full border border-line bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-euskara"
                      />
                    </div>
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-ink-muted mb-0.5">
                        T2 mota (Admin)
                      </label>
                      <select
                        value={editT2Mota}
                        onChange={(e) => setEditT2Mota(e.target.value === "kentzea" ? "kentzea" : "jarraipena")}
                        className="w-full border border-line bg-white rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink"
                      >
                        <option value="jarraipena">Jarraipena</option>
                        <option value="kentzea">Esku-hartzea kentzea (ABA)</option>
                      </select>
                    </div>
                  )}

                  {Number(currentExp.blokeatuta || 0) === 1 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">
                        Aldaketaren arrazoia (beharrezkoa hipotesia edo xedea aldatzean) *
                      </label>
                      <input
                        type="text"
                        value={editAldaketaArrazoia}
                        onChange={(e) => setEditAldaketaArrazoia(e.target.value)}
                        placeholder="Adib. Behaketa-gunea zehazteko egokitzapena..."
                        className="w-full border border-amber-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-ink"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingHypothesis(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-muted hover:bg-slate-200/70 transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Utzi</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingHypothesis || !editHipotesiaText.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-euskara hover:opacity-95 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingHypothesis ? "Gordetzen..." : "Gorde hipotesia"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="bg-paper rounded-xl p-4 border border-line border-l-4 border-l-euskara my-3">
                    <p className="font-editorial text-base sm:text-[17px] text-ink italic leading-relaxed">
                      &ldquo;{currentExp.hipotesia}&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted pt-1">
                    <div>
                      <span className="block text-[10px] text-ink-muted uppercase font-bold tracking-wider">Taldea</span>
                      <span className="font-semibold text-ink">{currentExp.taldea}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-muted uppercase font-bold tracking-wider">Gunea</span>
                      <span className="font-semibold text-ink">{currentExp.gunea}</span>
                    </div>
                  </div>

                  {aldaketaErregistroa.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-line space-y-1">
                      <span className="block text-[10px] font-bold uppercase text-ink-muted tracking-wider">
                        Aldaketa-erregistroa
                      </span>
                      {aldaketaErregistroa.map((entry, idx) => (
                        <p key={idx} className="text-[11px] text-ink-muted">
                          <strong className="text-ink">
                            {new Date(entry.data).toLocaleDateString("eu-ES")}
                          </strong>{" "}
                          ({entry.erabiltzailea}): {entry.oharra}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Aurrerapen Barra */}
            <div className="civic-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-ink text-sm">
                    Hobekuntza-zikloaren aurrerapena
                  </h3>
                  <p className="text-xs text-ink-muted tabular-nums">
                    {completedStepsCount} / {steps.length} urrats osatuta
                  </p>
                </div>
                <span className="text-sm font-extrabold text-euskara tabular-nums">
                  %{progressPct}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-sand h-2 rounded-full overflow-hidden mb-6 border border-line">
                <div
                  className="bg-euskara h-full rounded-full transition-all duration-500"
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
                        ? "bg-euskara/5 border-euskara/25 text-emerald-950"
                        : st.current
                        ? "bg-sky-50 border-sky-300 text-sky-950 shadow-2xs"
                        : "bg-paper/50 border-line/70 text-ink-muted"
                    }`}
                  >
                    <div className="mt-0.5">
                      {st.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-euskara shrink-0" />
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
                              className="text-[10px] font-bold text-euskara bg-white hover:bg-euskara/10 px-2 py-0.5 rounded-lg border border-euskara/40 shadow-2xs transition cursor-pointer inline-flex items-center gap-1 shrink-0"
                              title="Egin beste behaketa saio bat fase honetako emaitza osatzeko"
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
                      <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/*  Pribatutasuna komunitatean Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-line">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      Number(activeEragilea.publikoa) === 1
                        ? "bg-euskara/10 text-euskara"
                        : "bg-sand text-ink-muted"
                    }`}
                  >
                    {Number(activeEragilea.publikoa) === 1 ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm">
                      Pribatutasuna komunitatean
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                      {Number(activeEragilea.publikoa) === 1 ? (
                        <span>
                          Zure entitatearen izena (<strong>{activeEragilea.izena}</strong>) ikusgai dago beste eragileentzat komunitateko zerrendan.
                        </span>
                      ) : (
                        <span>
                          Zure izena babestuta dago. Beste eragileek kode anonimo bat bakarrik ikusten dute: <strong>{getPublicEragileLabel(activeEragilea, "eragilea", "other")}</strong>.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-ink-muted">
                  {Number(activeEragilea.publikoa) === 1
                    ? "  Izen publikoa aktibatuta"
                    : "  Modu anonimoa aktibatuta (#ID)"}
                </span>
                <button
                  type="button"
                  onClick={handleTogglePrivacy}
                  disabled={isUpdatingPrivacy}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                    Number(activeEragilea.publikoa) === 1
                      ? "bg-sand hover:bg-slate-200 text-ink"
                      : "bg-euskara/10 hover:bg-euskara/15 text-euskara border border-euskara/25"
                  }`}
                >
                  {isUpdatingPrivacy
                    ? "Aldatzen..."
                    : Number(activeEragilea.publikoa) === 1
                    ? "Bihurtu anonimo (#ID)"
                    : "Erakutsi nire izena"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Visual Feedback & Charts (T0 vs T1 vs T2) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Chart Card */}
            <div className="civic-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-sea" />
                    <h3 className="font-editorial text-xl font-semibold text-ink">
                      Neurketa konparatiboa: T0 vs T1 vs T2
                    </h3>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Euskararen erabileraren eboluzioa fase bakoitzean (%)
                  </p>
                </div>

                {primaryOndorioa && primaryDiff && primaryOndorioa.kodea === "argia" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-euskara/10 border border-euskara/20 text-euskara text-xs font-bold tabular-nums">
                    <TrendingUp className="w-4 h-4" />
                    <span>{formatSignedPuntu(primaryDiff.d * 100)} puntu (aldea argia da)</span>
                  </div>
                )}
              </div>

              {/* Visual Bars Container */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 pb-6">
                
                {/* T0 Bar */}
                <div className="flex flex-col items-center">
                  <div className="h-56 w-full max-w-[92px] bg-sand rounded-xl p-1.5 flex flex-col justify-end relative border border-line">
                    {t0Stats !== null && t0Pct !== null ? (
                      <>
                        <div
                          className="w-full bg-sea rounded-lg transition-all duration-700 flex flex-col items-center justify-center text-white font-bold text-sm tabular-nums"
                          style={{ height: `${Math.max(t0Pct, 15)}%` }}
                        >
                          <span>%{formatDecimalEu(t0Pct)}</span>
                        </div>
                        {/* Wilson %95eko zalantza-tartea */}
                        <div
                          className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-0.5 bg-slate-900/75"
                          style={{
                            bottom: `${Math.max(0, Math.min(100, t0Stats.wilson.behea * 100))}%`,
                            height: `${Math.max(1, (t0Stats.wilson.goia - t0Stats.wilson.behea) * 100)}%`,
                          }}
                          title={`Zalantza-tartea: %${formatDecimalEu(t0Stats.wilson.behea * 100)}–%${formatDecimalEu(t0Stats.wilson.goia * 100)}`}
                        >
                          <div className="absolute -top-0.5 -left-1.5 w-3.5 h-0.5 bg-slate-900/75" />
                          <div className="absolute -bottom-0.5 -left-1.5 w-3.5 h-0.5 bg-slate-900/75" />
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-ink-muted text-center font-medium p-1">
                        Zain (ez dago daturik)
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-3 w-full">
                    <span className="font-bold text-xs text-ink block">
                      T0 neurketa
                    </span>
                    <span className="text-[10px] text-ink-muted block">
                      {t0Stats
                        ? t0Stats.count === 1
                          ? "1 saio erregistratua"
                          : `${t0Stats.count} saioren faseko emaitza`
                        : "Oinarrizkoa (aurretik)"}
                    </span>
                    {t0Stats && (
                      <span
                        className="text-[10px] text-sea font-bold block mt-0.5 tabular-nums"
                        title={`Zalantza-tartea: %${formatDecimalEu(t0Stats.wilson.behea * 100)}–%${formatDecimalEu(t0Stats.wilson.goia * 100)}`}
                      >
                        {t0Stats.totalEuskaraz}/{t0Stats.totalInteractions} elkarrizketa
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setObservationConfig({ expId: currentExp.id, phase: "T0" });
                        setActiveTab("behaketa");
                      }}
                      className={`mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer w-full print:hidden ${
                        t0Stats
                          ? "text-sea bg-paper hover:bg-sand border-line"
                          : "text-white bg-sea hover:opacity-95 border-transparent"
                      }`}
                      title="Egin beste behaketa-saio bat T0 faseko emaitza osatzeko"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t0Stats ? "Beste saio bat" : "Neurtu T0"}</span>
                    </button>
                  </div>
                </div>

                {/* T1 Bar */}
                <div className="flex flex-col items-center">
                  <div className="h-56 w-full max-w-[92px] bg-sand rounded-xl p-1.5 flex flex-col justify-end relative border border-line">
                    {t1Stats !== null && t1Pct !== null ? (
                      <>
                        <div
                          className="w-full bg-ochre rounded-lg transition-all duration-700 flex flex-col items-center justify-center text-white font-bold text-sm tabular-nums"
                          style={{ height: `${Math.max(t1Pct, 15)}%` }}
                        >
                          <span>%{formatDecimalEu(t1Pct)}</span>
                          {immediateGain !== null && (
                            <span className="text-[10px] bg-black/20 px-1.5 rounded-sm mt-0.5">
                              {formatSignedPuntu(immediateGain)} p.
                            </span>
                          )}
                        </div>
                        {/* Wilson %95eko zalantza-tartea */}
                        <div
                          className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-0.5 bg-slate-900/75"
                          style={{
                            bottom: `${Math.max(0, Math.min(100, t1Stats.wilson.behea * 100))}%`,
                            height: `${Math.max(1, (t1Stats.wilson.goia - t1Stats.wilson.behea) * 100)}%`,
                          }}
                          title={`Zalantza-tartea: %${formatDecimalEu(t1Stats.wilson.behea * 100)}–%${formatDecimalEu(t1Stats.wilson.goia * 100)}`}
                        >
                          <div className="absolute -top-0.5 -left-1.5 w-3.5 h-0.5 bg-slate-900/75" />
                          <div className="absolute -bottom-0.5 -left-1.5 w-3.5 h-0.5 bg-slate-900/75" />
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[10px] text-ink-muted text-center font-medium p-1">
                        <span>T1 zain</span>
                        {t0Stats && (
                          <button
                            onClick={() => {
                              setObservationConfig({ expId: currentExp.id, phase: "T1" });
                              setActiveTab("behaketa");
                            }}
                            className="mt-2 text-[10px] text-sea font-bold underline cursor-pointer print:hidden"
                          >
                            Neurtu T1
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-3 w-full">
                    <span className="font-bold text-xs text-ink block">
                      T1 neurketa
                    </span>
                    <span className="text-[10px] text-ink-muted block">
                      {t1Stats
                        ? t1Stats.count === 1
                          ? "1 saio erregistratua"
                          : `${t1Stats.count} saioren faseko emaitza`
                        : "Esku-hartzearekin"}
                    </span>
                    {t1Stats && (
                      <span
                        className="text-[10px] text-ochre font-bold block mt-0.5 tabular-nums"
                        title={`Zalantza-tartea: %${formatDecimalEu(t1Stats.wilson.behea * 100)}–%${formatDecimalEu(t1Stats.wilson.goia * 100)}`}
                      >
                        {t1Stats.totalEuskaraz}/{t1Stats.totalInteractions} elkarrizketa
                      </span>
                    )}

                    {t0Stats && (
                      <button
                        onClick={() => {
                          setObservationConfig({ expId: currentExp.id, phase: "T1" });
                          setActiveTab("behaketa");
                        }}
                        className={`mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer w-full print:hidden ${
                          t1Stats
                            ? "text-ink bg-paper hover:bg-sand border-line"
                            : "text-white bg-ochre hover:opacity-95 border-transparent"
                        }`}
                        title="Egin beste behaketa-saio bat T1 fasean"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t1Stats ? "Beste saio bat" : "Neurtu T1"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* T2 Bar */}
                <div className="flex flex-col items-center">
                  <div className="h-56 w-full max-w-[92px] bg-sand rounded-xl p-1.5 flex flex-col justify-end relative border border-line">
                    {t2Stats !== null && t2Pct !== null ? (
                      <>
                        <div
                          className="w-full bg-euskara rounded-lg transition-all duration-700 flex flex-col items-center justify-center text-white font-bold text-sm tabular-nums"
                          style={{ height: `${Math.max(t2Pct, 15)}%` }}
                        >
                          <span>%{formatDecimalEu(t2Pct)}</span>
                          {sustainedGain !== null && (
                            <span className="text-[10px] bg-black/20 px-1.5 rounded-sm mt-0.5">
                              {formatSignedPuntu(sustainedGain)} p.
                            </span>
                          )}
                        </div>
                        {/* Wilson %95eko zalantza-tartea */}
                        <div
                          className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-0.5 bg-slate-900/75"
                          style={{
                            bottom: `${Math.max(0, Math.min(100, t2Stats.wilson.behea * 100))}%`,
                            height: `${Math.max(1, (t2Stats.wilson.goia - t2Stats.wilson.behea) * 100)}%`,
                          }}
                          title={`Zalantza-tartea: %${formatDecimalEu(t2Stats.wilson.behea * 100)}–%${formatDecimalEu(t2Stats.wilson.goia * 100)}`}
                        >
                          <div className="absolute -top-0.5 -left-1.5 w-3.5 h-0.5 bg-slate-900/75" />
                          <div className="absolute -bottom-0.5 -left-1.5 w-3.5 h-0.5 bg-slate-900/75" />
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[10px] text-ink-muted text-center font-medium p-1">
                        <span>T2 zain</span>
                        {t1Stats && (
                          <button
                            onClick={() => {
                              setObservationConfig({ expId: currentExp.id, phase: "T2" });
                              setActiveTab("behaketa");
                            }}
                            className="mt-2 text-[10px] text-euskara font-bold underline cursor-pointer print:hidden"
                          >
                            Neurtu T2
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-3 w-full">
                    <span className="font-bold text-xs text-ink block">
                      T2 neurketa
                    </span>
                    <span className="text-[10px] text-ink-muted block">
                      {t2Stats
                        ? t2Stats.count === 1
                          ? "1 saio erregistratua"
                          : `${t2Stats.count} saioren faseko emaitza`
                        : "Jarraipena / kentzea"}
                    </span>
                    {t2Stats && (
                      <span
                        className="text-[10px] text-euskara font-bold block mt-0.5 tabular-nums"
                        title={`Zalantza-tartea: %${formatDecimalEu(t2Stats.wilson.behea * 100)}–%${formatDecimalEu(t2Stats.wilson.goia * 100)}`}
                      >
                        {t2Stats.totalEuskaraz}/{t2Stats.totalInteractions} elkarrizketa
                      </span>
                    )}

                    {t1Stats && (
                      <button
                        onClick={() => {
                          setObservationConfig({ expId: currentExp.id, phase: "T2" });
                          setActiveTab("behaketa");
                        }}
                        className={`mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer w-full print:hidden ${
                          t2Stats
                            ? "text-euskara bg-paper hover:bg-sand border-line"
                            : "text-white bg-euskara hover:opacity-95 border-transparent"
                        }`}
                        title="Egin beste behaketa-saio bat T2 fasean"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t2Stats ? "Beste saio bat" : "Neurtu T2"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Ondorio zintzoa (zalantza-tarteekin) */}
              <div className="bg-paper rounded-2xl p-4 border border-line space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-euskara" />
                  <span className="text-xs font-bold text-ink">
                    Ondorioa (faseko emaitzetan oinarritua):
                  </span>
                </div>

                {t0Stats && (t1Stats || t2Stats) && primaryDiff && primaryOndorioa ? (
                  <>
                    <p className="text-xs font-semibold text-ink tabular-nums">
                      T0: %{formatDecimalEu(t0Stats.pct)} ({t0Stats.totalEuskaraz}/{t0Stats.totalInteractions})
                      {" · "}
                      {t2Stats ? (
                        <>
                          T2: %{formatDecimalEu(t2Stats.pct)} ({t2Stats.totalEuskaraz}/{t2Stats.totalInteractions})
                        </>
                      ) : (
                        <>
                          T1: %{formatDecimalEu(t1Stats!.pct)} ({t1Stats!.totalEuskaraz}/{t1Stats!.totalInteractions})
                        </>
                      )}
                      {" · "}
                      Aldea: {formatSignedPuntu(primaryDiff.d * 100)} puntu ({formatAldeaTarteaEu(primaryDiff)})
                    </p>
                    <p
                      className={`text-xs leading-relaxed ${
                        primaryOndorioa.kodea === "argia"
                          ? "text-euskara font-semibold"
                          : primaryOndorioa.kodea === "jaitsiera"
                          ? "text-terracotta font-semibold"
                          : "text-ink-muted"
                      }`}
                    >
                      {primaryOndorioa.testua}
                    </p>
                    {isT2Kentzea && t1Stats && t2Stats && t2VsT1 && (
                      <div className="pt-2 border-t border-line/70 space-y-1">
                        <p className="text-xs font-semibold text-ink tabular-nums">
                          T2 kentzea (ABA): T1 %{formatDecimalEu(t1Stats.pct)} ({t1Stats.totalEuskaraz}/{t1Stats.totalInteractions})
                          {" → "}
                          T2 %{formatDecimalEu(t2Stats.pct)} ({t2Stats.totalEuskaraz}/{t2Stats.totalInteractions})
                          {" · "}
                          Aldea (T2 − T1): {formatSignedPuntu(t2VsT1.d * 100)} puntu ({formatAldeaTarteaEu(t2VsT1)})
                        </p>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          {t2VsT1.goia < 0
                            ? "Esku-hartzea kentzean erabilera jaitsi da: horrek adierazten du esku-hartzeak eragina zuela."
                            : t2VsT1.behea <= 0 && 0 <= t2VsT1.goia
                            ? "Esku-hartzea kendu eta erabilera antzeko mantendu da. Igoera ez da esku-hartzearen ondorioa, edo ohitura bihurtu da. Oraindik ez dakigu."
                            : "Esku-hartzea kendu eta erabilera igo egin da. Beste faktore batzuek eragin dezakete; oraindik ez dakigu."}
                        </p>
                      </div>
                    )}
                    {observerChangedAcrossPhases && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        Behatzailea aldatu da faseen artean; aldearen zati bat horregatik izan daiteke.
                      </p>
                    )}
                    {Number(currentExp.t1_egonkortu_gabe || 0) === 1 && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        Kontuz: oinarri-lerroa igotzen ari zen. Igoeraren zati bat esku-hartzearen aurrekoa izan daiteke.
                      </p>
                    )}
                    {((t0Stats?.totalAldaketa || 0) + (t1Stats?.totalAldaketa || 0) + (t2Stats?.totalAldaketa || 0)) > 0 && (
                      <p className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
                        Horietatik{" "}
                        <strong>
                          {(t0Stats?.totalAldaketa || 0) + (t1Stats?.totalAldaketa || 0) + (t2Stats?.totalAldaketa || 0)}
                        </strong>{" "}
                        bezero erdaraz hasi eta euskarara pasatu dira.
                      </p>
                    )}
                  </>
                ) : t0Stats ? (
                  <p className="text-xs text-ink-muted leading-relaxed">
                    T0: %{formatDecimalEu(t0Stats.pct)} ({t0Stats.totalEuskaraz}/{t0Stats.totalInteractions}, tartea %{formatDecimalEu(t0Stats.wilson.behea * 100)}–%{formatDecimalEu(t0Stats.wilson.goia * 100)}). Egin gutxienez {saioGutxienekoa} saio oso oinarri-lerroa ezagutzeko, esku-hartzea martxan jarri aurretik.
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Esperimentua prest dago. Lehenik eta behin, egin hasierako T0 neurketak zure entitatean.
                  </p>
                )}
              </div>

              {/* LATXA B BLOKEA: EMAITZEN ETA OHARREN ANALISI KUALITATIBOA */}
              <div className="bg-paper/90 rounded-2xl p-5 sm:p-6 text-ink border border-line border-l-4 border-l-indigo-600 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sea/10 border border-sea/25 flex items-center justify-center text-sea shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-ink text-sm">
                          Latxa: Emaitzen eta Oharren Analisi Kualitatiboa
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-sea/10 border border-sea/25 text-sea text-[10px] font-semibold">
                          Latxa 3
                        </span>
                        {latxaAnalysisResult && (
                          <span className="px-2 py-0.5 rounded-md bg-euskara/10 border border-euskara/25 text-euskara text-[10px] font-semibold">
                            Gordeta{latxaAnalysisResult.sortze_data ? ` • ${new Date(latxaAnalysisResult.sortze_data).toLocaleDateString("eu-ES")}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Zenbakietatik harago: aztertu behatzaileen oharrak, inertziak eta osatu lantaldearentzako txosten narratiboa.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunLatxaAnalysis}
                    disabled={isAnalyzingWithLatxa || expNeurketak.length === 0}
                    className="px-4 py-2 bg-sea hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 print:hidden"
                  >
                    {isAnalyzingWithLatxa ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Oharrak aztertzen...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {latxaAnalysisResult ? "Berritu analisia" : "Sortu analisia eta txostena"}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {latxaAnalysisError && (
                  <div className="mt-3 p-3 rounded-xl bg-terracotta/10 border border-terracotta/25 text-terracotta text-xs">
                    {latxaAnalysisError}
                  </div>
                )}

                {/* EMAITZA BISTARATZEA */}
                {latxaAnalysisResult && (
                  <div className="mt-4 pt-4 border-t border-line space-y-3.5 animate-in fade-in duration-300">
                    {/* Ondorio Nagusia */}
                    {latxaAnalysisResult.ondorio_nagusia && (
                      <div className="bg-white border border-line rounded-xl p-4 text-xs sm:text-sm text-ink leading-relaxed">
                        <span className="font-bold text-sea block mb-1 uppercase tracking-wider text-[10px]">
                          Emaitzen balorazio orokorra
                        </span>
                        <p>{latxaAnalysisResult.ondorio_nagusia}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Ohar Kualitatiboen Analisia */}
                      {latxaAnalysisResult.oharren_analisia && (
                        <div className="bg-white border border-line rounded-xl p-3.5">
                          <span className="font-bold text-amber-800 block mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-600" />
                            Behatzaileen oharrak eta portaera-patroiak
                          </span>
                          <p className="text-ink leading-relaxed text-[11px]">
                            {latxaAnalysisResult.oharren_analisia}
                          </p>
                        </div>
                      )}

                      {/* Balorazio Kuantitatiboa */}
                      {latxaAnalysisResult.balorazio_kuantitatiboa && (
                        <div className="bg-white border border-line rounded-xl p-3.5">
                          <span className="font-bold text-euskara block mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-euskara" />
                            Datuen eta igoeraren sendotasuna
                          </span>
                          <p className="text-ink leading-relaxed text-[11px]">
                            {latxaAnalysisResult.balorazio_kuantitatiboa}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Hurrengo urratsak */}
                    {latxaAnalysisResult.hurrengo_urratsak && latxaAnalysisResult.hurrengo_urratsak.length > 0 && (
                      <div className="bg-sea/5 border border-sea/25 rounded-xl p-3.5">
                        <span className="font-bold text-sea block mb-1.5 uppercase tracking-wider text-[10px]">
                          Lantaldearentzako hurrengo urrats gomendatuak
                        </span>
                        <ul className="space-y-1 text-[11px] text-ink">
                          {latxaAnalysisResult.hurrengo_urratsak.map((u, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-sea font-bold">•</span>
                              <span>{u}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Txosten Laburpena & Kopiatzeko Botoia */}
                    {latxaAnalysisResult.txosten_laburpena && (
                      <div className="bg-white text-ink rounded-xl p-4 border border-line">
                        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-line">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                            <FileText className="w-3 h-3 text-sea" />
                            Lantaldearekin partekatzeko txosten narratiboa
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyReport}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand hover:bg-slate-200 text-ink text-[10px] font-bold transition cursor-pointer print:hidden"
                            title="Kopiatu txosten osoa arbelean"
                          >
                            {copiedReport ? (
                              <>
                                <Check className="w-3 h-3 text-euskara" />
                                <span className="text-euskara">Kopiatuta!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Kopiatu txostena</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-ink leading-relaxed whitespace-pre-line font-medium">
                          {latxaAnalysisResult.txosten_laburpena}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* FASEEN EMAITZEN LABURPEN KOADROA */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-line">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-euskara" />
                  <h4 className="font-bold text-ink text-sm">
                    Faseko emaitzen laburpena
                  </h4>
                </div>
                <span className="text-[11px] text-ink-muted font-medium">
                  {expNeurketak.length} saio guztira erregistratuta
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* T0 Card */}
                <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-sky-950">T0 (hasierakoa)</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-800">
                        {t0Stats ? `${t0Stats.count} saio` : "0 saio"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-sky-900 my-1 tabular-nums">
                      {t0Stats ? `%${formatDecimalEu(t0Stats.pct)}` : "—"}
                    </div>
                    <p className="text-[11px] text-sky-700 tabular-nums">
                      {t0Stats
                        ? `${t0Stats.totalEuskaraz}/${t0Stats.totalInteractions} elkarrizketa`
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
                      <span className="text-xs font-bold text-teal-950">T1 (esku-hartzea)</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-800">
                        {t1Stats ? `${t1Stats.count} saio` : "0 saio"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-teal-900 my-1 tabular-nums">
                      {t1Stats ? `%${formatDecimalEu(t1Stats.pct)}` : "—"}
                      {immediateGain !== null && (
                        <span className="text-xs font-bold ml-2 text-teal-600">
                          ({formatSignedPuntu(immediateGain)} p.)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-teal-700 tabular-nums">
                      {t1Stats
                        ? `${t1Stats.totalEuskaraz}/${t1Stats.totalInteractions} elkarrizketa`
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
                    <span className="mt-3 text-[11px] text-ink-muted text-center py-1.5">
                      T0 neurtu behar da lehenik
                    </span>
                  )}
                </div>

                {/* T2 Card */}
                <div className="bg-euskara/10 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-950">T2</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/80 text-euskara">
                        {t2Stats ? `${t2Stats.count} saio` : "0 saio"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-euskara my-1 tabular-nums">
                      {t2Stats ? `%${formatDecimalEu(t2Stats.pct)}` : "—"}
                      {sustainedGain !== null && (
                        <span className="text-xs font-bold ml-2 text-euskara">
                          ({formatSignedPuntu(sustainedGain)} p.)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-euskara tabular-nums">
                      {t2Stats
                        ? `${t2Stats.totalEuskaraz}/${t2Stats.totalInteractions} elkarrizketa`
                        : "Zain"}
                    </p>
                  </div>
                  {t1Stats ? (
                    <button
                      onClick={() => {
                        setObservationConfig({ expId: currentExp.id, phase: "T2" });
                        setActiveTab("behaketa");
                      }}
                      className="mt-3 text-[11px] font-bold text-euskara hover:text-euskara bg-white hover:bg-euskara/15 py-1.5 px-3 rounded-xl border border-euskara/25 transition text-center cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t2Stats ? "Gehitu T2 saioa" : "Hasi T2 saioa"}</span>
                    </button>
                  ) : (
                    <span className="mt-3 text-[11px] text-ink-muted text-center py-1.5">
                      T1 neurtu behar da lehenik
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Measurements Table */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-line">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-ink text-sm">
                  Jasotako saio guztien zerrenda
                </h4>
                <span className="text-xs text-ink-muted">
                  Saio bakoitzak faseko emaitza osatzen du
                </span>
              </div>

              {expNeurketak.length === 0 ? (
                <p className="text-xs text-ink-muted py-4 text-center">
                  Oraindik ez dago neurketarik erregistratuta.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line text-ink-muted font-semibold uppercase text-[10px]">
                        <th className="pb-2">Fasea eta saioa</th>
                        <th className="pb-2">Euskaraz</th>
                        <th className="pb-2">Erdaraz</th>
                        <th className="pb-2">Elebi</th>
                        <th className="pb-2">Euskara %</th>
                        <th className="pb-2">Zalantza (±)</th>
                        <th className="pb-2">Egoera</th>
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
                          const pct = total > 0 ? Math.round((neu.euskaraz_count / total) * 1000) / 10 : 0;
                          const zalantzaPuntu = Math.round(wilsonMarjinaPuntu(neu.euskaraz_count, total));
                          const egoera = neurketaEgoera(neu, { nGutxienekoa, protokoloa: expProtokoloa });
                          const minutes = Math.max(1, Math.round((neu.iraupena_segundotan || 600) / 60));

                          // Determine session number in its phase
                          const samePhaseSorted = [...expNeurketak]
                            .filter((n) => n.unea === neu.unea)
                            .sort((a, b) => new Date(a.data_ordu).getTime() - new Date(b.data_ordu).getTime());
                          const sessionIndex = samePhaseSorted.findIndex((n) => n.id === neu.id) + 1;

                          return (
                            <tr key={neu.id} className="hover:bg-paper/50">
                              <td className="py-2.5 font-bold text-ink">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                      neu.unea === "T0"
                                        ? "bg-sky-100 text-sky-800"
                                        : neu.unea === "T1"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-euskara/15 text-euskara"
                                    }`}
                                  >
                                    {neu.unea}
                                  </span>
                                  <span className="text-[11px] font-medium text-ink-muted">
                                    ({sessionIndex}. saioa)
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 font-semibold text-euskara">
                                {neu.euskaraz_count}
                              </td>
                              <td className="py-2.5 font-semibold text-terracotta">
                                {neu.erdaraz_count}
                              </td>
                              <td className="py-2.5 font-semibold text-amber-600">
                                {neu.elebi_count}
                              </td>
                              <td className="py-2.5 font-extrabold text-ink tabular-nums">
                                %{formatDecimalEu(pct)}
                              </td>
                              <td className="py-2.5 text-ink-muted font-medium tabular-nums">
                                {total > 0 ? `±${zalantzaPuntu} puntu` : "—"}
                              </td>
                              <td className="py-2.5">
                                <div className="flex flex-wrap gap-1">
                                  {egoera.osoa ? (
                                    <span className="px-1.5 py-0.5 rounded-md bg-euskara/10 text-euskara text-[10px] font-bold">
                                      Osoa
                                    </span>
                                  ) : (
                                    <>
                                      {egoera.laginTxikia && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                                          Lagin txikia
                                        </span>
                                      )}
                                      {egoera.protokolotikKanpo && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                          Protokolotik kanpo
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 text-ink-muted font-medium">
                                {minutes} min
                              </td>
                              <td className="py-2.5 text-ink-muted max-w-[120px] truncate" title={formatBehatzaileaDisplay(neu.behatzailea)}>
                                {formatBehatzaileaDisplay(neu.behatzailea)}
                              </td>
                              <td className="py-2.5 text-ink-muted">
                                {new Date(neu.data_ordu).toLocaleDateString("eu-ES")}
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditNeurketaModal(neu)}
                                    className="p-1 text-ink-muted hover:text-sea hover:bg-sea/10 rounded-lg transition cursor-pointer"
                                    title="Editatu saio hau"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNeurketaToDeleteConfirm({
                                        id: neu.id,
                                        unea: neu.unea,
                                        sessionIndex,
                                      })
                                    }
                                    className="p-1 text-slate-300 hover:text-terracotta hover:bg-terracotta/10 rounded-lg transition cursor-pointer"
                                    title="Ezabatu saio hau"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
        /* Optional Pilot Selection & Hypothesis Card when !currentExp */
        <div className="bg-white rounded-2xl p-6 sm:p-10 max-w-2xl mx-auto border border-line shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-euskara/15 text-euskara flex items-center justify-center shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-euskara">
                1. urratsa • Aukeratu pilotua edo sortu hipotesia
              </span>
              <h3 className="text-xl font-extrabold text-ink">
                Aukeratu zure entitatearen lehen pilotua
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted mb-5 leading-relaxed">
            Zure kontua prest dago. Neurketekin hasteko, ikusi katalogoko esku-hartze pilotuak eta aukeratu zure entitateari ondoen egokitzen zaiona, edo idatzi zuzenean behean zure hipotesia:
          </p>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("katalogoa")}
              className="w-full py-3.5 px-5 rounded-xl bg-sea hover:bg-indigo-800 text-white font-bold text-sm shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Diseinatu Latxa Kopilotuarekin</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("katalogoa")}
              className="w-full py-3.5 px-5 rounded-xl bg-euskara hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Ikusi pilotuen katalogoa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <details className="group border-t border-line pt-4">
            <summary className="text-xs font-bold text-ink-muted hover:text-ink cursor-pointer list-none flex items-center justify-between">
              <span>Edo idatzi zuzenean zure hipotesia hemen bertan</span>
              <span className="text-euskara group-open:rotate-90 transition-transform">→</span>
            </summary>

            <form onSubmit={handleCreateQuickExp} className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-ink">
                    Zuen hipotesia *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleImproveTextWithLatxa("quick")}
                    disabled={isImprovingHypoWithLatxa}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sea/10 hover:bg-sea/15 text-sea border border-sea/25 text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <Bot className="w-3 h-3 text-sea" />
                    <span>{isImprovingHypoWithLatxa ? "Latxa fintzen..." : " Hobetu Latxarekin"}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={quickHipotesia}
                  onChange={(e) => setQuickHipotesia(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-euskara/40 bg-euskara/10 text-xs sm:text-sm font-semibold text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Behaketa-gunea (non)
                  </label>
                  <input
                    type="text"
                    required
                    value={quickGunea}
                    onChange={(e) => setQuickGunea(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-line text-xs font-medium text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Xede-igoera (puntu)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={quickXedea}
                    onChange={(e) => setQuickXedea(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-line text-xs font-bold text-euskara"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isCreatingQuickExp || !quickHipotesia.trim()}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{isCreatingQuickExp ? "Gordetzen..." : "Gorde hipotesia eta hasi T0 neurtzen →"}</span>
                </button>
              </div>
            </form>
          </details>
        </div>
      )}

      {/* KOMUNITATEAREN ERREFERENTZIA (ANONIMIZATUA / PRIBATUTASUNA BABESTUTA) */}
      {eragileak.length > 1 && (
        <div className="mt-10 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-line">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sea/10 text-sea flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-base">
                  Komunitatearen erreferentzia (pribatutasuna babestuta)
                </h3>
                <p className="text-xs text-ink-muted">
                  Beste entitateen bilakaera ikus dezakezu; izenak kode anonimo gisa agertzen dira (adib. <strong>Entitatea #ID</strong>), entitateak berak izena publiko egitea onartu ezean.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-sand text-ink text-xs font-bold shrink-0">
              {eragileak.length} entitate komunitatean
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {eragileak.map((er) => {
              const isMe = er.id === activeEragilea.id;
              const label = getPublicEragileLabel(er, currentUser?.role, activeEragilea.id);
              const erExp = esperimentuak.find((e) => e.eragile_id === er.id);
              const erNeurketak = erExp
                ? neurketak.filter((n) => n.esperimentu_id === erExp.id)
                : [];
              const erT0 = computePhaseStats(erNeurketak, "T0");
              const erT1 = computePhaseStats(erNeurketak, "T1");
              const erT2 = computePhaseStats(erNeurketak, "T2");

              return (
                <div
                  key={er.id}
                  className={`p-4 rounded-2xl border transition ${
                    isMe
                      ? "bg-euskara/5 border-euskara/40 ring-1 ring-emerald-300"
                      : "bg-paper/70 border-line"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isMe || Number(er.publikoa) === 1 || currentUser?.role === "admin" ? (
                        <Unlock className="w-3.5 h-3.5 text-euskara shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      )}
                      <span className="font-bold text-xs text-ink truncate">
                        {label}
                      </span>
                    </div>
                    {isMe && (
                      <span className="px-2 py-0.5 rounded-full bg-euskara text-white text-[10px] font-extrabold shrink-0">
                        Zure entitatea
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
                    <div className="bg-white rounded-xl py-1.5 px-1 border border-line">
                      <span className="block text-[9px] font-bold text-ink-muted">T0</span>
                      <span className="text-xs font-extrabold text-sky-700">
                        {erT0 ? `%${erT0.pct}` : "—"}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl py-1.5 px-1 border border-line">
                      <span className="block text-[9px] font-bold text-ink-muted">T1</span>
                      <span className="text-xs font-extrabold text-teal-700">
                        {erT1 ? `%${erT1.pct}` : "—"}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl py-1.5 px-1 border border-line">
                      <span className="block text-[9px] font-bold text-ink-muted">T2</span>
                      <span className="text-xs font-extrabold text-euskara">
                        {erT2 ? `%${erT2.pct}` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT SINGLE MEASUREMENT SESSION MODAL */}
      {neurketaToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg border border-line">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Pencil className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">
                    Neurketa-saioa editatu
                  </h3>
                  <p className="text-xs text-ink-muted">
                    {isAdmin
                      ? "Zuzendu entitatea, fasea, behatzailea edo elkarrizketa kopuruak"
                      : "Zuzendu fasea, behatzailea edo elkarrizketa kopuruak"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNeurketaToEdit(null)}
                className="text-ink-muted hover:text-ink-muted p-1 rounded-lg hover:bg-sand transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditNeurketa} className="space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Entitatea (eragilea)
                  </label>
                  <select
                    value={editNeuEragileId}
                    onChange={(e) => {
                      const nextEragileId = e.target.value;
                      setEditNeuEragileId(nextEragileId);
                      const matchingExp = esperimentuak.find((ex) => ex.eragile_id === nextEragileId);
                      setEditNeuExpId(matchingExp?.id || "");
                    }}
                    className="w-full border border-line rounded-xl px-3 py-2 text-xs font-bold text-ink bg-paper focus:bg-white focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                  >
                    {eragileak.map((er) => (
                      <option key={er.id} value={er.id}>
                        {er.izena}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Fasea (T0 / T1 / T2)
                  </label>
                  <select
                    value={editNeuUnea}
                    onChange={(e) => setEditNeuUnea(e.target.value as "T0" | "T1" | "T2")}
                    className="w-full border border-line rounded-xl px-3 py-2 text-xs font-bold text-ink"
                  >
                    <option value="T0">T0 (hasierako neurketa)</option>
                    <option value="T1">T1 (tarteko neurketa)</option>
                    <option value="T2">T2 (amaierako neurketa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Behatzailea
                  </label>
                  <input
                    type="text"
                    value={editNeuBehatzailea}
                    onChange={(e) => setEditNeuBehatzailea(e.target.value)}
                    className="w-full border border-line rounded-xl px-3 py-2 text-xs text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-euskara/10 p-2.5 rounded-xl border border-euskara/25">
                  <label className="block text-[10px] font-extrabold uppercase text-euskara mb-1">
                    Euskaraz
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editNeuEusk}
                    onChange={(e) => setEditNeuEusk(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-euskara/40 rounded-lg px-2.5 py-1.5 text-sm font-black text-euskara"
                  />
                </div>

                <div className="bg-terracotta/10 p-2.5 rounded-xl border border-terracotta/25">
                  <label className="block text-[10px] font-extrabold uppercase text-terracotta mb-1">
                    Erdaraz
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editNeuErd}
                    onChange={(e) => setEditNeuErd(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-terracotta/40 rounded-lg px-2.5 py-1.5 text-sm font-black text-terracotta"
                  />
                </div>

                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <label className="block text-[10px] font-extrabold uppercase text-amber-800 mb-1">
                    Elebi
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editNeuElebi}
                    onChange={(e) => setEditNeuElebi(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-sm font-black text-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Oharrak
                </label>
                <textarea
                  rows={2}
                  value={editNeuOharrak}
                  onChange={(e) => setEditNeuOharrak(e.target.value)}
                  className="w-full border border-line rounded-xl px-3 py-2 text-xs text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setNeurketaToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isSavingNeurketaEdit}
                  className="px-5 py-2.5 bg-sea hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNeurketaEdit ? "Gordetzen..." : "Gorde saioa"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE HYPOTHESIS CONFIRMATION MODAL */}
      {expToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg border border-line">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-terracotta/15 text-terracotta rounded-2xl shrink-0">
                <Trash2 className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-base">
                  Hipotesia ezabatu?
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Ziur zaude hipotesi hau eta hari lotutako neurketak ezabatu nahi dituzula? Beste hipotesi bat sor dezakezu gero.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setExpToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
              >
                Utzi
              </button>
              <button
                type="button"
                disabled={isDeletingExp}
                onClick={async () => {
                  setIsDeletingExp(true);
                  const ok = await deleteEsperimentua(expToDelete.id);
                  setIsDeletingExp(false);
                  if (ok) {
                    setIsEditingHypothesis(false);
                    setExpToDelete(null);
                  }
                }}
                className="px-5 py-2.5 bg-terracotta hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingExp ? "Ezabatzen..." : "Bai, ezabatu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MEASUREMENT SESSION CONFIRMATION MODAL */}
      {neurketaToDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg border border-line">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-terracotta/15 text-terracotta rounded-2xl shrink-0">
                <Trash2 className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-base">
                  Neurketa-saioa ezabatu?
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Ziur zaude <strong>{neurketaToDeleteConfirm.unea}</strong> faseko <strong>{neurketaToDeleteConfirm.sessionIndex}. saioa</strong> ezabatu nahi duzula? Faseko emaitza birkalkulatuko da.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setNeurketaToDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
              >
                Utzi
              </button>
              <button
                type="button"
                disabled={isDeletingNeurketa}
                onClick={async () => {
                  setIsDeletingNeurketa(true);
                  await deleteNeurketa(neurketaToDeleteConfirm.id);
                  setIsDeletingNeurketa(false);
                  setNeurketaToDeleteConfirm(null);
                }}
                className="px-5 py-2.5 bg-terracotta hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingNeurketa ? "Ezabatzen..." : "Bai, ezabatu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Txostenaren aurrebista eta PDF deskarga modala */}
      {showReportModal && currentExp && activeEragilea && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-6 print:hidden">
          <div className="bg-paper rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-line overflow-hidden">
            {/* Modal Toolbar */}
            <div className="bg-white border-b border-line px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-euskara" />
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Txostenaren aurrebista (A4 · PDF)
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    {isAnalyzingWithLatxa
                      ? "Latxa txostenaren testua eta ondorioak idazten ari da..."
                      : latxaAnalysisResult
                      ? "Latxaren analisiarekin osatuta — prest PDF gisa gordetzeko."
                      : "Datuen txostena prest. Nahi baduzu, sortu analisi narratiboa Latxarekin."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {expNeurketak.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRunLatxaAnalysis}
                    disabled={isAnalyzingWithLatxa}
                    className="px-3 py-2 rounded-xl bg-sea/10 hover:bg-sea/15 text-sea border border-sea/25 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzingWithLatxa ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Latxa idazten...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        <span>{latxaAnalysisResult ? "Berritu Latxarekin" : "Sortu Latxarekin"}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-euskara hover:opacity-95 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Deskargatu PDF / Inprimatu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-2 rounded-xl text-ink-muted hover:bg-sand transition cursor-pointer"
                  title="Itxi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {latxaAnalysisError && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-900">
                Latxa ezin izan da konektatu ({latxaAnalysisError}), baina datuen PDF txostena zuzenean deskarga dezakezu.
              </div>
            )}

            {/* A4 Paper Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70">
              <div className="bg-white shadow-lg border border-line rounded-sm p-6 sm:p-10 mx-auto max-w-[210mm]">
                <TxostenInprimagarria
                  eragilea={activeEragilea}
                  esperimentua={currentExp}
                  expNeurketak={expNeurketak}
                  t0Stats={t0Stats}
                  t1Stats={t1Stats}
                  t2Stats={t2Stats}
                  primaryDiff={primaryDiff}
                  primaryOndorioa={primaryOndorioa}
                  t2VsT1={t2VsT1}
                  observerChangedAcrossPhases={observerChangedAcrossPhases}
                  latxaAnalysis={latxaAnalysisResult}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Inprimatzeko / PDF bertsio garbia (aplikazioaren interfazerik gabe) */}
    {currentExp && activeEragilea && (
      <div className="hidden print:block bg-white">
        <TxostenInprimagarria
          eragilea={activeEragilea}
          esperimentua={currentExp}
          expNeurketak={expNeurketak}
          t0Stats={t0Stats}
          t1Stats={t1Stats}
          t2Stats={t2Stats}
          primaryDiff={primaryDiff}
          primaryOndorioa={primaryOndorioa}
          t2VsT1={t2VsT1}
          observerChangedAcrossPhases={observerChangedAcrossPhases}
          latxaAnalysis={latxaAnalysisResult}
        />
      </div>
    )}
    </>
  );
}
