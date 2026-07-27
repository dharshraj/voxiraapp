import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { transcribeAudio } from '../../services/speechService';
import '../../testAssemblyAI';
import { useTheme } from '../../theme/ThemeContext';

let Audio: any = null;
if (Platform.OS !== 'web') {
  try { Audio = require('expo-av').Audio; } catch {}
}

const { width: _W } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

function formatTime(secs: number) {
  return `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
}

const MIC = 96;

export default function RecordScreen({ navigation, route }: any) {
  const { colors: C, isDark } = useTheme();
  const mode = route?.params?.mode ?? 'Free Speech';
  const [phase, setPhase]     = useState<'ready' | 'recording' | 'paused' | 'done' | 'transcribing'>('ready');
  const [duration, setDuration]   = useState(0);
  const [recording, setRecording] = useState<any>(null);
  const [audioUri, setAudioUri]   = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const waveAnims = useRef(Array.from({ length: 20 }, () => new Animated.Value(0.3))).current;
  const timerRef  = useRef<any>(null);
  const pulseRef  = useRef<any>(null);
  const waveRef   = useRef<any>(null);

  const webRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef   = useRef<BlobPart[]>([]);
  const webStreamRef   = useRef<MediaStream | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    if (!isWeb) requestPermissions();
    return () => { stopTimer(); pulseRef.current?.stop(); waveRef.current?.stop(); };
  }, []);

  const requestPermissions = async () => {
    if (!Audio) return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone access is required.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {}
  };

  const startWave = () => {
    const anims = waveAnims.map((v, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 45),
        Animated.timing(v, { toValue: 0.3 + Math.random() * 0.7, duration: 280 + i * 20, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.15 + Math.random() * 0.3, duration: 260 + i * 15, useNativeDriver: true }),
      ]))
    );
    waveRef.current = Animated.parallel(anims);
    waveRef.current.start();
  };
  const stopWave = () => {
    waveRef.current?.stop();
    waveAnims.forEach(a => Animated.timing(a, { toValue: 0.3, duration: 200, useNativeDriver: true }).start());
  };
  const startPulse = () => {
    pulseRef.current = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
    ]));
    pulseRef.current.start();
  };
  const stopPulse = () => { pulseRef.current?.stop(); pulseAnim.setValue(1); };
  const startTimer = () => { timerRef.current = setInterval(() => setDuration(d => d + 1), 1000); };
  const stopTimer  = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startWebRecording = async () => {
    try {
      const stream = await (navigator as any).mediaDevices.getUserMedia({ audio: true });
      webStreamRef.current = stream;
      webChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) webChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(webChunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioUri(URL.createObjectURL(blob));
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      };
      recorder.start(500);
      webRecorderRef.current = recorder;
    } catch (err: any) {
      Alert.alert('Microphone Error', err?.message ?? 'Could not access microphone. Please allow mic permission in your browser.');
    }
  };
  const stopWebRecording   = () => { if (webRecorderRef.current && webRecorderRef.current.state !== 'inactive') webRecorderRef.current.stop(); };
  const pauseWebRecording  = () => { if (webRecorderRef.current && webRecorderRef.current.state === 'recording') webRecorderRef.current.pause(); };
  const resumeWebRecording = () => { if (webRecorderRef.current && webRecorderRef.current.state === 'paused') webRecorderRef.current.resume(); };

  const startRecording = async () => {
    if (isWeb) {
      await startWebRecording();
      setPhase('recording'); setDuration(0); startTimer(); startPulse(); startWave();
      return;
    }
    if (!Audio) return;
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec); setPhase('recording'); setDuration(0); startTimer(); startPulse(); startWave();
    } catch (e: any) { Alert.alert('Error', e?.message ?? 'Could not start recording.'); }
  };
  const pauseRecording = async () => {
    if (isWeb) pauseWebRecording();
    else if (recording) { try { await recording.pauseAsync(); } catch {} }
    setPhase('paused'); stopTimer(); stopPulse(); stopWave();
  };
  const resumeRecording = async () => {
    if (isWeb) resumeWebRecording();
    else if (recording) { try { await recording.startAsync(); } catch {} }
    setPhase('recording'); startTimer(); startPulse(); startWave();
  };
  const stopRecording = async () => {
    stopTimer(); stopPulse(); stopWave();
    if (isWeb) { stopWebRecording(); setPhase('done'); return; }
    if (recording) {
      try { await recording.stopAndUnloadAsync(); setAudioUri(recording.getURI()); } catch (e) { console.log('Stop error:', e); }
    }
    setPhase('done');
  };
  const goToAnalysis = async () => {
    setPhase('transcribing');
    setErrorBanner(null);
    if (!audioUri) {
      const msg = 'No audio captured — please record first.';
      setStatusMsg(msg);
      setErrorBanner(msg);
      setPhase('done');
      return;
    }
    setStatusMsg('Uploading to AssemblyAI…');
    let result;
    try {
      result = await transcribeAudio(audioUri);
    } catch (e: any) {
      const msg = `Upload error: ${e?.message ?? 'Failed'}`;
      console.error('[RecordScreen] transcribeAudio threw:', e);
      setStatusMsg(msg);
      setErrorBanner(msg);
      setPhase('done');
      return;
    }
    if (result.status === 'completed' && result.text) {
      setStatusMsg('Transcription complete!');
      setTimeout(() => navigation.navigate('Analyzing', { duration, mode, transcript: result.text, fillerWords: result.filler_words }), 600);
    } else {
      let msg: string;
      if (result.status === 'no_key') {
        msg = 'AssemblyAI API key not set.\n\nAdd EXPO_PUBLIC_ASSEMBLYAI_KEY to your .env file.';
      } else {
        msg = `Transcription failed: ${result.error ?? 'Unknown error'}`;
      }
      console.error('[RecordScreen] Transcription result:', result.status, result.error);
      setStatusMsg(msg);
      setErrorBanner(msg);
      setPhase('done');
    }
  };
  const reset = () => {
    if (webStreamRef.current) { webStreamRef.current.getTracks().forEach(t => t.stop()); webStreamRef.current = null; }
    if (audioUri && audioUri.startsWith('blob:')) URL.revokeObjectURL(audioUri);
    setPhase('ready'); setDuration(0); setRecording(null); setAudioUri(null); setStatusMsg(''); setErrorBanner(null);
  };

  const micColor =
    phase === 'paused' ? C.warning :
    phase === 'done'   ? C.success :
                         C.primary;

  const s = StyleSheet.create({
    root:         { flex: 1, backgroundColor: C.bg },
    header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 8, gap: 10 },
    backBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
    headerTitle:  { fontSize: 15, fontWeight: '700', color: C.text },
    statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    statusPillRec:{ borderColor: C.error + '4D', backgroundColor: C.error + '14' },
    recDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.error },
    statusTxt:    { fontSize: 11, fontWeight: '600', color: C.textSec },
    timerWrap:    { alignItems: 'center', marginTop: 32, marginBottom: 16 },
    timer:        { fontSize: 56, fontWeight: '800', color: C.text, letterSpacing: -2 },
    timerSub:     { fontSize: 12, color: C.textSec, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
    waveWrap:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, gap: 3, marginHorizontal: 24, marginBottom: 4 },
    waveBar:      { width: 3, borderRadius: 2 },
    micArea:      { alignItems: 'center', justifyContent: 'center', height: 160, marginBottom: 8 },
    micBtn:       { width: MIC, height: MIC, borderRadius: MIC / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: C.primary, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
    micRing:      { position: 'absolute', width: MIC - 16, height: MIC - 16, borderRadius: (MIC - 16) / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    statsRow:     { flexDirection: 'row', marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingVertical: 16 },
    errorBannerWrap:  { marginHorizontal: 20, marginBottom: 12, backgroundColor: C.error + '15', borderRadius: 14, borderWidth: 1, borderColor: C.error + '55', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    errorBannerText:  { flex: 1, fontSize: 13, color: C.error, lineHeight: 19, fontWeight: '500' },
    statBox:      { flex: 1, alignItems: 'center', gap: 4 },
    statDivider:  { width: 1, backgroundColor: C.border },
    statVal:      { fontSize: 15, fontWeight: '700', color: C.text },
    statLbl:      { fontSize: 10, color: C.textMuted },
    bottomRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 24, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    controlBtn:   {},
    controlBtnInner:{ alignItems: 'center', gap: 4 },
    controlBtnTxt:{ fontSize: 11, color: C.textSec, fontWeight: '500' },
    stopBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.error, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, shadowColor: C.error, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
    stopSquare:   { width: 12, height: 12, borderRadius: 2, backgroundColor: '#fff' },
    stopTxt:      { fontSize: 13, fontWeight: '700', color: '#fff' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        style={isWeb ? ({ height: '100vh', overflowY: 'scroll' } as any) : undefined}
      >
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={C.textSec} />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>{mode}</Text>
              <View style={[s.statusPill, phase === 'recording' && s.statusPillRec]}>
                {phase === 'recording' && <View style={s.recDot} />}
                <Text style={[s.statusTxt, phase === 'recording' && { color: C.error }]}>
                  {phase === 'ready'        ? 'Ready'
                  : phase === 'recording'  ? 'Recording'
                  : phase === 'paused'     ? 'Paused'
                  : phase === 'transcribing' ? 'Processing…'
                  : 'Done'}
                </Text>
              </View>
            </View>
            <View style={{ width: 42 }} />
          </View>

          <View style={s.timerWrap}>
            <Text style={s.timer}>{formatTime(duration)}</Text>
            <Text style={s.timerSub}>
              {phase === 'ready'          ? 'Press mic to start'
              : phase === 'recording'    ? 'Listening…'
              : phase === 'paused'       ? 'Paused — tap to resume'
              : phase === 'transcribing' ? (statusMsg || 'Analysing…')
              : 'Recording complete!'}
            </Text>
          </View>

          <View style={s.waveWrap}>
            {waveAnims.map((a, i) => (
              <Animated.View
                key={i}
                style={[
                  s.waveBar,
                  {
                    height: 6 + (i % 5) * 6,
                    transform: [{ scaleY: a }],
                    backgroundColor: phase === 'recording'
                      ? (i % 3 === 0 ? C.primary : i % 3 === 1 ? C.info : C.primary + '66')
                      : C.border,
                  },
                ]}
              />
            ))}
          </View>

          <View style={s.micArea}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[s.micBtn, { backgroundColor: micColor }]}
                onPress={() => {
                  if (phase === 'ready')     startRecording();
                  else if (phase === 'recording') pauseRecording();
                  else if (phase === 'paused')    resumeRecording();
                }}
                activeOpacity={0.85}
                disabled={phase === 'done' || phase === 'transcribing'}
              >
                <View style={s.micRing} />
                <Ionicons
                  name={
                    phase === 'paused'    ? 'play' :
                    phase === 'recording' ? 'pause' :
                    phase === 'done'      ? 'checkmark' : 'mic'
                  }
                  size={36}
                  color="#fff"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {errorBanner && (
            <View style={s.errorBannerWrap}>
              <Ionicons name="alert-circle-outline" size={18} color={C.error} style={{ marginTop: 1 }} />
              <Text style={s.errorBannerText}>{errorBanner}</Text>
            </View>
          )}

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Ionicons name="time-outline" size={14} color={C.primary} />
              <Text style={s.statVal}>{formatTime(duration)}</Text>
              <Text style={s.statLbl}>Duration</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Ionicons name="radio-outline" size={14} color={C.success} />
              <Text style={[s.statVal, { color: phase === 'recording' ? C.error : C.text }]}>
                {phase === 'recording' ? 'Live' : '—'}
              </Text>
              <Text style={s.statLbl}>Status</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Ionicons name="document-text-outline" size={14} color={C.warning} />
              <Text style={[s.statVal, { color: audioUri ? C.success : C.text }]}>
                {audioUri ? '✓' : '—'}
              </Text>
              <Text style={s.statLbl}>Audio</Text>
            </View>
          </View>

          <View style={s.bottomRow}>
            <TouchableOpacity style={s.controlBtn} onPress={reset} disabled={phase === 'ready' || phase === 'transcribing'}>
              <View style={[s.controlBtnInner, (phase === 'ready' || phase === 'transcribing') && { opacity: 0.35 }]}>
                <Ionicons name="refresh" size={18} color={C.textSec} />
                <Text style={s.controlBtnTxt}>Reset</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.stopBtn, (phase !== 'recording' && phase !== 'paused') && { opacity: 0.3 }]}
              onPress={stopRecording}
              disabled={phase !== 'recording' && phase !== 'paused'}
              activeOpacity={0.85}
            >
              <View style={s.stopSquare} />
              <Text style={s.stopTxt}>Stop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.controlBtn} onPress={goToAnalysis} disabled={phase !== 'done'}>
              <View style={[s.controlBtnInner, phase !== 'done' && { opacity: 0.35 }]}>
                <Ionicons name="analytics-outline" size={18} color={phase === 'done' ? C.primary : C.textMuted} />
                <Text style={[s.controlBtnTxt, { color: phase === 'done' ? C.primary : C.textMuted }]}>
                  Analyse
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
