const SOUNDS: Record<string, string> = {
  fire_lit_standard:  "/audio/sfx/fire_lit_standard.mp3",
  fire_lit_unfreeze:  "/audio/sfx/fire_lit_unfreeze.mp3",
  streak_vaporize:    "/audio/sfx/streak_vaporize.mp3",
  shield_add_metal:   "/audio/sfx/shield_add_metal.mp3",
  eternal_unlock:     "/audio/sfx/eternal_unlock.mp3",
  monster_alert:      "/audio/sfx/monster_alert.mp3",
  beast_activated:    "/audio/sfx/beast_activated.mp3",
  timer_bell:         "/audio/sfx/timer_bell.mp3",
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

// Synthesize pleasant chime using Web Audio API as reliable audio fallback
function playSynthesizedChime(freq = 880, duration = 0.6) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Synthesized chime error:", e);
  }
}

export function playSound(id: string, volume = 0.6): void {
  const src = SOUNDS[id];
  let playedFile = false;

  if (src) {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            playedFile = true;
          })
          .catch(() => {
            // Audio file missing or blocked -> use synthesizer fallback
            playSynthesizedChime(id === "timer_bell" ? 987.77 : 587.33);
          });
      }
    } catch {
      playSynthesizedChime(id === "timer_bell" ? 987.77 : 587.33);
    }
  } else {
    playSynthesizedChime(id === "timer_bell" ? 987.77 : 587.33);
  }
}
