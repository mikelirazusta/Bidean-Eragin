"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  Download,
  Send,
  Eye,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  MessageSquare,
  Star,
  Flame,
  MessageCircleHeart,
  Timer,
  Store,
  X,
  BadgeCheck,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Pencil,
  Save,
  FlaskConical,
  Monitor,
  Printer,
  Lock,
  Unlock,
  FileText,
  Bot,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";
import { useApp, getPublicEragileLabel, DEFAULT_UI_TEXTS, formatBehatzaileaDisplay } from "@/context/AppContext";
import type { Eragilea, Esperimentua, Neurketa } from "@/lib/db";
import {
  wilson,
  aldea,
  ondorioa,
  parseProtokoloa,
  neurketaEgoera,
  faseSemaforoa,
  formatDecimalEu,
  formatSignedPuntu,
  formatAldeaTarteaEu,
} from "@/lib/estatistika";

const UI_TEXT_FIELDS: Array<{
  section: string;
  items: Array<{ key: string; label: string; multiline?: boolean }>;
}> = [
  {
    section: "1. Sarrerako ataria eta nabigazio-barra",
    items: [
      { key: "app_title", label: "Aplikazioaren izenburua" },
      { key: "app_subtitle", label: "Azpititulua (goiburua)" },
      { key: "auth_intro", label: "Sarrerako azalpen-testua", multiline: true },
      { key: "auth_step1_title", label: "1. urratsa (izenburua)" },
      { key: "auth_step1_desc", label: "1. urratsa (azalpena)" },
      { key: "auth_step2_title", label: "2. urratsa (izenburua)" },
      { key: "auth_step2_desc", label: "2. urratsa (azalpena)" },
      { key: "auth_step3_title", label: "3. urratsa (izenburua)" },
      { key: "auth_step3_desc", label: "3. urratsa (azalpena)" },
      { key: "nav_panela", label: "Menu-botoia: Nire panela" },
      { key: "nav_behaketa", label: "Menu-botoia: Neurtu (T0/T1/T2)" },
      { key: "nav_katalogoa", label: "Menu-botoia: Pilotuak" },
      { key: "nav_komunitatea", label: "Menu-botoia: Komunitatea" },
      { key: "nav_admin", label: "Menu-botoia: Koordinazioa" },
    ],
  },
  {
    section: "2. Neurketa-kontagailua (T0 / T1 / T2)",
    items: [
      { key: "counter_badge", label: "Goiko etiketa (kontagailua)" },
      { key: "counter_title", label: "Kontagailuaren izenburua" },
      { key: "counter_subtitle", label: "Kontagailuaren azalpena", multiline: true },
      { key: "counter_start_btn", label: "Saioa hasteko botoia" },
      { key: "counter_pause_btn", label: "Pausatzeko botoia" },
      { key: "counter_save_btn", label: "Amaitu eta gordetzeko botoia" },
      { key: "counter_btn_euskaraz", label: "Botoi berdea (euskaraz)" },
      { key: "counter_btn_erdaraz", label: "Botoi gorria (erdaraz)" },
      { key: "counter_btn_elebi", label: "Botoi horia (elebi)" },
    ],
  },
  {
    section: "3. Entitatearen panela eta pilotuen katalogoa",
    items: [
      { key: "dashboard_step1_title", label: "Panela — 1. urratsa (T0) izenburua" },
      { key: "dashboard_step1_desc", label: "Panela — 1. urratsa (T0) azalpena", multiline: true },
      { key: "dashboard_step2_title", label: "Panela — 2. urratsa (T1) izenburua" },
      { key: "dashboard_step3_title", label: "Panela — 3. urratsa (T2) izenburua" },
      { key: "katalogoa_title", label: "Pilotuen katalogoa — izenburua" },
      { key: "katalogoa_subtitle", label: "Pilotuen katalogoa — azpititulua", multiline: true },
    ],
  },
];

