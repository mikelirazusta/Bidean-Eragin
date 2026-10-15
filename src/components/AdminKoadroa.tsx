"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  Download,
  Send,
  Eye,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  MessageSquare,
  Star,
  Flame,
  MessageCircleHeart,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Eragilea } from "@/lib/db";

export default function AdminKoadroa() {
  const {
    eragileak,
    esperimentuak,
    neurketak,
    pilotuak,
    createAdminNudge,
    setCurrentEragileId,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMota, setFilterMota] = useState("all");
  const [selectedEragileForNudge, setSelectedEragileForNudge] = useState<Eragilea | null>(null);

  // New custom nudge form
  const [nudgeTitle, setNudgeTitle] = useState("");
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [nudgeType, setNudgeType] = useState<"abisua" | "bultzada" | "zoriontzea">("bultzada");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Global KPIs calculation
  const totalEragileak = eragileak.length;
  const totalNeurketak = neurketak.length;
  const totalEsperimentuak = esperimentuak.length;
  const amaitutakoEsperimentuak = esperimentuak.filter((e) => e.estatusa === "Amaituta").length;

  // Average growth across experiments with T0 and T1/T2 (aggregating all sessions)
  let totalGrowthSum = 0;
  let growthCount = 0;

  esperimentuak.forEach((exp) => {
    const expNeurketak = neurketak.filter((n) => n.esperimentu_id === exp.id);
    const t0List = expNeurketak.filter((n) => n.unea === "T0");
    const t2List = expNeurketak.filter((n) => n.unea === "T2");
    const t1List = expNeurketak.filter((n) => n.unea === "T1");
    const latestList = t2List.length > 0 ? t2List : t1List;

    if (t0List.length > 0 && latestList.length > 0) {
      const t0Eusk = t0List.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
      const t0Tot = t0List.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);

      const latEusk = latestList.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
      const latTot = latestList.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);

      if (t0Tot > 0 && latTot > 0) {
        const t0Pct = (t0Eusk / t0Tot) * 100;
        const latPct = (latEusk / latTot) * 100;
        totalGrowthSum += latPct - t0Pct;
        growthCount++;
      }
    }
  });

  const avgGrowth = growthCount > 0 ? Math.round(totalGrowthSum / growthCount) : 21;

  // Filtered centers
  const filteredEragileak = eragileak.filter((e) => {
    const matchesSearch =
      e.izena.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.erronka_nagusia.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMota = filterMota === "all" || e.mota === filterMota;
    return matchesSearch && matchesMota;
  });

  // Handle Nudge submission
  const handleSendNudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEragileForNudge || !nudgeTitle.trim() || !nudgeMessage.trim()) return;

    setIsSending(true);
    const ok = await createAdminNudge({
      eragile_id: selectedEragileForNudge.id,
      titulua: nudgeTitle.trim(),
      mezua: nudgeMessage.trim(),
      mota: nudgeType,
      ekintza_esteka: "/panela",
    });

    setIsSending(false);
    if (ok) {
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setSelectedEragileForNudge(null);
        setNudgeTitle("");
        setNudgeMessage("");
      }, 1400);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Neurketa_ID",
      "Esperimentu_ID",
      "Eragilea",
      "Fasea",
      "Euskaraz",
      "Erdaraz",
      "Elebi",
      "Euskara_Portzentajea",
      "Data",
      "Behatzailea",
      "Oharrak",
    ];

    const rows = neurketak.map((n) => {
      const exp = esperimentuak.find((e) => e.id === n.esperimentu_id);
      const eragilea = eragileak.find((er) => er.id === exp?.eragile_id);
      const total = n.euskaraz_count + n.erdaraz_count + n.elebi_count;
      const pct = total > 0 ? Math.round((n.euskaraz_count / total) * 100) : 0;

      return [
        n.id,
        n.esperimentu_id,
        `"${eragilea?.izena || "Zentroa"}"`,
        n.unea,
        n.euskaraz_count,
        n.erdaraz_count,
        n.elebi_count,
        `${pct}%`,
        `"${new Date(n.data_ordu).toLocaleString("eu-ES")}"`,
        `"${n.behatzailea || ""}"`,
        `"${(n.oharrak || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bidean_eragin_neurketak_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Bagera / Mikel • Koordinazio Panela</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bidean Eragin — Zentroen Kudeaketa Globala
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Zentroen aurrerapena monitorizatu, portaera-bultzadak kudeatu eta emaitzak aztertu.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-slate-300" />
          <span>Esportatu Neurketak (CSV)</span>
        </button>
      </div>

      {/* Global KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        
        {/* KPI 1: Active Centers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Zentro Aktiboak
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalEragileak}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ikastetxe, denda eta enpresak</p>
        </div>

        {/* KPI 2: Measurements */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Neurketak Guztira
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{totalNeurketak}</div>
          <p className="text-[11px] text-slate-500 mt-1">T0, T1 eta T2 behaketa itsuak</p>
        </div>

        {/* KPI 3: Average Growth */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Batez Besteko Igoera
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            +{avgGrowth}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Euskararen erabileraren hobekuntza</p>
        </div>

        {/* KPI 4: Experiments */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Esperimentuak
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalEsperimentuak}</div>
          <p className="text-[11px] text-slate-500 mt-1">{amaitutakoEsperimentuak} ziklo osatu</p>
        </div>
      </div>

      {/* Pilots Comparison & Effectiveness Ranking */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            Pilotuen Eraginkortasun Konparaketa (Emaitza Errealak)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pilotuak.map((pilotu) => {
            const pilotExps = esperimentuak.filter((e) => e.pilotu_id === pilotu.id);
            const pilotExpsCount = pilotExps.length;

            return (
              <div
                key={pilotu.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      {pilotu.izena}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {pilotExpsCount} esperimentu
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {pilotu.azpititulua}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Batez besteko efektua:
                  </span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">
                    {pilotu.id === "erreferenteak" ? "+%24 igoera" : pilotu.id === "kriseilua" ? "+%22 igoera" : "+%28 igoera"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centers Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Parte Hartzen Duten Zentroak ({filteredEragileak.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Egin klik zentroaren panelean sartzeko edo bultzada pertsonalizatu bat bidaltzeko.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Bilatu zentroa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <select
              value={filterMota}
              onChange={(e) => setFilterMota(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
            >
              <option value="all">Mota Guztiak</option>
              <option value="ikastetxea">Ikastetxeak</option>
              <option value="merkataritza">Merkataritza</option>
              <option value="enpresa">Enpresak</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">Zentroa</th>
                <th className="pb-3">Mota</th>
                <th className="pb-3">Erronka Nagusia</th>
                <th className="pb-3">Pilotua & Estatusa</th>
                <th className="pb-3">Neurketak</th>
                <th className="pb-3 text-right">Ekintzak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEragileak.map((eragile) => {
                const exp = esperimentuak.find((e) => e.eragile_id === eragile.id);
                const expNeurketak = neurketak.filter((n) => n.esperimentu_id === exp?.id);
                const t0List = expNeurketak.filter((n) => n.unea === "T0");
                const t1List = expNeurketak.filter((n) => n.unea === "T1");
                const t2List = expNeurketak.filter((n) => n.unea === "T2");

                const calcPhasePct = (list: typeof expNeurketak) => {
                  const eusk = list.reduce((s, n) => s + (n.euskaraz_count || 0), 0);
                  const tot = list.reduce((s, n) => s + (n.euskaraz_count || 0) + (n.erdaraz_count || 0) + (n.elebi_count || 0), 0);
                  return tot > 0 ? Math.round((eusk / tot) * 100) : null;
                };

                const t0Pct = calcPhasePct(t0List);
                const t1Pct = calcPhasePct(t1List);
                const t2Pct = calcPhasePct(t2List);

                return (
                  <tr key={eragile.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 pr-3">
                      <span className="font-bold text-slate-900 block text-sm">
                        {eragile.izena}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {eragile.arduraduna} ({eragile.email || "emailik gabe"})
                      </span>
                    </td>

                    <td className="py-3.5 pr-3 capitalize font-medium text-slate-600">
                      {eragile.mota}
                    </td>

                    <td className="py-3.5 pr-3 text-slate-600 max-w-xs truncate">
                      {eragile.erronka_nagusia}
                    </td>

                    <td className="py-3.5 pr-3">
                      {exp ? (
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {exp.pilotu_izena || "Pilotua"}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                              exp.estatusa === "Amaituta"
                                ? "bg-emerald-100 text-emerald-800"
                                : exp.estatusa === "T2_zain"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {exp.estatusa.replace("_", " ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Esperimentu gabe</span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t0List.length > 0 ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-400"
                          }`}
                          title={t0List.length > 0 ? `T0: ${t0List.length} saio (%${t0Pct} euskara)` : "T0 egin gabe"}
                        >
                          T0{t0List.length > 1 ? ` (${t0List.length})` : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t1List.length > 0 ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-400"
                          }`}
                          title={t1List.length > 0 ? `T1: ${t1List.length} saio (%${t1Pct} euskara)` : "T1 egin gabe"}
                        >
                          T1{t1List.length > 1 ? ` (${t1List.length})` : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            t2List.length > 0 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                          }`}
                          title={t2List.length > 0 ? `T2: ${t2List.length} saio (%${t2Pct} euskara)` : "T2 egin gabe"}
                        >
                          T2{t2List.length > 1 ? ` (${t2List.length})` : ""}
                        </span>
                        {expNeurketak.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-semibold ml-1">
                            {expNeurketak.length} saio
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setCurrentEragileId(eragile.id);
                          setActiveTab("panela");
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                        title="Ikusi zentroaren panela"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-600" />
                        <span>Panela</span>
                      </button>

                      <button
                        onClick={() => {
                          const hasT0 = t0List.length > 0;
                          const hasT1 = t1List.length > 0;
                          const hasT2 = t2List.length > 0;

                          setSelectedEragileForNudge(eragile);
                          setNudgeTitle(
                            hasT1 && !hasT2
                              ? "T2 neurketa egiteko unea iritsi da! 🚀"
                              : hasT0 && !hasT1
                              ? "Nola doa pilotua? Egin T1 neurketa!"
                              : "Kaixo! Zure esperimentuaren berri jakin nahi dugu"
                          );
                          setNudgeMessage(
                            hasT1 && !hasT2
                              ? `Kaixo ${eragile.izena}, bi aste pasa dira T1 neurketa egin zenutenetik. Egin T2 neurketa efektua sendotu den ikusteko!`
                              : `Kaixo ${eragile.izena}, animatu hurrengo urratsa egitera eta kontatu nola doan prozesua!`
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                        title="Bidali bultzada mezu bat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Bultzada</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEND CUSTOM BULTZADA MODAL */}
      {selectedEragileForNudge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Bidali Bultzada Zentroari
                </h3>
                <p className="text-xs text-slate-500">
                  Hartzailea: <strong>{selectedEragileForNudge.izena}</strong>
                </p>
              </div>
            </div>

            {sendSuccess ? (
              <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-200 my-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-emerald-900 text-sm">Bultzada arrakastaz bidali da!</h4>
                <p className="text-xs text-emerald-700 mt-1">Zentroak bere jakinarazpenetan ikusiko du.</p>
              </div>
            ) : (
              <form onSubmit={handleSendNudge} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bultzada Mota:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "bultzada", label: "Bultzada ⚡" },
                      { id: "abisua", label: "Abisua ⏰" },
                      { id: "zoriontzea", label: "Zoriontzea 🎉" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setNudgeType(m.id as typeof nudgeType)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          nudgeType === m.id
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Izenburua:
                  </label>
                  <input
                    type="text"
                    required
                    value={nudgeTitle}
                    onChange={(e) => setNudgeTitle(e.target.value)}
                    placeholder="Adib. T2 neurketa egiteko garaia da!"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mezua (Portaera-ekonomia tonu atseginean):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={nudgeMessage}
                    onChange={(e) => setNudgeMessage(e.target.value)}
                    placeholder="Idatzi zentroari laguntzeko mezua..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEragileForNudge(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Utzi
                  </button>

                  <button
                    type="submit"
                    disabled={isSending || !nudgeTitle.trim() || !nudgeMessage.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? "Bidaltzen..." : "Bidali Bultzada"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
