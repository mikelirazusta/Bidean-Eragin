"use client";

import React, { useState } from "react";
import {
  Sparkles,
  GraduationCap,
  Store,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Award,
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

export default function OnboardingView() {
  const { registerEragilea } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [izena, setIzena] = useState("");
  const [arduraduna, setArduraduna] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mota, setMota] = useState<"ikastetxea" | "merkataritza" | "enpresa" | "aisialdia">("ikastetxea");
  const [erronkaNagusia, setErronkaNagusia] = useState(ERRONKA_AUKERAK[0].titulua);
  const [customErronka, setCustomErronka] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!izena.trim()) return;
    setStep(2);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    const finalErronka = customErronka.trim() ? customErronka.trim() : erronkaNagusia;

    const res = await registerEragilea({
      izena: izena.trim(),
      arduraduna: arduraduna.trim() || "Arduraduna",
      email: email.trim(),
      password: password.trim() || "bidean123",
      mota,
      erronka_nagusia: finalErronka,
    });

    setIsSubmitting(false);
    if (res) {
      // automatically redirected via context to 'katalogoa'
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Portaera-aldaketak & Esperimentazio arina</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Eman izena & Aktibatu Euskara
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Zure zentroak hipotesiak sortu, behaketa itsuak egin eta emaitzetan oinarritutako portaera-aldaketak bultzatuko ditu.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              step === 1
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            <span>1. Zentroaren Datuak</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-200"></div>
          <div
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              step === 2
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <span>2. Diagnostiko Azkarra</span>
          </div>
        </div>
      </div>

      {/* Step 1: Organization details */}
      {step === 1 && (
        <form
          onSubmit={handleNextStep}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 transition"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Zentroaren Izena <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={izena}
                onChange={(e) => setIzena(e.target.value)}
                placeholder="Adibidez: Santo Tomas Lizeoa, Kaxilda Denda, CAF..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 text-sm shadow-xs transition"
              />
            </div>

            {/* Center type selection */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Zentro Mota <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: "ikastetxea", label: "Ikastetxea", icon: GraduationCap },
                  { id: "merkataritza", label: "Merkataritza", icon: Store },
                  { id: "enpresa", label: "Enpresa", icon: Briefcase },
                  { id: "aisialdia", label: "Aisialdia", icon: Award },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = mota === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMota(item.id as typeof mota)}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? "bg-sky-50 border-sky-500 text-sky-800 shadow-xs ring-1 ring-sky-500"
                          : "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/60"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-sky-600" : "text-slate-500"}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Arduradunaren Izena
                </label>
                <input
                  type="text"
                  value={arduraduna}
                  onChange={(e) => setArduraduna(e.target.value)}
                  placeholder="Zure izen-abizenak"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Helbide Elektronikoa
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adibidea@zentroa.eus"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Pasahitza (Kontua sortzeko)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Gutxienez 4 karaktere"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 text-sm"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={!izena.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <span>Jarraitu Diagnostikora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Step 2: Quick Diagnostic */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 transition">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-sky-600" />
              Zein da zuen erronka nagusia?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Hautatu zuen zentroko egoerara gehien hurbiltzen den portaera-arazoa:
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {ERRONKA_AUKERAK.map((aukera) => {
              const isSelected = erronkaNagusia === aukera.titulua && !customErronka;
              return (
                <div
                  key={aukera.id}
                  onClick={() => {
                    setErronkaNagusia(aukera.titulua);
                    setCustomErronka("");
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? "bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {aukera.titulua}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {aukera.azpititulua}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Custom Challenge write-in */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Edo idatzi zuen erronka propioa (nahi baduzue):
              </label>
              <textarea
                value={customErronka}
                onChange={(e) => setCustomErronka(e.target.value)}
                placeholder="Idatzi hemen zuen erronka zehatza..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Itzuli atzera
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <span>{isSubmitting ? "Gordetzen..." : "Bikain, Sortu Zentroa & Ikusi Pilotuak!"}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
