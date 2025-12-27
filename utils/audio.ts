// Audio Utility for Synthesized Game Sound Effects
// Using Web Audio API to avoid loading external assets

let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, startTime: number, vol: number = 0.1) => {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
  
  return { osc, gain };
};

export const SoundFX = {
  // Initialize context on first user interaction
  init: () => {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();
  },

  // UI Click: Short, crisp high pop
  playClick: () => {
    const ctx = getContext();
    createOscillator('sine', 800, 0.1, ctx.currentTime, 0.05);
  },

  // Start Button: Heavy energetic confirm
  playStart: () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    createOscillator('square', 220, 0.2, t, 0.1);
    createOscillator('sine', 440, 0.4, t, 0.1);
    createOscillator('sine', 880, 0.6, t + 0.1, 0.05);
  },

  // Squat Down: "Loading" / "Charging" sound
  playSquatDown: () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    // Slide down pitch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  },

  // Good Rep: Satisfying "Coin" / "Ring" sound
  playRepComplete: () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    // Classic coin chime (B5 -> E6)
    createOscillator('sine', 987.77, 0.1, t, 0.1); // B5
    createOscillator('sine', 1318.51, 0.4, t + 0.05, 0.1); // E6
  },

  // Bad Rep / Failure: Low buzz
  playFailure: () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    createOscillator('sawtooth', 150, 0.3, t, 0.15);
    createOscillator('sawtooth', 120, 0.3, t, 0.15);
  },

  // Victory: Fanfare arpeggio
  playVictory: () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    // C Major Arpeggio rapidly
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      createOscillator('triangle', freq, 0.3, t + (i * 0.1), 0.1);
    });
    // Final sustained chord
    createOscillator('sine', 523.25, 1.5, t + 0.4, 0.05);
    createOscillator('sine', 1046.50, 1.5, t + 0.4, 0.05);
  },

  // Unlock Screen: Magical whoosh
  playUnlock: () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Sweep up
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.5);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.2);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }
};