/**
 * AchievementsScreen
 *
 * All unlock states are computed from real Supabase data via sessionStore
 * and userStore. A brand-new user will see every achievement locked at 0.
 * No hardcoded `done:true` values anywhere.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, SpeechSession } from '../../store/sessionStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../theme/ThemeContext';

// ── Achievement definitions ───────────────────────────────────────────────────

type AchCat = 'speech' | 'streak' | 'milestone';

interface AchDef {
  id:       string;
  title:    string;
  desc:     string;
  icon:     string;
  xp:       number;
  category: AchCat;
  /** Returns { done, progress, total } given live data */
  compute: (d: LiveData) => { done: boolean; progress: number; total: number };
}

interface LiveData {
  speechCount:    number;
  bestScore:      number;
  fillerFreeCount: number;
  longCount:      number;   // sessions ≥ 10 min
  streakDays:     number;
  avgScore:       number;
}

const ACHIEVEMENTS: AchDef[] = [
  // Speech
  {
    id: 's1', title: 'First Words', xp: 50, category: 'speech',
    icon: 'mic-outline',
    desc: 'Complete your first speech session.',
    compute: d => ({ done: d.speechCount >= 1,  progress: Math.min(d.speechCount, 1),  total: 1  }),
  },
  {
    id: 's2', title: 'Consistent Speaker', xp: 100, category: 'speech',
    icon: 'mic-circle-outline',
    desc: 'Complete 5 speech sessions.',
    compute: d => ({ done: d.speechCount >= 5,  progress: Math.min(d.speechCount, 5),  total: 5  }),
  },
  {
    id: 's3', title: '10 Sessions', xp: 150, category: 'speech',
    icon: 'mic-circle-outline',
    desc: 'Complete 10 speech sessions.',
    compute: d => ({ done: d.speechCount >= 10, progress: Math.min(d.speechCount, 10), total: 10 }),
  },
  {
    id: 's4', title: '25 Sessions', xp: 250, category: 'speech',
    icon: 'mic-circle-outline',
    desc: 'Complete 25 speech sessions.',
    compute: d => ({ done: d.speechCount >= 25, progress: Math.min(d.speechCount, 25), total: 25 }),
  },
  {
    id: 's5', title: 'Smooth Talker', xp: 100, category: 'speech',
    icon: 'star-outline',
    desc: 'Score 80 or above in a session.',
    compute: d => ({ done: d.bestScore >= 80,   progress: Math.min(d.bestScore, 80),   total: 80 }),
  },
  {
    id: 's6', title: 'High Achiever', xp: 200, category: 'speech',
    icon: 'trophy-outline',
    desc: 'Score 90 or above in a session.',
    compute: d => ({ done: d.bestScore >= 90,   progress: Math.min(d.bestScore, 90),   total: 90 }),
  },
  {
    id: 's7', title: 'Filler-Free', xp: 150, category: 'speech',
    icon: 'shield-checkmark-outline',
    desc: 'Complete a session with zero filler words.',
    compute: d => ({ done: d.fillerFreeCount >= 1, progress: Math.min(d.fillerFreeCount, 1), total: 1 }),
  },
  {
    id: 's8', title: 'Marathon Speaker', xp: 200, category: 'speech',
    icon: 'timer-outline',
    desc: 'Record a speech longer than 10 minutes.',
    compute: d => ({ done: d.longCount >= 1,    progress: Math.min(d.longCount, 1),    total: 1  }),
  },
  // Streaks
  {
    id: 'st1', title: '3-Day Streak', xp: 75, category: 'streak',
    icon: 'flame-outline',
    desc: 'Practice 3 days in a row.',
    compute: d => ({ done: d.streakDays >= 3,   progress: Math.min(d.streakDays, 3),   total: 3  }),
  },
  {
    id: 'st2', title: '7-Day Streak', xp: 150, category: 'streak',
    icon: 'flame-outline',
    desc: 'Practice 7 days in a row.',
    compute: d => ({ done: d.streakDays >= 7,   progress: Math.min(d.streakDays, 7),   total: 7  }),
  },
  {
    id: 'st3', title: '30-Day Streak', xp: 500, category: 'streak',
    icon: 'flame-outline',
    desc: 'Practice 30 days in a row.',
    compute: d => ({ done: d.streakDays >= 30,  progress: Math.min(d.streakDays, 30),  total: 30 }),
  },
  // Milestones
  {
    id: 'm1', title: 'Rising Star', xp: 100, category: 'milestone',
    icon: 'trending-up-outline',
    desc: 'Reach an average score of 70 across all sessions.',
    compute: d => ({ done: d.avgScore >= 70,    progress: Math.min(Math.round(d.avgScore), 70),  total: 70  }),
  },
  {
    id: 'm2', title: 'Communication Pro', xp: 200, category: 'milestone',
    icon: 'ribbon-outline',
    desc: 'Reach an average score of 85 across all sessions.',
    compute: d => ({ done: d.avgScore >= 85,    progress: Math.min(Math.round(d.avgScore), 85),  total: 85  }),
  },
];

