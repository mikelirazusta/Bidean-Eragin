"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, Download, RefreshCw, CheckCircle2, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function PWAInitializer() {
  const { isOnline, pendingSyncCount, syncOfflineData } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Register Service Worker & Install Prompt Listener
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker erregistratuta:", reg.scope);
          })
          .catch((err) => {
            console.warn("SW erregistro errore:", err);
          });
      });

      // Listen for browser install prompt (Android, Chrome, Edge)
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Check if user already dismissed install banner
        const dismissed = localStorage.getItem("bidean_eragin_dismiss_install");
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem("bidean_eragin_dismiss_install", "true");
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const result = await syncOfflineData();
    setIsSyncing(false);
    if (result && result.syncedCount > 0) {
      setSyncToast(`${result.syncedCount} neurketa arrakastaz sinkronizatu dira zerbitzariarekin!`);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  return (
    <>
      {/* 1. OFFLINE STATUS BANNER */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between sticky top-0 z-50 shadow-md animate-in slide-in-from-top">
          <div className="flex items-center gap-2 mx-auto">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Lineaz kanpoko modua aktibo: Neurketa guztiak gailuan gordeko dira eta konexioa itzultzean automatikoki sinkronizatuko dira!
            </span>
          </div>
        </div>
      )}

      {/* 2. PENDING OFFLINE SYNC FLOATING BAR */}
      {isOnline && pendingSyncCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xs">
            <span className="font-bold block">
              {pendingSyncCount} neurketa sinkronizatzeko zain
            </span>
            <span className="text-slate-400 text-[11px]">
              Gailuan gordeta daude
            </span>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="ml-auto px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Igotzen..." : "Sinkronizatu"}</span>
          </button>
        </div>
      )}

      {/* 3. SYNC TOAST NOTIFICATION */}
      {syncToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* 4. INSTALL APP PWA BANNER */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:max-w-md z-50 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 flex items-center gap-3 animate-in slide-in-from-bottom">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <img src="/icons/icon-192x192.png" alt="Icon" className="w-8 h-8 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <h5 className="font-bold text-slate-900 leading-tight">
              Instalatu Bidean Eragin
            </h5>
            <p className="text-slate-500 text-[11px] truncate">
              Mugikorreko aplikazio gisa erabili, baita konexiorik gabe ere!
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalatu</span>
            </button>
            <button
              onClick={handleDismissInstall}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              title="Itxi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
