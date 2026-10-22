import { NextResponse } from "next/server";
import {
  saveMaterialChunkToStore,
  getMaterialMetaFromStore,
  getMaterialChunkFromStore,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      izena,
      fitxategi_izena,
      mota,
      tamaina,
      chunkIndex = 0,
      totalChunks = 1,
      chunkData,
      sortze_data,
    } = body;

    if (!id || typeof chunkData !== "string") {
      return NextResponse.json(
        { success: false, error: "Fitxategiaren IDa eta datuak beharrezkoak dira." },
        { status: 400 }
      );
    }

    const ok = await saveMaterialChunkToStore({
      id: String(id),
      izena: String(izena || fitxategi_izena || "Materiala"),
      fitxategi_izena: String(fitxategi_izena || "dokumentua.pdf"),
      mota: String(mota || "application/pdf"),
      tamaina: Number(tamaina || 0),
      chunkIndex: Number(chunkIndex),
      totalChunks: Number(totalChunks),
      chunkData,
      sortze_data: sortze_data ? String(sortze_data) : new Date().toISOString(),
    });

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Ezin izan da fitxategiaren zatia hodeian gorde." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id,
      chunkIndex: Number(chunkIndex),
      totalChunks: Number(totalChunks),
      url: `/api/materialak?id=${encodeURIComponent(String(id))}`,
    });
  } catch (error) {
    console.error("Errorea materiala igotzean:", error);
    return NextResponse.json(
      { success: false, error: "Errorea fitxategia zerbitzarira igotzean." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const metaOnly = searchParams.get("meta") === "1";
    const chunkParam = searchParams.get("chunk");
    const isDownload = searchParams.get("download") === "1";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Materialaren IDa falta da." },
        { status: 400 }
      );
    }

    if (chunkParam !== null) {
      const chunkIdx = Number(chunkParam);
      const chunkData = await getMaterialChunkFromStore(id, chunkIdx);
      if (chunkData === null) {
        return NextResponse.json(
          { success: false, error: "Zatia ez da aurkitu." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        id,
        chunkIndex: chunkIdx,
        chunkData,
      });
    }

    const meta = await getMaterialMetaFromStore(id);

    if (metaOnly) {
      if (!meta) {
        return NextResponse.json(
          { success: false, error: "Materiala ez da aurkitu." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, meta });
    }

    const totalChunks = meta?.totalChunks || 1;
    const chunkPromises: Promise<string | null>[] = [];
    for (let i = 0; i < totalChunks; i++) {
      chunkPromises.push(getMaterialChunkFromStore(id, i));
    }

    const chunks = await Promise.all(chunkPromises);
    if (chunks.some((c) => c === null)) {
      return NextResponse.json(
        { success: false, error: "Fitxategia ez da osorik aurkitu." },
        { status: 404 }
      );
    }

    const fullBase64 = chunks.join("");
    const buffer = Buffer.from(fullBase64, "base64");
    const contentType = meta?.mota || "application/pdf";
    const safeFilename = (meta?.fitxategi_izena || "materiala.pdf").replace(/["\r\n]/g, "_");
    const disposition = isDownload
      ? `attachment; filename="${safeFilename}"`
      : `inline; filename="${safeFilename}"`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Errorea materiala eskuratzean:", error);
    return NextResponse.json(
      { success: false, error: "Errorea fitxategia eskuratzean." },
      { status: 500 }
    );
  }
}
