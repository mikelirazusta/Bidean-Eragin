// Web Audio API sound & distinct haptic vibration generator for blind observation counting
export function playCounterClick(
  type: "euskaraz" | "erdaraz" | "elebi" | "undo",
  options?: { soundEnabled?: boolean; vibrateEnabled?: boolean }
) {
  if (typeof window === "undefined") return;

  const soundEnabled =
    options?.soundEnabled !== undefined
      ? options.soundEnabled
      : localStorage.getItem("bidean_sound_enabled") === "true";

  const vibrateEnabled =
    options?.vibrateEnabled !== undefined ? options.vibrateEnabled : true;

  // 1. Distinct haptic vibration patterns so observer can count without looking at the screen
  try {
    if (vibrateEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
      if (type === "euskaraz") {
        navigator.vibrate([35]); // 1 ukitu sendo
      } else if (type === "erdaraz") {
        navigator.vibrate([22, 40, 22]); // 2 ukitu labur
      } else if (type === "elebi") {
        navigator.vibrate([18, 30, 18, 30, 18]); // 3 ukitu labur
      } else {
        navigator.vibrate([50]);
      }
    }
  } catch {
    // Ignore vibration errors
  }

  // 2. Optional audio feedback (muted by default in stealth/blind observation)
  if (!soundEnabled) return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "euskaraz") {
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "erdaraz") {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "elebi") {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      osc.frequency.setValueAtTime(250, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch {
    // Ignore audio errors gracefully
  }
}