export default function AdminKoadroa() {
  const {
    currentUser,
    eragileak,
    esperimentuak,
    neurketak,
    pilotuak,
    createAdminNudge,
    createQuickPostua,
    createEsperimentua,
    updateEragilea,
    updateEsperimentua,
    deleteEsperimentua,
    updateNeurketa,
    deleteEragilea,
    deleteNeurketa,
    resetDemoData,
    updateAdminCredentials,
    uiTexts,
    updateUiTexts,
    refreshData,
    setObservationConfig,
    setCurrentEragileId,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMota, setFilterMota] = useState("all");
  const [selectedEragileForNudge, setSelectedEragileForNudge] = useState<Eragilea | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // App UI Texts Editor Modal state
  const [showTextEditorModal, setShowTextEditorModal] = useState(false);
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>({});
  const [isSavingTexts, setIsSavingTexts] = useState(false);
  const [textEditorSuccess, setTextEditorSuccess] = useState<string | null>(null);

  const openTextEditorModal = () => {
    setDraftTexts({ ...DEFAULT_UI_TEXTS, ...uiTexts });
    setTextEditorSuccess(null);
    setShowTextEditorModal(true);
  };

  const handleSaveTexts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTexts(true);
    setTextEditorSuccess(null);
    const ok = await updateUiTexts(draftTexts, false);
    setIsSavingTexts(false);
    if (ok) {
      setTextEditorSuccess("Testuak ondo gorde eta eguneratu dira aplikazio osoan!");
      setTimeout(() => {
        setTextEditorSuccess(null);
        setShowTextEditorModal(false);
      }, 1200);
    }
  };

  const handleResetDefaultTexts = async () => {
    if (!window.confirm("Ziur zaude testu guztiak jatorrizko balioetara leheneratu nahi dituzula?")) {
      return;
    }
    setIsSavingTexts(true);
    const ok = await updateUiTexts({}, true);
    setIsSavingTexts(false);
    if (ok) {
      setDraftTexts({ ...DEFAULT_UI_TEXTS });
      setTextEditorSuccess("Testu lehenetsiak berrezarri dira!");
    }
  };

  // Admin Account / Password change modal state
  const [showAdminAccountModal, setShowAdminAccountModal] = useState(false);
  const [adminCurrentPassword, setAdminCurrentPassword] = useState("");
  const [adminNewEmail, setAdminNewEmail] = useState("");
  const [adminNewName, setAdminNewName] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminAccountError, setAdminAccountError] = useState<string | null>(null);
  const [adminAccountSuccess, setAdminAccountSuccess] = useState<string | null>(null);
  const [isSavingAdminAccount, setIsSavingAdminAccount] = useState(false);

  const openAdminAccountModal = () => {
    setAdminCurrentPassword("");
    setAdminNewEmail(currentUser?.email || "admin@bagera.eus");
    setAdminNewName(currentUser?.name || "Bagera Koordinazioa");
    setAdminNewPassword("");
    setAdminAccountError(null);
    setAdminAccountSuccess(null);
    setShowAdminAccountModal(true);
  };

  const handleSaveAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAccountError(null);
    setAdminAccountSuccess(null);

    if (!adminCurrentPassword.trim()) {
      setAdminAccountError("Uneko pasahitza sartu behar duzu aldaketa baieztatzeko.");
      return;
    }

    setIsSavingAdminAccount(true);
    const res = await updateAdminCredentials({
      currentPassword: adminCurrentPassword,
      newEmail: adminNewEmail,
      newName: adminNewName,
      newPassword: adminNewPassword.trim() ? adminNewPassword : adminCurrentPassword,
    });
    setIsSavingAdminAccount(false);

    if (res.success) {
      setAdminCurrentPassword("");
      setAdminNewPassword("");
      setAdminAccountSuccess("Administratzailearen kontua eta pasahitza ondo eguneratu dira!");
      setTimeout(() => {
        setShowAdminAccountModal(false);
        setAdminAccountSuccess(null);
      }, 1500);
    } else {
      setAdminAccountError(res.error || "Errorea gertatu da datuak eguneratzean.");
    }
  };

  // Deletion & Reset states
  const [eragileToDelete, setEragileToDelete] = useState<Eragilea | null>(null);
  const [isDeletingEragile, setIsDeletingEragile] = useState(false);
  const [expToDelete, setExpToDelete] = useState<{ exp: Esperimentua; eragileIzena: string } | null>(null);
  const [isDeletingExp, setIsDeletingExp] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [neurketaDeletingId, setNeurketaDeletingId] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (expToDelete) setExpToDelete(null);
      else if (eragileToDelete) setEragileToDelete(null);
      else if (showResetConfirmModal) setShowResetConfirmModal(false);
      else if (neurketaToEdit) setNeurketaToEdit(null);
      else if (eragileToEdit) setEragileToEdit(null);
      else if (showAdminAccountModal) setShowAdminAccountModal(false);
      else if (showTextEditorModal) setShowTextEditorModal(false);
      else if (selectedEragileForNudge) setSelectedEragileForNudge(null);
      else if (showNewPostModal) setShowNewPostModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Edit Center & Hypothesis Modal state
  const [eragileToEdit, setEragileToEdit] = useState<Eragilea | null>(null);
  const [editIzena, setEditIzena] = useState("");
  const [editMota, setEditMota] = useState<string>("merkataritza");
  const [editArduraduna, setEditArduraduna] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editErronka, setEditErronka] = useState("");
  const [editExpId, setEditExpId] = useState<string | null>(null);
  const [editPilotuId, setEditPilotuId] = useState("barra-barra-txapak");
  const [editHipotesia, setEditHipotesia] = useState("");
  const [editTaldea, setEditTaldea] = useState("");
  const [editPertsonak, setEditPertsonak] = useState("");
  const [editGunea, setEditGunea] = useState("");
  const [editXedePct, setEditXedePct] = useState<number>(25);
  const [editEstatusa, setEditEstatusa] = useState<string>("T0_zain");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const openEditEragileModal = (eragile: Eragilea, exp?: Esperimentua) => {
    setEragileToEdit(eragile);
    setEditIzena(eragile.izena);
    setEditMota(eragile.mota);
    setEditArduraduna(eragile.arduraduna);
    setEditEmail(eragile.email || "");
    setEditPassword("");
    setEditErronka(eragile.erronka_nagusia);

    if (exp) {
      setEditExpId(exp.id);
      setEditPilotuId(exp.pilotu_id || "barra-barra-txapak");
      setEditHipotesia(exp.hipotesia);
      setEditTaldea(exp.taldea);
      setEditPertsonak(exp.pertsonak);
      setEditGunea(exp.gunea);
      setEditXedePct(exp.xede_portzentajea || 25);
      setEditEstatusa(exp.estatusa || "T0_zain");
    } else {
      setEditExpId(null);
      setEditPilotuId("barra-barra-txapak");
      setEditTaldea("Entitateko kideek");
      setEditPertsonak("herritarrekin eta bezeroekin");
      setEditGunea("harrera edo gune nagusian");
      setEditXedePct(25);
      setEditHipotesia("");
      setEditEstatusa("T0_zain");
    }
  };

  const handleSaveEditEragileAndExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eragileToEdit || !editIzena.trim()) return;

    setIsSavingEdit(true);
    await updateEragilea({
      id: eragileToEdit.id,
      izena: editIzena.trim(),
      mota: editMota,
      arduraduna: editArduraduna.trim() || "Arduraduna",
      email: editEmail.trim(),
      password: editPassword.trim() || undefined,
      erronka_nagusia: editErronka.trim() || "Gure entitatean lehen hitza eta elkarrizketa euskaraz piztea.",
    });

    if (editExpId && editHipotesia.trim()) {
      await updateEsperimentua({
        id: editExpId,
        pilotu_id: editPilotuId,
        hipotesia: editHipotesia.trim(),
        taldea: editTaldea.trim() || "Entitateko kideek",
        pertsonak: editPertsonak.trim() || "herritarrekin eta bezeroekin",
        gunea: editGunea.trim() || "harrera edo gune nagusian",
        xede_portzentajea: editXedePct,
        estatusa: editEstatusa,
      });
    } else if (editExpId && !editHipotesia.trim()) {
      await deleteEsperimentua(editExpId);
    } else if (!editExpId && editHipotesia.trim()) {
      await createEsperimentua({
        eragile_id: eragileToEdit.id,
        pilotu_id: editPilotuId,
        hipotesia: editHipotesia.trim(),
        taldea: editTaldea.trim() || "Entitateko kideek",
        pertsonak: editPertsonak.trim() || "herritarrekin eta bezeroekin",
        gunea: editGunea.trim() || "harrera edo gune nagusian",
        xede_portzentajea: editXedePct,
        skipNavigation: true,
      });
    }

    setIsSavingEdit(false);
    setEragileToEdit(null);
  };

  const openEditNeurketaModal = (n: Neurketa) => {
    const exp = esperimentuak.find((e) => e.id === n.esperimentu_id);
    setNeurketaToEdit(n);
    setEditNeuExpId(n.esperimentu_id);
    setEditNeuEragileId(exp?.eragile_id || eragileak[0]?.id || "");
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
      eragile_id: editNeuEragileId || undefined,
      esperimentu_id: editNeuExpId || undefined,
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

  const handleConfirmDeleteEragilea = async () => {
    if (!eragileToDelete) return;
    setIsDeletingEragile(true);
    setDeleteError(null);
    const ok = await deleteEragilea(eragileToDelete.id);
    setIsDeletingEragile(false);
    if (ok) {
      setEragileToDelete(null);
    } else {
      setDeleteError("Ezin izan da entitatea ezabatu. Saiatu berriro.");
    }
  };

  const handleConfirmDeleteExp = async () => {
    if (!expToDelete) return;
    setIsDeletingExp(true);
    setDeleteError(null);
    const targetExpId = expToDelete.exp.id;
    const ok = await deleteEsperimentua(targetExpId);
    setIsDeletingExp(false);
    if (ok) {
      if (editExpId === targetExpId) {
        setEditExpId(null);
        setEditHipotesia("");
      }
      setExpToDelete(null);
    } else {
      setDeleteError("Ezin izan da hipotesia ezabatu. Saiatu berriro.");
    }
  };

  const handleDeleteSingleNeurketa = async (id: string) => {
    setNeurketaDeletingId(id);
    await deleteNeurketa(id);
    setNeurketaDeletingId(null);
  };

  const handleConfirmResetAll = async () => {
    setIsResettingAll(true);
    await resetDemoData();
    setIsResettingAll(false);
    setShowResetConfirmModal(false);
  };

  // New Entity Modal State
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [postName, setPostName] = useState("");
  const [postManager, setPostManager] = useState("");
  const [postErronka, setPostErronka] = useState("Entitatean lehen hitza eta elkarrizketa euskaraz piztea.");
  const [postTaldea, setPostTaldea] = useState("Entitateko kideek");
  const [postPertsonak, setPostPertsonak] = useState("herritarrekin eta bezeroekin");
  const [postGunea, setPostGunea] = useState("harrera edo gune nagusian");
  const [postTargetPct, setPostTargetPct] = useState(25);
  const [postHipotesia, setPostHipotesia] = useState(
    "Entitateko kideek esku-hartze pilotua aktibatuta, harrera-gunean lehen hitza eta elkarrizketak euskaraz %25 igoko dira."
  );
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postName.trim()) return;

    setIsCreatingPost(true);
    const created = await createQuickPostua({
      izena: postName.trim(),
      arduraduna: postManager.trim() || undefined,
      erronka_nagusia: postErronka.trim() || undefined,
      taldea: postTaldea.trim() || undefined,
      pertsonak: postPertsonak.trim() || undefined,
      gunea: postGunea.trim() || undefined,
      hipotesia: postHipotesia.trim() || undefined,
      xede_portzentajea: postTargetPct,
    });
    setIsCreatingPost(false);

    if (created) {
      setPostName("");
      setPostManager("");
      setShowNewPostModal(false);
    }
  };

  // New custom nudge form
  const [nudgeTitle, setNudgeTitle] = useState("");
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [nudgeType, setNudgeType] = useState<"abisua" | "bultzada" | "zoriontzea">("bultzada");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isGeneratingNudgeLatxa, setIsGeneratingNudgeLatxa] = useState(false);

  // Block C: Community-wide Latxa Executive Report state
  const [isGeneratingCommunityReport, setIsGeneratingCommunityReport] = useState(false);
  const [communityReportError, setCommunityReportError] = useState<string | null>(null);
  const [copiedCommunityReport, setCopiedCommunityReport] = useState(false);
  const [communityReport, setCommunityReport] = useState<{
    ondorio_orokorra?: string;
    joera_kualitatiboak?: string;
    arrakasta_gakoak?: string;
    gomendio_estrategikoak?: string[];
    txosten_exekutiboa?: string;
    sortze_data?: string;
  } | null>(null);

  React.useEffect(() => {
    if (uiTexts.komunitate_ai_txostena) {
      try {
        const parsed = JSON.parse(uiTexts.komunitate_ai_txostena);
        if (parsed && parsed.ondorio_orokorra) {
          setCommunityReport(parsed);
        }
      } catch {
        // ignore invalid json
      }
    }
  }, [uiTexts.komunitate_ai_txostena]);

  const handleGenerateNudgeWithLatxa = async () => {
    if (!selectedEragileForNudge || isGeneratingNudgeLatxa) return;
    setIsGeneratingNudgeLatxa(true);

    const exp = esperimentuak.find((e) => e.eragile_id === selectedEragileForNudge.id);
    const expNeu = neurketak.filter((n) => n.esperimentu_id === exp?.id);
    const calcSimplePhase = (phase: "T0" | "T1" | "T2") => {
      const list = expNeu.filter((n) => n.unea === phase);
      if (list.length === 0) return null;
      const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
      const tot = list.reduce(
        (s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0),
        0
      );
      const pct = tot > 0 ? Math.round((eusk / tot) * 100) : 0;
      return { pct, count: list.length, euskaraz: eusk, total: tot };
    };

    const t0 = calcSimplePhase("T0");
    const t1 = calcSimplePhase("T1");
    const t2 = calcSimplePhase("T2");

    try {
      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "sortu_nudge_mezua",
          eragile_izena: selectedEragileForNudge.izena,
          eragile_mota: selectedEragileForNudge.mota,
          erronka_nagusia: selectedEragileForNudge.erronka_nagusia,
          pilotu_izena: exp?.pilotu_izena || "Esku-hartze pilotua",
          hipotesia: exp?.hipotesia || "",
          nudge_mota: nudgeType,
          t0_stats: t0,
          t1_stats: t1 ? { ...t1, gain: t0 ? t1.pct - t0.pct : 0 } : null,
          t2_stats: t2 ? { ...t2, gain: t0 ? t2.pct - t0.pct : 0 } : null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        if (json.data.titulua) setNudgeTitle(json.data.titulua);
        if (json.data.mezua) setNudgeMessage(json.data.mezua);
      }
    } catch (err) {
      console.error("Errorea bultzada Latxarekin sortzean:", err);
    } finally {
      setIsGeneratingNudgeLatxa(false);
    }
  };

  const handleGenerateCommunityReport = async () => {
    if (isGeneratingCommunityReport) return;
    setIsGeneratingCommunityReport(true);
    setCommunityReportError(null);

    const calcGlobalPhasePct = (phase: "T0" | "T1" | "T2") => {
      const list = neurketak.filter((n) => n.unea === phase);
      if (list.length === 0) return null;
      const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
      const tot = list.reduce(
        (s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0),
        0
      );
      return tot > 0 ? Math.round((eusk / tot) * 100) : null;
    };

    const totalInteractionsAll = neurketak.reduce(
      (s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0),
      0
    );

    const eragileLaburpenak = eragileak.map((er) => {
      const exp = esperimentuak.find((e) => e.eragile_id === er.id);
      const expNeu = neurketak.filter((n) => n.esperimentu_id === exp?.id);
      const getPct = (phase: "T0" | "T1" | "T2") => {
        const l = expNeu.filter((n) => n.unea === phase);
        const eusk = l.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
        const tot = l.reduce(
          (s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0),
          0
        );
        return tot > 0 ? Math.round((eusk / tot) * 100) : null;
      };
      return {
        izena: er.izena,
        mota: er.mota,
        erronka: er.erronka_nagusia,
        pilotua: exp?.pilotu_izena || "Zehaztu gabe",
        hipotesia: exp?.hipotesia || "",
        t0_pct: getPct("T0"),
        t1_pct: getPct("T1"),
        t2_pct: getPct("T2"),
      };
    });

    const oharrakZerrenda = neurketak
      .filter((n) => n.oharrak && n.oharrak.trim().length > 0)
      .map((n) => {
        const exp = esperimentuak.find((e) => e.id === n.esperimentu_id);
        const er = eragileak.find((item) => item.id === exp?.eragile_id);
        return {
          eragilea: er?.izena || "Entitatea",
          unea: n.unea,
          oharra: n.oharrak.trim(),
          behatzailea: n.behatzailea || "Behatzailea",
          data: n.data_ordu,
        };
      });

    try {
      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "komunitate_txostena",
          komunitate_datuak: {
            eragile_kopurua: eragileak.length,
            esperimentu_kopurua: esperimentuak.length,
            neurketa_kopurua: neurketak.length,
            elkarrizketa_guztira: totalInteractionsAll,
            global_t0_pct: calcGlobalPhasePct("T0"),
            global_t1_pct: calcGlobalPhasePct("T1"),
            global_t2_pct: calcGlobalPhasePct("T2"),
            eragile_laburpenak: eragileLaburpenak,
          },
          oharrak_zerrenda: oharrakZerrenda,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Ezin izan da komunitate-txostena sortu.");
      }
      setCommunityReport(json.data);
      await refreshData();
    } catch (err) {
      console.error("Errorea komunitate txostena sortzean:", err);
      setCommunityReportError(
        err instanceof Error ? err.message : "Errorea gertatu da Latxarekin txostena sortzean."
      );
    } finally {
      setIsGeneratingCommunityReport(false);
    }
  };

  // Global KPIs calculation (benetako neurketetan oinarrituta, aldaketa_count barne)
  const totalEragileak = eragileak.length;
  const totalNeurketak = neurketak.length;
  const totalEsperimentuak = esperimentuak.length;

  const getExpPhaseCounts = (expId: string, phase: "T0" | "T1" | "T2") => {
    const list = neurketak.filter((n) => n.esperimentu_id === expId && n.unea === phase);
    const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0), 0);
    const tot = list.reduce(
      (s, n) =>
        s +
        (n.euskaraz_count || 0) +
        (n.aldaketa_count || 0) +
        (n.erdaraz_count || 0) +
        (n.elebi_count || 0),
      0
    );
    return { list, eusk, tot };
  };

  const esperimentuakDatuekin = esperimentuak.filter((e) =>
    neurketak.some((n) => n.esperimentu_id === e.id)
  ).length;

  const t2DutenaEsperimentuak = esperimentuak.filter((e) =>
    neurketak.some((n) => n.esperimentu_id === e.id && n.unea === "T2")
  ).length;

  // Ziklo osatua: T0, T1 eta T2 hiruretan gutxieneko saio osoak beteta (edo esplizituki Amaituta markatuta T2 saio nahikoekin)
  const zikloOsatuak = esperimentuak.filter((e) => {
    const saioMin = e.saio_gutxienekoa || 4;
    const nMin = e.n_gutxienekoa || 20;
    const protokoloa = parseProtokoloa(e.protokoloa_json);
    const expN = neurketak.filter((n) => n.esperimentu_id === e.id);
    const osoak = (p: "T0" | "T1" | "T2") =>
      expN.filter((n) => n.unea === p && neurketaEgoera(n, { nGutxienekoa: nMin, protokoloa }).osoa).length;
    return osoak("T0") >= saioMin && osoak("T1") >= saioMin && osoak("T2") >= saioMin;
  }).length;

  // Pooled phase difference across experiments with T0 and T1/T2 (respecting t2_mota === "kentzea")
  let pooledT0X = 0;
  let pooledT0N = 0;
  let pooledPostX = 0;
  let pooledPostN = 0;
  let growthCount = 0;

  esperimentuak.forEach((exp) => {
    const t0 = getExpPhaseCounts(exp.id, "T0");
    const t1 = getExpPhaseCounts(exp.id, "T1");
    const t2 = getExpPhaseCounts(exp.id, "T2");
    // ABA (kentzea) denean, esku-hartzearen efektua T1 vs T0 da (T2 kentzea baita)
    const post = exp.t2_mota === "kentzea" ? t1 : t2.tot > 0 ? t2 : t1;

    if (t0.tot > 0 && post.tot > 0) {
      pooledT0X += t0.eusk;
      pooledT0N += t0.tot;
      pooledPostX += post.eusk;
      pooledPostN += post.tot;
      growthCount++;
    }
  });

  const globalAldea =
    growthCount > 0 && pooledT0N > 0 && pooledPostN > 0
      ? aldea(pooledT0X, pooledT0N, pooledPostX, pooledPostN)
      : null;
  const avgGrowth = globalAldea ? Math.round(globalAldea.d * 1000) / 10 : 0;

  // Filtered centers
  const filteredEragileak = eragileak.filter((e) => {
    const matchesSearch =
      e.izena.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.erronka_nagusia.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMota = filterMota === "all" || e.mota === filterMota;
    return matchesSearch && matchesMota;
  });

  // Handle Nudge submission
  const handleSendNudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEragileForNudge || !nudgeTitle.trim() || !nudgeMessage.trim()) return;

    setIsSending(true);
    const ok = await createAdminNudge({
      eragile_id: selectedEragileForNudge.id,
      titulua: nudgeTitle.trim(),
      mezua: nudgeMessage.trim(),
      mota: nudgeType,
      ekintza_esteka: "/panela",
    });

    setIsSending(false);
    if (ok) {
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setSelectedEragileForNudge(null);
        setNudgeTitle("");
        setNudgeMessage("");
      }, 1400);
    }
  };

  // Export CSV
  const downloadCsvFile = (filename: string, csvLines: string[]) => {
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCsvCell = (val: string | number | null | undefined): string => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const handleExportCSV = () => {
    const ASTEKO_EGUNAK = [
      "igandea",
      "astelehena",
      "asteartea",
      "asteazkena",
      "osteguna",
      "ostirala",
      "larunbata",
    ];
    const headers = [
      "neurketa_id",
      "esperimentu_id",
      "entitatea",
      "fasea",
      "hasiera_ordu",
      "amaiera_ordu",
      "data_ordu",
      "iraupena_min",
      "asteko_eguna",
      "behatzailea",
      "euskaraz",
      "erdaraz",
      "elebi",
      "aldaketa",
      "n",
      "euskara_pct",
      "wilson_behea",
      "wilson_goia",
      "egoera",
      "lineaz_kanpo",
      "atzeratua",
      "oharrak",
    ];

    const rows = neurketak.map((n) => {
      const exp = esperimentuak.find((e) => e.id === n.esperimentu_id);
      const eragilea = eragileak.find((er) => er.id === exp?.eragile_id);
      const aldaketa = Number(n.aldaketa_count || 0);
      const euskGuztira = Number(n.euskaraz_count || 0) + aldaketa;
      const total = euskGuztira + Number(n.erdaraz_count || 0) + Number(n.elebi_count || 0);
      const w = wilson(euskGuztira, total);
      const pctNum = total > 0 ? (w.p * 100).toFixed(1) : "0.0";
      const wBehea = total > 0 ? (w.behea * 100).toFixed(1) : "0.0";
      const wGoia = total > 0 ? (w.goia * 100).toFixed(1) : "0.0";
      const protokoloa = parseProtokoloa(exp?.protokoloa_json);
      const egoera = neurketaEgoera(n, {
        nGutxienekoa: exp?.n_gutxienekoa || 20,
        protokoloa,
      });
      const refDate = new Date(n.hasiera_ordu || n.data_ordu);
      const astekoEguna = !isNaN(refDate.getTime()) ? ASTEKO_EGUNAK[refDate.getDay()] : "";
      const iraupenaMin = Math.round(((n.iraupena_segundotan || 0) / 60) * 10) / 10;

      return [
        escapeCsvCell(n.id),
        escapeCsvCell(n.esperimentu_id),
        escapeCsvCell(eragilea?.izena || "Entitatea"),
        escapeCsvCell(n.unea),
        escapeCsvCell(n.hasiera_ordu || ""),
        escapeCsvCell(n.amaiera_ordu || ""),
        escapeCsvCell(n.data_ordu || ""),
        iraupenaMin,
        escapeCsvCell(astekoEguna),
        escapeCsvCell(formatBehatzaileaDisplay(n.behatzailea)),
        Number(n.euskaraz_count || 0),
        Number(n.erdaraz_count || 0),
        Number(n.elebi_count || 0),
        aldaketa,
        total,
        pctNum,
        wBehea,
        wGoia,
        escapeCsvCell(egoera.etiketak.join("+")),
        Number(n.lineaz_kanpo || 0),
        Number(n.atzeratua || 0),
        escapeCsvCell(n.oharrak || ""),
      ].join(",");
    });

    downloadCsvFile(
      `bidean_eragin_neurketak_${new Date().toISOString().slice(0, 10)}.csv`,
      [headers.join(","), ...rows]
    );
  };

  const handleExportPhaseSummaryCSV = () => {
    const headers = [
      "esperimentu_id",
      "entitatea",
      "fasea",
      "euskaraz",
      "n",
      "euskara_pct",
      "wilson_behea",
      "wilson_goia",
      "saio_kopurua",
      "saio_osoak",
      "semaforoa",
      "aldea_t0rekiko_puntu",
      "aldea_behea",
      "aldea_goia",
    ];

    const rows: string[] = [];
    for (const exp of esperimentuak) {
      const eragilea = eragileak.find((er) => er.id === exp.eragile_id);
      const expNeur = neurketak.filter((n) => n.esperimentu_id === exp.id);
      const protokoloa = parseProtokoloa(exp.protokoloa_json);
      const nMin = exp.n_gutxienekoa || 20;
      const saioMin = exp.saio_gutxienekoa || 4;

      const t0List = expNeur.filter((n) => n.unea === "T0");
      const t0X = t0List.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0), 0);
      const t0N = t0List.reduce(
        (s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0),
        0
      );

      for (const fasea of ["T0", "T1", "T2"] as const) {
        const list = expNeur.filter((n) => n.unea === fasea);
        if (list.length === 0) continue;
        const x = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0), 0);
        const n = list.reduce(
          (s, item) =>
            s +
            (item.euskaraz_count || 0) +
            (item.aldaketa_count || 0) +
            (item.erdaraz_count || 0) +
            (item.elebi_count || 0),
          0
        );
        const w = wilson(x, n);
        const sem = faseSemaforoa(list, fasea, {
          nGutxienekoa: nMin,
          saioGutxienekoa: saioMin,
          protokoloa,
        });
        const diff = fasea !== "T0" && t0N > 0 && n > 0 ? aldea(t0X, t0N, x, n) : null;

        rows.push(
          [
            escapeCsvCell(exp.id),
            escapeCsvCell(eragilea?.izena || "Entitatea"),
            fasea,
            x,
            n,
            n > 0 ? (w.p * 100).toFixed(1) : "0.0",
            n > 0 ? (w.behea * 100).toFixed(1) : "0.0",
            n > 0 ? (w.goia * 100).toFixed(1) : "0.0",
            list.length,
            sem.osoaKopurua,
            sem.kolorea,
            diff ? (diff.d * 100).toFixed(1) : "",
            diff ? (diff.behea * 100).toFixed(1) : "",
            diff ? (diff.goia * 100).toFixed(1) : "",
          ].join(",")
        );
      }
    }

    downloadCsvFile(
      `bidean_eragin_faseen_laburpena_${new Date().toISOString().slice(0, 10)}.csv`,
      [headers.join(","), ...rows]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-line">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sand border border-line text-sea text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-sea" />
            <span>
              {isPresentationMode
                ? "Bagera • Emaitzen aurkezpen publikoa"
                : "Bagera • Koordinazio-panela"}
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
            {isPresentationMode
              ? "Bidean Eragin — Emaitza eta bilakaera orokorra"
              : "Bidean Eragin — Entitateen kudeaketa orokorra"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            {isPresentationMode
              ? "Parte hartzen duten entitateen hizkuntza-ohituren bilakaera (T0 → T1 → T2)."
              : "Entitateen aurrerapena jarraitu, portaera-bultzadak kudeatu eta emaitzak aztertu."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto print:hidden">
          <button
            type="button"
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition cursor-pointer ${
              isPresentationMode
                ? "bg-sea text-white border-sea"
                : "bg-white hover:bg-sand text-sea border-line"
            }`}
            title="Ezkutatu administrazio-botoiak proiektorean edo publikoaren aurrean erakusteko"
          >
            <Monitor className="w-4 h-4" />
            <span>{isPresentationMode ? "Irten aurkezpen-modutik" : "Aurkezpen-modua"}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-sand text-ink border border-line font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Inprimatu edo gorde PDF txostena"
          >
            <Printer className="w-4 h-4 text-ink-muted" />
            <span>Inprimatu (PDF)</span>
          </button>

          {!isPresentationMode && (
            <>
              <button
                onClick={() => setShowNewPostModal(true)}
                className="px-4 py-2.5 rounded-xl bg-euskara hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Entitate berria</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-sea hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-white/80" />
                <span>Esportatu (CSV)</span>
              </button>

              <button
                onClick={handleExportPhaseSummaryCSV}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-sand text-sea border border-line font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sea" />
                <span>Esportatu faseen laburpena</span>
              </button>

              <button
                type="button"
                onClick={openTextEditorModal}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-sand text-ink border border-line font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Moldatu aplikazio osoko testuak eta etiketak erraz"
              >
                <FileText className="w-3.5 h-3.5 text-sea" />
                <span>Testuak moldatu</span>
              </button>

              <button
                type="button"
                onClick={openAdminAccountModal}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-sand text-ink border border-line font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Aldatu Bagerako administratzailearen helbide elektronikoa eta pasahitza"
              >
                <Lock className="w-3.5 h-3.5 text-ochre" />
                <span>Admin kontua / pasahitza</span>
              </button>

              {(eragileak.length > 0 || neurketak.length > 0) && (
                <button
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-terracotta/10 hover:bg-terracotta/15 text-terracotta border border-terracotta/25 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Ezabatu aurretik egindako proba, entitate eta neurketa guztiak"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Garbitu proba guztiak</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Global KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        
        {/* KPI 1: Active Centers */}
        <div className="civic-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              Entitate aktiboak
            </span>
            <div className="p-2 rounded-lg bg-sand text-sea border border-line">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-ink tabular-nums">{totalEragileak}</div>
          <p className="text-[11px] text-ink-muted mt-1">Elkarte, ikastetxe, zerbitzu eta enpresak</p>
        </div>

        {/* KPI 2: Measurements */}
        <div className="civic-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              Neurketak guztira
            </span>
            <div className="p-2 rounded-lg bg-euskara/10 text-euskara border border-euskara/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-euskara tabular-nums">{totalNeurketak}</div>
          <p className="text-[11px] text-ink-muted mt-1">T0, T1 eta T2 neurketa-saioak</p>
        </div>

        {/* KPI 3: Average Growth */}
        <div className="civic-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              Faseen arteko aldea
            </span>
            <div className="p-2 rounded-lg bg-ochre/10 text-ochre border border-ochre/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-euskara tabular-nums">
            {globalAldea ? `${formatSignedPuntu(avgGrowth)} p.` : "—"}
          </div>
          <p className="text-[11px] text-ink-muted mt-1 tabular-nums">
            {globalAldea
              ? `Tartea: ${formatAldeaTarteaEu(globalAldea)} (${growthCount} esp.)`
              : "T0 eta T1/T2 neurketen zain"}
          </p>
        </div>

        {/* KPI 4: Experiments */}
        <div className="civic-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              Esperimentuak martxan
            </span>
            <div className="p-2 rounded-lg bg-sand text-sea border border-line">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-ink tabular-nums">
            {esperimentuakDatuekin}
            <span className="text-base font-semibold text-ink-muted ml-1.5">
              / {totalEsperimentuak}
            </span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1 tabular-nums">
            {t2DutenaEsperimentuak} T2 fasean · {zikloOsatuak} ziklo osatu
          </p>
        </div>
      </div>

      {/* C BLOKEA: KOMUNITATE OSOKO SINTESI SOZIOLINGUISTIKOA (LATXA 70B) */}
      <div className="civic-card p-6 sm:p-8 text-ink border-l-4 border-l-sea mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sand border border-line flex items-center justify-center text-sea shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-editorial text-lg sm:text-xl font-semibold text-ink tracking-tight">
                  Latxa: Donostiako Komunitatearen Txosten Soziolinguistiko Bateratua
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-sand border border-line text-sea text-[10px] font-bold">
                  C Blokea • Latxa 3
                </span>
                {communityReport && (
                  <span className="px-2 py-0.5 rounded-md bg-euskara/10 border border-euskara/20 text-euskara text-[10px] font-bold">
                    Gordeta{communityReport.sortze_data ? ` • ${new Date(communityReport.sortze_data).toLocaleDateString("eu-ES")}` : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Entitate guztien T0/T1/T2 datuak eta behatzaileen ohar kualitatiboak gurutzatuz sortutako sintesi exekutiboa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateCommunityReport}
            disabled={isGeneratingCommunityReport || eragileak.length === 0}
            className="px-5 py-2.5 bg-sea hover:opacity-95 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 print:hidden"
          >
            {isGeneratingCommunityReport ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Komunitatearen datuak aztertzen...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{communityReport ? "Berritu komunitate-txostena" : "Sortu komunitate osoko txostena"}</span>
              </>
            )}
          </button>
        </div>

        {communityReportError && (
          <div className="mt-3 p-3 rounded-xl bg-terracotta/10 border border-terracotta/25 text-terracotta text-xs">
            {communityReportError}
          </div>
        )}

        {communityReport && (
          <div className="mt-4 pt-4 border-t border-line space-y-4 animate-in fade-in duration-300">
            {communityReport.ondorio_orokorra && (
              <div className="bg-paper border border-line rounded-xl p-4 text-xs sm:text-sm text-ink leading-relaxed">
                <span className="font-bold text-sea block mb-1 uppercase tracking-wider text-[10px]">
                  Balorazio soziolinguistiko orokorra
                </span>
                <p>{communityReport.ondorio_orokorra}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {communityReport.joera_kualitatiboak && (
                <div className="bg-paper border border-line rounded-xl p-4">
                  <span className="font-bold text-amber-800 block mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    Behatzaileen oharretan atzemandako joerak
                  </span>
                  <p className="text-ink leading-relaxed">{communityReport.joera_kualitatiboak}</p>
                </div>
              )}

              {communityReport.arrakasta_gakoak && (
                <div className="bg-paper border border-line rounded-xl p-4">
                  <span className="font-bold text-euskara block mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-euskara" />
                    Arrakasta-faktoreak eta praktika onenak
                  </span>
                  <p className="text-ink leading-relaxed">{communityReport.arrakasta_gakoak}</p>
                </div>
              )}
            </div>

            {communityReport.gomendio_estrategikoak && communityReport.gomendio_estrategikoak.length > 0 && (
              <div className="bg-sea/5 border border-sea/25 rounded-xl p-4">
                <span className="font-bold text-sea block mb-1.5 uppercase tracking-wider text-[10px]">
                  Koordinazio-taldearentzako gomendio estrategikoak
                </span>
                <ul className="space-y-1 text-xs text-ink">
                  {communityReport.gomendio_estrategikoak.map((g, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-sea font-bold">•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {communityReport.txosten_exekutiboa && (
              <div className="bg-paper/70 text-ink rounded-xl p-4 border border-line">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-line">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-sea" />
                    Txosten Exekutiboa (Bazkide, Udal edo Prentsarako)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(communityReport.txosten_exekutiboa || "");
                        setCopiedCommunityReport(true);
                        setTimeout(() => setCopiedCommunityReport(false), 2500);
                      } catch {}
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-sand text-ink border border-line text-[10px] font-bold transition cursor-pointer print:hidden"
                  >
                    {copiedCommunityReport ? (
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
                  {communityReport.txosten_exekutiboa}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual T0 -> T1 -> T2 Comparative Progress Chart Across Participating Centers */}
      {eragileak.length > 0 && (
        <div className="civic-card p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-euskara" />
                <h3 className="font-editorial text-xl font-semibold text-ink">
                  Entitateen bilakaera konparatiboa (T0 → T1 → T2 euskararen erabilera %)
                </h3>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Entitate bakoitzaren hasierako argazkia (T0), berehalako eragina (T1) eta ohitura finkatua (T2).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-sea">
                <span className="w-3 h-3 rounded-xs bg-sea inline-block" /> T0 (aurretik)
              </span>
              <span className="flex items-center gap-1.5 text-ochre">
                <span className="w-3 h-3 rounded-xs bg-ochre inline-block" /> T1 (berehala)
              </span>
              <span className="flex items-center gap-1.5 text-euskara">
                <span className="w-3 h-3 rounded-xs bg-euskara inline-block" /> T2 (sendotua)
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {eragileak.map((eragile) => {
              const exp = esperimentuak.find((e) => e.eragile_id === eragile.id);
              const expNeu = neurketak.filter((n) => n.esperimentu_id === exp?.id);
              const calcPct = (phase: "T0" | "T1" | "T2") => {
                const list = expNeu.filter((n) => n.unea === phase);
                const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0), 0);
                const tot = list.reduce(
                  (s, n) =>
                    s +
                    (n.euskaraz_count || 0) +
                    (n.aldaketa_count || 0) +
                    (n.erdaraz_count || 0) +
                    (n.elebi_count || 0),
                  0
                );
                return tot > 0 ? { eusk, tot, pct: Math.round((eusk / tot) * 1000) / 10 } : null;
              };
              const p0Data = calcPct("T0");
              const p1Data = calcPct("T1");
              const p2Data = calcPct("T2");
              const p0 = p0Data ? p0Data.pct : null;
              const p1 = p1Data ? p1Data.pct : null;
              const p2 = p2Data ? p2Data.pct : null;
              const postData = exp?.t2_mota === "kentzea" ? p1Data : p2Data || p1Data;
              const diffObj =
                p0Data && postData
                  ? aldea(p0Data.eusk, p0Data.tot, postData.eusk, postData.tot)
                  : null;
              const diff = diffObj ? Math.round(diffObj.d * 1000) / 10 : null;

              return (
                <div
                  key={eragile.id}
                  className="p-4 rounded-xl bg-paper border border-line"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink text-sm">
                        {isPresentationMode
                          ? getPublicEragileLabel(eragile, "eragilea")
                          : eragile.izena}
                      </span>
                      {!isPresentationMode && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            Number(eragile.publikoa) === 1
                              ? "bg-euskara/10 text-euskara border-euskara/20"
                              : "bg-sand text-ink-muted border-line"
                          }`}
                        >
                          {Number(eragile.publikoa) === 1
                            ? "Publikoa"
                            : getPublicEragileLabel(eragile, "eragilea")}
                        </span>
                      )}
                      {exp && !isPresentationMode && (
                        <span className="text-xs text-ink-muted">
                          ({exp.gunea} • Xedea: +{exp.xede_portzentajea} puntu)
                        </span>
                      )}
                    </div>
                    {diff !== null && diffObj ? (
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold tabular-nums ${
                          diffObj.behea > 0
                            ? "bg-euskara/10 text-euskara border border-euskara/20"
                            : diffObj.goia < 0
                            ? "bg-terracotta/10 text-terracotta border border-terracotta/20"
                            : "bg-sand text-ink-muted border border-line"
                        }`}
                      >
                        {formatSignedPuntu(diff)} puntu ({formatAldeaTarteaEu(diffObj)})
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-ink-muted tabular-nums">
                        {p0 !== null ? `T0 neurtuta (%${formatDecimalEu(p0)})` : "Lehen neurketaren zain"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        { label: "T0", val: p0, color: "bg-sea", text: "text-sea" },
                        { label: "T1", val: p1, color: "bg-ochre", text: "text-ochre" },
                        { label: "T2", val: p2, color: "bg-euskara", text: "text-euskara" },
                      ] as const
                    ).map((bar) => (
                      <div key={bar.label} className="bg-white rounded-lg p-2.5 border border-line">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-bold ${bar.text}`}>{bar.label}</span>
                          <span className="font-bold text-ink tabular-nums">
                            {bar.val !== null ? `%${bar.val}` : "—"}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
                          <div
                            className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                            style={{ width: `${bar.val !== null ? Math.max(bar.val, 4) : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pilots Comparison & Effectiveness Ranking */}
      <div className="civic-card p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-euskara" />
          <h3 className="font-editorial text-xl font-semibold text-ink">
            Pilotuen eraginkortasun-konparaketa (emaitza errealak)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pilotuak.map((pilotu) => {
            const pilotExps = esperimentuak.filter((e) => e.pilotu_id === pilotu.id);
            const pilotExpsCount = pilotExps.length;
            const pilotExpsWithData = pilotExps.filter((e) =>
              neurketak.some((n) => n.esperimentu_id === e.id)
            ).length;

            let pT0X = 0;
            let pT0N = 0;
            let pPostX = 0;
            let pPostN = 0;
            pilotExps.forEach((exp) => {
              const t0 = getExpPhaseCounts(exp.id, "T0");
              const t1 = getExpPhaseCounts(exp.id, "T1");
              const t2 = getExpPhaseCounts(exp.id, "T2");
              const post = exp.t2_mota === "kentzea" ? t1 : t2.tot > 0 ? t2 : t1;
              if (t0.tot > 0 && post.tot > 0) {
                pT0X += t0.eusk;
                pT0N += t0.tot;
                pPostX += post.eusk;
                pPostN += post.tot;
              }
            });
            const pilotAldea =
              pT0N > 0 && pPostN > 0 ? aldea(pT0X, pT0N, pPostX, pPostN) : null;
            const pilotAvgGrowth = pilotAldea ? Math.round(pilotAldea.d * 1000) / 10 : null;

            return (
              <div
                key={pilotu.id}
                className="bg-paper rounded-2xl p-4 border border-line/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink">
                      {pilotu.izena}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-ink text-[10px] font-bold tabular-nums">
                      {pilotExpsWithData} martxan / {pilotExpsCount}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted line-clamp-2">
                    {pilotu.azpititulua}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                  <span className="text-[11px] text-ink-muted font-semibold">
                    Faseko aldea:
                  </span>
                  {pilotAvgGrowth !== null && pilotAldea ? (
                    <span className="text-xs font-black text-euskara bg-euskara/15 px-2 py-0.5 rounded-lg tabular-nums">
                      {formatSignedPuntu(pilotAvgGrowth)} p. ({formatAldeaTarteaEu(pilotAldea)})
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-ink-muted bg-slate-200/80 px-2 py-0.5 rounded-lg">
                      Datuen zain (T0/T1)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.10 Koordinazioaren abisuak eta semaforoak */}
      {!isPresentationMode && esperimentuak.length > 0 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm mb-8">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-editorial text-xl font-semibold text-ink">
                Koordinazioaren abisuak eta semaforoak
              </h3>
            </div>
            <span className="text-xs text-ink-muted font-medium">
              {esperimentuak.length} esperimentu jarraipenean
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {esperimentuak.map((exp) => {
              const eragilea = eragileak.find((er) => er.id === exp.eragile_id);
              const expNeur = neurketak.filter((n) => n.esperimentu_id === exp.id);
              const protokoloa = parseProtokoloa(exp.protokoloa_json);
              const nMin = exp.n_gutxienekoa || 20;
              const saioMin = exp.saio_gutxienekoa || 4;
              const activePhase: "T0" | "T1" | "T2" =
                exp.estatusa === "T1_zain"
                  ? "T1"
                  : exp.estatusa === "T2_zain" || exp.estatusa === "Amaituta"
                  ? "T2"
                  : "T0";

              const sem = faseSemaforoa(
                expNeur.filter((n) => n.unea === activePhase),
                activePhase,
                { nGutxienekoa: nMin, saioGutxienekoa: saioMin, protokoloa }
              );

              const phaseLine = (fasea: "T0" | "T1" | "T2") => {
                const list = expNeur.filter((n) => n.unea === fasea);
                if (list.length === 0) return null;
                const x = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0), 0);
                const n = list.reduce(
                  (s, item) =>
                    s +
                    (item.euskaraz_count || 0) +
                    (item.aldaketa_count || 0) +
                    (item.erdaraz_count || 0) +
                    (item.elebi_count || 0),
                  0
                );
                if (n === 0) return null;
                const w = wilson(x, n);
                return `${fasea}: %${formatDecimalEu(w.p * 100)} (${formatDecimalEu(w.behea * 100)}–${formatDecimalEu(w.goia * 100)})`;
              };

              const phaseSummaries = (["T0", "T1", "T2"] as const)
                .map(phaseLine)
                .filter((s): s is string => Boolean(s));

              // Abisuak
              const abisuak: string[] = [];
              const fourteenDaysMs = 14 * 86400 * 1000;
              const nowMs = Date.now();
              if (expNeur.length === 0) {
                const startMs = new Date(exp.hasiera_data).getTime();
                if (!isNaN(startMs) && nowMs - startMs > fourteenDaysMs) {
                  abisuak.push("14 egun neurketarik gabe");
                }
              } else {
                const latestMs = Math.max(
                  ...expNeur.map((n) => new Date(n.hasiera_ordu || n.data_ordu).getTime()).filter((t) => !isNaN(t))
                );
                if (latestMs > 0 && nowMs - latestMs > fourteenDaysMs) {
                  abisuak.push("14 egun neurketarik gabe");
                }
              }

              if (Number(exp.t1_egonkortu_gabe || 0) === 1) {
                abisuak.push("T1 oinarri-lerro egonkorrik gabe hasia");
              }

              if (expNeur.length > 0) {
                const laginTxikiaCount = expNeur.filter(
                  (n) => neurketaEgoera(n, { nGutxienekoa: nMin, protokoloa }).laginTxikia
                ).length;
                if (laginTxikiaCount > expNeur.length / 2) {
                  abisuak.push('Saioen erdia baino gehiago "lagin txikia"');
                }
                const hasUnknownObserver = expNeur.some(
                  (n) => formatBehatzaileaDisplay(n.behatzailea) === "Ezezaguna"
                );
                if (hasUnknownObserver) {
                  abisuak.push('Behatzailea "Ezezaguna"');
                }
              }

              return (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-line bg-paper/60 p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-ink text-sm">
                        {eragilea?.izena || exp.eragile_izena || "Entitatea"}
                      </h4>
                      <span className="text-[11px] text-ink-muted">
                        {exp.gunea} · {expNeur.length} saio
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border shrink-0 ${
                        sem.kolorea === "berdea"
                          ? "bg-euskara/10 text-euskara border-euskara/30"
                          : sem.kolorea === "horia"
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : "bg-terracotta/10 text-terracotta border-terracotta/30"
                      }`}
                    >
                      {sem.kolorea === "berdea" ? "🟢" : sem.kolorea === "horia" ? "🟡" : "🔴"}{" "}
                      {sem.mezua}
                    </span>
                  </div>

                  {phaseSummaries.length > 0 && (
                    <div className="text-xs font-semibold text-ink tabular-nums">
                      {phaseSummaries.join(" · ")}
                    </div>
                  )}

                  {abisuak.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {abisuak.map((ab, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold"
                        >
                          {ab}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block text-[11px] text-euskara font-semibold">
                      Abisurik ez
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Centers Table */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm">
        
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-ink text-base sm:text-lg">
              Parte hartzen duten entitateak ({filteredEragileak.length})
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Egin klik entitatearen panelean sartzeko edo hipotesia eta emaitzak ikusteko.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Bilatu entitatea..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-line text-xs focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
              />
            </div>

            <select
              value={filterMota}
              onChange={(e) => setFilterMota(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-line text-xs text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden bg-white"
            >
              <option value="all">Mota guztiak</option>
              <option value="ikastetxea">Ikastetxeak</option>
              <option value="merkataritza">Merkataritza / zerbitzuak</option>
              <option value="enpresa">Enpresak</option>
              <option value="aisialdia">Elkarteak / aisialdia</option>
            </select>
          </div>
        </div>

        {/* Mobile Cards View (< md) */}
        <div className="md:hidden space-y-3">
          {filteredEragileak.map((eragile) => {
            const exp = esperimentuak.find((e) => e.eragile_id === eragile.id);
            const expNeurketak = neurketak.filter((n) => n.esperimentu_id === exp?.id);
            const t0List = expNeurketak.filter((n) => n.unea === "T0");
            const t1List = expNeurketak.filter((n) => n.unea === "T1");
            const t2List = expNeurketak.filter((n) => n.unea === "T2");
            const calcPct = (list: typeof expNeurketak) => {
              const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0), 0);
              const tot = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);
              return tot > 0 ? Math.round((eusk / tot) * 1000) / 10 : null;
            };
            const t0Pct = calcPct(t0List);
            const t1Pct = calcPct(t1List);
            const t2Pct = calcPct(t2List);

            return (
              <div key={eragile.id} className="rounded-xl border border-line bg-paper/50 p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-ink text-sm truncate">
                      {isPresentationMode
                        ? getPublicEragileLabel(eragile, "eragilea")
                        : eragile.izena}
                    </div>
                    <div className="text-[11px] text-ink-muted capitalize mt-0.5">
                      {eragile.mota}
                    </div>
                  </div>
                  {!isPresentationMode && (
                    <button
                      type="button"
                      onClick={() =>
                        updateEragilea({
                          id: eragile.id,
                          publikoa: Number(eragile.publikoa) === 1 ? 0 : 1,
                        })
                      }
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer ${
                        Number(eragile.publikoa) === 1
                          ? "bg-euskara/15 text-euskara"
                          : "bg-sand text-ink-muted"
                      }`}
                    >
                      {Number(eragile.publikoa) === 1 ? (
                        <>
                          <Unlock className="w-2.5 h-2.5" />
                          <span>Publikoa</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-2.5 h-2.5" />
                          <span>Pribatua</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {exp ? (
                  <div className="bg-white rounded-lg p-2.5 border border-line">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-ink font-medium leading-snug">
                        &ldquo;{exp.hipotesia}&rdquo;
                      </p>
                      {!isPresentationMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setExpToDelete({ exp, eragileIzena: eragile.izena });
                          }}
                          className="p-1 rounded-md text-ink-muted hover:text-terracotta hover:bg-terracotta/10 shrink-0 cursor-pointer"
                          title="Ezabatu hipotesia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-ink-muted mt-1">
                      Gunea: {exp.gunea} • Xedea: +%{exp.xede_portzentajea}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted">{eragile.erronka_nagusia}</p>
                )}

                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                  <div className="bg-white rounded-lg py-1.5 border border-line">
                    <span className="text-ink-muted block text-[10px]">T0</span>
                    <span className="font-bold text-ink tabular-nums">{t0Pct !== null ? `%${t0Pct}` : "—"}</span>
                  </div>
                  <div className="bg-white rounded-lg py-1.5 border border-line">
                    <span className="text-ink-muted block text-[10px]">T1</span>
                    <span className="font-bold text-euskara tabular-nums">{t1Pct !== null ? `%${t1Pct}` : "—"}</span>
                  </div>
                  <div className="bg-white rounded-lg py-1.5 border border-line">
                    <span className="text-ink-muted block text-[10px]">T2</span>
                    <span className="font-bold text-sea tabular-nums">{t2Pct !== null ? `%${t2Pct}` : "—"}</span>
                  </div>
                </div>

                {!isPresentationMode && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-line">
                    <button
                      type="button"
                      onClick={() => openEditEragileModal(eragile, exp)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sand text-ink border border-line font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editatu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentEragileId(eragile.id);
                        setActiveTab("panela");
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-sea/10 text-sea font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Panela</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEragileToDelete(eragile)}
                      className="ml-auto px-2.5 py-1.5 rounded-lg bg-terracotta/10 text-terracotta border border-terracotta/25 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ezabatu</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-ink-muted font-semibold uppercase text-[10px]">
                <th className="pb-3">Entitatea</th>
                <th className="pb-3">Mota</th>
                <th className="pb-3">Hipotesia eta erronka</th>
                <th className="pb-3">Pilotua eta estatusa</th>
                <th className="pb-3">Neurketak</th>
                <th className="pb-3 text-right">Ekintzak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEragileak.map((eragile) => {
                const exp = esperimentuak.find((e) => e.eragile_id === eragile.id);
                const expNeurketak = neurketak.filter((n) => n.esperimentu_id === exp?.id);
                const t0List = expNeurketak.filter((n) => n.unea === "T0");
                const t1List = expNeurketak.filter((n) => n.unea === "T1");
                const t2List = expNeurketak.filter((n) => n.unea === "T2");

                const calcPhasePct = (list: typeof expNeurketak) => {
                  const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0), 0);
                  const tot = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.aldaketa_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);
                  return tot > 0 ? Math.round((eusk / tot) * 1000) / 10 : null;
                };

                const t0Pct = calcPhasePct(t0List);
                const t1Pct = calcPhasePct(t1List);
                const t2Pct = calcPhasePct(t2List);

                return (
                  <tr key={eragile.id} className="hover:bg-paper/70 transition">
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-ink text-sm">
                          {isPresentationMode
                            ? getPublicEragileLabel(eragile, "eragilea")
                            : eragile.izena}
                        </span>
                        {!isPresentationMode && (
                          <button
                            type="button"
                            onClick={() =>
                              updateEragilea({
                                id: eragile.id,
                                publikoa: Number(eragile.publikoa) === 1 ? 0 : 1,
                              })
                            }
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                              Number(eragile.publikoa) === 1
                                ? "bg-euskara/15 text-euskara hover:bg-emerald-200"
                                : "bg-sand text-ink-muted hover:bg-slate-200"
                            }`}
                            title="Sakatu pribatutasun-egoera aldatzeko (izen publikoa vs kode anonimoa #ID)"
                          >
                            {Number(eragile.publikoa) === 1 ? (
                              <>
                                <Unlock className="w-2.5 h-2.5" />
                                <span>Publikoa</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-2.5 h-2.5" />
                                <span>{getPublicEragileLabel(eragile, "eragilea")}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {!isPresentationMode && (
                        <span className="text-[11px] text-ink-muted block mt-0.5">
                          {eragile.arduraduna}
                          {eragile.email ? ` (${eragile.email})` : ""}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3 capitalize font-medium text-ink-muted">
                      {eragile.mota}
                    </td>

                    <td className="py-3.5 pr-3 max-w-xs">
                      {exp ? (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              onClick={() => !isPresentationMode && openEditEragileModal(eragile, exp)}
                              className="text-ink font-medium line-clamp-2 cursor-pointer hover:text-sea transition"
                              title="Egin klik hipotesia editatzeko"
                            >
                              &ldquo;{exp.hipotesia}&rdquo;
                            </p>
                            <span className="text-[10px] text-ink-muted block mt-0.5 truncate">
                              Gunea: {exp.gunea} • Xedea: +%{exp.xede_portzentajea}
                            </span>
                          </div>
                          {!isPresentationMode && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setExpToDelete({ exp, eragileIzena: eragile.izena });
                              }}
                              className="p-1.5 rounded-lg text-ink-muted hover:text-terracotta hover:bg-terracotta/10 transition shrink-0 cursor-pointer"
                              title="Ezabatu hipotesia (entitatea mantenduta)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-muted truncate block">{eragile.erronka_nagusia}</span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3">
                      {exp ? (
                        <div>
                          <span className="font-semibold text-ink block">
                            {exp.pilotu_izena || "Euskaraz barra-barra txapak"}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                              exp.estatusa === "Amaituta"
                                ? "bg-euskara/15 text-euskara"
                                : exp.estatusa === "T2_zain"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {exp.estatusa.replace("_", " ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-ink-muted italic">Esperimentu gabe</span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t0List.length > 0 ? "bg-sky-600 text-white" : "bg-sand text-ink-muted"
                          }`}
                          title={t0List.length > 0 ? `T0: ${t0List.length} saio (%${t0Pct} euskara)` : "T0 egin gabe"}
                        >
                          T0{t0Pct !== null ? ` %${t0Pct}` : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t1List.length > 0 ? "bg-amber-600 text-white" : "bg-sand text-ink-muted"
                          }`}
                          title={t1List.length > 0 ? `T1: ${t1List.length} saio (%${t1Pct} euskara)` : "T1 egin gabe"}
                        >
                          T1{t1Pct !== null ? ` %${t1Pct}` : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t2List.length > 0 ? "bg-euskara text-white" : "bg-sand text-ink-muted"
                          }`}
                          title={t2List.length > 0 ? `T2: ${t2List.length} saio (%${t2Pct} euskara)` : "T2 egin gabe"}
                        >
                          T2{t2Pct !== null ? ` %${t2Pct}` : ""}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setCurrentEragileId(eragile.id);
                          setActiveTab("panela");
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-line hover:bg-sand text-ink font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                        title="Ikusi entitatearen panela"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-600" />
                        <span>Panela</span>
                      </button>

                      {!isPresentationMode && (
                        <>
                          {exp && (
                            <button
                              onClick={() => {
                                const nextPhase = t0List.length === 0 ? "T0" : t1List.length === 0 ? "T1" : "T2";
                                setObservationConfig({ expId: exp.id, phase: nextPhase });
                                setCurrentEragileId(eragile.id);
                                setActiveTab("behaketa");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-euskara/10 hover:bg-euskara/15 text-euskara border border-euskara/25 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                              title="Neurtu entitate hau zuzenean"
                            >
                              <Timer className="w-3.5 h-3.5 text-euskara" />
                              <span>Neurtu ({t0List.length === 0 ? "T0" : t1List.length === 0 ? "T1" : "T2"})</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditEragileModal(eragile, exp)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Editatu entitatearen datuak eta hipotesia"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-600" />
                            <span>Editatu</span>
                          </button>

                          <button
                            onClick={() => {
                              const hasT0 = t0List.length > 0;
                              const hasT1 = t1List.length > 0;
                              const hasT2 = t2List.length > 0;

                              setSelectedEragileForNudge(eragile);
                              setNudgeTitle(
                                hasT1 && !hasT2
                                  ? "T2 neurketa egiteko unea iritsi da! "
                                  : hasT0 && !hasT1
                                  ? "Nola doa pilotua? Egin T1 neurketa!"
                                  : "Kaixo! Zure esperimentuaren berri jakin nahi dugu"
                              );
                              setNudgeMessage(
                                hasT1 && !hasT2
                                  ? `Kaixo ${eragile.izena}, bi aste pasa dira T1 neurketa egin zenutenetik. Egin T2 neurketa efektua sendotu den ikusteko!`
                                  : `Kaixo ${eragile.izena}, animatu hurrengo urratsa egitera eta kontatu nola doan prozesua!`
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-sea/10 hover:bg-sea/15 text-sea font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Bidali bultzada-mezu bat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Bultzada</span>
                          </button>

                          <button
                            onClick={() => setEragileToDelete(eragile)}
                            className="px-2.5 py-1.5 rounded-lg bg-terracotta/10 hover:bg-terracotta/15 text-terracotta border border-terracotta/25 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Ezabatu entitatea eta bere proba-neurketa guztiak"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-terracotta" />
                            <span>Ezabatu</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredEragileak.length === 0 && (
            <div className="text-center py-12 px-4 bg-paper rounded-2xl border-2 border-dashed border-line my-4">
              <Store className="w-10 h-10 text-ink-muted mx-auto mb-2" />
              <h4 className="font-bold text-ink text-sm mb-1">
                Oraindik ez dago entitaterik zerrendan
              </h4>
              <p className="text-xs text-ink-muted max-w-sm mx-auto mb-4">
                Sortu hemen entitate berri bat segundo gutxitan eta hasi zuzenean neurtzen:
              </p>
              <button
                type="button"
                onClick={() => setShowNewPostModal(true)}
                className="px-4 py-2 bg-euskara hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Gehitu 1. entitatea</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Individual Measurements / Sessions Management Table (Hidden in Presentation Mode) */}
      {!isPresentationMode && neurketak.length > 0 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-ink text-base sm:text-lg">
                Egindako neurketen saioak ({neurketak.length})
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Neurketa baten datuak (behatzailea, fasea, zenbakiak edo oharrak) zuzendu edo proba-saio bat ezabatu dezakezu hemen.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-ink-muted font-semibold uppercase text-[10px]">
                  <th className="pb-3">Entitatea</th>
                  <th className="pb-3">Fasea</th>
                  <th className="pb-3">Behatzailea</th>
                  <th className="pb-3">Elkarrizketak (eusk / erd / elebi)</th>
                  <th className="pb-3">Data eta ordua</th>
                  <th className="pb-3 text-right">Ekintzak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {neurketak.map((n) => {
                  const exp = esperimentuak.find((e) => e.id === n.esperimentu_id);
                  const eragilea = eragileak.find((er) => er.id === exp?.eragile_id);
                  const tot = (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0);
                  const pct = tot > 0 ? Math.round(((n.euskaraz_count || 0) / tot) * 100) : 0;

                  return (
                    <tr key={n.id} className="hover:bg-paper/70 transition">
                      <td className="py-3 pr-3 font-bold text-ink">
                        {eragilea?.izena || "Entitatea"}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            n.unea === "T0"
                              ? "bg-sky-100 text-sky-800"
                              : n.unea === "T1"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-euskara/15 text-euskara"
                          }`}
                        >
                          {n.unea}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-ink-muted font-medium">
                        {formatBehatzaileaDisplay(n.behatzailea)}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-bold text-euskara">{n.euskaraz_count} eusk</span>
                        {" / "}
                        <span className="text-terracotta font-semibold">{n.erdaraz_count} erd</span>
                        {" / "}
                        <span className="text-amber-600 font-semibold">{n.elebi_count} elebi</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-sand text-ink font-bold text-[10px]">
                          %{pct}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-ink-muted">
                        {new Date(n.data_ordu).toLocaleString("eu-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditNeurketaModal(n)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-amber-600" />
                          <span>Editatu</span>
                        </button>
                        <button
                          type="button"
                          disabled={neurketaDeletingId === n.id}
                          onClick={() => handleDeleteSingleNeurketa(n.id)}
                          className="px-2.5 py-1 rounded-lg bg-terracotta/10 hover:bg-terracotta/15 text-terracotta border border-terracotta/25 font-semibold text-[11px] inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3 text-terracotta" />
                          <span>{neurketaDeletingId === n.id ? "Ezabatzen..." : "Ezabatu saioa"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT CENTER & HYPOTHESIS MODAL */}
      {eragileToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-lg border border-line my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <Pencil className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base sm:text-lg">
                    Entitatea eta hipotesia editatu
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Zuzendu entitatearen datuak, sarbide-kredentzialak eta hipotesia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEragileToEdit(null)}
                className="text-ink-muted hover:text-ink-muted p-1.5 rounded-lg hover:bg-sand transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEragileAndExp} className="space-y-5">
              {/* Section 1: Entitatearen datuak */}
              <div className="bg-paper rounded-2xl p-4 border border-line space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-ink-muted" />
                  <span>1. Entitatearen datuak eta sarbidea</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Entitatearen izena *
                    </label>
                    <input
                      type="text"
                      required
                      value={editIzena}
                      onChange={(e) => setEditIzena(e.target.value)}
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Mota
                    </label>
                    <select
                      value={editMota}
                      onChange={(e) => setEditMota(e.target.value)}
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                    >
                      <option value="merkataritza">Merkataritza / zerbitzua</option>
                      <option value="ikastetxea">Ikastetxea</option>
                      <option value="enpresa">Enpresa</option>
                      <option value="aisialdia">Elkartea / aisialdia</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Arduraduna
                    </label>
                    <input
                      type="text"
                      value={editArduraduna}
                      onChange={(e) => setEditArduraduna(e.target.value)}
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Erronka nagusia
                    </label>
                    <input
                      type="text"
                      value={editErronka}
                      onChange={(e) => setEditErronka(e.target.value)}
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Helbide elektronikoa (entitateak saioa hasteko)
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Adib.: entitatea@gmail.com"
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Pasahitz berria (utzi hutsik ez aldatzeko)
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Adib.: bidean123"
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Esperimentua eta hipotesia */}
              <div className="bg-euskara/5 rounded-2xl p-4 border border-euskara/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-euskara flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-euskara" />
                    <span>2. Hipotesia eta esperimentuaren xehetasunak (aukerakoa)</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const generated = `Gure ustez, ${editTaldea || "entitateko kideek"} ${editPertsonak || "herritarrekin eta bezeroekin"}, ${editGunea || "harrera edo gune nagusian"} esku-hartze pilotua aktibatuta, euskararen erabilera %${editXedePct} igoko da.`;
                        setEditHipotesia(generated);
                      }}
                      className="text-[11px] font-bold text-euskara hover:text-euskara bg-white px-2.5 py-1 rounded-lg border border-euskara/25 shadow-2xs transition cursor-pointer"
                    >
                      Sortu esaldia azpiko eremuekin
                    </button>
                    {editExpId && eragileToEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetExp = esperimentuak.find((item) => item.id === editExpId);
                          if (targetExp) {
                            setDeleteError(null);
                            setExpToDelete({ exp: targetExp, eragileIzena: eragileToEdit.izena });
                          }
                        }}
                        className="text-[11px] font-bold text-terracotta hover:text-terracotta bg-terracotta/10 hover:bg-terracotta/15 px-2.5 py-1 rounded-lg border border-terracotta/25 transition cursor-pointer inline-flex items-center gap-1"
                        title="Ezabatu entitate honen hipotesia eta neurketak"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Ezabatu hipotesia</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Hipotesia (utzi hutsik oraindik esperimenturik ez badu)
                  </label>
                  <textarea
                    rows={3}
                    value={editHipotesia}
                    onChange={(e) => setEditHipotesia(e.target.value)}
                    placeholder="Idatzi hemen entitate honetarako adostutako hipotesia..."
                    className="w-full border border-euskara/40 bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Nork (taldea)
                    </label>
                    <input
                      type="text"
                      value={editTaldea}
                      onChange={(e) => setEditTaldea(e.target.value)}
                      placeholder="Adib.: Entitateko kideek"
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Norekin (pertsonak)
                    </label>
                    <input
                      type="text"
                      value={editPertsonak}
                      onChange={(e) => setEditPertsonak(e.target.value)}
                      placeholder="Adib.: Herritarrekin"
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Non (gunea)
                    </label>
                    <input
                      type="text"
                      value={editGunea}
                      onChange={(e) => setEditGunea(e.target.value)}
                      placeholder="Adib.: Harrera-gunean"
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs text-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Xede-igoera (%):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editXedePct}
                      onChange={(e) => setEditXedePct(Number(e.target.value))}
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-bold text-euskara"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Pilotua:
                    </label>
                    <select
                      value={editPilotuId}
                      onChange={(e) => setEditPilotuId(e.target.value)}
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs text-ink"
                    >
                      {pilotuak.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.izena}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Fasea / estatusa:
                    </label>
                    <select
                      value={editEstatusa}
                      onChange={(e) => setEditEstatusa(e.target.value)}
                      className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs text-ink"
                    >
                      <option value="T0_zain">T0 zain</option>
                      <option value="T1_zain">T1 zain</option>
                      <option value="T2_zain">T2 zain</option>
                      <option value="Amaituta">Amaituta</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEragileToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editIzena.trim()}
                  className="px-5 py-2.5 bg-sea hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? "Gordetzen..." : "Gorde aldaketak"}</span>
                </button>
              </div>
            </form>
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
                    Zuzendu entitatea, fasea, behatzailea edo elkarrizketa kopuruak
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
                {esperimentuak.filter((ex) => ex.eragile_id === editNeuEragileId).length > 1 && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-bold text-ink-muted mb-1">
                      Esperimentua / gunea
                    </label>
                    <select
                      value={editNeuExpId}
                      onChange={(e) => setEditNeuExpId(e.target.value)}
                      className="w-full border border-line rounded-xl px-3 py-1.5 text-xs font-semibold text-ink"
                    >
                      {esperimentuak
                        .filter((ex) => ex.eragile_id === editNeuEragileId)
                        .map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.gunea || ex.taldea || ex.hipotesia.slice(0, 40)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

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

      {/* DELETE SINGLE CENTER / STAND CONFIRMATION MODAL */}
      {eragileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg border border-line">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-terracotta/15 text-terracotta rounded-2xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-base">
                  Entitatea ezabatu?
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Ziur zaude <strong>{eragileToDelete.izena}</strong> eta hari lotutako esperimentu zein neurketa guztiak ezabatu nahi dituzula?
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="text-xs font-semibold text-terracotta mb-3 bg-terracotta/10 border border-terracotta/25 rounded-xl px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setEragileToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
              >
                Utzi
              </button>
              <button
                type="button"
                disabled={isDeletingEragile}
                onClick={handleConfirmDeleteEragilea}
                className="px-5 py-2.5 bg-terracotta hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingEragile ? "Ezabatzen..." : "Bai, ezabatu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SINGLE HYPOTHESIS / EXPERIMENT CONFIRMATION MODAL */}
      {expToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg border border-line">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-terracotta/15 text-terracotta rounded-2xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-base">
                  Hipotesia ezabatu?
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Ziur zaude <strong>{expToDelete.eragileIzena}</strong> entitatearen hipotesi hau eta hari lotutako neurketak ezabatu nahi dituzula? Entitatea zerrendan mantenduko da.
                </p>
                <p className="text-xs italic text-ink-muted mt-2 bg-paper p-2.5 rounded-xl border border-line line-clamp-3">
                  &ldquo;{expToDelete.exp.hipotesia}&rdquo;
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="text-xs font-semibold text-terracotta mb-3 bg-terracotta/10 border border-terracotta/25 rounded-xl px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setExpToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
              >
                Utzi
              </button>
              <button
                type="button"
                disabled={isDeletingExp}
                onClick={handleConfirmDeleteExp}
                className="px-5 py-2.5 bg-terracotta hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingExp ? "Ezabatzen..." : "Bai, ezabatu hipotesia"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET ALL TEST DATA CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg border border-line">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-terracotta/15 text-terracotta rounded-2xl shrink-0">
                <RotateCcw className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-base">
                  Aurretik egindako proba guztiak garbitu?
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Ekintza honek orain arte sortutako <strong>entitate, esperimentu eta proba-neurketa guztiak</strong> ezabatuko ditu, panela hutsik eta garbi utziz benetako neurketak zerotik hasteko.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
              >
                Utzi
              </button>
              <button
                type="button"
                disabled={isResettingAll}
                onClick={handleConfirmResetAll}
                className="px-5 py-2.5 bg-terracotta hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResettingAll ? "Garbitzen..." : "Bai, garbitu dena"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND CUSTOM BULTZADA MODAL */}
      {selectedEragileForNudge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-lg border border-line animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-sea/15 text-sea flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">
                  Bidali bultzada entitateari
                </h3>
                <p className="text-xs text-ink-muted">
                  Hartzailea: <strong>{selectedEragileForNudge.izena}</strong>
                </p>
              </div>
            </div>

            {sendSuccess ? (
              <div className="bg-euskara/10 rounded-2xl p-6 text-center border border-euskara/25 my-4">
                <CheckCircle2 className="w-10 h-10 text-euskara mx-auto mb-2" />
                <h4 className="font-bold text-euskara text-sm">Bultzada arrakastaz bidali da!</h4>
                <p className="text-xs text-euskara mt-1">Entitateak bere jakinarazpenetan ikusiko du.</p>
              </div>
            ) : (
              <form onSubmit={handleSendNudge} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-ink">
                      Bultzada-mota:
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateNudgeWithLatxa}
                      disabled={isGeneratingNudgeLatxa}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sea/10 hover:bg-sea/15 text-sea border border-sea/25 text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                      title="Latxak entitatearen T0/T1/T2 datuak irakurri eta mezu pertsonalizatua idatziko du"
                    >
                      <Bot className="w-3.5 h-3.5 text-sea" />
                      <span>
                        {isGeneratingNudgeLatxa ? "Latxa idazten..." : "Sortu mezua Latxarekin"}
                      </span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "bultzada", label: "Bultzada " },
                      { id: "abisua", label: "Abisua " },
                      { id: "zoriontzea", label: "Zoriontzea " },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setNudgeType(m.id as typeof nudgeType)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          nudgeType === m.id
                            ? "bg-sea/10 border-sea text-sea shadow-2xs"
                            : "bg-paper border-line text-ink-muted hover:bg-sand"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Izenburua:
                  </label>
                  <input
                    type="text"
                    required
                    value={nudgeTitle}
                    onChange={(e) => setNudgeTitle(e.target.value)}
                    placeholder="Adib. T2 neurketa egiteko garaia da!"
                    className="w-full px-3 py-2 rounded-xl border border-line text-xs text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Mezua (portaera-ekonomia tonu atseginean):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={nudgeMessage}
                    onChange={(e) => setNudgeMessage(e.target.value)}
                    placeholder="Idatzi entitateari laguntzeko mezua..."
                    className="w-full px-3 py-2 rounded-xl border border-line text-xs text-ink focus:ring-2 focus:ring-sea/40 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEragileForNudge(null)}
                    className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Utzi
                  </button>

                  <button
                    type="submit"
                    disabled={isSending || !nudgeTitle.trim() || !nudgeMessage.trim()}
                    className="px-5 py-2.5 rounded-xl bg-sea hover:opacity-95 text-white font-bold text-xs shadow-md shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? "Bidaltzen..." : "Bidali bultzada"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Entity Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-lg border border-line my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-euskara/15 text-euskara rounded-2xl">
                  <Store className="w-5 h-5 text-euskara" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">
                    Entitate berria gehitu
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Zehaztu entitatea eta hasierako hipotesia (aukerakoa)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPostModal(false)}
                className="text-ink-muted hover:text-ink-muted p-1.5 rounded-lg hover:bg-sand transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Entitatearen izena *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Adib.: Parte Zaharreko elkartea"
                    value={postName}
                    onChange={(e) => setPostName(e.target.value)}
                    className="w-full border border-line rounded-xl px-3.5 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Arduradunaren izena (aukerakoa)
                  </label>
                  <input
                    type="text"
                    placeholder="Adib.: Miren / Koldo"
                    value={postManager}
                    onChange={(e) => setPostManager(e.target.value)}
                    className="w-full border border-line rounded-xl px-3.5 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">
                    Nork (taldea)
                  </label>
                  <input
                    type="text"
                    value={postTaldea}
                    onChange={(e) => setPostTaldea(e.target.value)}
                    className="w-full border border-line rounded-xl px-3 py-1.5 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">
                    Norekin (pertsonak)
                  </label>
                  <input
                    type="text"
                    value={postPertsonak}
                    onChange={(e) => setPostPertsonak(e.target.value)}
                    className="w-full border border-line rounded-xl px-3 py-1.5 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">
                    Non (gunea)
                  </label>
                  <input
                    type="text"
                    value={postGunea}
                    onChange={(e) => setPostGunea(e.target.value)}
                    className="w-full border border-line rounded-xl px-3 py-1.5 text-xs text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Euskararen xede-igoera (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={postTargetPct}
                    onChange={(e) => setPostTargetPct(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="font-extrabold text-sm text-euskara bg-euskara/10 px-2.5 py-1 rounded-lg border border-euskara/25">
                    +%{postTargetPct}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-ink">
                    Hipotesia (nahi duzun bezala idatzi edo moldatu)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPostHipotesia(
                        `Gure ustez, ${postTaldea || "entitateko kideek"} ${postPertsonak || "herritarrekin eta bezeroekin"}, ${postGunea || "harrera edo gune nagusian"} esku-hartze pilotua aktibatuta, euskararen erabilera %${postTargetPct} igoko da.`
                      )
                    }
                    className="text-[10px] font-bold text-euskara hover:underline cursor-pointer"
                  >
                    Eguneratu txantiloiarekin
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={postHipotesia}
                  onChange={(e) => setPostHipotesia(e.target.value)}
                  className="w-full border border-euskara/40 bg-euskara/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-ink focus:ring-2 focus:ring-euskara/40 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPost || !postName.trim()}
                  className="px-5 py-2.5 bg-euskara hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingPost ? "Sortzen..." : "Sortu entitatea →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* App UI Texts Editor Modal */}
      {showTextEditorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-lg border border-line my-8 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-ink">
                    Aplikazioko testuak eta hizkuntza moldatu
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Zuzendu edo egokitu aplikazioko izenburuak, botoiak eta azalpenak kodea ukitu gabe.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTextEditorModal(false)}
                className="p-2 text-ink-muted hover:text-ink-muted rounded-xl hover:bg-sand transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {textEditorSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-euskara/10 border border-euskara/25 text-euskara text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{textEditorSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveTexts} className="space-y-6">
              {UI_TEXT_FIELDS.map((group) => (
                <div
                  key={group.section}
                  className="bg-paper rounded-2xl p-4 sm:p-5 border border-line space-y-3"
                >
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-900">
                    {group.section}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.items.map((item) => (
                      <div
                        key={item.key}
                        className={item.multiline ? "sm:col-span-2" : ""}
                      >
                        <label className="block text-[11px] font-bold text-ink mb-1">
                          {item.label}
                        </label>
                        {item.multiline ? (
                          <textarea
                            rows={2}
                            value={draftTexts[item.key] ?? DEFAULT_UI_TEXTS[item.key] ?? ""}
                            onChange={(e) =>
                              setDraftTexts((prev) => ({
                                ...prev,
                                [item.key]: e.target.value,
                              }))
                            }
                            className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                          />
                        ) : (
                          <input
                            type="text"
                            value={draftTexts[item.key] ?? DEFAULT_UI_TEXTS[item.key] ?? ""}
                            onChange={(e) =>
                              setDraftTexts((prev) => ({
                                ...prev,
                                [item.key]: e.target.value,
                              }))
                            }
                            className="w-full border border-line bg-white rounded-xl px-3 py-2 text-xs font-medium text-ink focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={handleResetDefaultTexts}
                  disabled={isSavingTexts}
                  className="px-3.5 py-2 text-xs font-bold text-terracotta hover:bg-terracotta/10 rounded-xl border border-terracotta/25 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Leheneratu jatorrizko testuak</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTextEditorModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
                  >
                    Utzi
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTexts}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingTexts ? "Gordetzen..." : "Gorde testu guztiak"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Account & Password Update Modal */}
      {showAdminAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-lg border border-line animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-ink">
                    Bagera admin kontua
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Aldatu koordinazioaren helbide elektronikoa eta pasahitza
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminAccountModal(false)}
                className="p-2 text-ink-muted hover:text-ink-muted rounded-xl hover:bg-sand transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminAccountError && (
              <div className="mb-4 p-3 rounded-xl bg-terracotta/10 border border-terracotta/25 text-terracotta text-xs font-semibold">
                {adminAccountError}
              </div>
            )}

            {adminAccountSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-euskara/10 border border-euskara/25 text-euskara text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{adminAccountSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Administratzailearen izena
                </label>
                <input
                  type="text"
                  required
                  value={adminNewName}
                  onChange={(e) => setAdminNewName(e.target.value)}
                  placeholder="Bagera Koordinazioa"
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Sartzeko helbide elektronikoa (kontua) *
                </label>
                <input
                  type="email"
                  required
                  value={adminNewEmail}
                  onChange={(e) => setAdminNewEmail(e.target.value)}
                  placeholder="admin@bagera.eus"
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-line">
                <label className="block text-xs font-bold text-ink mb-1">
                  Uneko pasahitza (egiaztatzeko) *
                </label>
                <input
                  type="password"
                  required
                  value={adminCurrentPassword}
                  onChange={(e) => setAdminCurrentPassword(e.target.value)}
                  placeholder="Sartu orain arteko pasahitza..."
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Pasahitz berria (utzi hutsik berdina mantentzeko)
                </label>
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Gutxienez 4 karaktere..."
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdminAccountModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-sand rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdminAccount || !adminCurrentPassword.trim()}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingAdminAccount ? "Gordetzen..." : "Gorde kontua eta pasahitza"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
