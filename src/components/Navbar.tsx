"use client";

import React, { useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  Timer,
  UserPlus,
  ShieldCheck,
  Building2,
  GraduationCap,
  Store,
  Briefcase,
  Bell,
  RefreshCw,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import BideanLogo from "@/components/BideanLogo";

export default function Navbar() {
  const {
    currentUser,
    userRole,
    setUserRole,
    currentEragileId,
    setCurrentEragileId,
    activeTab,
    setActiveTab,
    eragileak,
    activeEragilea,
    nudges,
    markNudgeRead,
    resetDemoData,
    logout,
    isLoading,
    isOnline,
    pendingSyncCount,
    uiTexts,
  } = useApp();

  const [showNudgesModal, setShowNudgesModal] = useState(false);
  const [showCenterMenu, setShowCenterMenu] = useState(false);

  const unreadNudges = nudges.filter(
    (n) => n.eragile_id === currentEragileId && n.irakurria === 0
  );

  const getMotaIcon = (mota?: string) => {
    switch (mota) {
      case "ikastetxea":
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case "merkataritza":
        return <Store className="w-4 h-4 text-amber-600" />;
      case "enpresa":
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-600" />;
    }
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-md border-b border-line print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(isAdmin && userRole === "admin" ? "admin" : "panela")}
              className="flex items-center gap-2.5 text-left group transition cursor-pointer"
            >
              <BideanLogo size="md" className="group-hover:scale-105 transition-transform" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-editorial font-semibold text-xl text-ink tracking-tight">
                    {uiTexts.app_title || "Bidean Eragin"}
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-sand text-sea border border-line rounded-md">
                    Bagera
                  </span>
                </div>
                <p className="text-xs text-ink-muted hidden md:block">
                  {uiTexts.app_subtitle || "Euskararen erabilera sustatzeko esperimentu praktikoak"}
                </p>
              </div>
            </button>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
                    activeTab === "admin"
                      ? "bg-sea text-white"
                      : "text-ink-muted hover:text-ink hover:bg-sand/70"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {uiTexts.nav_admin || "Koordinazioa"}
                </button>

                <button
                  onClick={() => setActiveTab("behaketa")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
                    activeTab === "behaketa"
                      ? "bg-euskara text-white"
                      : "bg-euskara/10 text-euskara hover:bg-euskara/15"
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  {uiTexts.nav_behaketa || "Neurtu"}
                </button>

                <button
                  onClick={() => setActiveTab("panela")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    activeTab === "panela"
                      ? "bg-sand text-ink border border-line"
                      : "text-ink-muted hover:text-ink hover:bg-sand/70"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {uiTexts.nav_panela || "Entitatearen panela"}
                </button>

                <button
                  onClick={() => setActiveTab("katalogoa")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    activeTab === "katalogoa"
                      ? "bg-sand text-ink border border-line"
                      : "text-ink-muted hover:text-ink hover:bg-sand/70"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  {uiTexts.nav_katalogoa || "Pilotuak eta hipotesia"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("panela")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    activeTab === "panela"
                      ? "bg-sand text-ink border border-line"
                      : "text-ink-muted hover:text-ink hover:bg-sand/70"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {uiTexts.nav_panela || "Nire panela"}
                </button>

                <button
                  onClick={() => setActiveTab("behaketa")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
                    activeTab === "behaketa"
                      ? "bg-euskara text-white"
                      : "bg-euskara/10 text-euskara hover:bg-euskara/15"
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  {uiTexts.nav_behaketa || "Neurtu"}
                </button>

                <button
                  onClick={() => setActiveTab("katalogoa")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    activeTab === "katalogoa"
                      ? "bg-sand text-ink border border-line"
                      : "text-ink-muted hover:text-ink hover:bg-sand/70"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  {uiTexts.nav_katalogoa || "Pilotuak eta hipotesia"}
                </button>
              </>
            )}
          </nav>

          {/* Right Controls: Center Info, User Badge, Nudges & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* If regular agent: Display Center & User badge */}
            {!isAdmin && activeEragilea && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 max-w-[160px] sm:max-w-[200px] truncate">
                  {getMotaIcon(activeEragilea.mota)}
                  <span className="truncate">{activeEragilea.izena}</span>
                </div>
                <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate max-w-[120px]">{currentUser?.name}</span>
                </div>
              </div>
            )}

            {/* If Admin: Clear Badge */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Bagera admin</span>
              </div>
            )}


            {/* Offline Status Badge */}
            {!isOnline && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Lineaz kanpo</span>
              </span>
            )}

            {/* Nudge Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNudgesModal(!showNudgesModal)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                title="Bultzadak eta jakinarazpenak"
              >
                <Bell className="w-5 h-5" />
                {unreadNudges.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-xs">
                    {unreadNudges.length}
                  </span>
                )}
              </button>

              {showNudgesModal && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-sm text-slate-900">
                        Bultzadak eta gogorarazpenak
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500">
                      {unreadNudges.length} berri
                    </span>
                  </div>

                  {nudges.filter((n) => n.eragile_id === currentEragileId).length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      Ez duzu jakinarazpen berririk une honetan.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {nudges
                        .filter((n) => n.eragile_id === currentEragileId)
                        .slice(0, 5)
                        .map((nudge) => (
                          <div
                            key={nudge.id}
                            className={`p-3 rounded-xl border text-xs transition ${
                              nudge.irakurria === 0
                                ? "bg-emerald-50/60 border-emerald-200"
                                : "bg-slate-50 border-slate-200 opacity-75"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-slate-900">
                                {nudge.titulua}
                              </h5>
                              {nudge.irakurria === 0 && (
                                <button
                                  onClick={() => markNudgeRead(nudge.id)}
                                  className="text-[10px] text-emerald-700 hover:underline cursor-pointer shrink-0 font-medium"
                                >
                                  Irakurria
                                </button>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">
                              {nudge.mezua}
                            </p>
                            {nudge.ekintza_esteka && (
                              <button
                                onClick={() => {
                                  setShowNudgesModal(false);
                                  if (nudge.ekintza_esteka?.includes("behaketa") || nudge.ekintza_esteka?.includes("kontagailua")) {
                                    setActiveTab("behaketa");
                                  } else if (nudge.ekintza_esteka?.includes("katalogoa")) {
                                    setActiveTab("katalogoa");
                                  } else {
                                    setActiveTab("panela");
                                  }
                                }}
                                className="mt-2 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                              >
                                Joan ekintzara →
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1.5"
              title="Itxi saioa"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Itxi</span>
            </button>
          </div>
        </div>

        {/* Admin Active Entity Bar (Only when admin needs to switch context cleanly) */}
        {isAdmin && (
          <div className="hidden md:flex items-center justify-end py-1.5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-[11px]">
              {eragileak.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Entitate aktiboa:</span>
                  <select
                    value={activeEragilea?.id || ""}
                    onChange={(e) => {
                      setCurrentEragileId(e.target.value);
                      if (activeTab === "admin") {
                        setActiveTab("panela");
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 font-bold text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden cursor-pointer max-w-[220px]"
                  >
                    {eragileak.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.izena}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-slate-400 italic">Entitaterik ez</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper/95 backdrop-blur-md border-t border-line pt-2 px-2 pb-safe flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab("panela")}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2.5 rounded-xl cursor-pointer ${
            activeTab === "panela" ? "text-sea font-bold bg-sand" : "text-ink-muted"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Panela</span>
        </button>
        <button
          onClick={() => setActiveTab("katalogoa")}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2.5 rounded-xl cursor-pointer ${
            activeTab === "katalogoa" ? "text-sea font-bold bg-sand" : "text-ink-muted"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Pilotuak</span>
        </button>
        <button
          onClick={() => setActiveTab("behaketa")}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold py-1.5 px-3.5 rounded-xl bg-euskara text-white shadow-xs cursor-pointer ${
            activeTab === "behaketa" ? "ring-2 ring-euskara/40" : ""
          }`}
        >
          <Timer className="w-5 h-5" />
          <span>Neurtu</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2.5 rounded-xl cursor-pointer ${
              activeTab === "admin" ? "text-sea font-bold bg-sand" : "text-ink-muted"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Admin</span>
          </button>
        )}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-2 rounded-xl text-terracotta hover:opacity-80 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Itxi</span>
        </button>
      </div>
    </header>
  );
}
