import { NextResponse } from "next/server";
import {
  saveUiTexts,
  syncDbFromCloud,
  syncDbToCloud,
} from "@/lib/db";
import { getSessionFromCookies, requireAdmin } from "@/lib/auth";
import { getScopedBootstrapData } from "@/lib/scopedData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await syncDbFromCloud();
    const session = await getSessionFromCookies();
    const data = getScopedBootstrapData(session);

    return NextResponse.json(
      {
        success: true,
        authenticated: Boolean(session),
        data,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Errorea bootstrap datuak eskuratzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan dira datuak kargatu" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    await syncDbFromCloud();

    const body = await request.json();
    const { uiTexts, resetAll } = body;

    const updated = saveUiTexts(uiTexts || {}, Boolean(resetAll));
    await syncDbToCloud();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Errorea UI testuak gordetzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan dira testuak gorde" },
      { status: 500 }
    );
  }
}
