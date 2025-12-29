
// A simple synth-based audio service to avoid external asset dependencies
// Uses Web Audio API to generate blips, explosions, and UI sounds.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentVolume = 0.3;

export const initAudio = () => {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = currentVolume; // Default volume
    masterGain.connect(audioCtx.destination);
};

export const setMasterVolume = (val: number) => {
    currentVolume = Math.max(0, Math.min(1, val));
    if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    }
};

export const getMasterVolume = () => {
    return currentVolume;
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 1) => {
    if (!audioCtx || !masterGain) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
};

const createNoise = (duration: number, vol: number = 1) => {
    if (!audioCtx || !masterGain) return;
    
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    noise.connect(gain);
    gain.connect(masterGain);
    
    noise.start();
};

export const playSound = (type: 'UI_HOVER' | 'UI_CLICK' | 'FIRE' | 'HIT' | 'EXPLODE' | 'ALARM') => {
    if (!audioCtx) initAudio(); // Try to init if not already
    if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx?.resume();
    }

    switch (type) {
        case 'UI_HOVER':
            createOscillator('sine', 400, 0.05, 0.1);
            break;
        case 'UI_CLICK':
            createOscillator('square', 800, 0.1, 0.1);
            break;
        case 'FIRE':
            // Pew pew
            {
                if (!audioCtx || !masterGain) return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.2);
            }
            break;
        case 'HIT':
            createNoise(0.1, 0.3);
            break;
        case 'EXPLODE':
            createNoise(1.0, 0.5);
            // Add low freq rumble
            createOscillator('sawtooth', 50, 0.8, 0.4);
            break;
        case 'ALARM':
            // Stagger or Alert sound (Heavy impact + Alarm)
            createOscillator('square', 1000, 0.3, 0.1);
            createNoise(0.2, 0.4); // Add impact crunch
            if (audioCtx && masterGain) {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sawtooth';
                osc2.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc2.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.4);
                gain2.gain.setValueAtTime(0.5, audioCtx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                osc2.connect(gain2);
                gain2.connect(masterGain);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.4);
            }
            break;
    }
};
