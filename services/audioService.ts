
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  public isMuted: boolean = false;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.4;
    
    this.startWind();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : 0.4;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }

  private createOsc(type: OscillatorType, freq: number, dur: number, vol: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    
    // Add slight random pitch variance for natural feel
    const variance = (Math.random() * 0.1) - 0.05; // +/- 5%
    const finalFreq = freq * (1 + variance);

    osc.frequency.setValueAtTime(finalFreq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  playClick() { this.createOsc('sine', 800, 0.05, 0.05); }
  
  playGatherWood(pitchMult: number = 1) { 
    // Low wooden thud, pitch shifts with combo
    this.createOsc('square', 100 * pitchMult, 0.08, 0.1); 
  }
  
  playGatherFood(pitchMult: number = 1) { 
    // Squishy/sharp sound, pitch shifts with combo
    this.createOsc('triangle', 400 * pitchMult, 0.08, 0.08); 
  }

  playStoke() { 
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    // Fire woosh (noise)
    const dur = 0.6;
    const bufSize = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0; i<bufSize; i++) data[i] = Math.random() * 2 - 1;
    
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    // Lowpass sweep to simulate fire roar
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.2);
    filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + dur);
    
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    src.start();
  }

  playCraft() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    // Metallic clink
    this.createOsc('square', 1200, 0.05, 0.1);
    setTimeout(() => this.createOsc('sine', 1800, 0.1, 0.05), 50);
  }

  playEvent() {
    // Alert sound
    this.createOsc('sawtooth', 440, 0.3, 0.1);
    setTimeout(()=>this.createOsc('sawtooth', 880, 0.4, 0.1), 150);
  }

  playUpgrade() {
    // Ascending chime
    this.createOsc('sine', 440, 0.15, 0.1);
    setTimeout(() => this.createOsc('sine', 554, 0.15, 0.1), 100);
    setTimeout(() => this.createOsc('sine', 659, 0.3, 0.1), 200);
  }
  
  playJackpot() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    // Rapid high pitched sequence
    const now = this.ctx.currentTime;
    this.createOsc('square', 880, 0.1, 0.1);
    setTimeout(() => this.createOsc('square', 1100, 0.1, 0.1), 80);
    setTimeout(() => this.createOsc('square', 1320, 0.1, 0.1), 160);
    setTimeout(() => this.createOsc('square', 1760, 0.3, 0.1), 240);
    setTimeout(() => this.createOsc('sawtooth', 880, 0.4, 0.1), 320);
  }

  playAchievement() {
    // Victory fanfare short
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
       setTimeout(() => this.createOsc('square', freq, 0.1, 0.1), i * 50);
    });
    // Final chord
    setTimeout(() => {
        this.createOsc('triangle', 523.25, 0.4, 0.1);
        this.createOsc('triangle', 659.25, 0.4, 0.1);
        this.createOsc('triangle', 783.99, 0.4, 0.1);
    }, 200);
  }

  playDeath() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 2);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 2);
  }
  
  private startWind() {
    if (!this.ctx || !this.masterGain) return;
    // 5 seconds buffer looped
    const dur = 5;
    const bufSize = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0; i<bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5; // Pinkish noise amplitude
    
    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = buf;
    this.windNode.loop = true;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;
    
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.02; // Very quiet start
    
    this.windNode.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windNode.start();
  }
  
  setBlizzard(active: boolean) {
    if (this.windGain && this.ctx) {
      const target = active ? 0.3 : 0.05;
      this.windGain.gain.setTargetAtTime(target, this.ctx.currentTime, 2);
    }
  }
}

export const audioService = new AudioService();
