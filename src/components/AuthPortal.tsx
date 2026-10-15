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

const ERRONKA_AUKERAK = [
  {
    id: "erronka-1",
    titulua: "Ikasleek badakite baina pasilloetan/aisialdian ez dute egiten",
    azpititulua: "Gelan erabiltzen dute baina espazio informaletan erdarara jotzen dute inertziaz.",
    mota: "ikastetxea",
  },
  {
    id: "erronka-2",
    titulua: "Dendan lehen hitza gaztelaniaz ateratzen zaigu",
    azpititulua: "Bezeroak euskaraz jakin arren, agurra eta hasiera automatikoki erdaraz egiten dira.",
    mota: "merkataritza",
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
  const { login, register } = useApp();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regIzena, setRegIzena] = useState("");
  const [regMota, setRegMota] = useState<"ikastetxea" | "merkataritza" | "enpresa" | "aisialdia">("ikastetxea");
  const [regArduraduna, setRegArduraduna] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regErronka, setRegErronka] = useState(ERRONKA_AUKERAK[0].titulua);
  const [customErronka, setCustomErronka] = useState("");

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

  const handleQuickAdminLogin = async () => {
    setLoginEmail("admin@bagera.eus");
    setLoginPassword("bagera2026");
    setErrorMessage("");
    setIsSubmitting(true);
    const result = await login("admin@bagera.eus", "bagera2026");
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.error || "Ezin izan da admin saioa hasi.");
    }
  };

  const handleRegStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!regIzena.trim()) {
      setErrorMessage("Zentroaren edo erakundearen izena beharrezkoa da.");
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
    });

    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.error || "Ezin izan da kontua sortu.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-slate-50 to-emerald-50/30 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand & Intro */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-teal-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Bidean Eragin
        </h1>
        <p className="mt-1 text-sm font-semibold text-emerald-800">
          Portaera-ekonomia eta esperimentazio arina
        </p>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Euskararen erabilera aktibatzeko tresna praktikoa. Jarraitu zure zentroaren aurrerapena eta neurketak.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80">
          
          {/* Tabs Switcher: Saioa Hasi vs Kontua Sortu */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage("");
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer ${
                activeTab === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Saioa Hasi
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMessage("");
                setRegStep(1);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer ${
                activeTab === "register"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Kontua Sortu (Eragile Berria)
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* ===================== TAB 1: SAIOA HASI ===================== */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Helbide elektronikoa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="adib. mikel@ikastola.eus"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pasahitza
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saioa hasten...</span>
                  ) : (
                    <>
                      <span>Sartu aplikazioan</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick switch to register */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setErrorMessage("");
                  }}
                  className="text-xs text-sky-700 hover:underline font-semibold cursor-pointer"
                >
                  Ez daukazu konturik oraindik? Sortu zure zentroaren kontua hemen →
                </button>
              </div>

              {/* Admin quick access helper */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Bagera / Mikel koordinatzailea?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAdminLogin}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 transition cursor-pointer text-[11px]"
                  >
                    Admin gisa sartu
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ===================== TAB 2: KONTUA SORTU ===================== */}
          {activeTab === "register" && (
            <div>
              {/* Stepper info */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {regStep === 1 ? "1/2 Urratsa: Zentroa & Kontua" : "2/2 Urratsa: Erronka Nagusia"}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {regStep === 1 ? "50%" : "100%"}
                </span>
              </div>

              {/* STEP 1: Center & Account Info */}
              {regStep === 1 && (
                <form onSubmit={handleRegStep1Submit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Zentroaren edo Erakundearen Izena *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regIzena}
                        onChange={(e) => setRegIzena(e.target.value)}
                        placeholder="adib. Santo Tomas Lizeoa, Eroski..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Zentro Mota *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "ikastetxea", label: "Ikastetxea", icon: GraduationCap },
                        { id: "merkataritza", label: "Merkataritza", icon: Store },
                        { id: "enpresa", label: "Enpresa", icon: Briefcase },
                        { id: "aisialdia", label: "Aisialdia / Elkartea", icon: Building2 },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = regMota === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => setRegMota(item.id as any)}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Arduradunaren Izen-Abizenak *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regArduraduna}
                        onChange={(e) => setRegArduraduna(e.target.value)}
                        placeholder="adib. Mikel Irazusta"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Helbide Elektronikoa (Saioa hasteko) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="adib. arloko.kidea@zentroa.eus"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Pasahitza *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Berretsi Pasahitza *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={regPasswordConfirm}
                        onChange={(e) => setRegPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Jarraitu Diagnostikora</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Fast Diagnosis / Challenge */}
              {regStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      Zein da zuen erronka nagusia?
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Aukeratu zure zentroko egoerara hurbilen dagoen portaera edo zehaztu zurea:
                    </p>

                    <div className="space-y-2.5">
                      {ERRONKA_AUKERAK.map((erronka) => {
                        const isSelected = regErronka === erronka.titulua && !customErronka.trim();
                        return (
                          <div
                            key={erronka.id}
                            onClick={() => {
                              setRegErronka(erronka.titulua);
                              setCustomErronka("");
                            }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start gap-3 ${
                              isSelected
                                ? "bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
                                : "bg-white border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <CheckCircle2
                                className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-300"}`}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-slate-900">{erronka.titulua}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{erronka.azpititulua}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom challenge textarea */}
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Edo idatzi zuen erronka pertsonalizatua:
                      </label>
                      <input
                        type="text"
                        value={customErronka}
                        onChange={(e) => setCustomErronka(e.target.value)}
                        placeholder="Adib. Ikasleek pasilloetan musika jarrita gaztelaniaz egiten dute..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atzera</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegisterSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Kontua sortzen...</span>
                      ) : (
                        <>
                          <span>Sortu Kontua & Hasi Bidean Eragiten</span>
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
