"use client";

import React from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import ZentroDashboard from "@/components/ZentroDashboard";
import PilotuenKatalogoa from "@/components/PilotuenKatalogoa";
import BehatzaileKontagailua from "@/components/BehatzaileKontagailua";
import OnboardingView from "@/components/OnboardingView";
import AdminKoadroa from "@/components/AdminKoadroa";
import AuthPortal from "@/components/AuthPortal";
import PWAInitializer from "@/components/PWAInitializer";
import { Heart, LogOut } from "lucide-react";
import { Pilotua, Eragilea, Esperimentua, Neurketa, Nudge } from "@/lib/db";

interface MainClientAppProps {
  initialData?: {
    pilotuak: Pilotua[];
    eragileak: Eragilea[];
    esperimentuak: (Esperimentua & { eragile_izena?: string })[];
    neurketak: Neurketa[];
    nudges: Nudge[];
    uiTexts?: Record<string, string>;
  };
}

function MainContent() {
  const { currentUser, activeTab, logout, activeEragilea, uiTexts } = useApp();

  // Wall: If user is not authenticated, ONLY render AuthPortal
  if (!currentUser) {
    return <AuthPortal />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pb-16">
        {activeTab === "panela" && <ZentroDashboard />}
        {activeTab === "katalogoa" && <PilotuenKatalogoa />}
        {activeTab === "behaketa" && <BehatzaileKontagailua />}
        {activeTab === "onboarding" && <OnboardingView />}
        {activeTab === "admin" && <AdminKoadroa />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800">{uiTexts.app_title || "Bidean Eragin"}</span>
            <span>•</span>
            <span>{uiTexts.footer_text || "Bagera Euskaltzaleen Elkartea • Euskararen erabilera neurgarria eta praktikoa"}</span>
            {activeEragilea && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline font-semibold text-sky-800">
                  {activeEragilea.izena}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
              title="Itxi saioa uneko kontutik"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Itxi saioa</span>
            </button>

            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              Euskaraz egina <Heart className="w-3 h-3 text-rose-500 fill-current" /> Bagera
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function MainClientApp({ initialData }: MainClientAppProps) {
  return (
    <AppProvider initialData={initialData}>
      <PWAInitializer />
      <MainContent />
    </AppProvider>
  );
}
