import { getInitialData } from "@/lib/db";
import MainClientApp from "@/components/MainClientApp";

export const dynamic = "force-dynamic";

export default function Home() {
  let initialData: ReturnType<typeof getInitialData> = {
    pilotuak: [],
    eragileak: [],
    esperimentuak: [],
    neurketak: [],
    nudges: [],
  };

  try {
    const data = getInitialData();
    if (data) {
      initialData = data;
    }
  } catch (err) {
    console.error("Errorea getInitialData deitzean:", err);
  }

  return <MainClientApp initialData={initialData} />;
}
