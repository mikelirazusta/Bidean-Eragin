"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  GraduationCap,
  Store,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import BideanLogo from "@/components/BideanLogo";

const ERRONKA_AUKERAK = [
  {
    id: "erronka-2",
    titulua: "Dendan lehen hitza gaztelaniaz ateratzen zaigu",
    azpititulua: "Bezeroak euskaraz jakin arren, agurra eta hasiera automatikoki erdaraz egiten dira.",
    mota: "merkataritza",
  },
  {
    id: "erronka-5",
    titulua: "Bezeroak ez daki langileak euskaraz badakien ala ez",
    azpititulua: "Zalantza horren aurrean, bezeroak gaztelaniara jotzen du zuzenean segurtasun faltagatik.",
    mota: "merkataritza",
  },
  {
    id: "erronka-1",
    titulua: "Ikasleek badakite baina pasilloetan/aisialdian ez dute egiten",
    azpititulua: "Gelan erabiltzen dute baina espazio informaletan erdarara jotzen dute inertziaz.",
    mota: "ikastetxea",
  },
  {
    id: "erronka-3",
    titulua: "Bileretan eta kafe-gunean erdararako inertzia handia dugu",
    azpititulua: "Lantaldean euskaldunak egon arren, batzar formaletan eta atsedenean gaztelania nagusitzen da.",
    mota: "enpresa",
  },
  {
    id: "erronka-4",
    titulua: "Lagunartean eta aisialdian erdara da ohiko hizkuntza",
    azpititulua: "Euskaraz eroso sentitu arren, lagun taldean erdarazko ohitura errotuta dago.",
    mota: "aisialdia",
  },
];

