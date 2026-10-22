import { getInitialData, syncDbFromCloud } from "@/lib/db";
import MainClientApp from "@/components/MainClientApp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  let initialData: ReturnType<typeof getInitialData> = {
    pilotuak: [],
    eragileak: [],
    esperimentuak: [],
    neurketak: [],
    nudges: [],
    uiTexts: {},
  };

  try {
    await syncDbFromCloud();
    const data = getInitialData();
    if (data) {
      initialData = data;
    }
  } catch (err) {
    console.error("Errorea getInitialData deitzean:", err);
  }

  return <MainClientApp initialData={initialData} />;
}
