"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import type {
  Eragilea,
  Pilotua,
  PilotuMateriala,
  Esperimentua,
  Neurketa,
  Nudge,
  User,
} from "@/lib/db";
import {
  getPendingNeurketak,
  savePendingNeurketa,
  syncPendingNeurketak,
  saveCachedBootstrapData,
  getCachedBootstrapData,
  clearPendingNeurketak,
  clearCachedBootstrapData,
} from "@/lib/offlineStore";

export const DEFAULT_UI_TEXTS: Record<string, string> = {
  app_title: "Bidean Eragin",
  app_subtitle: "Euskararen erabilera sustatzeko esperimentu praktikoak • Bagera",
  auth_intro:
    "Euskararen erabilera sustatzeko eta neurtzeko tresna praktikoa. Jarraitu zure entitatearen bilakaera 3 urrats errazetan:",
  auth_step1_title: "Hipotesia zehaztu",
  auth_step1_desc: "Zure entitateko erronka eta helburua finkatu.",
  auth_step2_title: "T0 / T1 / T2 neurtu",
  auth_step2_desc: "Behaketa erraza eta diskretua mugikorrarekin.",
  auth_step3_title: "Bilakaera ikusi",
  auth_step3_desc: "Emaitzak modu pribatuan eta argian aztertu.",
  nav_panela: "Nire panela",
  nav_behaketa: "Neurtu",
  nav_katalogoa: "Pilotuak eta hipotesia",
  nav_komunitatea: "Komunitatea",
  nav_admin: "Koordinazioa",
  counter_badge: "Zuzeneko neurketa • Kontagailua",
  counter_title: "Elkarrizketen kontagailua",
  counter_subtitle: "Zuzeneko behaketa-saioa",
  counter_start_btn: "Hasi saioa",
  counter_pause_btn: "Pausatu",
  counter_save_btn: "Amaitu eta gorde",
  counter_t0_desc:
    "Pilotua martxan jarri aurretik euskaraz zenbat hitz egiten den neurtzen du, abiapuntua ezagutzeko.",
  counter_t1_desc:
    "Pilotua martxan jarri berritan egindako neurketa, lehen eragina ikusteko.",
  counter_t2_desc:
    "Handik 2-3 astera egindako neurketa, ohitura berria egonkortu den egiaztatzeko.",
  counter_btn_euskaraz: "Euskaraz",
  counter_btn_erdaraz: "Erdaraz",
  counter_btn_elebi: "Elebi (bi hizkuntzatan)",
  dashboard_step1_title: "1. urratsa: egin T0 hasierako neurketa (pilotuaren aurretik)",
  dashboard_step1_desc:
    "Pilotua martxan jarri aurretik, neurtu 10-30 minutuz gaur egungo elkarrizketak zein hizkuntzatan diren (abiapuntua ezagutzeko).",
  dashboard_step2_title: "2. urratsa: jarri pilotua martxan eta neurtu T1",
  dashboard_step3_title: "3. urratsa: egin T2 neurketa ohitura egonkortu dela egiaztatzeko",
  katalogoa_title: "Esku-hartze pilotuak",
  katalogoa_subtitle:
    "Aukeratu zure entitatean probatu nahi duzun dinamika, deskargatu materialak eta zehaztu hipotesia.",
  footer_text:
    "Bidean Eragin — Bagera Euskaltzaleen Elkartea • Euskararen erabilera neurgarria eta praktikoa",
};

export function getPublicEragileLabel(
  eragile: Eragilea,
  viewerRole?: "admin" | "eragilea",
  viewerEragileId?: string
): string {
  if (viewerRole === "admin" || (viewerEragileId && eragile.id === viewerEragileId)) {
    return eragile.izena;
  }
  if (eragile.publikoa === 1) {
    return eragile.izena;
  }
  const suffix = eragile.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "01";
  const prefix =
    eragile.mota === "ikastetxea"
      ? "Ikastetxea"
      : eragile.mota === "enpresa"
      ? "Enpresa"
      : "Entitatea";
  return `${prefix} #${suffix}`;
}

