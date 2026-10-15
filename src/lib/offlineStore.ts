// Offline-First Storage and Background Synchronization Engine
// Manages local persistence for observation sessions and snapshot data when offline

export interface PendingNeurketa {
  id: string;
  esperimentu_id: string;
  unea: "T0" | "T1" | "T2";
  euskaraz_count: number;
  erdaraz_count: number;
  elebi_count: number;
  iraupena_segundotan: number;
  oharrak: string;
  behatzailea: string;
  data_ordu: string;
  is_offline: boolean;
}

const PENDING_NEURKETAK_KEY = "bidean_eragin_pending_neurketak";
const CACHED_DATA_KEY = "bidean_eragin_cached_bootstrap";

// ================= PENDING OFFLINE MEASUREMENTS QUEUE =================

export function getPendingNeurketak(): PendingNeurketa[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_NEURKETAK_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingNeurketa[];
  } catch (e) {
    console.error("Errorea lineaz kanpoko neurketak irakurtzean:", e);
    return [];
  }
}

export function savePendingNeurketa(data: Omit<PendingNeurketa, "id" | "is_offline" | "data_ordu">): PendingNeurketa {
  const pending = getPendingNeurketak();
  const newPending: PendingNeurketa = {
    ...data,
    id: "offline-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
    data_ordu: new Date().toISOString(),
    is_offline: true,
  };

  pending.push(newPending);
  try {
    localStorage.setItem(PENDING_NEURKETAK_KEY, JSON.stringify(pending));
  } catch (e) {
    console.error("Errorea lineaz kanpoko neurketa gordetzean:", e);
  }

  return newPending;
}

export function removePendingNeurketa(id: string): void {
  const pending = getPendingNeurketak().filter((item) => item.id !== id);
  try {
    localStorage.setItem(PENDING_NEURKETAK_KEY, JSON.stringify(pending));
  } catch (e) {
    console.error("Errorea sinkronizatutako neurketa kentzean:", e);
  }
}

export function clearPendingNeurketak(): void {
  try {
    localStorage.removeItem(PENDING_NEURKETAK_KEY);
  } catch (e) {
    console.error("Errorea ilara garbitzean:", e);
  }
}

// ================= BOOTSTRAP DATA SNAPSHOT CACHING =================

export function saveCachedBootstrapData(data: any): void {
  if (typeof window === "undefined" || !data) return;
  try {
    localStorage.setItem(
      CACHED_DATA_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (e) {
    console.warn("Ezin izan da tokiko snapshot-a gorde:", e);
  }
}

export function getCachedBootstrapData(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHED_DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch (e) {
    console.warn("Ezin izan da tokiko snapshot-a irakurri:", e);
    return null;
  }
}

// ================= SYNC ALL PENDING MEASUREMENTS TO SERVER =================

export async function syncPendingNeurketak(): Promise<{
  syncedCount: number;
  remainingCount: number;
  errors: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { syncedCount: 0, remainingCount: getPendingNeurketak().length, errors: 0 };
  }

  const queue = getPendingNeurketak();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0, errors: 0 };
  }

  let syncedCount = 0;
  let errors = 0;

  for (const item of queue) {
    try {
      const res = await fetch("/api/neurketak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          esperimentu_id: item.esperimentu_id,
          unea: item.unea,
          euskaraz_count: item.euskaraz_count,
          erdaraz_count: item.erdaraz_count,
          elebi_count: item.elebi_count,
          iraupena_segundotan: item.iraupena_segundotan,
          oharrak: item.oharrak ? `${item.oharrak} [Lineaz kanpo jasota]` : "[Lineaz kanpo jasota]",
          behatzailea: item.behatzailea,
        }),
      });

      const json = await res.json();
      if (json.success) {
        removePendingNeurketa(item.id);
        syncedCount++;
      } else {
        errors++;
      }
    } catch (err) {
      console.warn("Errorea saioa sinkronizatzean:", err);
      errors++;
      break; // Stop if network fails mid-sync
    }
  }

  return {
    syncedCount,
    remainingCount: getPendingNeurketak().length,
    errors,
  };
}
