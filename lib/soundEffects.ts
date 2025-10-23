// Sound effects for the Sequence game
// Using Web Audio API for better performance and control

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Enable/disable sound effects
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Play a sound effect
  async playSound(soundType: 'cardPlay' | 'chipPlace' | 'chipRemove' | 'sequence' | 'win' | 'error' | 'notification') {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = await this.getSoundBuffer(soundType);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  // Generate sound buffers using Web Audio API
  private async getSoundBuffer(soundType: string): Promise<AudioBuffer | null> {
    if (this.sounds.has(soundType)) {
      return this.sounds.get(soundType)!;
    }

    if (!this.audioContext) return null;

    try {
      const buffer = this.generateSound(soundType);
      this.sounds.set(soundType, buffer);
      return buffer;
    } catch (error) {
      console.warn(`Error generating sound ${soundType}:`, error);
      return null;
    }
  }

  // Generate different types of sounds
  private generateSound(soundType: string): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5; // 500ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    switch (soundType) {
      case 'cardPlay':
        return this.generateCardPlaySound(buffer, data, sampleRate);
      case 'chipPlace':
        return this.generateChipPlaceSound(buffer, data, sampleRate);
      case 'chipRemove':
        return this.generateChipRemoveSound(buffer, data, sampleRate);
      case 'sequence':
        return this.generateSequenceSound(buffer, data, sampleRate);
      case 'win':
        return this.generateWinSound(buffer, data, sampleRate);
      case 'error':
        return this.generateErrorSound(buffer, data, sampleRate);
      case 'notification':
        return this.generateNotificationSound(buffer, data, sampleRate);
      default:
        return buffer;
    }
  }

  // Card play sound - soft click
  private generateCardPlaySound(buffer: AudioBuffer, data: Float32Array, sampleRate: number): AudioBuffer {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 800 + Math.sin(t * 20) * 100;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 8) * 0.3;
    }
    return buffer;
  }

  // Chip place sound - satisfying thud
  private generateChipPlaceSound(buffer: AudioBuffer, data: Float32Array, sampleRate: number): AudioBuffer {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 400 + Math.sin(t * 15) * 50;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 6) * 0.4;
    }
    return buffer;
  }

  // Chip remove sound - quick pop
  private generateChipRemoveSound(buffer: AudioBuffer, data: Float32Array, sampleRate: number): AudioBuffer {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 600 + Math.sin(t * 25) * 150;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 10) * 0.3;
    }
    return buffer;
  }

  // Sequence sound - ascending chime
  private generateSequenceSound(buffer: AudioBuffer, data: Float32Array, sampleRate: number): AudioBuffer {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 500 + t * 200; // Ascending frequency
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3) * 0.5;
    }
    return buffer;
  }

  // Win sound - celebratory fanfare
  private generateWinSound(buffer: AudioBuffer, data: Float32Array, sampleRate: number): AudioBuffer {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency1 = 523.25; // C5
      const frequency2 = 659.25; // E5
      const frequency3 = 783.99; // G5
      
      const wave1 = Math.sin(2 * Math.PI * frequency1 * t) * 0.3;
      const wave2 = Math.sin(2 * Math.PI * frequency2 * t) * 0.3;
      const wave3 = Math.sin(2 * Math.PI * frequency3 * t) * 0.3;
      
      data[i] = (wave1 + wave2 + wave3) * Math.exp(-t * 2) * 0.6;
    }
    return buffer;
  }

  // Error sound - low buzz
  private generateErrorSound(buffer: AudioBuffer, data: Float32Array, sampleRate: number): AudioBuffer {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 200 + Math.sin(t * 10) * 50;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 4) * 0.2;
    }
    return buffer;
  }

  // Notification sound - gentle ping
  private generateNotificationSound(buffer: AudioBuffer, data: Float32Array, sampleRate: number): AudioBuffer {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 1000 + Math.sin(t * 30) * 200;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 5) * 0.3;
    }
    return buffer;
  }
}

// Create a singleton instance
export const soundManager = new SoundManager();

// Convenience functions for common sound effects
export const playCardPlaySound = () => soundManager.playSound('cardPlay');
export const playChipPlaceSound = () => soundManager.playSound('chipPlace');
export const playChipRemoveSound = () => soundManager.playSound('chipRemove');
export const playSequenceSound = () => soundManager.playSound('sequence');
export const playWinSound = () => soundManager.playSound('win');
export const playErrorSound = () => soundManager.playSound('error');
export const playNotificationSound = () => soundManager.playSound('notification');

// Sound settings
export const setSoundEnabled = (enabled: boolean) => soundManager.setEnabled(enabled);
