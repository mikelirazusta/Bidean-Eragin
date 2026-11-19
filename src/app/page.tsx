import { syncDbFromCloud } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { getScopedBootstrapData, type ScopedBootstrapData } from "@/lib/scopedData";
import MainClientApp from "@/components/MainClientApp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  let initialData: ScopedBootstrapData = {
    pilotuak: [],
    eragileak: [],
    esperimentuak: [],
    neurketak: [],
    nudges: [],
    uiTexts: {},
  };

  try {
    await syncDbFromCloud();
    const session = await getSessionFromCookies();
    initialData = getScopedBootstrapData(session);
  } catch (err) {
    console.error("Errorea hasierako datuak kargatzean:", err);
  }

  return <MainClientApp initialData={initialData} />;
}
