"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Eragilea, Pilotua, Esperimentua, Neurketa, Nudge, User } from "@/lib/db";
import {
  getPendingNeurketak,
  savePendingNeurketa,
  syncPendingNeurketak,
  saveCachedBootstrapData,
  getCachedBootstrapData,
  clearPendingNeurketak,
  clearCachedBootstrapData,
} from "@/lib/offlineStore";

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
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registerEragilea: (data: {
    izena: string;
    mota: string;
    arduraduna: string;
    email: string;
    erronka_nagusia: string;
    password?: string;
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
  };
}

export function AppProvider({ children, initialData }: AppProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"eragilea" | "admin">("eragilea");
  const [currentEragileId, setCurrentEragileId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"panela" | "katalogoa" | "behaketa" | "onboarding" | "admin">("panela");
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);

  const [pilotuak, setPilotuak] = useState<Pilotua[]>(initialData?.pilotuak || []);
  const [eragileak, setEragileak] = useState<Eragilea[]>(initialData?.eragileak || []);
  const [esperimentuak, setEsperimentuak] = useState<(Esperimentua & { eragile_izena?: string })[]>(initialData?.esperimentuak || []);
  const [neurketak, setNeurketak] = useState<Neurketa[]>(initialData?.neurketak || []);
  const [nudges, setNudges] = useState<Nudge[]>(initialData?.nudges || []);

  const [observationConfig, setObservationConfig] = useState<{ expId?: string; phase: "T0" | "T1" | "T2" }>({
    phase: "T0",
  });
  const [selectedPilotForMadLibs, setSelectedPilotForMadLibs] = useState<Pilotua | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

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
            setCurrentEragileId(parsed.eragile_id);
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

        // Cache snapshot to localStorage for offline mode
        saveCachedBootstrapData(json.data);

        // If an eragilea is logged in, verify their center still exists; if deleted, log them out cleanly
        if (currentUser?.role === "eragilea") {
          const exists = loadedEragileak.some((e) => e.id === currentUser.eragile_id);
          if (!exists) {
            setCurrentUser(null);
            setCurrentEragileId("");
            try {
              localStorage.removeItem("bidean_eragin_session");
            } catch {}
          } else if (currentUser.eragile_id) {
            setCurrentEragileId(currentUser.eragile_id);
          }
        } else if (loadedEragileak.length > 0 && !currentEragileId) {
          setCurrentEragileId(loadedEragileak[0].id);
        } else if (loadedEragileak.length === 0 && currentEragileId) {
          setCurrentEragileId("");
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
            setCurrentEragileId(json.user.eragile_id);
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
          setCurrentEragileId(json.user.eragile_id);
        }
        setActiveTab("katalogoa");
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
    setCurrentEragileId("");
    setUserRole("eragilea");
    setActiveTab("panela");
    try {
      localStorage.removeItem("bidean_eragin_session");
    } catch {}
  };

  // Target eragile ID is strictly the agent's center if logged in as eragilea
  const effectiveEragileId =
    currentUser?.role === "eragilea" && currentUser.eragile_id
      ? currentUser.eragile_id
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
          email: `komertzioa-${Date.now().toString(36)}@bideaneragin.eus`,
          erronka_nagusia:
            data.erronka_nagusia?.trim() ||
            "Dendan lehen hitza eta elkarrizketa euskaraz piztea, txapak erabilita.",
        }),
      });
      const jsonEragile = await resEragile.json();
      if (!jsonEragile.success || !jsonEragile.data) {
        throw new Error("Ezin izan da eragilea sortu");
      }
      const newEragilea = jsonEragile.data as Eragilea;

      const xedea = data.xede_portzentajea || 25;
      const taldeaVal = data.taldea?.trim() || "Saltokiko lantaldea";
      const pertsonakVal = data.pertsonak?.trim() || "Bezeroak eta langileak";
      const guneaVal = data.gunea?.trim() || "Saltokiaren mostradorea";
      const hipotesiaVal =
        data.hipotesia?.trim() ||
        `Gure ustez, ${taldeaVal} ${pertsonakVal}, ${guneaVal} 'Euskaraz barra-barra' txapa soinean eramanda, euskararen erabilera %${xedea} igoko da.`;

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
      console.error("Errorea saltoki azkarra sortzean:", e);
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