export default function AuthPortal() {
  const { login, register, uiTexts } = useApp();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state (never pre-fill password for public security)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regIzena, setRegIzena] = useState("");
  const [regMota, setRegMota] = useState<"ikastetxea" | "merkataritza" | "enpresa" | "aisialdia">("merkataritza");
  const [regArduraduna, setRegArduraduna] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regErronka, setRegErronka] = useState(ERRONKA_AUKERAK[0].titulua);
  const [customErronka, setCustomErronka] = useState("");
  const [regPublikoa, setRegPublikoa] = useState<boolean>(false);

  const sortedErronkak = [
    ...ERRONKA_AUKERAK.filter((e) => e.mota === regMota),
    ...ERRONKA_AUKERAK.filter((e) => e.mota !== regMota),
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage("Mesedez, bete posta elektronikoa eta pasahitza.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(loginEmail.trim(), loginPassword.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || "Ezin izan da saioa hasi.");
    }
  };

  const handleRegStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!regIzena.trim()) {
      setErrorMessage("Entitatearen izena beharrezkoa da.");
      return;
    }
    if (!regArduraduna.trim()) {
      setErrorMessage("Arduradunaren izen-abizenak beharrezkoak dira.");
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage("Helbide elektronikoa beharrezkoa da.");
      return;
    }
    if (regPassword.length < 4) {
      setErrorMessage("Pasahitzak gutxienez 4 karaktere izan behar ditu.");
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setErrorMessage("Pasahitzak ez datoz bat. Egiaztatu berriro.");
      return;
    }

    setRegStep(2);
  };

  const handleRegisterSubmit = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    const finalErronka = customErronka.trim() ? customErronka.trim() : regErronka;

    const result = await register({
      izena: regIzena.trim(),
      mota: regMota,
      arduraduna: regArduraduna.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      erronka_nagusia: finalErronka,
      publikoa: regPublikoa ? 1 : 0,
    });

    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.error || "Ezin izan da kontua sortu.");
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-8 sm:px-6 lg:px-8">
      {/* Brand & Intro */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center px-4">
        <BideanLogo size="lg" className="mx-auto mb-3 shadow-xs" />
        <h1 className="font-editorial text-4xl font-semibold text-ink tracking-tight">
          {uiTexts.app_title || "Bidean Eragin"}
        </h1>
        <p className="mt-1 text-sm font-semibold text-euskara">
          {uiTexts.app_subtitle || "Portaera-ekonomia eta esperimentazio arina • Bagera"}
        </p>
        <p className="mt-1.5 text-xs sm:text-sm text-ink-muted">
          {uiTexts.auth_intro || "Euskararen erabilera aktibatzeko tresna praktikoa."}
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-7 px-6 sm:px-9 rounded-2xl border border-line">
          {/* Unified Tabs Switcher: Saioa hasi vs Kontua sortu */}
          <div className="grid grid-cols-2 gap-1.5 bg-sand p-1.5 rounded-xl mb-6 border border-line">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage("");
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === "login"
                  ? "bg-white text-ink border border-line shadow-2xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Saioa hasi
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMessage("");
                setRegStep(1);
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === "register"
                  ? "bg-euskara text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Kontua sortu
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/30 flex items-start gap-2.5 text-xs sm:text-sm text-terracotta animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* ===================== TAB 1: UNIFIED LOGIN (ENTITATEAK + KOORDINAZIOA) ===================== */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Helbide elektronikoa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="adib. kaixo@entitatea.eus"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line bg-paper/40 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sea/40 focus:border-sea text-sm text-ink transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Pasahitza
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-line bg-paper/40 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sea/40 focus:border-sea text-sm text-ink transition"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ezkutatu pasahitza" : "Erakutsi pasahitza"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-sea hover:opacity-95 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saioa hasten...</span>
                  ) : (
                    <>
                      <span>Sartu</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-ink-muted text-center pt-1">
                Entitateak zein Bagera koordinazioa kontu beretik sartzen dira.
              </p>
            </form>
          )}

          {/* ===================== TAB 2: KONTUA SORTU ===================== */}
          {activeTab === "register" && (
            <div>
              {/* Stepper info */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  {regStep === 1 ? "1/2 urratsa: entitatea eta kontua" : "2/2 urratsa: erronka eta pribatutasuna"}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-euskara/15 text-euskara">
                  {regStep === 1 ? "50%" : "100%"}
                </span>
              </div>

              {/* STEP 1: Center & Account Info */}
              {regStep === 1 && (
                <form onSubmit={handleRegStep1Submit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Entitatearen izena *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regIzena}
                        onChange={(e) => setRegIzena(e.target.value)}
                        placeholder="adib. Zurriola Ikastola, Kaxilda, Bretxako Harategia..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line focus:outline-hidden focus:ring-2 focus:ring-euskara/40 text-sm transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Entitate mota *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "merkataritza", label: "Merkataritza / Ostalaritza", icon: Store },
                        { id: "ikastetxea", label: "Ikastetxea", icon: GraduationCap },
                        { id: "enpresa", label: "Enpresa / Lan-gunea", icon: Briefcase },
                        { id: "aisialdia", label: "Aisialdia / Elkartea", icon: Building2 },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = regMota === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              setRegMota(item.id as any);
                              const matching = ERRONKA_AUKERAK.find((e) => e.mota === item.id);
                              if (matching) setRegErronka(matching.titulua);
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                              isSelected
                                ? "bg-euskara/10 border-emerald-500 text-euskara shadow-xs"
                                : "bg-white border-line text-ink-muted hover:bg-paper"
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-euskara" : "text-ink-muted"}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Arduradunaren izen-abizenak *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regArduraduna}
                        onChange={(e) => setRegArduraduna(e.target.value)}
                        placeholder="adib. Ane Etxeberria"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line focus:outline-hidden focus:ring-2 focus:ring-euskara/40 text-sm transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Helbide elektronikoa (saioa hasteko) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="adib. kaixo@entitatea.eus"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line focus:outline-hidden focus:ring-2 focus:ring-euskara/40 text-sm transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                        Pasahitza *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line focus:outline-hidden focus:ring-2 focus:ring-euskara/40 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                        Berretsi pasahitza *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={regPasswordConfirm}
                        onChange={(e) => setRegPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line focus:outline-hidden focus:ring-2 focus:ring-euskara/40 text-sm transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Jarraitu erronka eta pribatutasunera</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Fast Diagnosis & Privacy (No Forced Hypothesis) */}
              {regStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-ink mb-1 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-euskara" />
                      1. Zein da zuen erronka nagusia?
                    </h3>
                    <p className="text-xs text-ink-muted mb-2.5">
                      Aukeratu zure entitateko egoerara hurbilen dagoen portaera:
                    </p>

                    <div className="space-y-2">
                      {sortedErronkak.map((erronka) => {
                        const isSelected = regErronka === erronka.titulua && !customErronka.trim();
                        return (
                          <div
                            key={erronka.id}
                            onClick={() => {
                              setRegErronka(erronka.titulua);
                              setCustomErronka("");
                            }}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-start gap-2.5 ${
                              isSelected
                                ? "bg-euskara/10/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
                                : "bg-white border-line hover:bg-paper"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <CheckCircle2
                                className={`w-4 h-4 ${isSelected ? "text-euskara" : "text-slate-300"}`}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-ink">{erronka.titulua}</p>
                              <p className="text-[11px] text-ink-muted mt-0.5">{erronka.azpititulua}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom challenge input */}
                    <div className="mt-2.5">
                      <label className="block text-xs font-semibold text-ink-muted mb-1">
                        Edo idatzi zuen erronka pertsonalizatua:
                      </label>
                      <input
                        type="text"
                        value={customErronka}
                        onChange={(e) => setCustomErronka(e.target.value)}
                        placeholder="Adib. Harreran lehen hitza gaztelaniaz egiten da..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-line focus:outline-hidden focus:ring-2 focus:ring-euskara/40 transition"
                      />
                    </div>
                  </div>

                  {/* Privacy Choice */}
                  <div className="bg-paper border border-line rounded-2xl p-3.5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regPublikoa}
                        onChange={(e) => setRegPublikoa(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-line text-euskara focus:ring-euskara/40"
                      />
                      <div>
                        <span className="block text-xs font-bold text-ink">
                          2. Erakutsi nire entitatearen izena komunitateko beste eragileei
                        </span>
                        <span className="block text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                          Markatu gabe uzten baduzu (lehenetsia), beste eragileek kode anonimo bat bakarrik ikusiko dute (adib. <strong>Entitatea #4821</strong>). Edonoiz alda dezakezu zure panelean.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-line text-xs font-bold text-ink hover:bg-paper transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atzera</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegisterSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 rounded-xl bg-euskara hover:opacity-95 text-white font-bold text-sm shadow-md shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Kontua sortzen...</span>
                      ) : (
                        <>
                          <span>Sortu kontua eta sartu panelera</span>
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
