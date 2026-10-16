"use client";

import React, { useState } from "react";
import {
  Sparkles,
  BadgeCheck,
  Star,
  Flame,
  MessageCircleHeart,
  Store,
  Award,
  Heart,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
  FileText,
  X,
  Printer,
  PlusCircle,
  Check,
  HelpCircle,
  Shield,
  Tag,
  Pencil,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Pilotua } from "@/lib/db";
import MadLibsSortzailea from "./MadLibsSortzailea";

const AVAILABLE_ICONS = [
  { id: "BadgeCheck", label: "Txapa / Ikurra", icon: BadgeCheck },
  { id: "Store", label: "Denda / Merkataritza", icon: Store },
  { id: "MessageCircleHeart", label: "Agurra / Hitza", icon: MessageCircleHeart },
  { id: "Star", label: "Erreferentea", icon: Star },
  { id: "Flame", label: "Erronka / Sua", icon: Flame },
  { id: "Award", label: "Lorpena", icon: Award },
  { id: "Sparkles", label: "Portaera-bultzada", icon: Sparkles },
];

const AVAILABLE_COLORS = [
  { id: "emerald", label: "Berdea", bg: "bg-emerald-500", ring: "ring-emerald-400" },
  { id: "sky", label: "Urdina", bg: "bg-sky-500", ring: "ring-sky-400" },
  { id: "amber", label: "Laranja", bg: "bg-amber-500", ring: "ring-amber-400" },
  { id: "indigo", label: "Morea", bg: "bg-indigo-500", ring: "ring-indigo-400" },
  { id: "rose", label: "Gorrixka", bg: "bg-rose-500", ring: "ring-rose-400" },
];

