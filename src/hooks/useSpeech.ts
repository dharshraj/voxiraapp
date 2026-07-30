import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { transcribeAudio } from '../services/speechService';

let Audio: any = null;
if (Platform.OS !== 'web') {
  try { Audio = require('expo-av').Audio; } catch {}
}

export type RecordingPhase = 'idle' | 'recording' | 'paused' | 'done' | 'transcribing';

export interface TranscribeResult {
  transcript: string;
  duration: number;
  audioUri: string | null;
  status: 'completed' | 'error' | 'no_key' | 'no_audio';
  error?: string;
}

export function useSpeech() {
  const [phase,     setPhase]     = useState<RecordingPhase>('idle');
  const [duration,  setDuration]  = useState(0);
  const [audioUri,  setAudioUri]  = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const recordingRef = useRef<any>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (!Audio) return true; // web — browser handles mic permission on getUserMedia
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  };

  const start = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // Web recording via the browser's MediaRecorder is not yet wired up.
      // We start the timer so UX is consistent; audioUri stays null.
      setPhase('recording');
      setDuration(0);
      startTimer();
      return true;
    }

    if (!Audio) return false;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:  true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setPhase('recording');
      setDuration(0);
      startTimer();
      return true;
    } catch {
      return false;
    }
  }, []);

  const pause = useCallback(async () => {
    if (recordingRef.current) {
      try { await recordingRef.current.pauseAsync(); } catch {}
    }
    stopTimer();
    setPhase('paused');
  }, [stopTimer]);

  const resume = useCallback(async () => {
    if (recordingRef.current) {
      try { await recordingRef.current.startAsync(); } catch {}
    }
    startTimer();
    setPhase('recording');
  }, []);

  const stop = useCallback(async () => {
    stopTimer();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri: string | null = recordingRef.current.getURI();
        setAudioUri(uri);
        recordingRef.current = null;
      } catch {}
    }
    setPhase('done');
  }, [stopTimer]);

  // Upload + transcribe the captured audio, then return structured results.
  const transcribe = useCallback(async (): Promise<TranscribeResult> => {
    setPhase('transcribing');

    if (!audioUri) {
      setStatusMsg('No audio captured.');
      return { transcript: '', duration, audioUri: null, status: 'no_audio' };
    }

    setStatusMsg('Uploading audio…');
    try {
      const result = await transcribeAudio(audioUri);

      if (result.status === 'completed') {
        setStatusMsg('Transcription complete!');
        return { transcript: result.text, duration, audioUri, status: 'completed' };
      }
      if (result.status === 'no_key') {
        setStatusMsg('No AssemblyAI key configured.');
        return { transcript: '', duration, audioUri, status: 'no_key', error: result.error };
      }
      setStatusMsg(`Error: ${result.error ?? 'Unknown'}`);
      return { transcript: '', duration, audioUri, status: 'error', error: result.error };
    } catch (err: any) {
      const msg = err?.message ?? 'Transcription failed';
      setStatusMsg(msg);
      return { transcript: '', duration, audioUri, status: 'error', error: msg };
    }
  }, [audioUri, duration]);

  const reset = useCallback(() => {
    stopTimer();
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setPhase('idle');
    setDuration(0);
    setAudioUri(null);
    setStatusMsg('');
  }, [stopTimer]);

  return {
    phase,
    duration,
    audioUri,
    statusMsg,
    requestPermissions,
    start,
    pause,
    resume,
    stop,
    transcribe,
    reset,
  };
}
