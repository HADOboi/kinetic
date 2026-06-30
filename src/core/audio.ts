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

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playSound(id: string, volume = 0.6): void {
  const src = SOUNDS[id];
  if (!src) return;
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {}
}

// Placeholder — real files dropped into /public/audio/sfx/
// App works silently if files missing (catch swallows error)
