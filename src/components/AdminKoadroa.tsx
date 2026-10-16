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
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Eragilea, Esperimentua, Neurketa } from "@/lib/db";

export default function AdminKoadroa() {
  const {
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
    setObservationConfig,
    setCurrentEragileId,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMota, setFilterMota] = useState("all");
  const [selectedEragileForNudge, setSelectedEragileForNudge] = useState<Eragilea | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

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
      setEditTaldea("Saltokiko lantaldea");
      setEditPertsonak("Bezeroak eta langileak");
      setEditGunea("Saltokiaren mostradorea");
      setEditXedePct(25);
      setEditHipotesia(
        "Gure ustez, Saltokiko lantaldea Bezeroak eta langileak, Saltokiaren mostradorea 'Euskaraz barra-barra' txapa soinean eramanda, euskararen erabilera %25 igoko da."
      );
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
      erronka_nagusia: editErronka.trim() || "Dendan lehen hitza eta elkarrizketa euskaraz piztea.",
    });

    if (editExpId) {
      await updateEsperimentua({
        id: editExpId,
        pilotu_id: editPilotuId,
        hipotesia: editHipotesia.trim(),
        taldea: editTaldea.trim() || "Saltokiko lantaldea",
        pertsonak: editPertsonak.trim() || "Bezeroak eta langileak",
        gunea: editGunea.trim() || "Saltokiaren mostradorea",
        xede_portzentajea: editXedePct,
        estatusa: editEstatusa,
      });
    } else if (editHipotesia.trim()) {
      await createEsperimentua({
        eragile_id: eragileToEdit.id,
        pilotu_id: editPilotuId,
        hipotesia: editHipotesia.trim(),
        taldea: editTaldea.trim() || "Saltokiko lantaldea",
        pertsonak: editPertsonak.trim() || "Bezeroak eta langileak",
        gunea: editGunea.trim() || "Saltokiaren mostradorea",
        xede_portzentajea: editXedePct,
      });
    }

    setIsSavingEdit(false);
    setEragileToEdit(null);
  };

  const openEditNeurketaModal = (n: Neurketa) => {
    setNeurketaToEdit(n);
    setEditNeuUnea(n.unea);
    setEditNeuBehatzailea(n.behatzailea || "Behatzaile Itsua");
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
      behatzailea: editNeuBehatzailea.trim() || "Behatzaile Itsua",
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

  // New Post/Shop Modal State
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [postName, setPostName] = useState("");
  const [postManager, setPostManager] = useState("");
  const [postErronka, setPostErronka] = useState("Dendan lehen hitza eta elkarrizketa euskaraz piztea, txapak erabilita.");
  const [postTaldea, setPostTaldea] = useState("Saltokiko lantaldea");
  const [postPertsonak, setPostPertsonak] = useState("Bezeroak eta langileak");
  const [postGunea, setPostGunea] = useState("Saltokiaren mostradorea");
  const [postTargetPct, setPostTargetPct] = useState(25);
  const [postHipotesia, setPostHipotesia] = useState(
    "Langileek 'Euskaraz barra-barra' txapa soinean eramanda, saltokiaren mostradorean bezeroen lehen hitza eta elkarrizketak euskaraz %25 igoko dira."
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
      "Eragilea",
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
        `"${eragilea?.izena || "Zentroa"}"`,
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
                ? "Bagera • Emaitzen Aurkezpen Publikoa"
                : "Bagera / Mikel • Koordinazio Panela"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isPresentationMode
              ? "Bidean Eragin — Emaitza eta Bilakaera Globala"
              : "Bidean Eragin — Zentroen Kudeaketa Globala"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isPresentationMode
              ? "Parte hartzen duten saltoki eta zentroen hizkuntza-ohituren bilakaera (T0 → T1 → T2)."
              : "Zentroen aurrerapena monitorizatu, portaera-bultzadak kudeatu eta emaitzak aztertu."}
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
            <span>{isPresentationMode ? "Irten Aurkezpen Modutik" : "Aurkezpen Modua"}</span>
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
                <span>+ Saltoki / Postu Berria</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-300" />
                <span>Esportatu (CSV)</span>
              </button>

              {(eragileak.length > 0 || neurketak.length > 0) && (
                <button
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Ezabatu aurretik egindako proba, saltoki eta neurketa guztiak"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Garbitu Proba Guztiak</span>
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
              Zentro Aktiboak
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalEragileak}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ikastetxe, denda eta enpresak</p>
        </div>

        {/* KPI 2: Measurements */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Neurketak Guztira
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{totalNeurketak}</div>
          <p className="text-[11px] text-slate-500 mt-1">T0, T1 eta T2 behaketa itsuak</p>
        </div>

        {/* KPI 3: Average Growth */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Batez Besteko Igoera
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
                  Saltokien Bilakaera Konparatiboa (T0 → T1 → T2 Euskararen Erabilera %)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Saltoki bakoitzaren hasierako argazkia (T0), berehalako eragina (T1) eta ohitura finkatua (T2).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-sky-700">
                <span className="w-3 h-3 rounded-xs bg-sky-500 inline-block" /> T0 (Aurretik)
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> T1 (Berehala)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> T2 (Sendotua)
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
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        {eragile.izena}
                      </span>
                      {exp && (
                        <span className="text-xs text-slate-500 ml-2">
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
            Pilotuen Eraginkortasun Konparaketa (Emaitza Errealak)
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
              Parte Hartzen Duten Zentroak ({filteredEragileak.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Egin klik zentroaren panelean sartzeko edo hipotesia eta emaitzak ikusteko.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Bilatu zentroa..."
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
              <option value="all">Mota Guztiak</option>
              <option value="ikastetxea">Ikastetxeak</option>
              <option value="merkataritza">Merkataritza</option>
              <option value="enpresa">Enpresak</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">Zentroa / Saltokia</th>
                <th className="pb-3">Mota</th>
                <th className="pb-3">Hipotesia & Erronka</th>
                <th className="pb-3">Pilotua & Estatusa</th>
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
                      <span className="font-bold text-slate-900 block text-sm">
                        {eragile.izena}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {eragile.arduraduna}
                        {!isPresentationMode && eragile.email ? ` (${eragile.email})` : ""}
                      </span>
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
                        title="Ikusi zentroaren panela"
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
                              title="Neurtu postu hau zuzenean"
                            >
                              <Timer className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Neurtu ({t0List.length === 0 ? "T0" : t1List.length === 0 ? "T1" : "T2"})</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditEragileModal(eragile, exp)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Editatu saltokiaren datuak eta hipotesia"
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
                            title="Bidali bultzada mezu bat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Bultzada</span>
                          </button>

                          <button
                            onClick={() => setEragileToDelete(eragile)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Ezabatu saltokia / zentroa eta bere proba-neurketa guztiak"
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
                Oraindik ez dago saltokirik zerrendan
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Gaur bi saltokitara bazoazte T0 neurtzera, sortu hemen biak segundu gutxitan eta zuzenean neurtzen hasi:
              </p>
              <button
                type="button"
                onClick={() => setShowNewPostModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Gehitu 1. Saltokia / Postua</span>
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
                Egindako Neurketen Saioak ({neurketak.length})
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
                  <th className="pb-3">Saltokia / Zentroa</th>
                  <th className="pb-3">Fasea</th>
                  <th className="pb-3">Behatzailea</th>
                  <th className="pb-3">Elkarrizketak (Eusk / Erd / Elebi)</th>
                  <th className="pb-3">Data eta Ordua</th>
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
                        {eragilea?.izena || "Saltokia"}
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
                    Saltokia eta Hipotesia Editatu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zuzendu saltokiaren datuak, sarbide-kredentzialak eta benetako hipotesia
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
              {/* Section 1: Saltokiaren datuak */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-600" />
                  <span>1. Saltokiaren / Zentroaren Datuak & Sarbidea</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Saltokiaren / Postuaren Izena *
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
                      <option value="merkataritza">Merkataritza / Saltokia</option>
                      <option value="ikastetxea">Ikastetxea</option>
                      <option value="enpresa">Enpresa</option>
                      <option value="aisialdia">Aisialdia / Elkartea</option>
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
                      Erronka Nagusia
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
                      Emaila (Saltokiak saioa hasteko)
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="adib: denda@gmail.com"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pasahitz Berria (utzi hutsik ez aldatzeko)
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Adib: bidean123"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Esperimentua eta Hipotesi Erreala */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Hipotesi Erreala eta Esperimentuaren Xehetasunak</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = `Gure ustez, ${editTaldea || "Saltokiko lantaldea"} ${editPertsonak || "Bezeroak eta langileak"}, ${editGunea || "Saltokiaren mostradorea"} 'Euskaraz barra-barra' txapa soinean eramanda, euskararen erabilera %${editXedePct} igoko da.`;
                      setEditHipotesia(generated);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs transition cursor-pointer"
                  >
                    ✨ Sortu esaldia azpiko eremuekin
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Hipotesia (idatzi nahi duzun testu zehatza) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editHipotesia}
                    onChange={(e) => setEditHipotesia(e.target.value)}
                    placeholder="Idatzi hemen saltoki honetarako adostutako hipotesi erreala..."
                    className="w-full border border-emerald-300 bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nork (Taldea)
                    </label>
                    <input
                      type="text"
                      value={editTaldea}
                      onChange={(e) => setEditTaldea(e.target.value)}
                      placeholder="Adib: Harategiko langileek"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Norekin (Pertsonak)
                    </label>
                    <input
                      type="text"
                      value={editPertsonak}
                      onChange={(e) => setEditPertsonak(e.target.value)}
                      placeholder="Adib: Bezeroekin"
                      className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Non (Gunea)
                    </label>
                    <input
                      type="text"
                      value={editGunea}
                      onChange={(e) => setEditGunea(e.target.value)}
                      placeholder="Adib: Mostradorean"
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
                      Fasea / Estatusa:
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
                  disabled={isSavingEdit || !editIzena.trim() || !editHipotesia.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? "Gordetzen..." : "Gorde Aldaketak"}</span>
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
                    Neurketa Saioa Editatu
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
                    <option value="T0">T0 (Aurre-neurketa)</option>
                    <option value="T1">T1 (Tarteko neurketa)</option>
                    <option value="T2">T2 (Amaierako neurketa)</option>
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
                  <span>{isSavingNeurketaEdit ? "Gordetzen..." : "Gorde Saioa"}</span>
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
                  Saltokia / Proba Ezabatu?
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
                <span>{isDeletingEragile ? "Ezabatzen..." : "Bai, Ezabatu"}</span>
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
                  Aurretik Egindako Proba Guztiak Garbitu?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Ekintza honek orain arte sortutako <strong>saltoki, esperimentu eta proba-neurketa guztiak</strong> ezabatuko ditu, panela hutsik eta garbi utziz gaurko benetako neurketak zerotik hasteko.
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
                <span>{isResettingAll ? "Garbitzen..." : "Bai, Garbitu Dena"}</span>
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
                  Bidali Bultzada Zentroari
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
                <p className="text-xs text-emerald-700 mt-1">Zentroak bere jakinarazpenetan ikusiko du.</p>
              </div>
            ) : (
              <form onSubmit={handleSendNudge} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bultzada Mota:
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
                    Mezua (Portaera-ekonomia tonu atseginean):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={nudgeMessage}
                    onChange={(e) => setNudgeMessage(e.target.value)}
                    placeholder="Idatzi zentroari laguntzeko mezua..."
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
                    <span>{isSending ? "Bidaltzen..." : "Bidali Bultzada"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Post / Shop Modal */}
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
                    Saltoki edo Postu Berria Gehitu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zehaztu saltokia eta zuen hipotesi erreala
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
                    Saltokiaren edo Postuaren Izena *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Adib: Bretxako 1. postua - Harategia"
                    value={postName}
                    onChange={(e) => setPostName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Arduradunaren Izena (hautazkoa)
                  </label>
                  <input
                    type="text"
                    placeholder="Adib: Miren / Koldo"
                    value={postManager}
                    onChange={(e) => setPostManager(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nork (Taldea)
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
                    Norekin (Pertsonak)
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
                    Non (Gunea)
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
                  Euskararen Xede-Igoera (%):
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
                    Hipotesi Erreala (nahi duzun bezala idatzi edo moldatu) *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPostHipotesia(
                        `Gure ustez, ${postTaldea || "Saltokiko lantaldea"} ${postPertsonak || "Bezeroak eta langileak"}, ${postGunea || "Saltokiaren mostradorea"} 'Euskaraz barra-barra' txapa soinean eramanda, euskararen erabilera %${postTargetPct} igoko da.`
                      )
                    }
                    className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    ✨ Eguneratu txantiloiarekin
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
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
                  disabled={isCreatingPost || !postName.trim() || !postHipotesia.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingPost ? "Sortzen..." : "Sortu Postua & Hipotesia →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
