import { describe, expect, it, vi } from 'vitest';
import { createAudioService } from '../src/game/audio/service';

class DeferredAudio {
  currentTime = 0;
  loop = false;
  preload = 'none';
  volume = 1;
  private readonly listeners = new Map<'ended' | 'error', Set<() => void>>();
  addEventListener(type: 'ended' | 'error', listener: () => void): void { this.listeners.set(type, new Set([...(this.listeners.get(type) ?? []), listener])); }
  removeEventListener(type: 'ended' | 'error', listener: () => void): void { this.listeners.get(type)?.delete(listener); }
  pause(): void {}
  play(): Promise<void> { return Promise.reject(new Error('decode failed')); }
  emit(type: 'ended' | 'error'): void { for (const listener of this.listeners.get(type) ?? []) listener(); }
}

describe('dialogue narration completion', () => {
  it('completes a failed voice playback once even if the element also reports an error', async () => {
    const audio = new DeferredAudio();
    const complete = vi.fn();
    const service = createAudioService({ createAudio: () => audio, localSpeech: null });
    service.configure({ voiceEnabled: true });

    const narration = service.narrateCaption('A cue fails cleanly.', { audioSrc: '/voice.mp3', onComplete: complete });
    audio.emit('error');
    await narration;

    expect(complete).toHaveBeenCalledOnce();
  });
});
