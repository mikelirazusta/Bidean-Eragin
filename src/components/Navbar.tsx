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

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNudgesModal(false);
        setShowCenterMenu(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const unreadNudges = nudges.filter(
    (n) => n.eragile_id === currentEragileId && n.irakurria === 0
  );

  const getMotaIcon = (mota?: string) => {
    switch (mota) {
      case "ikastetxea":
        return <GraduationCap className="w-4 h-4 text-euskara" />;
      case "merkataritza":
        return <Store className="w-4 h-4 text-amber-600" />;
      case "enpresa":
        return <Briefcase className="w-4 h-4 text-sea" />;
      default:
        return <Building2 className="w-4 h-4 text-ink-muted" />;
    }
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <>
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-line print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-15 sm:h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setActiveTab(isAdmin && userRole === "admin" ? "admin" : "panela")}
              className="flex items-center gap-2 sm:gap-2.5 text-left group transition cursor-pointer min-w-0"
            >
              <BideanLogo size="md" className="group-hover:scale-105 transition-transform shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-editorial font-semibold text-lg sm:text-xl text-ink tracking-tight truncate">
                    {uiTexts.app_title || "Bidean Eragin"}
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-sand text-sea border border-line rounded-md shrink-0">
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-sand border border-line text-xs font-bold text-ink max-w-[110px] sm:max-w-[200px] truncate">
                  {getMotaIcon(activeEragilea.mota)}
                  <span className="truncate">{activeEragilea.izena}</span>
                </div>
                <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-line text-xs text-ink-muted">
                  <UserIcon className="w-3.5 h-3.5 text-ink-muted" />
                  <span className="font-medium truncate max-w-[120px]">{currentUser?.name}</span>
                </div>
              </div>
            )}

            {/* If Admin: Clear Badge */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sea/10 border border-sea/20 text-xs font-bold text-sea">
                <ShieldCheck className="w-4 h-4 text-sea" />
                <span className="hidden sm:inline">Bagera koordinazioa</span>
              </div>
            )}


            {/* Offline Status Badge */}
            {!isOnline && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ochre/15 text-ochre text-[11px] font-bold border border-ochre/30">
                <span className="w-2 h-2 rounded-full bg-ochre animate-pulse" />
                <span className="hidden sm:inline">Lineaz kanpo</span>
              </span>
            )}

            {/* Nudge Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNudgesModal(!showNudgesModal)}
                aria-label="Bultzadak eta jakinarazpenak"
                className="relative p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-sand transition cursor-pointer"
                title="Bultzadak eta jakinarazpenak"
              >
                <Bell className="w-5 h-5" />
                {unreadNudges.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-euskara text-[10px] font-bold text-white">
                    {unreadNudges.length}
                  </span>
                )}
              </button>

              {showNudgesModal && (
                <div
                  role="dialog"
                  aria-label="Bultzadak eta gogorarazpenak"
                  className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-white rounded-2xl shadow-lg border border-line p-4 z-50"
                >
                  <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-euskara" />
                      <h4 className="font-bold text-sm text-ink">
                        Bultzadak eta gogorarazpenak
                      </h4>
                    </div>
                    <span className="text-xs text-ink-muted">
                      {unreadNudges.length} berri
                    </span>
                  </div>

                  {nudges.filter((n) => n.eragile_id === currentEragileId).length === 0 ? (
                    <p className="text-xs text-ink-muted py-3 text-center">
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
                                ? "bg-euskara/5 border-euskara/25"
                                : "bg-sand/50 border-line opacity-80"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-ink">
                                {nudge.titulua}
                              </h5>
                              {nudge.irakurria === 0 && (
                                <button
                                  onClick={() => markNudgeRead(nudge.id)}
                                  className="text-[10px] text-euskara hover:underline cursor-pointer shrink-0 font-semibold"
                                >
                                  Irakurria
                                </button>
                              )}
                            </div>
                            <p className="text-ink-muted mt-1 leading-relaxed">
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
                                className="mt-2 text-[11px] font-semibold text-euskara hover:opacity-80 flex items-center gap-1 cursor-pointer"
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
              aria-label="Itxi saioa"
              className="p-2 rounded-lg text-ink-muted hover:text-terracotta hover:bg-terracotta/10 transition cursor-pointer flex items-center gap-1.5"
              title="Itxi saioa"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Itxi</span>
            </button>
          </div>
        </div>

        {/* Admin Active Entity Bar (visible on both mobile and desktop) */}
        {isAdmin && (
          <div className="flex items-center justify-between md:justify-end py-1.5 border-t border-line text-xs">
            <div className="flex items-center gap-2 text-[11px] w-full md:w-auto justify-between md:justify-end">
              {eragileak.length > 0 ? (
                <div className="flex items-center gap-1.5 w-full md:w-auto justify-between md:justify-end">
                  <span className="text-ink-muted font-semibold shrink-0">Entitate aktiboa:</span>
                  <select
                    aria-label="Hautatu entitate aktiboa"
                    value={activeEragilea?.id || ""}
                    onChange={(e) => {
                      setCurrentEragileId(e.target.value);
                      if (activeTab === "admin") {
                        setActiveTab("panela");
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-line bg-white text-ink font-bold text-xs focus:ring-2 focus:ring-sea/40 focus:outline-hidden cursor-pointer max-w-[220px]"
                  >
                    {eragileak.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.izena}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-ink-muted italic">Entitaterik ez</span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>

    {/* Mobile Fixed Bottom Navigation Bar (sibling outside <header> so backdrop-blur never traps fixed positioning) */}
    <nav
      aria-label="Nabigazio nagusia"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper/95 backdrop-blur-md border-t border-line pt-2 px-2 pb-safe flex items-center justify-around shadow-md print:hidden"
    >
      <button
        onClick={() => setActiveTab("panela")}
        className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-3 rounded-xl cursor-pointer ${
          activeTab === "panela" ? "text-sea font-bold bg-sand" : "text-ink-muted"
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Panela</span>
      </button>
      <button
        onClick={() => setActiveTab("katalogoa")}
        className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-3 rounded-xl cursor-pointer ${
          activeTab === "katalogoa" ? "text-sea font-bold bg-sand" : "text-ink-muted"
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span>Pilotuak</span>
      </button>
      <button
        onClick={() => setActiveTab("behaketa")}
        className={`flex flex-col items-center gap-0.5 text-[11px] font-bold py-1.5 px-4 rounded-xl bg-euskara text-white shadow-xs cursor-pointer ${
          activeTab === "behaketa" ? "ring-2 ring-euskara/40" : ""
        }`}
      >
        <Timer className="w-5 h-5" />
        <span>Neurtu</span>
      </button>
      {isAdmin && (
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium py-1 px-3 rounded-xl cursor-pointer ${
            activeTab === "admin" ? "text-sea font-bold bg-sand" : "text-ink-muted"
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Admin</span>
        </button>
      )}
    </nav>
    </>
  );
}
