import { getInitialData } from "@/lib/db";
import MainClientApp from "@/components/MainClientApp";

export const dynamic = "force-dynamic";

export default function Home() {
  const initialData = getInitialData();
  return <MainClientApp initialData={initialData} />;
}