const FILTERS: { label: string; cat: AchCat | 'all' }[] = [
  { label: 'All',       cat: 'all'       },
  { label: 'Speech',    cat: 'speech'    },
  { label: 'Streaks',   cat: 'streak'    },
  { label: 'Milestones',cat: 'milestone' },
];

// ── AchCard component ─────────────────────────────────────────────────────────

function AchCard({
  def, done, progress, total, accent, C,
}: {
  def: AchDef; done: boolean; progress: number; total: number; accent: string; C: any;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  const s = StyleSheet.create({
    card:     { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: done ? accent + '55' : C.border, padding: 14, marginBottom: 10 },
    top:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: done || pct > 0 ? 10 : 0 },
    iconBox:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? accent + '18' : C.surfaceAlt },
    meta:     { flex: 1 },
    title:    { fontSize: 13, fontWeight: '700', color: done ? C.text : C.textSec },
    desc:     { fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 17 },
    xpRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    xpTxt:    { fontSize: 11, fontWeight: '600', color: done ? accent : C.textMuted },
    check:    { width: 22, height: 22, borderRadius: 11, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' },
    barBg:    { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
    barFill:  { height: '100%' as any, borderRadius: 2, backgroundColor: accent },
    progTxt:  { fontSize: 11, color: C.textMuted, marginTop: 4 },
  });
  return (
    <View style={s.card}>
      <View style={s.top}>
        <View style={s.iconBox}>
          <Ionicons name={def.icon as any} size={20} color={done ? accent : C.textMuted} />
        </View>
        <View style={s.meta}>
          <Text style={s.title}>{def.title}</Text>
          <Text style={s.desc}>{def.desc}</Text>
          <View style={s.xpRow}>
            <Ionicons name="star-outline" size={11} color={done ? accent : C.textMuted} />
            <Text style={s.xpTxt}>{def.xp} XP</Text>
          </View>
        </View>
        {done && (
          <View style={s.check}>
            <Ionicons name="checkmark" size={13} color="#fff" />
          </View>
        )}
      </View>
      {!done && total > 1 && (
        <>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={s.progTxt}>{progress} / {total}</Text>
        </>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AchievementsScreen({ navigation }: any) {
  const { colors: C, isDark } = useTheme();
  const userId      = useAuthStore(s => s.user?.id);
  const sessions    = useSessionStore(s => s.sessions);
  const loadSessions= useSessionStore(s => s.loadSessions);
  const profile     = useUserStore(s => s.profile);
  const [filter, setFilter] = useState<AchCat | 'all'>('all');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    if (userId) loadSessions(userId);
  }, [userId]);

  // ── Compute live data from real sessions ──────────────────────────────────
  const speechSessions = sessions.filter(s => s.type === 'speech') as SpeechSession[];
  const speechCount    = speechSessions.length;
  const bestScore      = speechCount > 0 ? Math.max(...speechSessions.map(s => s.score)) : 0;
  const avgScore       = speechCount > 0
    ? speechSessions.reduce((a, s) => a + s.score, 0) / speechCount
    : 0;
  const fillerFreeCount = speechSessions.filter(s => s.filler_count === 0).length;
  const longCount       = speechSessions.filter(s => s.duration >= 600).length;
  const streakDays      = profile?.streak_days ?? 0;

  const liveData: LiveData = { speechCount, bestScore, fillerFreeCount, longCount, streakDays, avgScore };

  // ── Evaluate achievements ─────────────────────────────────────────────────
  const evaluated = ACHIEVEMENTS.map(def => ({ def, ...def.compute(liveData) }));
  const filtered  = evaluated.filter(a => filter === 'all' || a.def.category === filter);
  const unlockedAll = evaluated.filter(a => a.done);
  const totalXP     = unlockedAll.reduce((s, a) => s + a.def.xp, 0);

  const ACCENT = C.primary;

  const s = StyleSheet.create({
    root:         { flex: 1, backgroundColor: C.bg },
    scrollContent:{ paddingBottom: 80 },

    header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, gap: 10 },
    backBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
    divider:      { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 16 },

    // Summary strip
    summaryRow:   { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    sumCard:      { flex: 1, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 12, alignItems: 'center', gap: 3 },
    sumVal:       { fontSize: 18, fontWeight: '700', color: C.text },
    sumLbl:       { fontSize: 10, color: C.textMuted },

    // Overall progress bar
    barWrap:      { paddingHorizontal: 20, marginBottom: 16 },
    barBg:        { height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    barFill:      { height: '100%' as any, borderRadius: 3, backgroundColor: ACCENT },

    // Filter chips
    filterRow:    { paddingHorizontal: 20, gap: 8, flexDirection: 'row', marginBottom: 16 },
    chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    chipActive:   { backgroundColor: ACCENT, borderColor: ACCENT },
    chipTxt:      { fontSize: 12, color: C.textMuted, fontWeight: '500' },
    chipTxtActive:{ color: '#fff', fontWeight: '700' },

    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 10, marginTop: 4 },
    listWrap:     { paddingHorizontal: 20 },
  });

  const pct = Math.round((unlockedAll.length / ACHIEVEMENTS.length) * 100);

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Achievements</Text>
      </View>
      <View style={s.divider} />

      <Animated.ScrollView
        style={[{ opacity: fade }, Platform.OS === 'web' && ({ flex: 1, overflowY: 'auto' } as any)]}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={s.sumCard}>
            <Text style={s.sumVal}>{unlockedAll.length}/{ACHIEVEMENTS.length}</Text>
            <Text style={s.sumLbl}>Unlocked</Text>
          </View>
          <View style={s.sumCard}>
            <Text style={s.sumVal}>{totalXP}</Text>
            <Text style={s.sumLbl}>XP Earned</Text>
          </View>
          <View style={s.sumCard}>
            <Text style={s.sumVal}>{pct}%</Text>
            <Text style={s.sumLbl}>Complete</Text>
          </View>
        </View>

        {/* Overall bar */}
        <View style={s.barWrap}>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${pct}%` as any }]} />
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.cat}
              style={[s.chip, filter === f.cat && s.chipActive]}
              onPress={() => setFilter(f.cat)}
              activeOpacity={0.75}
            >
              <Text style={[s.chipTxt, filter === f.cat && s.chipTxtActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Unlocked */}
        {filtered.some(a => a.done) && (
          <>
            <Text style={s.sectionLabel}>Unlocked</Text>
            <View style={s.listWrap}>
              {filtered.filter(a => a.done).map(a => (
                <AchCard key={a.def.id} def={a.def} done={a.done} progress={a.progress} total={a.total} accent={ACCENT} C={C} />
              ))}
            </View>
          </>
        )}

        {/* Locked / in progress */}
        {filtered.some(a => !a.done) && (
          <>
            <Text style={s.sectionLabel}>{speechCount === 0 ? 'Locked — Complete a session to start' : 'In Progress'}</Text>
            <View style={s.listWrap}>
              {filtered.filter(a => !a.done).map(a => (
                <AchCard key={a.def.id} def={a.def} done={a.done} progress={a.progress} total={a.total} accent={ACCENT} C={C} />
              ))}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}
