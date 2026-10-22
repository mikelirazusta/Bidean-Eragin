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
  Upload,
  Download,
  Eye,
  Paperclip,
} from "lucide-react";
import { useApp, parsePilotuMaterialak } from "@/context/AppContext";
import type { Pilotua, PilotuMateriala } from "@/lib/db";
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

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PilotuenKatalogoa() {
  const {
    pilotuak,
    esperimentuak,
    activeEragilea,
    currentUser,
    createPilotua,
    updatePilotua,
    deletePilotua,
    uiTexts,
  } = useApp();
  const [selectedPilot, setSelectedPilot] = useState<Pilotua | null>(null);
  const [showMaterialsPilot, setShowMaterialsPilot] = useState<Pilotua | null>(null);
  const [previewMaterialId, setPreviewMaterialId] = useState<string | null>(null);
  const [isUploadingDirectMaterial, setIsUploadingDirectMaterial] = useState<boolean>(false);
  const [isUploadingModalFiles, setIsUploadingModalFiles] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resolvedBlobUrls, setResolvedBlobUrls] = useState<Record<string, string>>({});
  const [isLoadingPreviewId, setIsLoadingPreviewId] = useState<string | null>(null);
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
    "2. T0 hasierako neurketa egin (esku-hartzea hasi aurretik).",
    "3. Pilotua espazioan aktibatu.",
    "4. T1 neurketa egin (lehen asteko eragina jasotzeko).",
    "5. T2 neurketa egin 14-21 egunera (ohitura finkatu dela neurtzeko).",
  ]);
  const [newMaterialak, setNewMaterialak] = useState<PilotuMateriala[]>([]);
  const [isSubmittingPilot, setIsSubmittingPilot] = useState(false);

  const ensureMaterialUrl = async (mat: PilotuMateriala): Promise<string> => {
    if (resolvedBlobUrls[mat.id]) {
      return resolvedBlobUrls[mat.id];
    }
    if (mat.data_url && mat.data_url.startsWith("data:")) {
      return mat.data_url;
    }
    // If file is large (> 3.5 MB or > 2 chunks), reassemble chunks in browser into a Blob URL
    const needsChunkFetch =
      (mat.chunk_count && mat.chunk_count > 2) ||
      (mat.tamaina && mat.tamaina > 3500000);

    if (!needsChunkFetch) {
      return mat.data_url || `/api/materialak?id=${encodeURIComponent(mat.id)}`;
    }

    try {
      setIsLoadingPreviewId(mat.id);
      let totalChunks = mat.chunk_count || 1;
      if (!mat.chunk_count) {
        const metaRes = await fetch(`/api/materialak?id=${encodeURIComponent(mat.id)}&meta=1`);
        const metaJson = await metaRes.json();
        if (metaJson.success && metaJson.meta?.totalChunks) {
          totalChunks = metaJson.meta.totalChunks;
        }
      }

      const chunkPromises: Promise<string>[] = [];
      for (let i = 0; i < totalChunks; i++) {
        chunkPromises.push(
          fetch(`/api/materialak?id=${encodeURIComponent(mat.id)}&chunk=${i}`).then(async (r) => {
            const j = await r.json();
            if (!j.success || typeof j.chunkData !== "string") {
              throw new Error("Errorea zatia deskargatzean");
            }
            return j.chunkData as string;
          })
        );
      }

      const chunks = await Promise.all(chunkPromises);
      const fullBase64 = chunks.join("");
      const binaryStr = atob(fullBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mat.mota || "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      setResolvedBlobUrls((prev) => ({ ...prev, [mat.id]: blobUrl }));
      return blobUrl;
    } catch (e) {
      console.error("Errorea PDF handia berreraikitzean:", e);
      return mat.data_url || `/api/materialak?id=${encodeURIComponent(mat.id)}`;
    } finally {
      setIsLoadingPreviewId(null);
    }
  };

  const readFilesAsMaterials = async (files: FileList | null): Promise<PilotuMateriala[]> => {
    if (!files || files.length === 0) return [];
    setUploadError(null);
    const items: PilotuMateriala[] = [];
    const CHUNK_CHAR_SIZE = 1400000; // ~1.4 MB per HTTP request (avoids serverless 6MB payload limit)

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`"${file.name}" handiegia da (gehienez 25 MB fitxategiko).`);
        continue;
      }

      setUploadProgressText(`"${file.name}" irakurtzen... (${i + 1}/${files.length})`);

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Errorea fitxategia irakurtzean"));
        reader.readAsDataURL(file);
      });

      const commaIdx = dataUrl.indexOf(",");
      const base64Raw = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
      const totalChunks = Math.max(1, Math.ceil(base64Raw.length / CHUNK_CHAR_SIZE));
      const matId = `mat-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const sortzeData = new Date().toISOString();

      let uploadFailed = false;
      for (let c = 0; c < totalChunks; c++) {
        const pct = Math.round(((c + 1) / totalChunks) * 100);
        setUploadProgressText(
          totalChunks > 1
            ? `"${file.name}" hodeira igotzen... (%${pct})`
            : `"${file.name}" hodeira igotzen...`
        );

        const slice = base64Raw.slice(c * CHUNK_CHAR_SIZE, (c + 1) * CHUNK_CHAR_SIZE);
        try {
          const res = await fetch("/api/materialak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: matId,
              izena: cleanTitle || file.name,
              fitxategi_izena: file.name,
              mota: file.type || "application/pdf",
              tamaina: file.size,
              chunkIndex: c,
              totalChunks,
              chunkData: slice,
              sortze_data: sortzeData,
            }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            uploadFailed = true;
            setUploadError(
              json.error || `"${file.name}" fitxategia igotzean errorea gertatu da.`
            );
            break;
          }
        } catch (err) {
          console.error("Errorea fitxategiaren zatia igotzean:", err);
          uploadFailed = true;
          setUploadError(`Errorea "${file.name}" zerbitzarira igotzean. Saiatu berriro.`);
          break;
        }
      }

      if (uploadFailed) continue;

      try {
        const localUrl = URL.createObjectURL(file);
        setResolvedBlobUrls((prev) => ({ ...prev, [matId]: localUrl }));
      } catch {}

      items.push({
        id: matId,
        izena: cleanTitle || file.name,
        fitxategi_izena: file.name,
        mota: file.type || "application/pdf",
        tamaina: file.size,
        chunk_count: totalChunks,
        data_url: `/api/materialak?id=${encodeURIComponent(matId)}`,
        sortze_data: sortzeData,
      });
    }

    setUploadProgressText(null);
    return items;
  };

  const handleModalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsUploadingModalFiles(true);
    try {
      const added = await readFilesAsMaterials(fileList);
      if (added.length > 0) {
        setNewMaterialak((prev) => [...prev, ...added]);
      }
    } finally {
      setIsUploadingModalFiles(false);
      e.target.value = "";
    }
  };

  const handleDirectUploadInMaterialsModal = async (
    e: React.ChangeEvent<HTMLInputElement>,
    pilotu: Pilotua
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsUploadingDirectMaterial(true);
    const added = await readFilesAsMaterials(fileList);
    e.target.value = "";
    if (added.length === 0) {
      setIsUploadingDirectMaterial(false);
      return;
    }

    const existing = parsePilotuMaterialak(pilotu.materialak_json);
    const combined = [...existing, ...added];
    const updated = await updatePilotua({
      id: pilotu.id,
      materialak: combined,
    });
    setIsUploadingDirectMaterial(false);
    if (updated) {
      setShowMaterialsPilot(updated);
      setPreviewMaterialId(added[0].id);
    } else {
      setUploadError("Ezin izan dira material berriak pilotuan gorde. Saiatu berriro.");
    }
  };

  const handleDeleteDirectMaterial = async (pilotu: Pilotua, matId: string) => {
    const existing = parsePilotuMaterialak(pilotu.materialak_json);
    const filtered = existing.filter((m) => m.id !== matId);
    setIsUploadingDirectMaterial(true);
    const updated = await updatePilotua({
      id: pilotu.id,
      materialak: filtered,
    });
    setIsUploadingDirectMaterial(false);
    if (updated) {
      setShowMaterialsPilot(updated);
      if (previewMaterialId === matId) {
        setPreviewMaterialId(null);
      }
    }
  };

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
      "2. T0 hasierako neurketa egin (esku-hartzea hasi aurretik).",
      "3. Pilotua espazioan aktibatu.",
      "4. T1 neurketa egin (lehen asteko eragina jasotzeko).",
      "5. T2 neurketa egin 14-21 egunera (ohitura finkatu dela neurtzeko).",
    ]);
    setNewMaterialak([]);
    setUploadError(null);
    setUploadProgressText(null);
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
    setNewMaterialak(parsePilotuMaterialak(pilotu.materialak_json));
    setUploadError(null);
    setUploadProgressText(null);
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
    if (isUploadingModalFiles) return;
    if (!newIzena.trim() || !newAzpititulua.trim() || !newDeskribapena.trim()) {
      setUploadError("Pilotuaren izena, azpititulua eta deskribapena bete behar dira.");
      return;
    }

    setUploadError(null);
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
        materialak: newMaterialak,
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
        materialak: newMaterialak,
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
      setNewMaterialak([]);
    } else {
      setUploadError("Ezin izan dira aldaketak gorde. Saiatu berriro mesedez.");
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
            {uiTexts.katalogoa_title || "Aukeratu edo sortu zure esku-hartze pilotua"}
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
            {activeEragilea ? (
              <span>
                <strong>{activeEragilea.izena}</strong>: aukeratu beheko pilotua edo sortu zurea zure erronkari (
                <em>&ldquo;{activeEragilea.erronka_nagusia}&rdquo;</em>) aurre egiteko.
              </span>
            ) : (
              uiTexts.katalogoa_subtitle || "Hautatu pilotu bat zure espazioan esperimentu kontrolatu bat abiatzeko."
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
          const pilotuMaterialak = parsePilotuMaterialak(pilotu.materialak_json);
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
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPilot(pilotu)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition cursor-pointer"
                      title="Editatu pilotua eta PDF materialak"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {currentUser?.role === "admin" && pilotu.id !== "barra-barra-txapak" && (
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
                  onClick={async () => {
                    setUploadError(null);
                    setShowMaterialsPilot(pilotu);
                    if (pilotuMaterialak.length > 0) {
                      setPreviewMaterialId(pilotuMaterialak[0].id);
                      await ensureMaterialUrl(pilotuMaterialak[0]);
                    } else {
                      setPreviewMaterialId(null);
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {pilotuMaterialak.length > 0
                      ? `Materialak & PDFak (${pilotuMaterialak.length} fitxategi)`
                      : "Ikusi / Igo Materialak (PDF/Irudiak)"}
                  </span>
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

      {/* ===================== MODAL: SORTU / EDITATU PILOTUA ===================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingPilotId
                      ? "Editatu Pilotua eta Materialak"
                      : "Sortu Pilotu Berria (Errezetak)"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPilotId
                      ? "Aldatu pilotuaren izena, deskribapena, urratsak edo erantsi PDF materialak"
                      : "Definitu zure zentrorako esku-hartze berritzaile bat eta igo PDF materialak"}
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

              {/* PDF & Materials Upload Section */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-emerald-600" />
                      <span>Pilotuaren Materialak (PDF / Irudiak)</span>
                    </label>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Igo pilotu honen txantiloiak, kartelak edo gida praktikoak PDF edo irudi formatuan.
                    </p>
                  </div>

                  <label
                    className={`px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 self-start sm:self-auto ${
                      isUploadingModalFiles ? "opacity-70 pointer-events-none" : ""
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isUploadingModalFiles
                        ? uploadProgressText || "PDFa igotzen..."
                        : "+ Igo PDF / Irudiak"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      multiple
                      disabled={isUploadingModalFiles}
                      onChange={handleModalFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadProgressText && (
                  <div className="p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-pulse">
                    <span>⏳ {uploadProgressText}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {uploadError}
                  </div>
                )}

                {newMaterialak.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {newMaterialak.map((mat, idx) => (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <input
                              type="text"
                              value={mat.izena}
                              onChange={(e) => {
                                const updated = [...newMaterialak];
                                updated[idx] = { ...mat, izena: e.target.value };
                                setNewMaterialak(updated);
                              }}
                              placeholder="Materialaren izenburua..."
                              className="w-full text-xs font-bold text-slate-900 border-b border-transparent focus:border-emerald-500 focus:outline-hidden bg-transparent"
                            />
                            <p className="text-[10px] text-slate-400 truncate">
                              {mat.fitxategi_izena}{" "}
                              {mat.tamaina ? `• ${formatFileSize(mat.tamaina)}` : ""} • Prest gordetzeko ✓
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setNewMaterialak((prev) => prev.filter((m) => m.id !== mat.id))
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Kendu fitxategi hau"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Ez dago PDF fitxategirik erantsita oraindik. Sakatu &ldquo;+ Igo PDF / Irudiak&rdquo; botoia gehitzeko.
                  </p>
                )}
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
                  disabled={isSubmittingPilot || isUploadingModalFiles}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isUploadingModalFiles
                    ? "PDFak igotzen..."
                    : isSubmittingPilot
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
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] overflow-y-auto">
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

            {/* Direct PDF Upload & Attached Materials List */}
            {(() => {
              const attachedMaterials = parsePilotuMaterialak(showMaterialsPilot.materialak_json);
              const activePreviewMat = attachedMaterials.find((m) => m.id === previewMaterialId);
              const activePreviewUrl = activePreviewMat
                ? resolvedBlobUrls[activePreviewMat.id] || activePreviewMat.data_url
                : "";

              return (
                <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-emerald-600" />
                        <span>Pilotuaren PDF eta Dokumentu Erantsiak ({attachedMaterials.length})</span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Deskargatu, aurreikusi edo igo PDF fitxategi berriak pilotu honetarako.
                      </p>
                    </div>

                    <label className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 self-start sm:self-auto">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {isUploadingDirectMaterial
                          ? uploadProgressText || "Igotzen..."
                          : "+ Igo PDF / Material Berria"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf,image/*"
                        multiple
                        disabled={isUploadingDirectMaterial}
                        onChange={(e) => handleDirectUploadInMaterialsModal(e, showMaterialsPilot)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadProgressText && (
                    <div className="p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-pulse">
                      <span>⏳ {uploadProgressText}</span>
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {uploadError}
                    </div>
                  )}

                  {attachedMaterials.length > 0 ? (
                    <div className="space-y-2.5">
                      {attachedMaterials.map((mat) => {
                        const isPreviewing = previewMaterialId === mat.id;
                        const directDownloadUrl =
                          resolvedBlobUrls[mat.id] ||
                          (mat.data_url?.startsWith("/api/materialak")
                            ? `${mat.data_url}&download=1`
                            : mat.data_url);
                        const isLargeChunked =
                          !resolvedBlobUrls[mat.id] &&
                          ((mat.chunk_count && mat.chunk_count > 2) ||
                            (mat.tamaina && mat.tamaina > 3500000));

                        return (
                          <div
                            key={mat.id}
                            className="bg-white rounded-xl p-3 border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {mat.izena}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {mat.fitxategi_izena}{" "}
                                  {mat.tamaina ? `• ${formatFileSize(mat.tamaina)}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (isPreviewing) {
                                    setPreviewMaterialId(null);
                                  } else {
                                    await ensureMaterialUrl(mat);
                                    setPreviewMaterialId(mat.id);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                                  isPreviewing
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>
                                  {isLoadingPreviewId === mat.id
                                    ? "Kargatzen..."
                                    : isPreviewing
                                    ? "Ezkutatu"
                                    : "Aurreikusi"}
                                </span>
                              </button>

                              {isLargeChunked ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const url = await ensureMaterialUrl(mat);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = mat.fitxategi_izena || `${mat.izena}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>
                                    {isLoadingPreviewId === mat.id ? "Deskargatzen..." : "Deskargatu"}
                                  </span>
                                </button>
                              ) : (
                                <a
                                  href={directDownloadUrl}
                                  download={mat.fitxategi_izena || `${mat.izena}.pdf`}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Deskargatu</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteDirectMaterial(showMaterialsPilot, mat.id)
                                }
                                disabled={isUploadingDirectMaterial}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Ezabatu PDF hau"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Inline PDF / Image Preview */}
                      {activePreviewMat && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-slate-300 bg-slate-900">
                          <div className="px-4 py-2 bg-slate-800 text-white text-xs font-bold flex items-center justify-between">
                            <span>📄 Aurreikuspena: {activePreviewMat.izena}</span>
                            <button
                              type="button"
                              onClick={() => setPreviewMaterialId(null)}
                              className="text-slate-300 hover:text-white text-xs cursor-pointer"
                            >
                              Itxi aurreikuspena ✕
                            </button>
                          </div>
                          {activePreviewMat.mota?.startsWith("image/") ? (
                            <div className="p-4 flex justify-center bg-slate-900">
                              <img
                                src={activePreviewUrl}
                                alt={activePreviewMat.izena}
                                className="max-h-[460px] object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <iframe
                              src={activePreviewUrl}
                              title={activePreviewMat.izena}
                              className="w-full h-[460px] bg-white"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/80 rounded-xl p-3.5 border border-dashed border-emerald-300 text-center">
                      <p className="text-xs font-semibold text-slate-600">
                        Oraindik ez da PDF fitxategirik igo pilotu honetarako. Goiko{" "}
                        <strong>&ldquo;+ Igo PDF / Material Berria&rdquo;</strong> botoia sakatuta igo ditzakezu.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

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
