// Simple Web Audio API sound generator for tactile feedback during counting
export function playCounterClick(type: "euskaraz" | "erdaraz" | "elebi" | "undo") {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "euskaraz") {
      // Pleasant higher-pitch chime
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "erdaraz") {
      // Deeper click
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "elebi") {
      // Mid-tone tap
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      // Subtle undo click
      osc.frequency.setValueAtTime(250, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    }

    // Try device vibration if available
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(type === "euskaraz" ? [30] : [20]);
    }
  } catch {
    // Ignore audio errors gracefully on un-interacted browsers
  }
}
