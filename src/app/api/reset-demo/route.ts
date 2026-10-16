import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST() {
  try {
    // Clear all dynamic data so user can start completely from scratch
    db.prepare("DELETE FROM neurketak").run();
    db.prepare("DELETE FROM esperimentuak").run();
    db.prepare("DELETE FROM nudges").run();
    db.prepare("DELETE FROM eragileak").run();
    db.prepare("DELETE FROM users WHERE role = 'eragilea'").run();

    return NextResponse.json({
      success: true,
      message: "Datu guztiak hustu dira arrakastaz. Aplikazioa 0tik hasteko prest dago!",
    });
  } catch (error) {
    console.error("Errorea datuak hustutzean:", error);
    return NextResponse.json(
      { success: false, error: "Ezin izan dira datuak hustu" },
      { status: 500 }
    );
  }
}