export function parsePilotuMaterialak(materialak_json?: string): PilotuMateriala[] {
  if (!materialak_json) return [];
  try {
    const parsed = JSON.parse(materialak_json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  userRole: "eragilea" | "admin";
  setUserRole: (role: "eragilea" | "admin") => void;
  currentEragileId: string;
  setCurrentEragileId: (id: string) => void;
  activeTab: "panela" | "katalogoa" | "behaketa" | "onboarding" | "admin";
  setActiveTab: (tab: "panela" | "katalogoa" | "behaketa" | "onboarding" | "admin") => void;
  pilotuak: Pilotua[];
  eragileak: Eragilea[];
  esperimentuak: (Esperimentua & { eragile_izena?: string })[];
  neurketak: Neurketa[];
  nudges: Nudge[];
  uiTexts: Record<string, string>;
  updateUiTexts: (updates: Record<string, string>, resetAll?: boolean) => Promise<boolean>;
  isLoading: boolean;
  activeEragilea: Eragilea | undefined;
  activeEsperimentua: (Esperimentua & { eragile_izena?: string }) | undefined;
  observationConfig: { expId?: string; phase: "T0" | "T1" | "T2" };
  setObservationConfig: (cfg: { expId?: string; phase: "T0" | "T1" | "T2" }) => void;
  selectedPilotForMadLibs: Pilotua | null;
  setSelectedPilotForMadLibs: (p: Pilotua | null) => void;
  refreshData: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    izena: string;
    mota: string;
    arduraduna: string;
    email: string;
    password: string;
    erronka_nagusia: string;
    publikoa?: number;
    hipotesia?: string;
    gunea?: string;
    xede_portzentajea?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registerEragilea: (data: {
    izena: string;
    mota: string;
    arduraduna: string;
    email: string;
    erronka_nagusia: string;
    password?: string;
    publikoa?: number;
  }) => Promise<Eragilea | null>;
  createPilotua: (data: {
    izena: string;
    azpititulua: string;
    deskribapena: string;
    mota: string;
    adibidea: string;
    urratsak?: string[];
    ikonoa?: string;
    kolorea?: string;
    materialak?: PilotuMateriala[];
  }) => Promise<Pilotua | null>;
  createEsperimentua: (data: {
    pilotu_id: string;
    hipotesia: string;
    taldea: string;
    pertsonak: string;
    gunea: string;
    xede_portzentajea: number;
    eragile_id?: string;
  }) => Promise<Esperimentua | null>;
  createQuickPostua: (data: {
    izena: string;
    arduraduna?: string;
    mota?: string;
    erronka_nagusia?: string;
    hipotesia?: string;
    taldea?: string;
    pertsonak?: string;
    gunea?: string;
    xede_portzentajea?: number;
  }) => Promise<{ eragilea: Eragilea; esperimentua: Esperimentua } | null>;
  updateEragilea: (data: {
    id: string;
    izena?: string;
    mota?: string;
    arduraduna?: string;
    email?: string;
    erronka_nagusia?: string;
    password?: string;
    publikoa?: number;
  }) => Promise<Eragilea | null>;
  updatePilotua: (data: {
    id: string;
    izena?: string;
    azpititulua?: string;
    deskribapena?: string;
    mota?: string;
    adibidea?: string;
    urratsak?: string[];
    ikonoa?: string;
    kolorea?: string;
    materialak?: PilotuMateriala[];
  }) => Promise<Pilotua | null>;
  deletePilotua: (id: string) => Promise<boolean>;
  updateEsperimentua: (data: {
    id: string;
    pilotu_id?: string;
    hipotesia?: string;
    taldea?: string;
    pertsonak?: string;
    gunea?: string;
    xede_portzentajea?: number;
    estatusa?: string;
  }) => Promise<Esperimentua | null>;
  updateNeurketa: (data: {
    id: string;
    unea?: "T0" | "T1" | "T2";
    euskaraz_count?: number;
    erdaraz_count?: number;
    elebi_count?: number;
    oharrak?: string;
    behatzailea?: string;
  }) => Promise<Neurketa | null>;
  saveNeurketa: (data: {
    esperimentu_id: string;
    unea: "T0" | "T1" | "T2";
    euskaraz_count: number;
    erdaraz_count: number;
    elebi_count: number;
    iraupena_segundotan: number;
    oharrak: string;
    behatzailea: string;
  }) => Promise<boolean>;
  deleteNeurketa: (id: string) => Promise<boolean>;
  deleteEragilea: (id: string) => Promise<boolean>;
  markNudgeRead: (id: string) => Promise<void>;
  createAdminNudge: (data: {
    eragile_id: string;
    titulua: string;
    mezua: string;
    mota: string;
    ekintza_esteka?: string;
  }) => Promise<boolean>;
  resetDemoData: () => Promise<void>;
  updateAdminCredentials: (data: {
    currentPassword: string;
    newEmail?: string;
    newPassword?: string;
    newName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  triggerConfetti: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  syncOfflineData: () => Promise<{ syncedCount: number; remainingCount: number; errors: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
  initialData?: {
    pilotuak: Pilotua[];
    eragileak: Eragilea[];
    esperimentuak: (Esperimentua & { eragile_izena?: string })[];
    neurketak: Neurketa[];
    nudges: Nudge[];
    uiTexts?: Record<string, string>;
  };
}

export function AppProvider({ children, initialData }: AppProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"eragilea" | "admin">("eragilea");
  const [currentEragileId, setCurrentEragileIdState] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"panela" | "katalogoa" | "behaketa" | "onboarding" | "admin">("panela");
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);

  const [pilotuak, setPilotuak] = useState<Pilotua[]>(initialData?.pilotuak || []);
  const [eragileak, setEragileak] = useState<Eragilea[]>(initialData?.eragileak || []);
  const [esperimentuak, setEsperimentuak] = useState<(Esperimentua & { eragile_izena?: string })[]>(initialData?.esperimentuak || []);
  const [neurketak, setNeurketak] = useState<Neurketa[]>(initialData?.neurketak || []);
  const [nudges, setNudges] = useState<Nudge[]>(initialData?.nudges || []);
  const [uiTexts, setUiTexts] = useState<Record<string, string>>({
    ...DEFAULT_UI_TEXTS,
    ...(initialData?.uiTexts || {}),
  });

  const [observationConfig, setObservationConfig] = useState<{ expId?: string; phase: "T0" | "T1" | "T2" }>({
    phase: "T0",
  });
  const [selectedPilotForMadLibs, setSelectedPilotForMadLibs] = useState<Pilotua | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Guarded setter: non-admin users can never switch to another center's ID
  const setCurrentEragileId = useCallback(
    (id: string) => {
      if (currentUser?.role === "eragilea") {
        if (currentUser.eragile_id) {
          setCurrentEragileIdState(currentUser.eragile_id);
        }
        return;
      }
      setCurrentEragileIdState(id);
    },
    [currentUser]
  );

  // Restore authenticated session from localStorage on client mount
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem("bidean_eragin_session");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr) as User;
        // Never restore yesterday's test account
        if (parsed && parsed.id === "user-1792052519787") {
          localStorage.removeItem("bidean_eragin_session");
          return;
        }
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
          setUserRole(parsed.role);
          if (parsed.role === "eragilea" && parsed.eragile_id) {
            setCurrentEragileIdState(parsed.eragile_id);
          } else if (parsed.role === "admin") {
            setActiveTab("admin");
          }
        }
      }
    } catch (e) {
      console.error("Errorea gordetako saioa kargatzean:", e);
    }
  }, []);

  // Monitor network status & auto-sync pending measurements when coming online
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setPendingSyncCount(getPendingNeurketak().length);

      const handleOnline = () => {
        setIsOnline(true);
        syncPendingNeurketak().then((res) => {
          setPendingSyncCount(res.remainingCount);
          if (res.syncedCount > 0) refreshData();
        });
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#0284c7", "#f59e0b", "#6366f1"],
      });
    } catch {
      // ignore
    }
  };

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(`/api/bootstrap?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const loadedEragileak: Eragilea[] = json.data.eragileak || [];
        setPilotuak(json.data.pilotuak || []);
        setEragileak(loadedEragileak);
        setEsperimentuak(json.data.esperimentuak || []);
        setNeurketak(json.data.neurketak || []);
        setNudges(json.data.nudges || []);
        if (json.data.uiTexts && typeof json.data.uiTexts === "object") {
          setUiTexts({ ...DEFAULT_UI_TEXTS, ...json.data.uiTexts });
        }

        // Cache snapshot to localStorage for offline mode
        saveCachedBootstrapData(json.data);

        // If an eragilea is logged in, verify their center still exists; never fall back to another center
        if (currentUser?.role === "eragilea") {
          let targetCenter = loadedEragileak.find((e) => e.id === currentUser.eragile_id);
          if (!targetCenter) {
            targetCenter = loadedEragileak.find(
              (e) =>
                (e.email && currentUser.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                (e.izena && currentUser.name && e.izena.toLowerCase() === currentUser.name.toLowerCase())
            );
          }
          if (!targetCenter) {
            setCurrentUser(null);
            setCurrentEragileIdState("");
            try {
              localStorage.removeItem("bidean_eragin_session");
            } catch {}
          } else {
            if (currentUser.eragile_id !== targetCenter.id) {
              const updatedUser = { ...currentUser, eragile_id: targetCenter.id };
              setCurrentUser(updatedUser);
              try {
                localStorage.setItem("bidean_eragin_session", JSON.stringify(updatedUser));
              } catch {}
            }
            setCurrentEragileIdState(targetCenter.id);
          }
        } else if (loadedEragileak.length > 0 && !currentEragileId) {
          setCurrentEragileIdState(loadedEragileak[0].id);
        } else if (loadedEragileak.length === 0 && currentEragileId) {
          setCurrentEragileIdState("");
        }
      }
    } catch (e) {
      console.warn("Errorea datuak kargatzean (lineaz kanpoko modua):", e);
      // Fallback to local snapshot
      const cached = getCachedBootstrapData();
      if (cached) {
        setPilotuak(cached.pilotuak || []);
        setEragileak(cached.eragileak || []);
        setEsperimentuak(cached.esperimentuak || []);
        setNeurketak(cached.neurketak || []);
        setNudges(cached.nudges || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentEragileId, currentUser]);

  useEffect(() => {
    refreshData();

    if (typeof window !== "undefined") {
      const handleVisibilityOrFocus = () => {
        if (document.visibilityState === "visible") {
          refreshData();
        }
      };
      window.addEventListener("focus", handleVisibilityOrFocus);
      document.addEventListener("visibilitychange", handleVisibilityOrFocus);

      const interval = setInterval(() => {
        if (document.visibilityState === "visible" && navigator.onLine) {
          refreshData();
        }
      }, 12000);

      return () => {
        window.removeEventListener("focus", handleVisibilityOrFocus);
        document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
        clearInterval(interval);
      };
    }
  }, [refreshData]);

  // Auth: Login
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success && json.user) {
        setCurrentUser(json.user);
        setUserRole(json.user.role);
        try {
          localStorage.setItem("bidean_eragin_session", JSON.stringify(json.user));
        } catch {}

        await refreshData();

        if (json.user.role === "eragilea") {
          if (json.user.eragile_id) {
            setCurrentEragileIdState(json.user.eragile_id);
          }
          setActiveTab("panela");
        } else {
          setActiveTab("admin");
        }
        triggerConfetti();
        return { success: true };
      }
      return { success: false, error: json.error || "Posta elektronikoa edo pasahitza ez dira zuzenak." };
    } catch (e) {
      console.error("Errorea saioa hastean:", e);
      return { success: false, error: "Zerbitzariarekin konektatzeko errorea gertatu da." };
    }
  };

  // Auth: Register
  const register = async (data: {
    izena: string;
    mota: string;
    arduraduna: string;
    email: string;
    password: string;
    erronka_nagusia: string;
    publikoa?: number;
    hipotesia?: string;
    gunea?: string;
    xede_portzentajea?: number;
  }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.user) {
        setCurrentUser(json.user);
        setUserRole(json.user.role);
        try {
          localStorage.setItem("bidean_eragin_session", JSON.stringify(json.user));
        } catch {}

        await refreshData();

        if (json.user.eragile_id) {
          setCurrentEragileIdState(json.user.eragile_id);
        }
        if (json.esperimentua?.id) {
          setObservationConfig({ expId: json.esperimentua.id, phase: "T0" });
        }
        setActiveTab("panela");
        triggerConfetti();
        return { success: true };
      }
      return { success: false, error: json.error || "Errorea kontua sortzean." };
    } catch (e) {
      console.error("Errorea kontua sortzean:", e);
      return { success: false, error: "Zerbitzariarekin konektatzeko errorea gertatu da." };
    }
  };

  // Auth: Logout
  const logout = () => {
    setCurrentUser(null);
    setCurrentEragileIdState("");
    setUserRole("eragilea");
    setActiveTab("panela");
    try {
      localStorage.removeItem("bidean_eragin_session");
    } catch {}
  };

  // Target eragile ID is strictly the agent's center if logged in as eragilea (never fall back to another center)
  const effectiveEragileId =
    currentUser?.role === "eragilea"
      ? currentUser.eragile_id ||
        eragileak.find(
          (e) =>
            (e.email && currentUser.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (e.izena && currentUser.name && e.izena.toLowerCase() === currentUser.name.toLowerCase())
        )?.id ||
        ""
      : currentEragileId;

  const activeEragilea =
    eragileak.find((e) => e.id === effectiveEragileId) ||
    (currentUser?.role === "admin" ? eragileak[0] : undefined);

  const activeEsperimentua = esperimentuak.find((e) => e.eragile_id === effectiveEragileId);

  const registerEragilea = async (data: {
    izena: string;
    mota: string;
    arduraduna: string;
    email: string;
    erronka_nagusia: string;
    password?: string;
    publikoa?: number;
  }) => {
    try {
      const res = await fetch("/api/eragileak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await refreshData();
        setCurrentEragileId(json.data.id);
        setActiveTab("katalogoa");
        triggerConfetti();
        return json.data;
      }
    } catch (e) {
      console.error("Errorea eragilea erregistratzean:", e);
    }
    return null;
  };

  const createPilotua = async (data: {
    izena: string;
    azpititulua: string;
    deskribapena: string;
    mota: string;
    adibidea: string;
    urratsak?: string[];
    ikonoa?: string;
    kolorea?: string;
    materialak?: PilotuMateriala[];
  }) => {
    try {
      const res = await fetch("/api/pilotuak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          sortzaile_id: effectiveEragileId || currentUser?.id || "eragile",
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await refreshData();
        triggerConfetti();
        return json.data as Pilotua;
      }
    } catch (e) {
      console.error("Errorea pilotua sortzean:", e);
    }
    return null;
  };

  const createEsperimentua = async (data: {
    pilotu_id: string;
    hipotesia: string;
    taldea: string;
    pertsonak: string;
    gunea: string;
    xede_portzentajea: number;
    eragile_id?: string;
  }) => {
    try {
      const targetId = data.eragile_id || effectiveEragileId || (currentUser?.eragile_id || "");
      const res = await fetch("/api/esperimentuak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          eragile_id: targetId,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await refreshData();
        setObservationConfig({ expId: json.data.id, phase: "T0" });
        setActiveTab("behaketa");
        triggerConfetti();
        return json.data;
      }
    } catch (e) {
      console.error("Errorea esperimentua sortzean:", e);
    }
    return null;
  };

  const createQuickPostua = async (data: {
    izena: string;
    arduraduna?: string;
    mota?: string;
    erronka_nagusia?: string;
    hipotesia?: string;
    taldea?: string;
    pertsonak?: string;
    gunea?: string;
    xede_portzentajea?: number;
  }) => {
    try {
      // 1. Create eragilea
      const resEragile = await fetch("/api/eragileak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          izena: data.izena.trim(),
          mota: data.mota || "merkataritza",
          arduraduna: data.arduraduna?.trim() || "Arduraduna",
          email: `entitatea-${Date.now().toString(36)}@bideaneragin.eus`,
          erronka_nagusia:
            data.erronka_nagusia?.trim() ||
            "Egunerokoan lehen hitza eta elkarrizketa euskaraz piztea, txapak erabilita.",
        }),
      });
      const jsonEragile = await resEragile.json();
      if (!jsonEragile.success || !jsonEragile.data) {
        throw new Error("Ezin izan da eragilea sortu");
      }
      const newEragilea = jsonEragile.data as Eragilea;

      const xedea = data.xede_portzentajea || 25;
      const taldeaVal = data.taldea?.trim() || "Entitateko lantaldeak";
      const pertsonakVal = data.pertsonak?.trim() || "herritarrekin";
      const guneaVal = data.gunea?.trim() || "harrera-gunean";
      const hipotesiaVal =
        data.hipotesia?.trim() ||
        `Gure ustez, ${taldeaVal} ${pertsonakVal} ${guneaVal} 'Euskaraz barra-barra' txapa bistan eramanda, euskarazko elkarrizketak %${xedea} ugarituko dira.`;

      // 2. Create experiment with 'barra-barra-txapak' pilot
      const resExp = await fetch("/api/esperimentuak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eragile_id: newEragilea.id,
          pilotu_id: "barra-barra-txapak",
          hipotesia: hipotesiaVal,
          taldea: taldeaVal,
          pertsonak: pertsonakVal,
          gunea: guneaVal,
          xede_portzentajea: xedea,
        }),
      });
      const jsonExp = await resExp.json();
      if (!jsonExp.success || !jsonExp.data) {
        throw new Error("Ezin izan da esperimentua sortu");
      }
      const newExp = jsonExp.data as Esperimentua;

      await refreshData();
      setCurrentEragileId(newEragilea.id);
      setObservationConfig({ expId: newExp.id, phase: "T0" });
      triggerConfetti();
      return { eragilea: newEragilea, esperimentua: newExp };
    } catch (e) {
      console.error("Errorea entitate azkarra sortzean:", e);
      return null;
    }
  };

  const updateEragilea = async (data: {
    id: string;
    izena?: string;
    mota?: string;
    arduraduna?: string;
    email?: string;
    erronka_nagusia?: string;
    password?: string;
    publikoa?: number;
  }) => {
    try {
      const res = await fetch("/api/eragileak", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await refreshData();
        return json.data as Eragilea;
      }
    } catch (e) {
      console.error("Errorea eragilea eguneratzean:", e);
    }
    return null;
  };

  const updatePilotua = async (data: {
    id: string;
    izena?: string;
    azpititulua?: string;
    deskribapena?: string;
    mota?: string;
    adibidea?: string;
    urratsak?: string[];
    ikonoa?: string;
    kolorea?: string;
    materialak?: PilotuMateriala[];
  }) => {
    try {
      const res = await fetch("/api/pilotuak", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await refreshData();
        return json.data as Pilotua;
      }
    } catch (e) {
      console.error("Errorea pilotua eguneratzean:", e);
    }
    return null;
  };

  const deletePilotua = async (id: string) => {
    try {
      const res = await fetch(`/api/pilotuak?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        await refreshData();
        return true;
      }
    } catch (e) {
      console.error("Errorea pilotua ezabatzean:", e);
    }
    return false;
  };

  const updateEsperimentua = async (data: {
    id: string;
    pilotu_id?: string;
    hipotesia?: string;
    taldea?: string;
    pertsonak?: string;
    gunea?: string;
    xede_portzentajea?: number;
    estatusa?: string;
  }) => {
    try {
      const res = await fetch("/api/esperimentuak", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await refreshData();
        return json.data as Esperimentua;
      }
    } catch (e) {
      console.error("Errorea esperimentua eguneratzean:", e);
    }
    return null;
  };

  const updateNeurketa = async (data: {
    id: string;
    unea?: "T0" | "T1" | "T2";
    euskaraz_count?: number;
    erdaraz_count?: number;
    elebi_count?: number;
    oharrak?: string;
    behatzailea?: string;
  }) => {
    try {
      const res = await fetch("/api/neurketak", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await refreshData();
        return json.data as Neurketa;
      }
    } catch (e) {
      console.error("Errorea neurketa eguneratzean:", e);
    }
    return null;
  };

  const syncOfflineData = async () => {
    const res = await syncPendingNeurketak();
    setPendingSyncCount(res.remainingCount);
    if (res.syncedCount > 0) {
      await refreshData();
    }
    return res;
  };

  const saveNeurketa = async (data: {
    esperimentu_id: string;
    unea: "T0" | "T1" | "T2";
    euskaraz_count: number;
    erdaraz_count: number;
    elebi_count: number;
    iraupena_segundotan: number;
    oharrak: string;
    behatzailea: string;
  }) => {
    // 1. If explicitly offline, save to local offline queue directly
    if (typeof window !== "undefined" && !navigator.onLine) {
      const savedOffline = savePendingNeurketa(data);
      const optimisticNeurketa: Neurketa = {
        id: savedOffline.id,
        esperimentu_id: data.esperimentu_id,
        unea: data.unea,
        euskaraz_count: data.euskaraz_count,
        erdaraz_count: data.erdaraz_count,
        elebi_count: data.elebi_count,
        iraupena_segundotan: data.iraupena_segundotan,
        oharrak: data.oharrak,
        behatzailea: data.behatzailea,
        data_ordu: savedOffline.data_ordu,
      };
      setNeurketak((prev) => [optimisticNeurketa, ...prev]);
      setPendingSyncCount(getPendingNeurketak().length);
      triggerConfetti();
      setActiveTab("panela");
      return true;
    }

    // 2. Try online server request
    try {
      const res = await fetch("/api/neurketak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        await refreshData();
        triggerConfetti();
        setActiveTab("panela");
        return true;
      }
    } catch (e) {
      console.warn("Sare-errorea; neurketa tokian gordeko da lineaz kanpo:", e);
      // 3. Fallback on network failure/timeout: save locally
      const savedOffline = savePendingNeurketa(data);
      const optimisticNeurketa: Neurketa = {
        id: savedOffline.id,
        esperimentu_id: data.esperimentu_id,
        unea: data.unea,
        euskaraz_count: data.euskaraz_count,
        erdaraz_count: data.erdaraz_count,
        elebi_count: data.elebi_count,
        iraupena_segundotan: data.iraupena_segundotan,
        oharrak: data.oharrak,
        behatzailea: data.behatzailea,
        data_ordu: savedOffline.data_ordu,
      };
      setNeurketak((prev) => [optimisticNeurketa, ...prev]);
      setPendingSyncCount(getPendingNeurketak().length);
      triggerConfetti();
      setActiveTab("panela");
      return true;
    }
    return false;
  };

  const deleteNeurketa = async (id: string) => {
    try {
      const res = await fetch(`/api/neurketak?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        await refreshData();
        return true;
      }
    } catch (e) {
      console.error("Errorea neurketa ezabatzean:", e);
    }
    return false;
  };

  const deleteEragilea = async (id: string) => {
    try {
      const res = await fetch(`/api/eragileak?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        if (currentEragileId === id) {
          setCurrentEragileId("");
        }
        await refreshData();
        return true;
      }
    } catch (e) {
      console.error("Errorea eragilea ezabatzean:", e);
    }
    return false;
  };

  const markNudgeRead = async (id: string) => {
    try {
      await fetch("/api/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", nudge_id: id }),
      });
      setNudges((prev) => prev.map((n) => (n.id === id ? { ...n, irakurria: 1 } : n)));
    } catch (e) {
      console.error("Errorea nudge-a irakurtzean:", e);
    }
  };

  const createAdminNudge = async (data: {
    eragile_id: string;
    titulua: string;
    mezua: string;
    mota: string;
    ekintza_esteka?: string;
  }) => {
    try {
      const res = await fetch("/api/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...data }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshData();
        return true;
      }
    } catch (e) {
      console.error("Errorea nudge berria bidaltzean:", e);
    }
    return false;
  };

  const resetDemoData = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/reset-demo", { method: "POST" });
      clearPendingNeurketak();
      clearCachedBootstrapData();
      setPendingSyncCount(0);
      setCurrentEragileId("");
      await refreshData();
      if (currentUser?.role === "admin") {
        setActiveTab("admin");
      } else {
        setActiveTab("panela");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateAdminCredentials = async (data: {
    currentPassword: string;
    newEmail?: string;
    newPassword?: string;
    newName?: string;
  }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.user) {
        setCurrentUser(json.user);
        try {
          localStorage.setItem("bidean_eragin_session", JSON.stringify(json.user));
        } catch {}
        triggerConfetti();
        return { success: true };
      }
      return { success: false, error: json.error || "Errorea gertatu da pasahitza aldatzean." };
    } catch (e) {
      console.error("Errorea admin kredentzialak eguneratzean:", e);
      return { success: false, error: "Zerbitzariarekin konektatzeko errorea." };
    }
  };

  const updateUiTexts = async (updates: Record<string, string>, resetAll = false) => {
    try {
      const res = await fetch("/api/bootstrap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uiTexts: updates, resetAll }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUiTexts({ ...DEFAULT_UI_TEXTS, ...json.data });
        return true;
      }
    } catch (e) {
      console.error("Errorea testuak eguneratzean:", e);
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        userRole,
        setUserRole,
        currentEragileId: effectiveEragileId,
        setCurrentEragileId,
        activeTab,
        setActiveTab,
        pilotuak,
        eragileak,
        esperimentuak,
        neurketak,
        nudges,
        uiTexts,
        updateUiTexts,
        isLoading,
        activeEragilea,
        activeEsperimentua,
        observationConfig,
        setObservationConfig,
        selectedPilotForMadLibs,
        setSelectedPilotForMadLibs,
        refreshData,
        login,
        register,
        logout,
        registerEragilea,
        createPilotua,
        updatePilotua,
        deletePilotua,
        createEsperimentua,
        createQuickPostua,
        updateEragilea,
        updateEsperimentua,
        updateNeurketa,
        saveNeurketa,
        deleteNeurketa,
        deleteEragilea,
        markNudgeRead,
        createAdminNudge,
        resetDemoData,
        updateAdminCredentials,
        triggerConfetti,
        isOnline,
        pendingSyncCount,
        syncOfflineData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp AppProvider barruan erabili behar da");
  }
  return context;
}
