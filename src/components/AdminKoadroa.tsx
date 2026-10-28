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
} from "lucide-react";
import { useApp, getPublicEragileLabel, DEFAULT_UI_TEXTS } from "@/context/AppContext";
import type { Eragilea, Esperimentua, Neurketa } from "@/lib/db";

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
    updateNeurketa,
    deleteEragilea,
    deleteNeurketa,
    resetDemoData,
    updateAdminCredentials,
    uiTexts,
    updateUiTexts,
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
  const [neurketaDeletingId, setNeurketaDeletingId] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

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
    } else if (!editExpId && editHipotesia.trim()) {
      await createEsperimentua({
        eragile_id: eragileToEdit.id,
        pilotu_id: editPilotuId,
        hipotesia: editHipotesia.trim(),
        taldea: editTaldea.trim() || "Entitateko kideek",
        pertsonak: editPertsonak.trim() || "herritarrekin eta bezeroekin",
        gunea: editGunea.trim() || "harrera edo gune nagusian",
        xede_portzentajea: editXedePct,
      });
    }

    setIsSavingEdit(false);
    setEragileToEdit(null);
  };

  const openEditNeurketaModal = (n: Neurketa) => {
    setNeurketaToEdit(n);
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
    await deleteEragilea(eragileToDelete.id);
    setIsDeletingEragile(false);
    setEragileToDelete(null);
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

  // Global KPIs calculation
  const totalEragileak = eragileak.length;
  const totalNeurketak = neurketak.length;
  const totalEsperimentuak = esperimentuak.length;
  const amaitutakoEsperimentuak = esperimentuak.filter((e) => e.estatusa === "Amaituta").length;

  // Average growth across experiments with T0 and T1/T2 (aggregating all sessions)
  let totalGrowthSum = 0;
  let growthCount = 0;

  esperimentuak.forEach((exp) => {
    const expNeurketak = neurketak.filter((n) => n.esperimentu_id === exp.id);
    const t0List = expNeurketak.filter((n) => n.unea === "T0");
    const t2List = expNeurketak.filter((n) => n.unea === "T2");
    const t1List = expNeurketak.filter((n) => n.unea === "T1");
    const latestList = t2List.length > 0 ? t2List : t1List;

    if (t0List.length > 0 && latestList.length > 0) {
      const t0Eusk = t0List.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
      const t0Tot = t0List.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);

      const latEusk = latestList.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
      const latTot = latestList.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);

      if (t0Tot > 0 && latTot > 0) {
        const t0Pct = (t0Eusk / t0Tot) * 100;
        const latPct = (latEusk / latTot) * 100;
        totalGrowthSum += latPct - t0Pct;
        growthCount++;
      }
    }
  });

  const avgGrowth = growthCount > 0 ? Math.round(totalGrowthSum / growthCount) : 0;

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
  const handleExportCSV = () => {
    const headers = [
      "Neurketa_ID",
      "Esperimentu_ID",
      "Entitatea",
      "Fasea",
      "Euskaraz",
      "Erdaraz",
      "Elebi",
      "Euskara_Portzentajea",
      "Data",
      "Behatzailea",
      "Oharrak",
    ];

    const rows = neurketak.map((n) => {
      const exp = esperimentuak.find((e) => e.id === n.esperimentu_id);
      const eragilea = eragileak.find((er) => er.id === exp?.eragile_id);
      const total = n.euskaraz_count + n.erdaraz_count + n.elebi_count;
      const pct = total > 0 ? Math.round((n.euskaraz_count / total) * 100) : 0;

      return [
        n.id,
        n.esperimentu_id,
        `"${eragilea?.izena || "Entitatea"}"`,
        n.unea,
        n.euskaraz_count,
        n.erdaraz_count,
        n.elebi_count,
        `${pct}%`,
        `"${new Date(n.data_ordu).toLocaleString("eu-ES")}"`,
        `"${n.behatzailea || ""}"`,
        `"${(n.oharrak || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bidean_eragin_neurketak_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>
              {isPresentationMode
                ? "Bagera • Emaitzen aurkezpen publikoa"
                : "Bagera • Koordinazio-panela"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isPresentationMode
              ? "Bidean Eragin — Emaitza eta bilakaera orokorra"
              : "Bidean Eragin — Entitateen kudeaketa orokorra"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isPresentationMode
              ? "Parte hartzen duten entitateen hizkuntza-ohituren bilakaera (T0 → T1 → T2)."
              : "Entitateen aurrerapena jarraitu, portaera-bultzadak kudeatu eta emaitzak aztertu."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition cursor-pointer ${
              isPresentationMode
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25"
                : "bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
            title="Ezkutatu administrazio-botoiak proiektorean edo publikoaren aurrean erakusteko"
          >
            <Monitor className="w-4 h-4" />
            <span>{isPresentationMode ? "Irten aurkezpen-modutik" : "Aurkezpen-modua"}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Inprimatu edo gorde PDF txostena"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Inprimatu (PDF)</span>
          </button>

          {!isPresentationMode && (
            <>
              <button
                onClick={() => setShowNewPostModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Entitate berria</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-300" />
                <span>Esportatu (CSV)</span>
              </button>

              <button
                type="button"
                onClick={openTextEditorModal}
                className="px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Moldatu aplikazio osoko testuak eta etiketak erraz"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Testuak moldatu</span>
              </button>

              <button
                type="button"
                onClick={openAdminAccountModal}
                className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Aldatu Bagerako administratzailearen helbide elektronikoa eta pasahitza"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin kontua / pasahitza</span>
              </button>

              {(eragileak.length > 0 || neurketak.length > 0) && (
                <button
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Ezabatu aurretik egindako proba, entitate eta neurketa guztiak"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Garbitu proba guztiak</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Global KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        
        {/* KPI 1: Active Centers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Entitate aktiboak
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalEragileak}</div>
          <p className="text-[11px] text-slate-500 mt-1">Elkarte, ikastetxe, zerbitzu eta enpresak</p>
        </div>

        {/* KPI 2: Measurements */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Neurketak guztira
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{totalNeurketak}</div>
          <p className="text-[11px] text-slate-500 mt-1">T0, T1 eta T2 neurketa-saioak</p>
        </div>

        {/* KPI 3: Average Growth */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Batez besteko igoera
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {growthCount > 0 ? `${avgGrowth >= 0 ? "+" : ""}${avgGrowth}%` : "0%"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {growthCount > 0 ? "Euskararen erabileraren hobekuntza" : "T0 eta T1/T2 neurketen zain"}
          </p>
        </div>

        {/* KPI 4: Experiments */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Esperimentuak
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalEsperimentuak}</div>
          <p className="text-[11px] text-slate-500 mt-1">{amaitutakoEsperimentuak} ziklo osatu</p>
        </div>
      </div>

      {/* Visual T0 -> T1 -> T2 Comparative Progress Chart Across Participating Centers */}
      {eragileak.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Entitateen bilakaera konparatiboa (T0 → T1 → T2 euskararen erabilera %)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Entitate bakoitzaren hasierako argazkia (T0), berehalako eragina (T1) eta ohitura finkatua (T2).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-sky-700">
                <span className="w-3 h-3 rounded-xs bg-sky-500 inline-block" /> T0 (aurretik)
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> T1 (berehala)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> T2 (sendotua)
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {eragileak.map((eragile) => {
              const exp = esperimentuak.find((e) => e.eragile_id === eragile.id);
              const expNeu = neurketak.filter((n) => n.esperimentu_id === exp?.id);
              const calcPct = (phase: "T0" | "T1" | "T2") => {
                const list = expNeu.filter((n) => n.unea === phase);
                const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
                const tot = list.reduce(
                  (s, n) =>
                    s +
                    (n.euskaraz_count || 0) +
                    (n.erdaraz_count || 0) +
                    (n.elebi_count || 0),
                  0
                );
                return tot > 0 ? Math.round((eusk / tot) * 100) : null;
              };
              const p0 = calcPct("T0");
              const p1 = calcPct("T1");
              const p2 = calcPct("T2");
              const latest = p2 !== null ? p2 : p1;
              const diff = p0 !== null && latest !== null ? latest - p0 : null;

              return (
                <div
                  key={eragile.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {isPresentationMode
                          ? getPublicEragileLabel(eragile, "eragilea")
                          : eragile.izena}
                      </span>
                      {!isPresentationMode && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            Number(eragile.publikoa) === 1
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {Number(eragile.publikoa) === 1
                            ? "🔓 Publikoa"
                            : `🔒 ${getPublicEragileLabel(eragile, "eragilea")}`}
                        </span>
                      )}
                      {exp && !isPresentationMode && (
                        <span className="text-xs text-slate-500">
                          ({exp.gunea} • Helburua: +%{exp.xede_portzentajea})
                        </span>
                      )}
                    </div>
                    {diff !== null ? (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          diff >= 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {diff >= 0 ? `+${diff}%` : `${diff}%`} bilakaera
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {p0 !== null ? `T0 neurtuta (%${p0})` : "Lehen neurketaren zain"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        { label: "T0", val: p0, color: "bg-sky-500", text: "text-sky-700" },
                        { label: "T1", val: p1, color: "bg-amber-500", text: "text-amber-700" },
                        { label: "T2", val: p2, color: "bg-emerald-500", text: "text-emerald-700" },
                      ] as const
                    ).map((bar) => (
                      <div key={bar.label} className="bg-white rounded-xl p-2.5 border border-slate-200/70">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-extrabold ${bar.text}`}>{bar.label}</span>
                          <span className="font-black text-slate-800">
                            {bar.val !== null ? `%${bar.val}` : "—"}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            Pilotuen eraginkortasun-konparaketa (emaitza errealak)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pilotuak.map((pilotu) => {
            const pilotExps = esperimentuak.filter((e) => e.pilotu_id === pilotu.id);
            const pilotExpsCount = pilotExps.length;

            let pilotGrowthSum = 0;
            let pilotGrowthCount = 0;
            pilotExps.forEach((exp) => {
              const expNeurketak = neurketak.filter((n) => n.esperimentu_id === exp.id);
              const t0List = expNeurketak.filter((n) => n.unea === "T0");
              const t2List = expNeurketak.filter((n) => n.unea === "T2");
              const t1List = expNeurketak.filter((n) => n.unea === "T1");
              const latestList = t2List.length > 0 ? t2List : t1List;
              if (t0List.length > 0 && latestList.length > 0) {
                const t0Eusk = t0List.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
                const t0Tot = t0List.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);
                const latEusk = latestList.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
                const latTot = latestList.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);
                if (t0Tot > 0 && latTot > 0) {
                  pilotGrowthSum += (latEusk / latTot) * 100 - (t0Eusk / t0Tot) * 100;
                  pilotGrowthCount++;
                }
              }
            });
            const pilotAvgGrowth = pilotGrowthCount > 0 ? Math.round(pilotGrowthSum / pilotGrowthCount) : null;

            return (
              <div
                key={pilotu.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      {pilotu.izena}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {pilotExpsCount} esperimentu
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {pilotu.azpititulua}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Batez besteko efektua:
                  </span>
                  {pilotAvgGrowth !== null ? (
                    <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">
                      {pilotAvgGrowth >= 0 ? `+${pilotAvgGrowth}%` : `${pilotAvgGrowth}%`} igoera
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-lg">
                      Datuen zain (T0/T1)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centers Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Parte hartzen duten entitateak ({filteredEragileak.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Egin klik entitatearen panelean sartzeko edo hipotesia eta emaitzak ikusteko.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Bilatu entitatea..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <select
              value={filterMota}
              onChange={(e) => setFilterMota(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
            >
              <option value="all">Mota guztiak</option>
              <option value="ikastetxea">Ikastetxeak</option>
              <option value="merkataritza">Merkataritza / zerbitzuak</option>
              <option value="enpresa">Enpresak</option>
              <option value="aisialdia">Elkarteak / aisialdia</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
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
                  const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
                  const tot = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);
                  return tot > 0 ? Math.round((eusk / tot) * 100) : null;
                };

                const t0Pct = calcPhasePct(t0List);
                const t1Pct = calcPhasePct(t1List);
                const t2Pct = calcPhasePct(t2List);

                return (
                  <tr key={eragile.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
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
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {eragile.arduraduna}
                          {eragile.email ? ` (${eragile.email})` : ""}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3 capitalize font-medium text-slate-600">
                      {eragile.mota}
                    </td>

                    <td className="py-3.5 pr-3 max-w-xs">
                      {exp ? (
                        <div>
                          <p
                            onClick={() => !isPresentationMode && openEditEragileModal(eragile, exp)}
                            className="text-slate-800 font-medium line-clamp-2 cursor-pointer hover:text-indigo-700 transition"
                            title="Egin klik hipotesia editatzeko"
                          >
                            &ldquo;{exp.hipotesia}&rdquo;
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                            Gunea: {exp.gunea} • Xedea: +%{exp.xede_portzentajea}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 truncate block">{eragile.erronka_nagusia}</span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3">
                      {exp ? (
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {exp.pilotu_izena || "Euskaraz barra-barra txapak"}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                              exp.estatusa === "Amaituta"
                                ? "bg-emerald-100 text-emerald-800"
                                : exp.estatusa === "T2_zain"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {exp.estatusa.replace("_", " ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Esperimentu gabe</span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t0List.length > 0 ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-400"
                          }`}
                          title={t0List.length > 0 ? `T0: ${t0List.length} saio (%${t0Pct} euskara)` : "T0 egin gabe"}
                        >
                          T0{t0Pct !== null ? ` %${t0Pct}` : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t1List.length > 0 ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-400"
                          }`}
                          title={t1List.length > 0 ? `T1: ${t1List.length} saio (%${t1Pct} euskara)` : "T1 egin gabe"}
                        >
                          T1{t1Pct !== null ? ` %${t1Pct}` : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t2List.length > 0 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
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
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
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
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                              title="Neurtu entitate hau zuzenean"
                            >
                              <Timer className="w-3.5 h-3.5 text-emerald-600" />
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
                                  ? "T2 neurketa egiteko unea iritsi da! 🚀"
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
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Bidali bultzada-mezu bat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Bultzada</span>
                          </button>

                          <button
                            onClick={() => setEragileToDelete(eragile)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Ezabatu entitatea eta bere proba-neurketa guztiak"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
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
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 my-4">
              <Store className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">
                Oraindik ez dago entitaterik zerrendan
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Sortu hemen entitate berri bat segundo gutxitan eta hasi zuzenean neurtzen:
              </p>
              <button
                type="button"
                onClick={() => setShowNewPostModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-2 cursor-pointer"
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Egindako neurketen saioak ({neurketak.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Neurketa baten datuak (behatzailea, fasea, zenbakiak edo oharrak) zuzendu edo proba-saio bat ezabatu dezakezu hemen.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
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
                    <tr key={n.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 pr-3 font-bold text-slate-900">
                        {eragilea?.izena || "Entitatea"}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            n.unea === "T0"
                              ? "bg-sky-100 text-sky-800"
                              : n.unea === "T1"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {n.unea}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 font-medium">
                        {n.behatzailea || <span className="text-slate-400 italic">Izendatu gabe</span>}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-bold text-emerald-700">{n.euskaraz_count} eusk</span>
                        {" / "}
                        <span className="text-rose-600 font-semibold">{n.erdaraz_count} erd</span>
                        {" / "}
                        <span className="text-amber-600 font-semibold">{n.elebi_count} elebi</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          %{pct}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-500">
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
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <Pencil className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Entitatea eta hipotesia editatu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zuzendu entitatearen datuak, sarbide-kredentzialak eta hipotesia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEragileToEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEragileAndExp} className="space-y-5">
              {/* Section 1: Entitatearen datuak */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-600" />
                  <span>1. Entitatearen datuak eta sarbidea</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Entitatearen izena *
                    </label>
                    <input
                      type="text"
                      required
                      value={editIzena}
                      onChange={(e) => setEditIzena(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mota
                    </label>
                    <select
                      value={editMota}
                      onChange={(e) => setEditMota(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Arduraduna
                    </label>
                    <input
                      type="text"
                      value={editArduraduna}
                      onChange={(e) => setEditArduraduna(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Erronka nagusia
                    </label>
                    <input
                      type="text"
                      value={editErronka}
                      onChange={(e) => setEditErronka(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Helbide elektronikoa (entitateak saioa hasteko)
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Adib.: entitatea@gmail.com"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pasahitz berria (utzi hutsik ez aldatzeko)
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Adib.: bidean123"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Esperimentua eta hipotesia */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Hipotesia eta esperimentuaren xehetasunak (aukerakoa)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = `Gure ustez, ${editTaldea || "entitateko kideek"} ${editPertsonak || "herritarrekin eta bezeroekin"}, ${editGunea || "harrera edo gune nagusian"} esku-hartze pilotua aktibatuta, euskararen erabilera %${editXedePct} igoko da.`;
                      setEditHipotesia(generated);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs transition cursor-pointer"
                  >
                    ✨ Sortu esaldia azpiko eremuekin
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Hipotesia (utzi hutsik oraindik esperimenturik ez badu)
                  </label>
                  <textarea
                    rows={3}
                    value={editHipotesia}
                    onChange={(e) => setEditHipotesia(e.target.value)}
                    placeholder="Idatzi hemen entitate honetarako adostutako hipotesia..."
                    className="w-full border border-emerald-300 bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nork (taldea)
                    </label>
                    <input
                      type="text"
                      value={editTaldea}
                      onChange={(e) => setEditTaldea(e.target.value)}
                      placeholder="Adib.: Entitateko kideek"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Norekin (pertsonak)
                    </label>
                    <input
                      type="text"
                      value={editPertsonak}
                      onChange={(e) => setEditPertsonak(e.target.value)}
                      placeholder="Adib.: Herritarrekin"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Non (gunea)
                    </label>
                    <input
                      type="text"
                      value={editGunea}
                      onChange={(e) => setEditGunea(e.target.value)}
                      placeholder="Adib.: Harrera-gunean"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Xede-igoera (%):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editXedePct}
                      onChange={(e) => setEditXedePct(Number(e.target.value))}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pilotua:
                    </label>
                    <select
                      value={editPilotuId}
                      onChange={(e) => setEditPilotuId(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-900"
                    >
                      {pilotuak.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.izena}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fasea / estatusa:
                    </label>
                    <select
                      value={editEstatusa}
                      onChange={(e) => setEditEstatusa(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="T0_zain">T0 zain</option>
                      <option value="T1_zain">T1 zain</option>
                      <option value="T2_zain">T2 zain</option>
                      <option value="Amaituta">Amaituta</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEragileToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editIzena.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Pencil className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Neurketa-saioa editatu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zuzendu fasea, behatzailea edo elkarrizketa kopuruak
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNeurketaToEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditNeurketa} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fasea (T0 / T1 / T2)
                  </label>
                  <select
                    value={editNeuUnea}
                    onChange={(e) => setEditNeuUnea(e.target.value as "T0" | "T1" | "T2")}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="T0">T0 (hasierako neurketa)</option>
                    <option value="T1">T1 (tarteko neurketa)</option>
                    <option value="T2">T2 (amaierako neurketa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Behatzailea
                  </label>
                  <input
                    type="text"
                    value={editNeuBehatzailea}
                    onChange={(e) => setEditNeuBehatzailea(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <label className="block text-[10px] font-extrabold uppercase text-emerald-800 mb-1">
                    Euskaraz
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editNeuEusk}
                    onChange={(e) => setEditNeuEusk(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-sm font-black text-emerald-800"
                  />
                </div>

                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <label className="block text-[10px] font-extrabold uppercase text-rose-800 mb-1">
                    Erdaraz
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editNeuErd}
                    onChange={(e) => setEditNeuErd(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-sm font-black text-rose-800"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Oharrak
                </label>
                <textarea
                  rows={2}
                  value={editNeuOharrak}
                  onChange={(e) => setEditNeuOharrak(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNeurketaToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isSavingNeurketaEdit}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Entitatea ezabatu?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Ziur zaude <strong>{eragileToDelete.izena}</strong> eta hari lotutako esperimentu zein neurketa guztiak ezabatu nahi dituzula?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEragileToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Utzi
              </button>
              <button
                type="button"
                disabled={isDeletingEragile}
                onClick={handleConfirmDeleteEragilea}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingEragile ? "Ezabatzen..." : "Bai, ezabatu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET ALL TEST DATA CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <RotateCcw className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Aurretik egindako proba guztiak garbitu?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Ekintza honek orain arte sortutako <strong>entitate, esperimentu eta proba-neurketa guztiak</strong> ezabatuko ditu, panela hutsik eta garbi utziz benetako neurketak zerotik hasteko.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Utzi
              </button>
              <button
                type="button"
                disabled={isResettingAll}
                onClick={handleConfirmResetAll}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Bidali bultzada entitateari
                </h3>
                <p className="text-xs text-slate-500">
                  Hartzailea: <strong>{selectedEragileForNudge.izena}</strong>
                </p>
              </div>
            </div>

            {sendSuccess ? (
              <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-200 my-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-emerald-900 text-sm">Bultzada arrakastaz bidali da!</h4>
                <p className="text-xs text-emerald-700 mt-1">Entitateak bere jakinarazpenetan ikusiko du.</p>
              </div>
            ) : (
              <form onSubmit={handleSendNudge} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bultzada-mota:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "bultzada", label: "Bultzada ⚡" },
                      { id: "abisua", label: "Abisua ⏰" },
                      { id: "zoriontzea", label: "Zoriontzea 🎉" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setNudgeType(m.id as typeof nudgeType)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          nudgeType === m.id
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Izenburua:
                  </label>
                  <input
                    type="text"
                    required
                    value={nudgeTitle}
                    onChange={(e) => setNudgeTitle(e.target.value)}
                    placeholder="Adib. T2 neurketa egiteko garaia da!"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mezua (portaera-ekonomia tonu atseginean):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={nudgeMessage}
                    onChange={(e) => setNudgeMessage(e.target.value)}
                    placeholder="Idatzi entitateari laguntzeko mezua..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEragileForNudge(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Utzi
                  </button>

                  <button
                    type="submit"
                    disabled={isSending || !nudgeTitle.trim() || !nudgeMessage.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
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
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Store className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Entitate berria gehitu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zehaztu entitatea eta hasierako hipotesia (aukerakoa)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPostModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Entitatearen izena *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Adib.: Parte Zaharreko elkartea"
                    value={postName}
                    onChange={(e) => setPostName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Arduradunaren izena (aukerakoa)
                  </label>
                  <input
                    type="text"
                    placeholder="Adib.: Miren / Koldo"
                    value={postManager}
                    onChange={(e) => setPostManager(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nork (taldea)
                  </label>
                  <input
                    type="text"
                    value={postTaldea}
                    onChange={(e) => setPostTaldea(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Norekin (pertsonak)
                  </label>
                  <input
                    type="text"
                    value={postPertsonak}
                    onChange={(e) => setPostPertsonak(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Non (gunea)
                  </label>
                  <input
                    type="text"
                    value={postGunea}
                    onChange={(e) => setPostGunea(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  <span className="font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    +%{postTargetPct}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Hipotesia (nahi duzun bezala idatzi edo moldatu)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPostHipotesia(
                        `Gure ustez, ${postTaldea || "entitateko kideek"} ${postPertsonak || "herritarrekin eta bezeroekin"}, ${postGunea || "harrera edo gune nagusian"} esku-hartze pilotua aktibatuta, euskararen erabilera %${postTargetPct} igoko da.`
                      )
                    }
                    className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    ✨ Eguneratu txantiloiarekin
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={postHipotesia}
                  onChange={(e) => setPostHipotesia(e.target.value)}
                  className="w-full border border-emerald-300 bg-emerald-50/30 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPost || !postName.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Aplikazioko testuak eta hizkuntza moldatu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zuzendu edo egokitu aplikazioko izenburuak, botoiak eta azalpenak kodea ukitu gabe.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTextEditorModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {textEditorSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{textEditorSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveTexts} className="space-y-6">
              {UI_TEXT_FIELDS.map((group) => (
                <div
                  key={group.section}
                  className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3"
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
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                            className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
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
                            className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetDefaultTexts}
                  disabled={isSavingTexts}
                  className="px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Leheneratu jatorrizko testuak</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTextEditorModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Bagera admin kontua
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aldatu koordinazioaren helbide elektronikoa eta pasahitza
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminAccountModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminAccountError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {adminAccountError}
              </div>
            )}

            {adminAccountSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{adminAccountSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administratzailearen izena
                </label>
                <input
                  type="text"
                  required
                  value={adminNewName}
                  onChange={(e) => setAdminNewName(e.target.value)}
                  placeholder="Bagera Koordinazioa"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sartzeko helbide elektronikoa (kontua) *
                </label>
                <input
                  type="email"
                  required
                  value={adminNewEmail}
                  onChange={(e) => setAdminNewEmail(e.target.value)}
                  placeholder="admin@bagera.eus"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uneko pasahitza (egiaztatzeko) *
                </label>
                <input
                  type="password"
                  required
                  value={adminCurrentPassword}
                  onChange={(e) => setAdminCurrentPassword(e.target.value)}
                  placeholder="Sartu orain arteko pasahitza..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pasahitz berria (utzi hutsik berdina mantentzeko)
                </label>
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Gutxienez 4 karaktere..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdminAccountModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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