export default function PilotuenKatalogoa() {
  const {
    pilotuak,
    esperimentuak,
    activeEragilea,
    currentUser,
    createPilotua,
    updatePilotua,
    deletePilotua,
  } = useApp();
  const [selectedPilot, setSelectedPilot] = useState<Pilotua | null>(null);
  const [showMaterialsPilot, setShowMaterialsPilot] = useState<Pilotua | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingPilotId, setEditingPilotId] = useState<string | null>(null);
  const [deletingPilotId, setDeletingPilotId] = useState<string | null>(null);

  // Create/Edit pilot modal form state
  const [newIzena, setNewIzena] = useState("");
  const [newAzpititulua, setNewAzpititulua] = useState("");
  const [newMota, setNewMota] = useState("Merkataritza eta ostalaritza");
  const [newDeskribapena, setNewDeskribapena] = useState("");
  const [newAdibidea, setNewAdibidea] = useState("");
  const [newIkonoa, setNewIkonoa] = useState("BadgeCheck");
  const [newKolorea, setNewKolorea] = useState("emerald");
  const [newUrratsak, setNewUrratsak] = useState([
    "1. Lantaldearekin erronka adostu eta materialak prestatu.",
    "2. T0 neurketa itsua egin (esku-hartzea hasi aurretik).",
    "3. Pilotua espazioan aktibatu.",
    "4. T1 neurketa egin (lehen asteko eragina jasotzeko).",
    "5. T2 neurketa egin 14-21 egunera (ohitura finkatu dela neurtzeko).",
  ]);
  const [isSubmittingPilot, setIsSubmittingPilot] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingPilotId(null);
    setNewIzena("");
    setNewAzpititulua("");
    setNewMota("Merkataritza eta ostalaritza");
    setNewDeskribapena("");
    setNewAdibidea("");
    setNewIkonoa("BadgeCheck");
    setNewKolorea("emerald");
    setNewUrratsak([
      "1. Lantaldearekin erronka adostu eta materialak prestatu.",
      "2. T0 neurketa itsua egin (esku-hartzea hasi aurretik).",
      "3. Pilotua espazioan aktibatu.",
      "4. T1 neurketa egin (lehen asteko eragina jasotzeko).",
      "5. T2 neurketa egin 14-21 egunera (ohitura finkatu dela neurtzeko).",
    ]);
    setShowCreateModal(true);
  };

  const handleOpenEditPilot = (pilotu: Pilotua) => {
    setEditingPilotId(pilotu.id);
    setNewIzena(pilotu.izena);
    setNewAzpititulua(pilotu.azpititulua);
    setNewMota(pilotu.mota);
    setNewDeskribapena(pilotu.deskribapena);
    setNewAdibidea(pilotu.adibidea);
    setNewIkonoa(pilotu.ikonoa || "BadgeCheck");
    setNewKolorea(pilotu.kolorea || "emerald");
    try {
      const parsed = JSON.parse(pilotu.urratsak_json || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        setNewUrratsak(parsed);
      }
    } catch {}
    setShowCreateModal(true);
  };

  const handleDeletePilot = async (pilotu: Pilotua) => {
    if (
      !window.confirm(
        `Ziur zaude "${pilotu.izena}" pilotua katalogotik ezabatu nahi duzula?`
      )
    ) {
      return;
    }
    setDeletingPilotId(pilotu.id);
    await deletePilotua(pilotu.id);
    setDeletingPilotId(null);
  };

  const getPilotTheme = (kolorea: string, ikonoa: string, id: string) => {
    // Resolve icon
    let IconComponent = BadgeCheck;
    if (ikonoa === "Star") IconComponent = Star;
    else if (ikonoa === "Flame") IconComponent = Flame;
    else if (ikonoa === "MessageCircleHeart") IconComponent = MessageCircleHeart;
    else if (ikonoa === "Store") IconComponent = Store;
    else if (ikonoa === "Award") IconComponent = Award;
    else if (ikonoa === "Sparkles") IconComponent = Sparkles;
    else if (ikonoa === "Heart") IconComponent = Heart;

    if (id === "barra-barra-txapak" || kolorea === "emerald") {
      return {
        icon: IconComponent,
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        cardBorder: "hover:border-emerald-400 group-hover:shadow-emerald-500/10",
        buttonColor: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25",
        accentGradient: "from-emerald-500 to-teal-700",
      };
    }

    if (kolorea === "amber") {
      return {
        icon: IconComponent,
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        cardBorder: "hover:border-amber-400 group-hover:shadow-amber-500/10",
        buttonColor: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25",
        accentGradient: "from-amber-500 to-orange-600",
      };
    }

    if (kolorea === "indigo") {
      return {
        icon: IconComponent,
        badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
        cardBorder: "hover:border-indigo-400 group-hover:shadow-indigo-500/10",
        buttonColor: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25",
        accentGradient: "from-indigo-500 to-violet-600",
      };
    }

    if (kolorea === "rose") {
      return {
        icon: IconComponent,
        badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
        cardBorder: "hover:border-rose-400 group-hover:shadow-rose-500/10",
        buttonColor: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25",
        accentGradient: "from-rose-500 to-pink-600",
      };
    }

    // Default: sky
    return {
      icon: IconComponent,
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      cardBorder: "hover:border-sky-400 group-hover:shadow-sky-500/10",
      buttonColor: "bg-sky-600 hover:bg-sky-700 shadow-sky-600/25",
      accentGradient: "from-sky-500 to-blue-600",
    };
  };

  const handleCreatePilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIzena.trim() || !newAzpititulua.trim() || !newDeskribapena.trim()) return;

    setIsSubmittingPilot(true);
    let savedPilot: Pilotua | null = null;

    if (editingPilotId) {
      savedPilot = await updatePilotua({
        id: editingPilotId,
        izena: newIzena.trim(),
        azpititulua: newAzpititulua.trim(),
        deskribapena: newDeskribapena.trim(),
        mota: newMota.trim(),
        adibidea: newAdibidea.trim() || `"${newIzena}" dinamika espazioan aktibatuta`,
        urratsak: newUrratsak.filter((u) => u.trim().length > 0),
        ikonoa: newIkonoa,
        kolorea: newKolorea,
      });
    } else {
      savedPilot = await createPilotua({
        izena: newIzena.trim(),
        azpititulua: newAzpititulua.trim(),
        deskribapena: newDeskribapena.trim(),
        mota: newMota.trim(),
        adibidea: newAdibidea.trim() || `"${newIzena}" dinamika espazioan aktibatuta`,
        urratsak: newUrratsak.filter((u) => u.trim().length > 0),
        ikonoa: newIkonoa,
        kolorea: newKolorea,
      });
    }

    setIsSubmittingPilot(false);
    if (savedPilot) {
      setShowCreateModal(false);
      setEditingPilotId(null);
      setNewIzena("");
      setNewAzpititulua("");
      setNewDeskribapena("");
      setNewAdibidea("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/80">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pilotuen Katalogoa • Errezetak</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Aukeratu edo sortu zure esku-hartze pilotua
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
            {activeEragilea ? (
              <span>
                <strong>{activeEragilea.izena}</strong>: aukeratu beheko pilotua edo sortu zurea zure erronkari (
                <em>&ldquo;{activeEragilea.erronka_nagusia}&rdquo;</em>) aurre egiteko.
              </span>
            ) : (
              "Hautatu pilotu bat zure espazioan esperimentu kontrolatu bat abiatzeko."
            )}
          </p>
        </div>

        {/* Create Pilot Button */}
        <div className="shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer hover:scale-102"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Sortu Pilotu Berria</span>
          </button>
        </div>
      </div>

      {/* Grid of Pilots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {pilotuak.map((pilotu) => {
          const theme = getPilotTheme(pilotu.kolorea, pilotu.ikonoa, pilotu.id);
          const Icon = theme.icon;
          const urratsak: string[] = JSON.parse(pilotu.urratsak_json || "[]");
          const activeExpCount = esperimentuak.filter(
            (e) => e.pilotu_id === pilotu.id
          ).length;

          return (
            <div
              key={pilotu.id}
              className={`group bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between shadow-lg transition-all duration-200 hover:-translate-y-1 ${theme.cardBorder}`}
            >
              <div>
                {/* Card Top: Icon & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${theme.accentGradient} flex items-center justify-center text-white shadow-md shadow-emerald-600/20`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${theme.badgeColor}`}
                    >
                      {pilotu.mota}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {activeExpCount > 0
                        ? `🔥 ${activeExpCount} saltokitan martxan`
                        : "🌱 Prest abiatzeko"}
                    </span>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-800 transition">
                    {pilotu.izena}
                  </h3>
                  {currentUser?.role === "admin" && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPilot(pilotu)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition cursor-pointer"
                        title="Editatu pilotua"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {pilotu.id !== "barra-barra-txapak" && (
                        <button
                          type="button"
                          onClick={() => handleDeletePilot(pilotu)}
                          disabled={deletingPilotId === pilotu.id}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition cursor-pointer disabled:opacity-50"
                          title="Ezabatu pilotua"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1 mb-3">
                  {pilotu.azpititulua}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {pilotu.deskribapena}
                </p>

                {/* Real Example Quote Callout */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 mb-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Adibide Erreal bat:
                  </span>
                  <p className="text-xs font-semibold text-slate-800 italic">
                    &ldquo;{pilotu.adibidea}&rdquo;
                  </p>
                </div>

                {/* Steps Checklist */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Urrats azkarrak:
                  </span>
                  {urratsak.slice(0, 3).map((urrats, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{urrats}</span>
                    </div>
                  ))}
                  {urratsak.length > 3 && (
                    <span className="text-[11px] text-slate-400 font-medium pl-5 block">
                      +{urratsak.length - 3} urrats gehiago...
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedPilot(pilotu)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${theme.buttonColor}`}
                >
                  <span>Aukeratu & Sortu Hipotesia</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowMaterialsPilot(pilotu)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ikusi Materialak & Txapak (PDF/Irudiak)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metodologia Info Box */}
      <div className="mt-12 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-3xl p-6 sm:p-8 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-emerald-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              Nola funtzionatzen du hobekuntza-zikloak?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              1. Hipotesia definitu → 2. T0 Neurtu (aurretik) → 3. Txapak/ekintza aktibatu → 4. T1 Neurtu (berehala) → 5. T2 Neurtu (sendotzea).
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 text-xs font-bold shadow-xs shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Euskaraz barra-barra • Portaera-aldaketak</span>
        </div>
      </div>

      {/* Mad Libs Modal when pilot is clicked */}
      {selectedPilot && (
        <MadLibsSortzailea
          pilotu={selectedPilot}
          onClose={() => setSelectedPilot(null)}
        />
      )}

      {/* ===================== MODAL: SORTU PILOTU BERRIA ===================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingPilotId
                      ? "Editatu Pilotua"
                      : "Sortu Pilotu Berria (Errezetak)"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPilotId
                      ? "Aldatu pilotuaren izena, deskribapena edo urratsak"
                      : "Definitu zure zentrorako esku-hartze berritzaile bat"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPilotId(null);
                }}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePilotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilotuaren Izena *
                </label>
                <input
                  type="text"
                  required
                  value={newIzena}
                  onChange={(e) => setNewIzena(e.target.value)}
                  placeholder="Adib. Barra-barra txapak, Kafe-orduan euskaraz, Lehen Hitza telefonoz..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Leloa / Azpititulua *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAzpititulua}
                    onChange={(e) => setNewAzpititulua(e.target.value)}
                    placeholder="Adib. Langileek txapa eramatea lehen hitza pizteko"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Espazioa / Mota *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMota}
                    onChange={(e) => setNewMota(e.target.value)}
                    placeholder="Adib. Merkataritza, Ikasgela, Pasilloak, Harrera..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskribapena (Helburua eta zergatia) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newDeskribapena}
                  onChange={(e) => setNewDeskribapena(e.target.value)}
                  placeholder="Nola eragiten du portaeran? Zergatik lagunduko du euskararen inertzia apurtzen?"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Adibide Erreal Bat
                </label>
                <input
                  type="text"
                  value={newAdibidea}
                  onChange={(e) => setNewAdibidea(e.target.value)}
                  placeholder="Adib. 'Txapa paparrean daramanean, bezeroak segurtasunez Egun on! esaten du'"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                />
              </div>

              {/* Icon & Color selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hautatu Ikonoa
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = newIkonoa === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setNewIkonoa(item.id)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                          title={item.label}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hautatu Kolorea
                  </label>
                  <div className="flex items-center gap-2">
                    {AVAILABLE_COLORS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setNewKolorea(col.id)}
                        className={`w-7 h-7 rounded-full ${col.bg} transition cursor-pointer flex items-center justify-center text-white ${
                          newKolorea === col.id ? `ring-3 ${col.ring} scale-110 shadow-md` : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        {newKolorea === col.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Steps inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hobekuntza-urratsak (1etik 5era)
                </label>
                <div className="space-y-1.5">
                  {newUrratsak.map((urrats, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={urrats}
                      onChange={(e) => {
                        const updated = [...newUrratsak];
                        updated[idx] = e.target.value;
                        setNewUrratsak(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  ))}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPilotId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Utzi
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPilot}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPilot
                    ? "Gordetzen..."
                    : editingPilotId
                    ? "Gorde Aldaketak"
                    : "Gorde eta Argitaratu Pilotua"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MATERIALAK & TXAPAK PREVIEW ===================== */}
      {showMaterialsPilot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {showMaterialsPilot.izena} • Esku-hartze Materialak
                  </h3>
                  <p className="text-xs text-slate-500">
                    PDF txantiloiak, inprimatzeko txapak eta gida praktikoak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMaterialsPilot(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster / Material Previews based on Pilot */}
            {showMaterialsPilot.id === "barra-barra-txapak" ? (
              <div className="space-y-4">
                {/* Visual Badge Card */}
                <div className="border border-emerald-300 rounded-3xl p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-xl text-center relative overflow-hidden">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold bg-white/20 px-3 py-1 rounded-full inline-block mb-4 border border-white/20">
                    Komertzio & Saltokiko Txapa Identifikatzailea
                  </span>

                  {/* Circular Badge Graphic */}
                  <div className="w-28 h-28 mx-auto rounded-full bg-white border-4 border-emerald-400 flex flex-col items-center justify-center text-slate-900 shadow-2xl p-2 mb-3">
                    <span className="text-[9px] font-black tracking-widest text-emerald-700 uppercase">
                      EUSKARAZ
                    </span>
                    <span className="text-sm font-black tracking-tight text-slate-900 uppercase">
                      BARRA
                    </span>
                    <span className="text-sm font-black tracking-tight text-emerald-600 uppercase">
                      BARRA
                    </span>
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                  </div>

                  <h4 className="text-xl font-black tracking-tight">
                    &ldquo;Euskaraz barra-barra: Hemen lasai hitz egin dezakezu&rdquo;
                  </h4>
                  <p className="text-xs text-emerald-100 mt-2 max-w-md mx-auto">
                    Langilearen paparrean eramateko txapa (38mm / 50mm) eta erakusleihorako identifikagarria.
                  </p>
                </div>

                {/* 3 Step Protocol for Staff */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Langileentzako 3 Arau Sinpleak (Protokoloa):</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-700">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="font-bold text-emerald-700 block">1. Txapa bistara</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Txapa bularrean ikusgai eraman uneoro.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="font-bold text-emerald-700 block">2. Lehen hitza euskaraz</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">&ldquo;Egun on!&rdquo; edo &ldquo;Arratsalde on!&rdquo; beti lehenengo.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="font-bold text-emerald-700 block">3. Eutsi euskarari</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Bezeroak erantzun arte, elkarrizketa euskaraz mantendu.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white shadow-lg text-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-white/20 px-3 py-1 rounded-full inline-block mb-3">
                    Esku-hartze Txantiloia
                  </span>
                  <h4 className="text-xl font-bold">{showMaterialsPilot.izena}</h4>
                  <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
                    {showMaterialsPilot.deskribapena}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <h5 className="font-bold text-xs text-slate-900 mb-1">
                    Definitutako Urratsak:
                  </h5>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {JSON.parse(showMaterialsPilot.urratsak_json || "[]").map((u: string, idx: number) => (
                      <p key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{u}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowMaterialsPilot(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Itxi
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Inprimatu / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = showMaterialsPilot;
                    setShowMaterialsPilot(null);
                    setSelectedPilot(p);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Aukeratu Pilotua & Hasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
