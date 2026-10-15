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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(isAdmin && userRole === "admin" ? "admin" : "panela")}
              className="flex items-center gap-2.5 text-left group transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">
                    Bidean Eragin
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                    Portaera-bultzadak
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden md:block">
                  Euskararen aktibazio zientifikoa
                </p>
              </div>
            </button>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("panela")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "panela"
                  ? "bg-slate-100 text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Panela
            </button>

            <button
              onClick={() => setActiveTab("katalogoa")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === "katalogoa"
                  ? "bg-slate-100 text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Pilotuak
            </button>

            <button
              onClick={() => setActiveTab("behaketa")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeTab === "behaketa"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Timer className="w-4 h-4" />
              Behatzaile Itsua
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Koadroa
              </button>
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

            {/* If Admin: Role Switcher & Center Selector */}
            {isAdmin && (
              <>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => {
                      setUserRole("eragilea");
                      if (activeTab === "admin") setActiveTab("panela");
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      userRole === "eragilea"
                        ? "bg-white text-sky-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Zentroko kidearen ikuspegia"
                  >
                    <span>Zentroa</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserRole("admin");
                      setActiveTab("admin");
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      userRole === "admin"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Bagera / Mikel Admin koadroa"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowCenterMenu(!showCenterMenu)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer max-w-[150px] sm:max-w-[180px]"
                  >
                    {activeEragilea && getMotaIcon(activeEragilea.mota)}
                    <span className="truncate">
                      {activeEragilea ? activeEragilea.izena : "Hautatu zentroa"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {showCenterMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Aukeratu Zentroa (Admin)
                      </div>
                      {eragileak.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => {
                            setCurrentEragileId(e.id);
                            setShowCenterMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                            e.id === currentEragileId
                              ? "bg-sky-50 font-semibold text-sky-800"
                              : "text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {getMotaIcon(e.mota)}
                            <span className="truncate">{e.izena}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {e.mota}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
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
                        Bultzadak eta Gogorarazpenak
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
                                  if (nudge.ekintza_esteka?.includes("behaketa")) {
                                    setActiveTab("behaketa");
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

        {/* Methodology Flow Stepper Bar (Desktop & Tablet) */}
        <div className="hidden md:flex items-center justify-between py-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mr-1">
              Metodologia Zikloa:
            </span>

            <button
              onClick={() => setActiveTab("katalogoa")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeTab === "katalogoa"
                  ? "bg-sky-100 text-sky-800 font-bold"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <span>1. Pilotuak & Hipotesia</span>
            </button>
            <span className="text-slate-300">→</span>

            <button
              onClick={() => setActiveTab("behaketa")}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === "behaketa"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>2. Behatzaile Itsua (T0/T1/T2)</span>
            </button>
            <span className="text-slate-300">→</span>

            <button
              onClick={() => setActiveTab("panela")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeTab === "panela"
                  ? "bg-sky-100 text-sky-800 font-bold"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <span>3. Emaitzak & Bultzadak</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            {isAdmin ? (
              <>
                <span className="text-slate-400 font-semibold mr-1">Zentroak:</span>
                {eragileak.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setCurrentEragileId(e.id);
                      setActiveTab("panela");
                    }}
                    className={`px-2 py-0.5 rounded-md border font-bold transition cursor-pointer truncate max-w-[130px] ${
                      currentEragileId === e.id
                        ? "bg-sky-100 border-sky-400 text-sky-800 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {e.izena}
                  </button>
                ))}
              </>
            ) : activeEragilea ? (
              <span className="text-slate-700 font-bold bg-white border border-slate-200 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                {getMotaIcon(activeEragilea.mota)}
                <span>{activeEragilea.izena}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="lg:hidden border-t border-slate-200 py-2 flex items-center justify-around">
          <button
            onClick={() => setActiveTab("panela")}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 rounded-lg cursor-pointer ${
              activeTab === "panela" ? "text-sky-700 font-bold" : "text-slate-500"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Panela
          </button>
          <button
            onClick={() => setActiveTab("katalogoa")}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 rounded-lg cursor-pointer ${
              activeTab === "katalogoa" ? "text-sky-700 font-bold" : "text-slate-500"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Pilotuak
          </button>
          <button
            onClick={() => setActiveTab("behaketa")}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-3 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 cursor-pointer ${
              activeTab === "behaketa" ? "scale-105" : ""
            }`}
          >
            <Timer className="w-5 h-5" />
            Kontagailua
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 rounded-lg cursor-pointer ${
                activeTab === "admin" ? "text-indigo-600 font-bold" : "text-slate-500"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              Admin
            </button>
          )}
          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 rounded-lg text-rose-600 hover:text-rose-800 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Itxi
          </button>
        </div>
      </div>
    </header>
  );
}
