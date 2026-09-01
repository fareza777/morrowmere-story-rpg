import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CinematicAudioPort, CinematicSequence } from '../../ui/types';

export type CinematicPlayerStatus = 'preloading' | 'playing' | 'paused' | 'complete' | 'fallback';

export interface CinematicPlayer {
  readonly status: CinematicPlayerStatus;
  readonly positionMs: number;
  readonly shotIndex: number;
  readonly runId: number;
  readonly audioUnavailable: boolean;
  pause(): void;
  resume(): void;
  retryAudio(): void;
  replay(): void;
  stop(): void;
  fail(): void;
}

interface VolumeSettings {
  readonly musicVolume: number;
  readonly voiceVolume: number;
  readonly sfxVolume: number;
}

type TimelineAwareAudioPort = CinematicAudioPort & {
  readonly sync?: (positionMs: number) => void;
};

function clampPosition(positionMs: number, durationMs: number): number {
  return Math.min(durationMs, Math.max(0, positionMs));
}

function indexAtPosition(sequence: CinematicSequence, positionMs: number): number {
  const index = sequence.shots.findIndex((shot) => positionMs < shot.endMs);
  return index < 0 ? Math.max(0, sequence.shots.length - 1) : index;
}

export function useCinematicPlayer(
  sequence: CinematicSequence,
  settings: VolumeSettings,
  audio: CinematicAudioPort,
): CinematicPlayer {
  const [status, setStatus] = useState<CinematicPlayerStatus>('preloading');
  const [positionMs, setPositionMs] = useState(0);
  const [runId, setRunId] = useState(0);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const statusRef = useRef<CinematicPlayerStatus>('preloading');
  const positionRef = useRef(0);
  const startedAtRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const epochRef = useRef(0);
  const mountedRef = useRef(false);
  const preloadRef = useRef<{
    readonly sequence: CinematicSequence;
    readonly audio: CinematicAudioPort;
    readonly promise: Promise<void>;
  } | null>(null);

  const updateStatus = useCallback((next: CinematicPlayerStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const cancelFrame = useCallback(() => {
    if (frameRef.current === null) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const fail = useCallback(() => {
    epochRef.current += 1;
    cancelFrame();
    audio.stop();
    updateStatus('fallback');
  }, [audio, cancelFrame, updateStatus]);

  const startAudio = useCallback((position: number, epoch: number) => {
    setAudioUnavailable(false);
    let playback: Promise<void>;
    try {
      playback = audio.play(sequence, position);
    } catch {
      if (mountedRef.current && epochRef.current === epoch) setAudioUnavailable(true);
      return;
    }
    void playback.then(() => {
      if (!mountedRef.current) {
        audio.stop();
        return;
      }
      if (epochRef.current === epoch) return;
      if (statusRef.current === 'paused' || statusRef.current === 'complete' || statusRef.current === 'fallback') {
        audio.pause();
      }
    }).catch(() => {
      if (mountedRef.current && epochRef.current === epoch) setAudioUnavailable(true);
    });
  }, [audio, sequence]);

  useEffect(() => {
    audio.setVolumes({
      music: settings.musicVolume,
      voice: settings.voiceVolume,
      sfx: settings.sfxVolume,
    });
  }, [audio, settings.musicVolume, settings.sfxVolume, settings.voiceVolume]);

  useEffect(() => {
    const epoch = ++epochRef.current;
    let mounted = true;
    mountedRef.current = true;
    positionRef.current = 0;
    setPositionMs(0);
    setAudioUnavailable(false);
    startedAtRef.current = performance.now();
    updateStatus('playing');

    let preload = preloadRef.current;
    if (!preload || preload.sequence !== sequence || preload.audio !== audio) {
      let promise: Promise<void>;
      try {
        promise = audio.preload(sequence);
      } catch (error) {
        promise = Promise.reject(error);
      }
      preload = { sequence, audio, promise };
      preloadRef.current = preload;
    }

    void preload.promise.then(() => {
      if (!mounted || epochRef.current !== epoch || statusRef.current !== 'playing') return;
      startAudio(positionRef.current, epoch);
    }).catch(() => {
      if (mounted && epochRef.current === epoch) setAudioUnavailable(true);
    });

    return () => {
      mounted = false;
      mountedRef.current = false;
      epochRef.current += 1;
      cancelFrame();
      audio.stop();
    };
  }, [audio, cancelFrame, fail, sequence, startAudio, updateStatus]);

  useEffect(() => {
    if (status !== 'playing') return undefined;
    let active = true;
    const tick = (timestamp: number) => {
      if (!active || statusRef.current !== 'playing') return;
      const next = clampPosition(timestamp - startedAtRef.current, sequence.durationMs);
      positionRef.current = next;
      (audio as TimelineAwareAudioPort).sync?.(next);
      setPositionMs(next);
      if (next >= sequence.durationMs) {
        frameRef.current = null;
        audio.stop();
        updateStatus('complete');
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelFrame();
    };
  }, [audio, cancelFrame, sequence.durationMs, status, updateStatus]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    epochRef.current += 1;
    cancelFrame();
    audio.pause();
    updateStatus('paused');
  }, [audio, cancelFrame, updateStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    const epoch = ++epochRef.current;
    const position = positionRef.current;
    audio.seek(position);
    startedAtRef.current = performance.now() - position;
    updateStatus('playing');
    startAudio(position, epoch);
  }, [audio, startAudio, updateStatus]);

  const retryAudio = useCallback(() => {
    if (!audioUnavailable || statusRef.current !== 'playing') return;
    const epoch = ++epochRef.current;
    const position = positionRef.current;
    audio.seek(position);
    startAudio(position, epoch);
  }, [audio, audioUnavailable, startAudio]);

  const replay = useCallback(() => {
    const epoch = ++epochRef.current;
    cancelFrame();
    positionRef.current = 0;
    setPositionMs(0);
    setRunId((current) => current + 1);
    audio.stop();
    audio.seek(0);
    startedAtRef.current = performance.now();
    updateStatus('playing');
    startAudio(0, epoch);
  }, [audio, cancelFrame, startAudio, updateStatus]);

  const stop = useCallback(() => {
    epochRef.current += 1;
    cancelFrame();
    audio.stop();
    updateStatus('complete');
  }, [audio, cancelFrame, updateStatus]);

  const shotIndex = useMemo(
    () => indexAtPosition(sequence, positionMs),
    [positionMs, sequence],
  );

  return {
    status,
    positionMs,
    shotIndex,
    runId,
    audioUnavailable,
    pause,
    resume,
    retryAudio,
    replay,
    stop,
    fail,
  };
}
