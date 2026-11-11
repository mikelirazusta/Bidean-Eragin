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
  Bot,
  Lightbulb,
  RotateCcw,
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
    createEsperimentua,
    setActiveTab,
    setObservationConfig,
    triggerConfetti,
    uiTexts,
  } = useApp();
  const [selectedPilot, setSelectedPilot] = useState<Pilotua | null>(null);

  // Latxa Copilot state
  const [copilotChallenge, setCopilotChallenge] = useState<string>("");
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);
  const [copilotHistory, setCopilotHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
  const [userFollowUpAnswer, setUserFollowUpAnswer] = useState<string>("");
  const [isEditingCopilotProposal, setIsEditingCopilotProposal] = useState<boolean>(false);
  const [isImprovingCopilotHypo, setIsImprovingCopilotHypo] = useState<boolean>(false);
  const [copilotHypoExplanation, setCopilotHypoExplanation] = useState<string | null>(null);
  const [copilotResult, setCopilotResult] = useState<{
    bat_dator?: boolean;
    egoera?: "pilotua_prest" | "galderak_behar_dira";
    zintzotasun_mezua?: string;
    aholkua?: string;
    galderak?: string[];
    pilotu_mota?: "existitzen_dena" | "berria";
    pilotu_id?: string | null;
    pilotu_berria?: {
      izena: string;
      azpititulua: string;
      deskribapena: string;
      mota: string;
      adibidea?: string;
      urratsak?: string[];
      ikonoa?: string;
      kolorea?: string;
    } | null;
    taldea?: string;
    pertsonak?: string;
    gunea?: string;
    xede_portzentajea?: number;
    hipotesia?: string;
    behaketa_aholkuak?: string[];
  } | null>(null);
  const [copilotChoice, setCopilotChoice] = useState<"berria" | "existitzen_dena">("berria");
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [isApplyingCopilot, setIsApplyingCopilot] = useState<boolean>(false);

  // Initialize copilotChallenge when activeEragilea changes
  React.useEffect(() => {
    if (activeEragilea?.erronka_nagusia && !copilotChallenge) {
      setCopilotChallenge(activeEragilea.erronka_nagusia);
    }
  }, [activeEragilea, copilotChallenge]);

  const handleAskLatxaCopilot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copilotChallenge.trim()) return;

    setIsCopilotLoading(true);
    setCopilotError(null);
    setCopilotResult(null);
    setQuestionAnswers({});
    setUserFollowUpAnswer("");
    setIsEditingCopilotProposal(false);
    setCopilotHypoExplanation(null);

    const initialUserMsg = `Entitatearen erronka: "${copilotChallenge.trim()}" (Entitatea: ${activeEragilea?.izena || "Entitatea"}, Mota: ${activeEragilea?.mota || "orokorra"})`;
    const newHistory: Array<{ role: "user" | "assistant"; content: string }> = [{ role: "user", content: initialUserMsg }];
    setCopilotHistory(newHistory);

    try {
      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "aholkularia_eta_hipotesia",
          eragile_izena: activeEragilea?.izena || "Entitatea",
          eragile_mota: activeEragilea?.mota || "orokorra",
          erronka_nagusia: copilotChallenge.trim(),
          messages: newHistory,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Ezin izan da Latxaren erantzuna jaso.");
      }

      setCopilotResult(json.data);
      if (json.data.bat_dator && json.data.pilotu_id) {
        setCopilotChoice("existitzen_dena");
      } else {
        setCopilotChoice("berria");
      }

      const historyWithReply: Array<{ role: "user" | "assistant"; content: string }> = [
        ...newHistory,
        {
          role: "assistant",
          content: JSON.stringify(json.data),
        },
      ];
      setCopilotHistory(historyWithReply);
      triggerConfetti();
    } catch (err) {
      console.error("Latxa kopilotu errorea:", err);
      setCopilotError(err instanceof Error ? err.message : "Errorea gertatu da Latxari galdetzean.");
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const hasAnyFollowUpAnswer =
    Object.values(questionAnswers).some((v) => v && v.trim().length > 0) ||
    userFollowUpAnswer.trim().length > 0;

  const handleSendFollowUpAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyFollowUpAnswer || isCopilotLoading) return;

    const formattedPairs = (copilotResult?.galderak || [])
      .map((galdera, idx) => {
        const ans = (questionAnswers[idx] || "").trim();
        return ans ? `${idx + 1}. Galdera ("${galdera}") -> Erantzuna: "${ans}"` : null;
      })
      .filter(Boolean)
      .join("\n");

    const extraText = userFollowUpAnswer.trim();
    const combinedAnswer = [
      formattedPairs,
      extraText ? `Ohar gehigarria: "${extraText}"` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setQuestionAnswers({});
    setUserFollowUpAnswer("");
    setIsCopilotLoading(true);
    setCopilotError(null);

    const updatedHistory: Array<{ role: "user" | "assistant"; content: string }> = [
      ...copilotHistory,
      {
        role: "user",
        content: `Erabiltzailearen erantzunak galderei:\n${combinedAnswer}\n\nOrain sortu pilotu berriaren fitxa osoa ("egoera": "pilotua_prest", "pilotu_berria": {...}) eta hipotesi neurgarria datu hauekin.`,
      },
    ];
    setCopilotHistory(updatedHistory);

    try {
      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "elkarrizketa",
          eragile_izena: activeEragilea?.izena || "Entitatea",
          eragile_mota: activeEragilea?.mota || "orokorra",
          messages: updatedHistory,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Ezin izan da Latxaren erantzuna jaso.");
      }

      setCopilotResult(json.data);
      setCopilotChoice("berria");
      setCopilotHistory([
        ...updatedHistory,
        {
          role: "assistant",
          content: JSON.stringify(json.data),
        },
      ]);
      triggerConfetti();
    } catch (err) {
      console.error("Latxa galdera-erantzun errorea:", err);
      setCopilotError(err instanceof Error ? err.message : "Errorea gertatu da Latxari erantzutean.");
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleImproveCopilotHypothesis = async () => {
    if (!copilotResult || isImprovingCopilotHypo) return;
    setIsImprovingCopilotHypo(true);
    setCopilotHypoExplanation(null);

    const currentHypoText =
      copilotResult.hipotesia ||
      `Gure ustez, ${copilotResult.taldea || "lantaldeak"} ${copilotResult.pertsonak || "bezeroekin"} ${copilotResult.gunea || "gunean"} dinamika aktibatuta, euskararen erabilera %${copilotResult.xede_portzentajea || 20} igoko da.`;

    try {
      const res = await fetch("/api/ai/latxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ekintza: "hobetu_hipotesia",
          uneko_testua: currentHypoText,
          eragile_izena: activeEragilea?.izena || "Entitatea",
          eragile_mota: activeEragilea?.mota || "orokorra",
          erronka_nagusia: copilotChallenge.trim(),
          pilotu_izena:
            copilotChoice === "berria"
              ? copilotResult.pilotu_berria?.izena
              : pilotuak.find((p) => p.id === copilotResult.pilotu_id)?.izena,
          taldea: copilotResult.taldea,
          pertsonak: copilotResult.pertsonak,
          gunea: copilotResult.gunea,
          xede_portzentajea: copilotResult.xede_portzentajea,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data?.hipotesi_hobetua) {
        setCopilotResult((prev) =>
          prev
            ? {
                ...prev,
                hipotesia: json.data.hipotesi_hobetua,
              }
            : prev
        );
        if (json.data.azalpena) {
          setCopilotHypoExplanation(json.data.azalpena);
        }
      }
    } catch (err) {
      console.error("Errorea hipotesia hobetzean:", err);
    } finally {
      setIsImprovingCopilotHypo(false);
    }
  };

  const handleApplyCopilotExperiment = async () => {
    if (!copilotResult) return;
    setIsApplyingCopilot(true);

    try {
      let finalPilotId = copilotResult.pilotu_id;

      // Only create a new pilot if user explicitly selected "berria" or there is no matching catalog pilot ID
      if (copilotChoice === "berria" || !finalPilotId) {
        const berria = copilotResult.pilotu_berria;
        const newPilot = await createPilotua({
          izena: berria?.izena?.trim() || "Esku-hartze berria",
          azpititulua: berria?.azpititulua?.trim() || "Entitaterako berariaz sortutako pilotua",
          deskribapena: berria?.deskribapena?.trim() || "Euskararen erabilera sustatzeko dinamika pertsonalizatua.",
          mota: berria?.mota?.trim() || activeEragilea?.mota || "Orokorra",
          adibidea: berria?.adibidea?.trim() || "Dinamika espazioan aktibatuta.",
          urratsak: berria?.urratsak || [
            "1. Lantaldearekin erronka adostu eta dinamika aurkeztu.",
            "2. T0 hasierako neurketa egin.",
            "3. Dinamika espazioan aktibatu.",
            "4. T1 neurketa egin.",
            "5. T2 neurketa egin 14-21 egunera.",
          ],
          ikonoa: berria?.ikonoa || "Sparkles",
          kolorea: berria?.kolorea || "emerald",
        });

        if (newPilot) {
          finalPilotId = newPilot.id;
        } else {
          finalPilotId = "barra-barra-txapak";
        }
      }

      const created = await createEsperimentua({
        pilotu_id: finalPilotId || "barra-barra-txapak",
        hipotesia:
          copilotResult.hipotesia ||
          `Gure ustez, ${copilotResult.taldea || "lantaldeak"} ${copilotResult.pertsonak || "bezeroekin"} ${copilotResult.gunea || "gunean"} dinamika aktibatuta, euskararen erabilera %${copilotResult.xede_portzentajea || 20} igoko da.`,
        taldea: copilotResult.taldea || "Lantaldeak",
        pertsonak: copilotResult.pertsonak || "herritarrekin",
        gunea: copilotResult.gunea || "harreran",
        xede_portzentajea: Number(copilotResult.xede_portzentajea) || 20,
      });

      if (created) {
        setObservationConfig({ expId: created.id, phase: "T0" });
        triggerConfetti();
        setActiveTab("panela");
      }
    } catch (err) {
      console.error("Errorea esperimentua aplikatzean:", err);
    } finally {
      setIsApplyingCopilot(false);
    }
  };
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-line">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sand text-sea border border-line text-xs font-bold mb-3">
            <Layers className="w-3.5 h-3.5 text-euskara" />
            <span>Pilotuen katalogoa • Errezetak</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
            {uiTexts.katalogoa_title || "Aukeratu edo sortu zure esku-hartze pilotua"}
          </h1>
          <p className="mt-2 text-ink-muted text-sm sm:text-base leading-relaxed">
            {activeEragilea ? (
              <span>
                <strong className="text-ink">{activeEragilea.izena}</strong>: aukeratu beheko pilotua edo sortu zurea zure erronkari (
                <em>&ldquo;{activeEragilea.erronka_nagusia}&rdquo;</em>) aurre egiteko.
              </span>
            ) : (
              uiTexts.katalogoa_subtitle || "Hautatu pilotu bat zure entitatean esperimentu kontrolatu bat abiatzeko."
            )}
          </p>
        </div>

        {/* Create Pilot Button */}
        <div className="shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-euskara hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Sortu pilotu berria</span>
          </button>
        </div>
      </div>

      {/* LATXA KOPILOTUA & AHOLKULARI SOZIOLINGUISTIKOA */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 text-ink border border-line border-l-4 border-l-sea mb-12 relative">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sand border border-line flex items-center justify-center text-sea shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-ink tracking-tight">
                    Latxa Kopilotua: Aholkulari Soziolinguistikoa
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-sand border border-line text-sea text-[10px] font-bold">
                    Latxa 70B
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Azaldu zure erronka eta Latxak esku-hartze aproposena eta hipotesi neurgarria proposatuko dizkizu.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAskLatxaCopilot} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5 flex items-center justify-between">
                <span>Zuen entitatearen egoera edo erronka:</span>
                <span className="text-[11px] text-ink-muted font-normal">
                  {activeEragilea ? `${activeEragilea.izena} (${activeEragilea.mota})` : "Entitatea"}
                </span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={copilotChallenge}
                  onChange={(e) => setCopilotChallenge(e.target.value)}
                  placeholder="Adibidez: Tabernan gaztelaniaz hasten dira bezero gehienak, edo lantaldeak lotsa du euskaraz abiatzeko..."
                  className="flex-1 bg-paper border border-line rounded-xl px-4 py-3 text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-hidden focus:ring-2 focus:ring-sea focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={isCopilotLoading || !copilotChallenge.trim()}
                  className="px-6 py-3 rounded-xl bg-sea hover:opacity-95 text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {isCopilotLoading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Latxa pentsatzen ari da...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Galdetu Latxari →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {copilotError && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {copilotError}
            </div>
          )}

          {/* LATXA RESULT CARD */}
          {copilotResult && (
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-in fade-in duration-300">
              {/* Zintzotasunaren eta Egoeraren Diagnostikoa */}
              <div
                className={`p-4 sm:p-5 rounded-xl border ${
                  !copilotResult.bat_dator
                    ? "bg-amber-50/80 border-amber-200 text-amber-950"
                    : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      !copilotResult.bat_dator
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {!copilotResult.bat_dator ? <Lightbulb className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-1">
                      {copilotResult.zintzotasun_mezua ||
                        (!copilotResult.bat_dator
                          ? "Plataforman ez dago zure erronkari zuzenean erantzuten dion pilotu/hipotesirik sortua. Izan zaitez lehenengoa!"
                          : "Zure erronkarako pilotu egokia dugu jada katalogoan!")}
                    </h4>
                    {copilotResult.aholkua && (
                      <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
                        <strong>Aholku soziolinguistikoa:</strong> &ldquo;{copilotResult.aholkua}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Elkarrizketa-historiaren laburpena (erabiltzaileak dagoeneko erantzun badu) */}
              {copilotHistory.filter((m) => m.role === "user").length > 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Ko-diseinuko elkarrizketa-haria ({copilotHistory.filter((m) => m.role === "user").length - 1} erantzun bidalita)
                  </span>
                  {copilotHistory
                    .filter((m) => m.role === "user")
                    .slice(1)
                    .map((msg, i) => (
                      <div key={i} className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-line">
                        {msg.content.replace(/^Erabiltzailearen erantzunak galderei:\n/, "").replace(/\n\nOrain sortu[\s\S]*$/, "")}
                      </div>
                    ))}
                </div>
              )}

              {/* Galderak eta Ko-diseinurako Banan-banako Erantzun Koadroa */}
              {copilotResult.galderak && copilotResult.galderak.length > 0 && (
                <div className="bg-slate-50 border border-amber-200 rounded-xl p-5 text-slate-900 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-900">
                      Ko-diseinurako galderak (erantzun zure egoeraren arabera):
                    </h4>
                  </div>

                  <form onSubmit={handleSendFollowUpAnswer} className="space-y-3.5">
                    <div className="space-y-3">
                      {copilotResult.galderak.map((galdera, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2"
                        >
                          <label className="flex items-start gap-2 text-xs sm:text-sm font-bold text-slate-800">
                            <span className="font-bold text-amber-700 shrink-0">{idx + 1}.</span>
                            <span>{galdera}</span>
                          </label>
                          <input
                            type="text"
                            value={questionAnswers[idx] || ""}
                            onChange={(e) =>
                              setQuestionAnswers((prev) => ({
                                ...prev,
                                [idx]: e.target.value,
                              }))
                            }
                            placeholder={`${idx + 1}. galderari zure erantzuna...`}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                        Beste xehetasun edo ideiaren bat gehitu nahi duzu? (aukerakoa):
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={userFollowUpAnswer}
                          onChange={(e) => setUserFollowUpAnswer(e.target.value)}
                          placeholder="Adibidez: Lantaldean 6 pertsona gara eta goizeko txandan egin nahi dugu..."
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          disabled={isCopilotLoading || !hasAnyFollowUpAnswer}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                        >
                          {isCopilotLoading ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                              <span>Pilotua eta hipotesia eraikitzen...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Sortu proposamena erantzunekin →</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Aukera: Katalogokoa erabili ala Pilotu berri bat sortu */}
              {copilotResult.egoera !== "galderak_behar_dira" && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 flex-1">
                    {copilotResult.pilotu_id && (
                      <button
                        type="button"
                        onClick={() => setCopilotChoice("existitzen_dena")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                          copilotChoice === "existitzen_dena"
                            ? "bg-indigo-700 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                        }`}
                      >
                        Katalogoko pilotua erabili (
                        {pilotuak.find((p) => p.id === copilotResult.pilotu_id)?.izena || "Dagoena"})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCopilotChoice("berria");
                        if (!copilotResult.pilotu_berria) {
                          setCopilotResult((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  pilotu_berria: {
                                    izena: "Gure neurriko esku-hartzea",
                                    azpititulua: "Entitaterako berariaz egokitutako dinamika",
                                    deskribapena:
                                      prev.aholkua ||
                                      "Euskarazko lehen hitza eta elkarrizketak errazteko dinamika praktikoa.",
                                    mota: activeEragilea?.mota || "Orokorra",
                                    urratsak: [
                                      "1. Lantaldearekin erronka adostu eta dinamika aurkeztu.",
                                      "2. T0 hasierako neurketa egin.",
                                      "3. Dinamika espazioan aktibatu.",
                                      "4. T1 neurketa egin.",
                                      "5. T2 neurketa egin 14-21 egunera.",
                                    ],
                                  },
                                }
                              : prev
                          );
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                        copilotChoice === "berria"
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                      }`}
                    >
                      Pilotu berri bat sortu ({copilotResult.pilotu_berria?.izena || "Neurrikoa"})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingCopilotProposal((v) => !v)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isEditingCopilotProposal
                        ? "bg-amber-100 text-amber-950 border-amber-300"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isEditingCopilotProposal ? "Edizioa itxi" : "Editatu proposamena"}</span>
                  </button>
                </div>
              )}

              {/* Pilotu Berriaren Fitxa (berria bada) */}
              {copilotResult.egoera !== "galderak_behar_dira" &&
                (copilotChoice === "berria" || !copilotResult.bat_dator) &&
                copilotResult.pilotu_berria && (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 text-slate-900">
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-200/80">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-700" />
                        Zuretzat diseinatutako pilotu berria
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-white text-emerald-800 border border-emerald-200">
                        {copilotResult.pilotu_berria.mota || "Pertsonalizatua"}
                      </span>
                    </div>

                    {isEditingCopilotProposal ? (
                      <div className="space-y-3 mt-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-emerald-800 mb-1">
                            Pilotu berriaren izena
                          </label>
                          <input
                            type="text"
                            value={copilotResult.pilotu_berria.izena}
                            onChange={(e) =>
                              setCopilotResult((prev) =>
                                prev && prev.pilotu_berria
                                  ? {
                                      ...prev,
                                      pilotu_berria: { ...prev.pilotu_berria, izena: e.target.value },
                                    }
                                  : prev
                              )
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-emerald-800 mb-1">
                            Azpititulua (laburpena)
                          </label>
                          <input
                            type="text"
                            value={copilotResult.pilotu_berria.azpititulua}
                            onChange={(e) =>
                              setCopilotResult((prev) =>
                                prev && prev.pilotu_berria
                                  ? {
                                      ...prev,
                                      pilotu_berria: { ...prev.pilotu_berria, azpititulua: e.target.value },
                                    }
                                  : prev
                              )
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-emerald-800 mb-1">
                            Deskribapena
                          </label>
                          <textarea
                            rows={2}
                            value={copilotResult.pilotu_berria.deskribapena}
                            onChange={(e) =>
                              setCopilotResult((prev) =>
                                prev && prev.pilotu_berria
                                  ? {
                                      ...prev,
                                      pilotu_berria: { ...prev.pilotu_berria, deskribapena: e.target.value },
                                    }
                                  : prev
                              )
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-emerald-800 mb-1">
                            Urratsak (bat lerro bakoitzean)
                          </label>
                          <textarea
                            rows={4}
                            value={(copilotResult.pilotu_berria.urratsak || []).join("\n")}
                            onChange={(e) =>
                              setCopilotResult((prev) =>
                                prev && prev.pilotu_berria
                                  ? {
                                      ...prev,
                                      pilotu_berria: {
                                        ...prev.pilotu_berria,
                                        urratsak: e.target.value.split("\n"),
                                      },
                                    }
                                  : prev
                              )
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-bold text-slate-900">{copilotResult.pilotu_berria.izena}</h3>
                        <p className="text-xs text-emerald-800 font-semibold mt-0.5 mb-2">
                          {copilotResult.pilotu_berria.azpititulua}
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed mb-3">
                          {copilotResult.pilotu_berria.deskribapena}
                        </p>

                        {copilotResult.pilotu_berria.urratsak && copilotResult.pilotu_berria.urratsak.length > 0 && (
                          <div className="bg-white p-3.5 rounded-lg border border-emerald-200/80 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                              Esku-hartzearen urratsak:
                            </span>
                            <ul className="space-y-1 text-xs text-slate-700">
                              {copilotResult.pilotu_berria.urratsak.map((u, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-700 font-bold">•</span>
                                  <span>{u}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

              {/* Hipotesi eta Esperimentu Proposamena */}
              {copilotResult.egoera !== "galderak_behar_dira" && (
                <div className="bg-white text-slate-900 rounded-xl p-5 border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Proposatutako hipotesi neurgarria
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleImproveCopilotHypothesis}
                        disabled={isImprovingCopilotHypo}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        {isImprovingCopilotHypo ? (
                          <>
                            <RotateCcw className="w-3 h-3 animate-spin" />
                            <span>Fintzen...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Hobetu erredakzioa Latxarekin</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {copilotChoice === "berria" || !copilotResult.bat_dator
                          ? `Pilotu berria: ${copilotResult.pilotu_berria?.izena || "Neurrira"}`
                          : `Dagoen pilotua: ${pilotuak.find((p) => p.id === copilotResult.pilotu_id)?.izena || "Katalogokoa"}`}
                      </span>
                    </div>
                  </div>

                  {copilotHypoExplanation && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between gap-2">
                      <span>
                        <strong>Latxaren hobekuntza:</strong> {copilotHypoExplanation}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCopilotHypoExplanation(null)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {isEditingCopilotProposal ? (
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Hipotesiaren esaldia
                        </label>
                        <textarea
                          rows={2}
                          value={
                            copilotResult.hipotesia ||
                            `Gure ustez, ${copilotResult.taldea || "lantaldeak"} ${copilotResult.pertsonak || "bezeroekin"} ${copilotResult.gunea || "gunean"} dinamika aktibatuta, euskararen erabilera %${copilotResult.xede_portzentajea || 20} igoko da.`
                          }
                          onChange={(e) =>
                            setCopilotResult((prev) => (prev ? { ...prev, hipotesia: e.target.value } : prev))
                          }
                          className="w-full bg-indigo-50/40 border border-indigo-300 rounded-xl p-3 text-sm font-bold text-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Nork</label>
                          <input
                            type="text"
                            value={copilotResult.taldea || ""}
                            onChange={(e) =>
                              setCopilotResult((prev) => (prev ? { ...prev, taldea: e.target.value } : prev))
                            }
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Norekin</label>
                          <input
                            type="text"
                            value={copilotResult.pertsonak || ""}
                            onChange={(e) =>
                              setCopilotResult((prev) => (prev ? { ...prev, pertsonak: e.target.value } : prev))
                            }
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Non (gunea)</label>
                          <input
                            type="text"
                            value={copilotResult.gunea || ""}
                            onChange={(e) =>
                              setCopilotResult((prev) => (prev ? { ...prev, gunea: e.target.value } : prev))
                            }
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-emerald-700 font-bold uppercase mb-1">
                            Xede-igoera (%)
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={100}
                            value={copilotResult.xede_portzentajea || 20}
                            onChange={(e) =>
                              setCopilotResult((prev) =>
                                prev ? { ...prev, xede_portzentajea: Number(e.target.value) || 20 } : prev
                              )
                            }
                            className="w-full bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-black text-emerald-800"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 mb-4 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 leading-relaxed">
                        {copilotResult.hipotesia ||
                          `Gure ustez, ${copilotResult.taldea || "lantaldeak"} ${copilotResult.pertsonak || "bezeroekin"} ${copilotResult.gunea || "gunean"} dinamika aktibatuta, euskararen erabilera %${copilotResult.xede_portzentajea || 20} igoko da.`}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">Nork</span>
                          <span className="font-extrabold text-slate-800">{copilotResult.taldea || "Lantaldeak"}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">Norekin</span>
                          <span className="font-extrabold text-slate-800">{copilotResult.pertsonak || "Herritarrekin"}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">Non (gunea)</span>
                          <span className="font-extrabold text-slate-800">{copilotResult.gunea || "Harrera-gunean"}</span>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <span className="block text-[10px] text-emerald-700 font-bold uppercase">Xede-igoera</span>
                          <span className="font-black text-emerald-800 text-sm">
                            +{copilotResult.xede_portzentajea || 20}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {copilotResult.behaketa_aholkuak && copilotResult.behaketa_aholkuak.length > 0 && (
                    <div className="mb-4 text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                      <span className="font-bold text-amber-900 block mb-1">💡 T0 behaketa egiteko gomendioak:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-950">
                        {copilotResult.behaketa_aholkuak.map((aholkua, i) => (
                          <li key={i}>{aholkua}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCopilotResult(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Itxi
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCopilotProposal((v) => !v)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isEditingCopilotProposal ? "Edizioa amaitu" : "Editatu gorde aurretik"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCopilotExperiment}
                      disabled={isApplyingCopilot}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {isApplyingCopilot
                          ? "Esperimentua sortzen..."
                          : copilotChoice === "berria" || !copilotResult.bat_dator
                          ? "Sortu pilotu berria eta hasi T0 neurtzen →"
                          : "Erabili katalogoko pilotua eta hasi T0 neurtzen →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
              className={`group bg-white rounded-2xl border border-line hover:border-sea/40 p-6 sm:p-7 flex flex-col justify-between transition-colors ${theme.cardBorder}`}
            >
              <div>
                {/* Card Top: Icon & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-sand border border-line flex items-center justify-center text-sea`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${theme.badgeColor}`}
                    >
                      {pilotu.mota}
                    </span>
                    <span className="text-[10px] font-bold text-ink-muted bg-paper border border-line px-2 py-0.5 rounded-md tabular-nums">
                      {activeExpCount > 0
                        ? `${activeExpCount} entitatetan martxan`
                        : "Prest abiatzeko"}
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
                    Adibide erreal bat:
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
                  <span>Aukeratu eta sortu hipotesia</span>
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
                      ? `Materialak eta PDFak (${pilotuMaterialak.length} fitxategi)`
                      : "Ikusi / igo materialak (PDF edo irudiak)"}
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
              1. Hipotesia definitu → 2. T0 neurtu (aurretik) → 3. Pilotua aktibatu → 4. T1 neurtu (berehala) → 5. T2 neurtu (sendotzea).
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
                      ? "Editatu pilotua eta materialak"
                      : "Sortu pilotu berria (errezetak)"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPilotId
                      ? "Aldatu pilotuaren izena, deskribapena, urratsak edo erantsi PDF materialak"
                      : "Definitu zure entitaterako esku-hartze berritzaile bat eta igo PDF materialak"}
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
                  Pilotuaren izena *
                </label>
                <input
                  type="text"
                  required
                  value={newIzena}
                  onChange={(e) => setNewIzena(e.target.value)}
                  placeholder="Adib. Barra-barra txapak, Kafe-orduan euskaraz, Lehen hitza telefonoz..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Leloa / azpititulua *
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
                    Espazioa / mota *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMota}
                    onChange={(e) => setNewMota(e.target.value)}
                    placeholder="Adib. Merkataritza, ikasgela, pasilloak, harrera..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskribapena (helburua eta zergatia) *
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
                  Adibide erreal bat
                </label>
                <input
                  type="text"
                  value={newAdibidea}
                  onChange={(e) => setNewAdibidea(e.target.value)}
                  placeholder="Adib. 'Txapa paparrean daramanean, herritarrak segurtasunez Egun on! esaten du'"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                />
              </div>

              {/* Icon & Color selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hautatu ikonoa
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
                    Hautatu kolorea
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
                      <span>Pilotuaren materialak (PDF / irudiak)</span>
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
                        : "+ Igo PDF / irudiak"}
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
                    Ez dago PDF fitxategirik erantsita oraindik. Sakatu &ldquo;+ Igo PDF / irudiak&rdquo; botoia gehitzeko.
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
                    ? "Gorde aldaketak"
                    : "Gorde eta argitaratu pilotua"}
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
                    {showMaterialsPilot.izena} • Esku-hartze materialak
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
                        <span>Pilotuaren PDF eta dokumentu erantsiak ({attachedMaterials.length})</span>
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
                          : "+ Igo PDF / material berria"}
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
                        <strong>&ldquo;+ Igo PDF / material berria&rdquo;</strong> botoia sakatuta igo ditzakezu.
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
                    Entitate eta harrera-guneetako txapa identifikatzailea
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
                    &ldquo;Euskaraz barra-barra: hemen lasai hitz egin dezakezu&rdquo;
                  </h4>
                  <p className="text-xs text-emerald-100 mt-2 max-w-md mx-auto">
                    Langilearen paparrean eramateko txapa (38mm / 50mm) eta harrera-gunerako identifikagarria.
                  </p>
                </div>

                {/* 3 Step Protocol for Staff */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Langileentzako 3 arau sinpleak (protokoloa):</span>
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
                      <p className="text-[11px] text-slate-500 mt-0.5">Elkarrizketak aurrera egin arte, euskaraz mantendu.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white shadow-lg text-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-white/20 px-3 py-1 rounded-full inline-block mb-3">
                    Esku-hartze txantiloia
                  </span>
                  <h4 className="text-xl font-bold">{showMaterialsPilot.izena}</h4>
                  <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
                    {showMaterialsPilot.deskribapena}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <h5 className="font-bold text-xs text-slate-900 mb-1">
                    Definitutako urratsak:
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
                  <span>Aukeratu pilotua eta hasi</span>
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
