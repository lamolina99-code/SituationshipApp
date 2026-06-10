import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  SafeAreaView, ScrollView, TextInput, Alert, Animated,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, AppState,
  PanResponder, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from '../../context/AppContext';
import {
  SCORE_KEYS, SCORE_EMOJIS_GIRL, SCORE_LABELS_GIRL, scoreColor,
  FLAGS_GIRL, emptyCandidate, PHRASES
} from '../../constants/data';

// ── NOTIFICATIONS SETUP ───────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function scheduleWeeklyRecap(candidates: any[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const active = candidates.filter((c: any) => c.nonNegotiables && Object.values(c.nonNegotiables).every(v => !v));
  const top = active.sort((a: any, b: any) => b.moodAfter - a.moodAfter)[0];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'The Rotation 💜',
      body: active.length > 0
        ? `Your rotation has ${candidates.length} candidate${candidates.length !== 1 ? 's' : ''}. Top pick: ${top?.name || 'TBD'} 👑`
        : 'Your rotation is empty. Time to add some candidates 👀',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3 * 24 * 60 * 60,
      repeats: true,
    },
  });
}

// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const t = (lang: string, key: string): string => {
  const tr: Record<string, Record<string, string>> = {
    saveRotation: { en: 'Save to Rotation', es: 'Guardar' },
    cancel: { en: 'Cancel', es: 'Cancelar' },
    scores: { en: 'Scores', es: 'Puntajes' },
    check: { en: 'Check', es: 'Checklist' },
    notes: { en: 'Notes', es: 'Notas' },
    mood: { en: 'Mood', es: 'Animo' },
    logDate: { en: '+ Log date', es: '+ Agregar cita' },
    noDates: { en: 'No dates logged yet', es: 'Sin citas registradas' },
    tapChange: { en: 'tap to change', es: 'toca para cambiar' },
    confirmDate: { en: 'Confirm date', es: 'Confirmar' },
    flagsHint: { en: 'Tap to log observed flags:', es: 'Toca para registrar flags:' },
    namePlaceholder: { en: 'Name of your date...', es: 'Nombre de tu cita...' },
    empty: { en: 'The rotation is empty.', es: 'La rotacion esta vacia.' },
    tapAdd: { en: 'Tap + to add your first candidate', es: 'Toca + para agregar' },
    edit: { en: 'Edit', es: 'Editar' },
    added: { en: 'Added', es: 'Agregado' },
    disq: { en: 'DISQUALIFIED', es: 'DESCALIFICADO' },
    autoDisq: { en: 'AUTO-DISQUALIFIED. NEXT.', es: 'AUTO-DESCALIFICADO.' },
    ranking: { en: 'COMPATIBILITY RANKING', es: 'RANKING' },
    avgMood: { en: 'AVG MOOD', es: 'ANIMO PROM.' },
    quickStats: { en: 'QUICK STATS', es: 'RESUMEN' },
    bestMatch: { en: 'Best match', es: 'Mejor match' },
    mostDates: { en: 'Most dates', es: 'Mas citas' },
    mostToxic: { en: 'Most toxic', es: 'Mas toxico' },
    bestMood: { en: 'Best mood', es: 'Mejor animo' },
    addMore: { en: 'Add candidates to see analytics', es: 'Agrega candidatos para analytics' },
    hey: { en: 'Hey', es: 'Hola' },
    reqs: { en: 'Reqs', es: 'Reqs' },
    nn: { en: 'NN', es: 'NN' },
    removeQ: { en: 'Remove?', es: 'Eliminar?' },
    remove: { en: 'Remove', es: 'Eliminar' },
    nonNeg: { en: 'NON-NEGOTIABLES — ONE CHECK = GAME OVER', es: 'NON-NEGOTIABLES — UN CHECK = GAME OVER' },
    requirements: { en: 'REQUIREMENTS', es: 'REQUISITOS' },
    typeEnter: { en: 'Type and press Enter...', es: 'Escribe y presiona Enter...' },
    delete: { en: 'Delete', es: 'Eliminar' },
    deleteQ: { en: 'Delete?', es: 'Eliminar?' },
    reset: { en: 'Reset all data', es: 'Borrar todos los datos' },
    resetQ: { en: 'Reset everything?', es: 'Borrar todo?' },
    resetMsg: { en: 'This deletes all candidates and data.', es: 'Esto elimina todo.' },
  };
  return tr[key]?.[lang] || tr[key]?.['en'] || key;
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const CANDIDATE_COLORS = ['#a855f7','#60a5fa','#4ade80','#fbbf24','#fb923c','#e879f9','#34d399','#f0e6ff','#38bdf8','#c084fc'];

const getCompat = (c: any, requirements: any[], nonNegs: any[]) => {
  if (nonNegs.some((nn: any) => c.nonNegotiables[nn.id])) return 0;
  const filled = Object.values(c.scores as Record<string, number>).filter(v => v > 0);
  if (!filled.length) return 0;
  const avg = filled.reduce((a, b) => a + b, 0) / filled.length;
  const scoresPct = (avg / 10) * 100;
  const reqMet = requirements.filter((r: any) => c.requirements[r.id]).length;
  const reqPct = requirements.length > 0 ? (reqMet / requirements.length) * 100 : 100;
  return Math.round(scoresPct * 0.5 + reqPct * 0.5);
};

// ── SPLASH ────────────────────────────────────────────────────────────────────
function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [phraseIdx, setPhraseIdx] = useState(Math.floor(Math.random() * PHRASES.length));
  const screenFade = useRef(new Animated.Value(0)).current;
  const phraseFade = useRef(new Animated.Value(1)).current;
  const actionsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(screenFade, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    const t1 = setTimeout(() => {
      Animated.timing(actionsFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 4000);
    const iv = setInterval(() => {
      Animated.timing(phraseFade, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setPhraseIdx(i => (i + 1) % PHRASES.length);
        Animated.timing(phraseFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 8000);
    return () => { clearTimeout(t1); clearInterval(iv); };
  }, []);

  const handleEnter = () => {
    Animated.timing(screenFade, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => onEnter());
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#0a0612', opacity: screenFade, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <SafeAreaView style={{ alignItems: 'center', width: '100%' }}>
        <Text style={{ fontSize: 52, marginBottom: 8 }}>💜</Text>
        <Text style={sp.tag}>SITUATIONSHIP TRACKER</Text>
        <Text style={sp.title}>The Rotation</Text>
        <Animated.View style={[sp.phraseBox, { opacity: phraseFade }]}>
          <Text style={sp.phrase}>"{PHRASES[phraseIdx]}"</Text>
        </Animated.View>
        <Animated.View style={{ width: '100%', alignItems: 'center', opacity: actionsFade }}>
          <TouchableOpacity style={sp.enterBtn} onPress={handleEnter}>
            <Text style={sp.enterText}>Enter The Rotation</Text>
          </TouchableOpacity>
          <Text style={sp.disclaimer}>No candidates will be harmed. (Emotionally, that is on you.) 💜</Text>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}
const sp = StyleSheet.create({
  tag: { fontSize: 11, letterSpacing: 3, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 40, fontWeight: '800', color: '#f0e6ff', letterSpacing: -1, marginBottom: 16 },
  phraseBox: { minHeight: 60, paddingHorizontal: 20, marginBottom: 32, alignItems: 'center', justifyContent: 'center' },
  phrase: { fontSize: 16, color: '#c4b5d4', fontStyle: 'italic', textAlign: 'center', lineHeight: 24 },
  enterBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 16, marginBottom: 16 },
  enterText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  disclaimer: { fontSize: 12, color: '#3d2d5a', textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email.trim() || (mode !== 'reset' && !password.trim())) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name.'); return; }
    try {
      if (mode === 'signup') {
        const user = { name: name.trim(), email: email.trim().toLowerCase(), password };
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('lastActive', Date.now().toString());
        onLogin(user.name);
      } else if (mode === 'signin') {
        const stored = await AsyncStorage.getItem('user');
        if (!stored) { setError('No account found. Sign up first.'); return; }
        const u = JSON.parse(stored);
        if (u.email !== email.trim().toLowerCase() || u.password !== password) { setError('Incorrect email or password.'); return; }
        await AsyncStorage.setItem('lastActive', Date.now().toString());
        onLogin(u.name);
      } else if (mode === 'reset') {
        if (!newPassword.trim()) { setError('Enter a new password.'); return; }
        const stored = await AsyncStorage.getItem('user');
        if (!stored) { setError('No account found.'); return; }
        const u = JSON.parse(stored);
        if (u.email !== email.trim().toLowerCase()) { setError('Email not found.'); return; }
        await AsyncStorage.setItem('user', JSON.stringify({ ...u, password: newPassword.trim() }));
        setSuccess('Password updated! Sign in now.');
        setMode('signin'); setNewPassword('');
      }
    } catch { setError('Something went wrong. Try again.'); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={lg.container}>
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontSize: 42, marginBottom: 6 }}>💜</Text>
            <Text style={lg.tag}>SITUATIONSHIP TRACKER</Text>
            <Text style={lg.title}>The Rotation</Text>
          </View>
          <View style={lg.form}>
            {mode === 'signup' && (
              <View style={lg.inputWrap}>
                <Text style={lg.label}>Name</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Your name"
                  placeholderTextColor="#3d2d5a" autoCapitalize="words" style={lg.input} />
              </View>
            )}
            <View style={lg.inputWrap}>
              <Text style={lg.label}>Email</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com"
                placeholderTextColor="#3d2d5a" keyboardType="email-address" autoCapitalize="none" style={lg.input} />
            </View>
            {mode !== 'reset' && (
              <View style={lg.inputWrap}>
                <Text style={lg.label}>Password</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput value={password} onChangeText={setPassword} placeholder="password"
                    placeholderTextColor="#3d2d5a" secureTextEntry={!showPw}
                    style={[lg.input, { paddingRight: 48 }]} />
                  <TouchableOpacity onPress={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {mode === 'reset' && (
              <View style={lg.inputWrap}>
                <Text style={lg.label}>New Password</Text>
                <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="new password"
                  placeholderTextColor="#3d2d5a" secureTextEntry style={lg.input} />
              </View>
            )}
            {error ? <Text style={lg.error}>{error}</Text> : null}
            {success ? <Text style={lg.success}>{success}</Text> : null}
            <TouchableOpacity style={lg.btn} onPress={handleSubmit}>
              <Text style={lg.btnText}>
                {mode === 'signup' ? 'Create Account' : mode === 'signin' ? 'Sign In' : 'Reset Password'}
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity onPress={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setSuccess(''); }}>
                <Text style={lg.switchText}>{mode === 'signup' ? 'Sign in' : 'Sign up'}</Text>
              </TouchableOpacity>
              {mode !== 'reset' && (
                <TouchableOpacity onPress={() => { setMode('reset'); setError(''); setSuccess(''); }}>
                  <Text style={lg.switchText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
              {mode === 'reset' && (
                <TouchableOpacity onPress={() => { setMode('signin'); setError(''); setSuccess(''); }}>
                  <Text style={lg.switchText}>Back to sign in</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
const lg = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0612', alignItems: 'center', justifyContent: 'center', padding: 24 },
  tag: { fontSize: 11, letterSpacing: 3, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 36, fontWeight: '800', color: '#f0e6ff', letterSpacing: -1 },
  form: { width: '100%', maxWidth: 340 },
  inputWrap: { marginBottom: 14 },
  label: { fontSize: 13, color: '#7c6a9a', marginBottom: 6 },
  input: { backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 12, padding: 13, fontSize: 15, color: '#f0e6ff' },
  error: { color: '#f87171', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  success: { color: '#4ade80', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btn: { backgroundColor: '#7c3aed', padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: { color: '#7c6a9a', fontSize: 14 },
});

// ── SCORE SLIDER ──────────────────────────────────────────────────────────────
function ScoreSlider({ value, onChange, label, emoji }: { value: number; onChange: (v: number) => void; label: string; emoji: string }) {
  const color = value === 0 ? '#2a1f3d' : scoreColor(value);
  const textColor = value === 0 ? '#7c6a9a' : '#000';
  const pct = (value / 10) * 100;
  const trackWidth = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (trackWidth.current > 0) {
          const x = evt.nativeEvent.locationX;
          const newVal = Math.round(Math.min(10, Math.max(0, (x / trackWidth.current) * 10)));
          onChange(newVal);
        }
      },
      onPanResponderMove: (evt) => {
        if (trackWidth.current > 0) {
          const x = evt.nativeEvent.locationX;
          const newVal = Math.round(Math.min(10, Math.max(0, (x / trackWidth.current) * 10)));
          onChange(newVal);
        }
      },
    })
  ).current;

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 15, color: '#c4b5d4' }}>{emoji} {label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: color === '#2a1f3d' ? '#7c6a9a' : color }}>{value}/10</Text>
      </View>
      <View
        style={{ height: 36, justifyContent: 'center' }}
        onLayout={e => { trackWidth.current = e.nativeEvent.layout.width; }}
        {...panResponder.panHandlers}
      >
        <View style={{ height: 6, backgroundColor: '#2a1f3d', borderRadius: 999 }}>
          {value > 0 && <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 999 }} />}
        </View>
        <View style={{
          position: 'absolute',
          left: `${pct}%` as any,
          marginLeft: -14,
          width: 28, height: 28, borderRadius: 14,
          backgroundColor: color,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: color, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: textColor }}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

// ── DATE LOG ──────────────────────────────────────────────────────────────────
function DateLogSection({ guy, setGuy, lang }: { guy: any; setGuy: any; lang: string }) {
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const dateLog = guy.dateLog || [];

  const addDate = () => {
    const today = new Date();
    const label = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newLog = [...dateLog, { id: Date.now().toString(), date: label, timestamp: today.getTime() }];
    setGuy((g: any) => ({ ...g, dateLog: newLog, dates: newLog.length }));
  };

  const updateDate = (id: string, selectedDate: Date) => {
    const label = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newLog = dateLog.map((d: any) => d.id === id ? { ...d, date: label, timestamp: selectedDate.getTime() } : d);
    setGuy((g: any) => ({ ...g, dateLog: newLog }));
    setShowPicker(null);
  };

  const removeDate = (id: string) => {
    const newLog = dateLog.filter((d: any) => d.id !== id);
    setGuy((g: any) => ({ ...g, dateLog: newLog, dates: newLog.length }));
  };

  return (
    <View style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 15, color: '#7c6a9a' }}>{dateLog.length} {dateLog.length === 1 ? 'date' : 'dates'}</Text>
        <TouchableOpacity onPress={addDate} style={{ backgroundColor: '#7c3aed', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{t(lang, 'logDate')}</Text>
        </TouchableOpacity>
      </View>
      {dateLog.length === 0 ? (
        <View style={{ backgroundColor: '#1f1535', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#3d2d5a' }}>
          <Text style={{ color: '#4a3f62', fontSize: 14 }}>{t(lang, 'noDates')}</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {dateLog.map((d: any, i: number) => (
            <View key={d.id}>
              <View style={{ backgroundColor: '#1f1535', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: showPicker === d.id ? '#7c3aed' : '#3d2d5a', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2d1f4a', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#c084fc', fontSize: 13, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setTempDate(d.timestamp ? new Date(d.timestamp) : new Date()); setShowPicker(showPicker === d.id ? null : d.id); }}>
                  <Text style={{ color: '#f0e6ff', fontSize: 14, fontWeight: '500' }}>{d.date}</Text>
                  <Text style={{ color: '#7c3aed', fontSize: 11, marginTop: 2 }}>📅 {t(lang, 'tapChange')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeDate(d.id)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
              {showPicker === d.id && (
                <View style={{ backgroundColor: '#1a1028', borderRadius: 12, borderWidth: 1, borderColor: '#7c3aed', overflow: 'hidden', marginTop: 2 }}>
                  <DateTimePicker value={tempDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') { if (event.type === 'set' && selectedDate) updateDate(d.id, selectedDate); setShowPicker(null); }
                      else { if (selectedDate) setTempDate(selectedDate); }
                    }}
                    themeVariant="dark" accentColor="#7c3aed" />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={() => updateDate(d.id, tempDate)} style={{ padding: 12, backgroundColor: '#7c3aed', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{t(lang, 'confirmDate')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── MINI SETTINGS ─────────────────────────────────────────────────────────────
function MiniSettings({ type, onBack }: { type: 'req' | 'nn'; onBack: () => void }) {
  const { requirements, setRequirements, nonNegs, setNonNegs, lang } = useApp();
  const [newLabel, setNewLabel] = useState('');
  const [newTrigger, setNewTrigger] = useState('');

  const addReq = () => { if (!newLabel.trim()) return; setRequirements([{ id: Date.now().toString(), label: newLabel.trim() }, ...requirements]); setNewLabel(''); };
  const addNN = () => { if (!newLabel.trim()) return; setNonNegs([{ id: Date.now().toString(), label: newLabel.trim(), trigger: newTrigger.trim() }, ...nonNegs]); setNewLabel(''); setNewTrigger(''); };
  const deleteReq = (id: string, label: string) => Alert.alert(t(lang, 'removeQ'), `"${label}"`,
    [{ text: t(lang, 'cancel'), style: 'cancel' }, { text: t(lang, 'remove'), style: 'destructive', onPress: () => setRequirements(requirements.filter((x: any) => x.id !== id)) }]);
  const deleteNN = (id: string, label: string) => Alert.alert(t(lang, 'removeQ'), `"${label}"`,
    [{ text: t(lang, 'cancel'), style: 'cancel' }, { text: t(lang, 'remove'), style: 'destructive', onPress: () => setNonNegs(nonNegs.filter((x: any) => x.id !== id)) }]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0612' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#2a1f3d' }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12, padding: 6, backgroundColor: '#1f1535', borderRadius: 10 }}>
          <Text style={{ color: '#c084fc', fontSize: 16, fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#f0e6ff' }}>
          {type === 'req' ? 'Requirements' : 'Non-Negotiables'}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TextInput value={newLabel} onChangeText={setNewLabel}
          placeholder={type === 'req' ? 'e.g. Has a dog' : 'e.g. Liar'}
          placeholderTextColor="#3d2d5a" returnKeyType={type === 'req' ? 'done' : 'next'}
          onSubmitEditing={type === 'req' ? addReq : undefined}
          style={{ backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 10, padding: 12, fontSize: 15, color: '#f0e6ff', marginBottom: type === 'nn' ? 8 : 12 }} />
        {type === 'nn' && (
          <TextInput value={newTrigger} onChangeText={setNewTrigger} placeholder="Trigger e.g. Lies to you"
            placeholderTextColor="#3d2d5a" returnKeyType="done" onSubmitEditing={addNN}
            style={{ backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 10, padding: 12, fontSize: 15, color: '#f0e6ff', marginBottom: 12 }} />
        )}
        {type === 'req' ? requirements.map((r: any) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1028', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a1f3d' }}>
            <Text style={{ flex: 1, fontSize: 15, color: '#f0e6ff' }}>{r.label}</Text>
            <TouchableOpacity onPress={() => deleteReq(r.id, r.label)}><Text style={{ fontSize: 16, color: '#f87171' }}>🗑️</Text></TouchableOpacity>
          </View>
        )) : nonNegs.map((nn: any) => (
          <View key={nn.id} style={{ backgroundColor: '#1a1028', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a1f3d', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: '#f0e6ff', fontWeight: '500' }}>{nn.label}</Text>
              {nn.trigger ? <Text style={{ fontSize: 13, color: '#7c6a9a', marginTop: 2 }}>{nn.trigger}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => deleteNN(nn.id, nn.label)}><Text style={{ fontSize: 16, color: '#f87171' }}>🗑️</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── CANDIDATE FORM ────────────────────────────────────────────────────────────
function CandidateForm({ initial, onSave, onCancel }: { initial?: any; onSave: (c: any) => void; onCancel: () => void }) {
  const { requirements, nonNegs, lang } = useApp();
  const [guy, setGuy] = useState(initial || emptyCandidate());
  const [tab, setTab] = useState<'scores' | 'check' | 'flags' | 'notes'>('scores');
  const [miniSettings, setMiniSettings] = useState<'req' | 'nn' | null>(null);

  const setScore = (k: string, v: number) => setGuy((g: any) => ({ ...g, scores: { ...g.scores, [k]: v } }));
  const toggleReq = (id: string) => setGuy((g: any) => ({ ...g, requirements: { ...g.requirements, [id]: !g.requirements[id] } }));
  const toggleNN = (id: string) => setGuy((g: any) => ({ ...g, nonNegotiables: { ...g.nonNegotiables, [id]: !g.nonNegotiables[id] } }));
  const toggleFlag = (f: string) => setGuy((g: any) => ({ ...g, flags: g.flags.includes(f) ? g.flags.filter((x: string) => x !== f) : [...g.flags, f] }));
  const disqualified = nonNegs.some((nn: any) => guy.nonNegotiables[nn.id]);
  const moods = ['😞', '😕', '😐', '🙂', '🤩'];

  if (miniSettings) return <MiniSettings type={miniSettings} onBack={() => setMiniSettings(null)} />;

  const tabLabels: Record<string, string> = {
    scores: t(lang, 'scores'), check: t(lang, 'check'), flags: 'Flags', notes: t(lang, 'notes')
  };

  const SaveCancel = () => (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
      <TouchableOpacity onPress={() => onSave(guy)} style={{ flex: 1, padding: 14, backgroundColor: '#7c3aed', borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{t(lang, 'saveRotation')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} style={{ paddingHorizontal: 18, padding: 14, backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ color: '#7c6a9a', fontSize: 16 }}>{t(lang, 'cancel')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0612' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#0a0612' }}>
        <TextInput value={guy.name} onChangeText={txt => setGuy((g: any) => ({ ...g, name: txt }))}
          placeholder={t(lang, 'namePlaceholder')} placeholderTextColor="#3d2d5a"
          style={{ backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 10, padding: 10, fontSize: 16, color: '#f0e6ff', marginBottom: 8 }} />
      </View>
      <View style={{ backgroundColor: '#0a0612', paddingHorizontal: 16, paddingBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['scores', 'check', 'flags', 'notes'] as const).map(tb => (
              <TouchableOpacity key={tb} onPress={() => setTab(tb)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: tab === tb ? '#7c3aed' : '#1f1535' }}>
                <Text style={{ color: tab === tb ? '#fff' : '#7c6a9a', fontSize: 14, fontWeight: tab === tb ? '700' : '400' }}>{tabLabels[tb]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>
        {tab === 'scores' && (
          <View>
            {SCORE_KEYS.map(k => <ScoreSlider key={k} label={SCORE_LABELS_GIRL[k]} emoji={SCORE_EMOJIS_GIRL[k]} value={guy.scores[k]} onChange={v => setScore(k, v)} />)}
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 15, color: '#7c6a9a', marginBottom: 8 }}>{t(lang, 'mood')}: {moods[guy.moodAfter - 1]}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(m => (
                  <TouchableOpacity key={m} onPress={() => setGuy((g: any) => ({ ...g, moodAfter: m }))}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: guy.moodAfter === m ? '#7c3aed' : '#2a1f3d', backgroundColor: guy.moodAfter === m ? '#2d1f4a' : 'transparent', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{moods[m - 1]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <DateLogSection guy={guy} setGuy={setGuy} lang={lang} />
            <SaveCancel />
          </View>
        )}
        {tab === 'check' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#f87171', fontWeight: '700', flex: 1 }}>{t(lang, 'nonNeg')}</Text>
              <TouchableOpacity onPress={() => setMiniSettings('nn')} style={{ backgroundColor: '#2a1f3d', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 }}>
                <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '700' }}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {nonNegs.map((nn: any) => (
              <TouchableOpacity key={nn.id} onPress={() => toggleNN(nn.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: guy.nonNegotiables[nn.id] ? '#f87171' : '#3d2d5a', backgroundColor: guy.nonNegotiables[nn.id] ? '#f87171' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {guy.nonNegotiables[nn.id] && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>x</Text>}
                </View>
                <Text style={{ fontSize: 15, color: guy.nonNegotiables[nn.id] ? '#f87171' : '#c4b5d4', flex: 1 }}>
                  {nn.label}{nn.trigger ? <Text style={{ opacity: 0.6 }}> — {nn.trigger}</Text> : null}
                </Text>
              </TouchableOpacity>
            ))}
            {disqualified && (
              <View style={{ backgroundColor: '#2a0d0d', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#f8717133' }}>
                <Text style={{ fontSize: 24, marginBottom: 6 }}>🚫</Text>
                <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 15 }}>{t(lang, 'autoDisq')}</Text>
              </View>
            )}
            <View style={{ borderTopWidth: 1, borderTopColor: '#2a1f3d', marginTop: 18, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 15, color: '#c084fc', fontWeight: '700' }}>{t(lang, 'requirements')}</Text>
                <TouchableOpacity onPress={() => setMiniSettings('req')} style={{ backgroundColor: '#2d1f4a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: '#c084fc', fontSize: 12, fontWeight: '700' }}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {requirements.map((req: any) => (
                  <TouchableOpacity key={req.id} onPress={() => toggleReq(req.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: '46%' }}>
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: guy.requirements[req.id] ? '#c084fc' : '#3d2d5a', backgroundColor: guy.requirements[req.id] ? '#7c3aed' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {guy.requirements[req.id] && <Text style={{ color: '#fff', fontSize: 13 }}>✓</Text>}
                    </View>
                    <Text style={{ fontSize: 15, color: guy.requirements[req.id] ? '#c084fc' : '#7c6a9a', flex: 1 }}>{req.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <SaveCancel />
          </View>
        )}
        {tab === 'flags' && (
          <View>
            <Text style={{ fontSize: 14, color: '#7c6a9a', marginBottom: 10 }}>{t(lang, 'flagsHint')}</Text>
            {FLAGS_GIRL.map((f: string) => {
              const isGreen = f.includes('✅');
              const active = guy.flags.includes(f);
              return (
                <TouchableOpacity key={f} onPress={() => toggleFlag(f)}
                  style={{ padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 6, borderColor: active ? (isGreen ? '#4ade80' : '#f87171') : '#2a1f3d', backgroundColor: active ? (isGreen ? '#0d2a1a' : '#2a0d0d') : '#1a1028' }}>
                  <Text style={{ fontSize: 15, color: active ? (isGreen ? '#4ade80' : '#f87171') : '#7c6a9a' }}>{f}</Text>
                </TouchableOpacity>
              );
            })}
            <SaveCancel />
          </View>
        )}
        {tab === 'notes' && (
          <View>
            <Text style={{ fontSize: 14, color: '#7c6a9a', marginBottom: 8 }}>{t(lang, 'notes')} / tea</Text>
            <TextInput value={guy.notes} onChangeText={txt => setGuy((g: any) => ({ ...g, notes: txt }))}
              placeholder="They showed up late but brought flowers... 😭"
              placeholderTextColor="#3d2d5a" multiline
              style={{ backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 12, padding: 14, fontSize: 15, color: '#c4b5d4', minHeight: 150, textAlignVertical: 'top' }} />
            <SaveCancel />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── ROSTER ────────────────────────────────────────────────────────────────────
function RosterScreen({ onAdd, onEdit }: { onAdd: () => void; onEdit: (c: any) => void }) {
  const { candidates, deleteCandidate, requirements, nonNegs, lang } = useApp();
  const moods = ['😞', '😕', '😐', '🙂', '🤩'];

  if (!candidates.length) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text style={{ fontSize: 52, marginBottom: 16 }}>💜</Text>
      <Text style={{ fontSize: 18, color: '#5c4a7a', marginBottom: 8, textAlign: 'center' }}>{t(lang, 'empty')}</Text>
      <Text style={{ fontSize: 15, color: '#3d2d5a', textAlign: 'center' }}>{t(lang, 'tapAdd')}</Text>
      <TouchableOpacity style={ro.fab} onPress={onAdd}><Text style={ro.fabText}>+</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {candidates.map(c => {
          const disq = nonNegs.some((nn: any) => c.nonNegotiables[nn.id]);
          const compat = getCompat(c, requirements, nonNegs);
          const gf = c.flags.filter((f: string) => f.includes('✅')).length;
          const rf = c.flags.filter((f: string) => f.includes('🚩')).length;
          const rawTox = disq ? 100 : (rf * 10) - (gf * 2);
          const tox = Math.min(100, Math.max(0, rawTox));
          const toxColors = ['#4ade80', '#a3e635', '#fbbf24', '#fb923c', '#f87171'];
          const toxIdx = tox < 20 ? 0 : tox < 40 ? 1 : tox < 60 ? 2 : tox < 80 ? 3 : 4;
          const toxLabels = disq ? ['RUN 🏃', 'RUN 🏃', 'RUN 🏃', 'RUN 🏃', 'RUN 🏃'] : ['Angel 😇', 'Borderline 😐', 'Yellow Flag 🟡', 'Red Alert 🚩', 'RUN 🏃'];
          const ringColor = disq ? '#f87171' : (c.color || '#a855f7');
          const dateCount = (c.dateLog || []).length || c.dates || 0;

          return (
            <View key={c.id} style={[ro.card, disq && { borderColor: '#f8717144' }]}>
              {disq && <View style={ro.disqBadge}><Text style={ro.disqText}>{t(lang, 'disq')}</Text></View>}
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={[ro.ring, { borderColor: ringColor }]}>
                  {disq ? <Text style={{ fontSize: 18 }}>🚫</Text> :
                    <><Text style={{ fontSize: 17, fontWeight: '800', color: ringColor }}>{compat}%</Text>
                      <Text style={{ fontSize: 9, color: '#7c6a9a' }}>match</Text></>}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[ro.name, { color: c.color || '#a855f7' }]} numberOfLines={1}>{c.name || 'Unnamed'}</Text>
                  <Text style={ro.meta}>{t(lang, 'added')} {c.addedDate} · {dateCount} {dateCount === 1 ? 'date' : 'dates'}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    <View style={ro.badgeG}><Text style={{ color: '#4ade80', fontSize: 12 }}>✅ {gf}</Text></View>
                    <View style={ro.badgeR}><Text style={{ color: '#f87171', fontSize: 12 }}>🚩 {rf}</Text></View>
                    <View style={ro.badgeP}><Text style={{ color: '#c084fc', fontSize: 12 }}>💜 {requirements.filter((r: any) => c.requirements[r.id]).length}/{requirements.length}</Text></View>
                    <View style={ro.badgeB}><Text style={{ color: '#818cf8', fontSize: 12 }}>{moods[c.moodAfter - 1]}</Text></View>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {SCORE_KEYS.map(k => {
                  const v = (c.scores as Record<string, number>)[k];
                  const col = scoreColor(v);
                  return (
                    <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, width: '46%' }}>
                      <Text style={{ fontSize: 11 }}>{SCORE_EMOJIS_GIRL[k]}</Text>
                      <View style={{ flex: 1, height: 4, backgroundColor: '#2a1f3d', borderRadius: 999 }}>
                        <View style={{ height: '100%', width: `${Math.max(v * 10, v === 0 ? 3 : 0)}%`, backgroundColor: col, borderRadius: 999 }} />
                      </View>
                      <Text style={{ fontSize: 12, color: col, minWidth: 14 }}>{v}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={{ fontSize: 12, color: '#7c6a9a', marginBottom: 3 }}>☢️ TOXICITY METER</Text>
              <View style={{ flexDirection: 'row', gap: 3, marginBottom: 3 }}>
                {[20, 40, 60, 80, 100].map((v, i) => (
                  <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: tox >= v - 19 ? (disq ? '#f87171' : toxColors[i]) : '#2a1f3d' }} />
                ))}
              </View>
              <Text style={{ fontSize: 13, color: disq ? '#f87171' : toxColors[toxIdx], fontWeight: '700', marginBottom: 8 }}>{toxLabels[toxIdx]}</Text>
              {c.notes ? <Text style={ro.notes}>"{c.notes}"</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={ro.editBtn} onPress={() => onEdit(c)}>
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>{t(lang, 'edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ro.deleteBtn} onPress={() => Alert.alert(t(lang, 'deleteQ'), `Remove ${c.name || 'this candidate'}?`,
                  [{ text: t(lang, 'cancel'), style: 'cancel' }, { text: t(lang, 'delete'), style: 'destructive', onPress: () => deleteCandidate(c.id) }])}>
                  <Text style={{ fontSize: 14 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={ro.fab} onPress={onAdd}><Text style={ro.fabText}>+</Text></TouchableOpacity>
    </View>
  );
}
const ro = StyleSheet.create({
  card: { backgroundColor: '#1a1028', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#3d2d5a' },
  disqBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#f87171', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  disqText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  ring: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: '#f0e6ff', marginBottom: 2 },
  meta: { fontSize: 12, color: '#7c6a9a', marginBottom: 6 },
  badgeG: { backgroundColor: '#0d2a1a', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeR: { backgroundColor: '#2a0d0d', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeP: { backgroundColor: '#1a1028', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeB: { backgroundColor: '#1a1a28', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  notes: { padding: 8, backgroundColor: '#130e1f', borderRadius: 8, fontSize: 13, color: '#a89bc0', fontStyle: 'italic', lineHeight: 20, marginTop: 6 },
  editBtn: { flex: 1, padding: 9, backgroundColor: '#2d1f4a', borderRadius: 10, alignItems: 'center' },
  deleteBtn: { padding: 9, paddingHorizontal: 14, backgroundColor: '#2a0d0d', borderRadius: 10, alignItems: 'center' },
  fab: { position: 'absolute', bottom: 28, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '300' },
});

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
function AnalyticsScreen() {
  const { candidates, requirements, nonNegs, lang } = useApp();
  const active = candidates.filter((c: any) => !nonNegs.some((nn: any) => c.nonNegotiables[nn.id]));
  const sorted = [...candidates].sort((a, b) => getCompat(b, requirements, nonNegs) - getCompat(a, requirements, nonNegs));
  const moods = ['😞', '😕', '😐', '🙂', '🤩'];

  if (!candidates.length) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
      <Text style={{ color: '#7c6a9a', fontSize: 16 }}>{t(lang, 'addMore')}</Text>
    </View>
  );

  const bestMatch = active.length ? [...active].sort((a, b) => getCompat(b, requirements, nonNegs) - getCompat(a, requirements, nonNegs))[0] : candidates[0];
  const mostDates = [...candidates].sort((a: any, b: any) => ((b.dateLog || []).length || b.dates || 0) - ((a.dateLog || []).length || a.dates || 0))[0];
  const mostToxic = [...candidates].sort((a: any, b: any) => {
    const tox = (c: any) => (c.flags.filter((f: string) => f.includes('🚩')).length * 10) - (c.flags.filter((f: string) => f.includes('✅')).length * 2);
    return tox(b) - tox(a);
  })[0];
  const bestMood = [...candidates].sort((a: any, b: any) => b.moodAfter - a.moodAfter)[0];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Total', value: candidates.length, emoji: '👥' },
          { label: 'Active', value: active.length, emoji: '✅' },
          { label: 'Out', value: candidates.length - active.length, emoji: '🚫' },
        ].map(s => (
          <View key={s.label} style={{ flex: 1, backgroundColor: '#1a1028', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#2a1f3d' }}>
            <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#f0e6ff' }}>{s.value}</Text>
            <Text style={{ fontSize: 11, color: '#7c6a9a' }}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: '#1a1028', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2a1f3d', marginBottom: 14 }}>
        <Text style={{ fontSize: 12, color: '#7c6a9a', marginBottom: 12, letterSpacing: 1 }}>{t(lang, 'ranking')}</Text>
        {sorted.map((c: any) => {
          const compat = getCompat(c, requirements, nonNegs);
          const disq = nonNegs.some((nn: any) => c.nonNegotiables[nn.id]);
          const col = disq ? '#f87171' : (c.color || '#a855f7');
          return (
            <View key={c.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: col, fontWeight: '700' }} numberOfLines={1}>{c.name || 'Unnamed'}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: col }}>{disq ? '🚫 OUT' : `${compat}%`}</Text>
              </View>
              <View style={{ height: 7, backgroundColor: '#2a1f3d', borderRadius: 999 }}>
                {disq
                  ? <View style={{ height: '100%', width: '100%', backgroundColor: '#f8717133', borderRadius: 999 }} />
                  : <View style={{ height: '100%', width: `${compat}%`, backgroundColor: col, borderRadius: 999 }} />
                }
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1, backgroundColor: '#1a1028', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2a1f3d' }}>
          <Text style={{ fontSize: 12, color: '#7c6a9a', marginBottom: 12, letterSpacing: 1 }}>{t(lang, 'avgMood')}</Text>
          {active.length === 0 ? (
            <Text style={{ color: '#4a3f62', fontSize: 12, textAlign: 'center' }}>No active candidates</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {active.map((c: any) => {
                const col = c.color || '#a855f7';
                const size = 44;
                return (
                  <View key={c.id} style={{ alignItems: 'center', gap: 4 }}>
                    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: col + '22', borderWidth: 2, borderColor: col, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 18 }}>{moods[c.moodAfter - 1]}</Text>
                    </View>
                    <Text style={{ fontSize: 9, color: col, fontWeight: '600' }} numberOfLines={1}>{(c.name || '?').split(' ')[0]}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        <View style={{ flex: 1, backgroundColor: '#1a1028', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2a1f3d' }}>
          <Text style={{ fontSize: 12, color: '#7c6a9a', marginBottom: 10, letterSpacing: 1 }}>{t(lang, 'quickStats')}</Text>
          {[
            { label: t(lang, 'bestMatch'), candidate: bestMatch },
            { label: t(lang, 'mostDates'), candidate: mostDates },
            { label: t(lang, 'mostToxic'), candidate: mostToxic },
            { label: t(lang, 'bestMood'), candidate: bestMood },
          ].map(s => {
            const col = s.candidate?.color || '#7c6a9a';
            return (
              <View key={s.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 10, color: '#7c6a9a', flex: 1 }}>{s.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
                  <Text style={{ fontSize: 11, color: col, fontWeight: '700' }} numberOfLines={1}>{s.candidate?.name || '-'}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

// ── REQS SCREEN ───────────────────────────────────────────────────────────────
function ReqsScreen() {
  const { lang, requirements, setRequirements, nonNegs, setNonNegs, resetAll } = useApp();
  const [tab, setTab] = useState<'req' | 'nn'>('req');
  const [newReq, setNewReq] = useState('');
  const [newNN, setNewNN] = useState('');
  const [newNNTrigger, setNewNNTrigger] = useState('');

  const addReq = () => { if (!newReq.trim()) return; setRequirements([{ id: Date.now().toString(), label: newReq.trim() }, ...requirements]); setNewReq(''); };
  const addNN = () => { if (!newNN.trim()) return; setNonNegs([{ id: Date.now().toString(), label: newNN.trim(), trigger: newNNTrigger.trim() }, ...nonNegs]); setNewNN(''); setNewNNTrigger(''); };
  const deleteReq = (id: string, label: string) => Alert.alert(t(lang, 'removeQ'), `"${label}"`,
    [{ text: t(lang, 'cancel'), style: 'cancel' }, { text: t(lang, 'remove'), style: 'destructive', onPress: () => setRequirements(requirements.filter((x: any) => x.id !== id)) }]);
  const deleteNN = (id: string, label: string) => Alert.alert(t(lang, 'removeQ'), `"${label}"`,
    [{ text: t(lang, 'cancel'), style: 'cancel' }, { text: t(lang, 'remove'), style: 'destructive', onPress: () => setNonNegs(nonNegs.filter((x: any) => x.id !== id)) }]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#0a0612' }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: tab === 'req' ? '#7c3aed' : '#1a1028' }} onPress={() => setTab('req')}>
            <Text style={{ color: tab === 'req' ? '#fff' : '#7c6a9a', fontSize: 14, fontWeight: tab === 'req' ? '700' : '400' }}>💜 {t(lang, 'reqs')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: tab === 'nn' ? '#f87171' : '#1a1028' }} onPress={() => setTab('nn')}>
            <Text style={{ color: tab === 'nn' ? '#fff' : '#7c6a9a', fontSize: 14, fontWeight: tab === 'nn' ? '700' : '400' }}>⛔ {t(lang, 'nn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {tab === 'req' && (
          <View>
            <Text style={{ fontSize: 13, color: '#7c6a9a', marginBottom: 12, lineHeight: 18 }}>Things you need from a partner. Checked in the candidate form.</Text>
            <TextInput value={newReq} onChangeText={setNewReq} placeholder={t(lang, 'typeEnter')}
              placeholderTextColor="#3d2d5a" returnKeyType="done" onSubmitEditing={addReq}
              style={{ backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 10, padding: 12, fontSize: 15, color: '#f0e6ff', marginBottom: 12 }} />
            {requirements.map((r: any) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1028', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a1f3d' }}>
                <Text style={{ flex: 1, fontSize: 15, color: '#f0e6ff' }}>{r.label}</Text>
                <TouchableOpacity onPress={() => deleteReq(r.id, r.label)}><Text style={{ fontSize: 16, color: '#f87171' }}>🗑️</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {tab === 'nn' && (
          <View>
            <Text style={{ fontSize: 13, color: '#7c6a9a', marginBottom: 12, lineHeight: 18 }}>Deal-breakers. One strike and they are out.</Text>
            <TextInput value={newNN} onChangeText={setNewNN} placeholder="Label e.g. Liar"
              placeholderTextColor="#3d2d5a"
              style={{ backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 10, padding: 12, fontSize: 15, color: '#f0e6ff', marginBottom: 8 }} />
            <TextInput value={newNNTrigger} onChangeText={setNewNNTrigger} placeholder="Trigger e.g. Lies to you"
              placeholderTextColor="#3d2d5a" returnKeyType="done" onSubmitEditing={addNN}
              style={{ backgroundColor: '#1f1535', borderWidth: 1, borderColor: '#3d2d5a', borderRadius: 10, padding: 12, fontSize: 15, color: '#f0e6ff', marginBottom: 12 }} />
            {nonNegs.map((nn: any) => (
              <View key={nn.id} style={{ backgroundColor: '#1a1028', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a1f3d', flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: '#f0e6ff', fontWeight: '500' }}>{nn.label}</Text>
                  {nn.trigger ? <Text style={{ fontSize: 13, color: '#7c6a9a', marginTop: 2 }}>{nn.trigger}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => deleteNN(nn.id, nn.label)}><Text style={{ fontSize: 16, color: '#f87171' }}>🗑️</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#2a1f3d', paddingTop: 20 }}>
          <TouchableOpacity onPress={() => Alert.alert(t(lang, 'resetQ'), t(lang, 'resetMsg'),
            [{ text: t(lang, 'cancel'), style: 'cancel' }, { text: t(lang, 'reset'), style: 'destructive', onPress: resetAll }])}
            style={{ padding: 12, backgroundColor: '#2a0d0d', borderRadius: 12, borderWidth: 1, borderColor: '#f8717133', alignItems: 'center' }}>
            <Text style={{ color: '#f87171', fontSize: 15, fontWeight: '700' }}>{t(lang, 'reset')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ── SETTINGS BOTTOM SHEET ─────────────────────────────────────────────────────
function SettingsSheet({ visible, onClose, notifOn, onToggleNotif, onLogout, onDeleteAccount }: {
  visible: boolean;
  onClose: () => void;
  notifOn: boolean;
  onToggleNotif: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = async () => {
    setDeleted(true);
    setTimeout(() => {
      setDeleteConfirm(false);
      setDeleted(false);
      onClose();
      onDeleteAccount();
    }, 1800);
  };

  const handleClose = () => {
    setDeleteConfirm(false);
    setDeleted(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <View style={ss.sheet}>
              {/* Handle bar */}
              <View style={ss.handle} />

              {deleted ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ fontSize: 40, marginBottom: 10 }}>✅</Text>
                  <Text style={{ color: '#f0e6ff', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Account deleted</Text>
                  <Text style={{ color: '#7c6a9a', fontSize: 13, textAlign: 'center' }}>Your data has been permanently removed.</Text>
                </View>
              ) : deleteConfirm ? (
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>⚠️</Text>
                  <Text style={{ color: '#f87171', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Delete account?</Text>
                  <Text style={{ color: '#7c6a9a', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                    All your data will be permanently removed.
                  </Text>
                  <TouchableOpacity onPress={handleDelete} style={ss.deleteConfirmBtn}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Yes, delete everything</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeleteConfirm(false)} style={ss.cancelBtn}>
                    <Text style={{ color: '#7c6a9a', fontSize: 15 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={ss.title}>⚙️ Settings</Text>

                  {/* Notifications */}
                  <View style={ss.row}>
                    <Text style={ss.rowLabel}>🔔 Notifications</Text>
                    <TouchableOpacity onPress={onToggleNotif}
                      style={[ss.toggle, { backgroundColor: notifOn ? '#7c3aed' : '#2a1f3d' }]}>
                      <View style={[ss.toggleThumb, { alignSelf: notifOn ? 'flex-end' : 'flex-start' }]} />
                    </TouchableOpacity>
                  </View>

                  <View style={ss.divider} />

                  {/* Log out */}
                  <TouchableOpacity style={ss.row} onPress={() => { handleClose(); onLogout(); }}>
                    <Text style={ss.rowLabel}>🚪 Log Out</Text>
                    <Ionicons name="chevron-forward" size={16} color="#4a3f62" />
                  </TouchableOpacity>

                  <View style={ss.divider} />

                  {/* Delete account */}
                  <TouchableOpacity style={ss.deleteRow} onPress={() => setDeleteConfirm(true)}>
                    <Text style={ss.deleteLabel}>🗑️ Delete Account</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const ss = StyleSheet.create({
  sheet: { backgroundColor: '#1a1028', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, borderTopWidth: 0.5, borderColor: '#3a2a5a' },
  handle: { width: 40, height: 4, backgroundColor: '#3a2a5a', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 17, fontWeight: '700', color: '#f0e6ff', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowLabel: { fontSize: 15, color: '#f0e6ff' },
  divider: { height: 0.5, backgroundColor: '#2a1f3d' },
  toggle: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  deleteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginTop: 8, backgroundColor: '#2a0d0d', borderRadius: 12, paddingHorizontal: 14, borderWidth: 0.5, borderColor: '#f8717133' },
  deleteLabel: { fontSize: 15, color: '#f87171', fontWeight: '700' },
  deleteConfirmBtn: { backgroundColor: '#f87171', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%', marginBottom: 10 },
  cancelBtn: { borderWidth: 0.5, borderColor: '#3a2a5a', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
});

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function MainApp({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const { candidates, addCandidate, updateCandidate, lang } = useApp();
  const [view, setView] = useState<'roster' | 'analytics' | 'reqs'>('roster');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [notifOn, setNotifOn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('notifOn').then(v => { if (v === 'true') setNotifOn(true); });
  }, []);

  useEffect(() => {
    const checkInactivity = async () => {
      const lastActive = await AsyncStorage.getItem('lastActive');
      if (lastActive) {
        const diff = Date.now() - parseInt(lastActive);
        if (diff > 72 * 60 * 60 * 1000) { onLogout(); return; }
      }
      await AsyncStorage.setItem('lastActive', Date.now().toString());
    };
    checkInactivity();
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') AsyncStorage.setItem('lastActive', Date.now().toString());
    });
    return () => sub.remove();
  }, []);

  const toggleNotif = async () => {
    if (!notifOn) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Enable notifications in your device settings.');
          return;
        }
        await scheduleWeeklyRecap(candidates);
        setNotifOn(true);
        await AsyncStorage.setItem('notifOn', 'true');
      } catch {
        Alert.alert('Unavailable', 'Could not schedule notifications on this device.');
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotifOn(false);
      await AsyncStorage.setItem('notifOn', 'false');
    }
  };

  useEffect(() => {
    if (notifOn) scheduleWeeklyRecap(candidates);
  }, [candidates, notifOn]);

  const handleSave = (c: any) => {
    const finalCandidate = editing
      ? c
      : { ...c, color: c.color || CANDIDATE_COLORS[candidates.length % CANDIDATE_COLORS.length] };
    if (editing) updateCandidate(finalCandidate); else addCandidate(finalCandidate);
    setShowForm(false); setEditing(null);
  };

  const handleDeleteAccount = async () => {
    await AsyncStorage.clear();
    onLogout();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0612' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0612" />
      <SafeAreaView style={{ backgroundColor: '#0a0612' }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4, alignItems: 'center', position: 'relative' }}>
          {/* Gear icon — same position as bell was */}
          <TouchableOpacity onPress={() => setShowSettings(true)} style={{ position: 'absolute', right: 16, top: 10 }}>
            <Ionicons name="settings-outline" size={20} color="#7c6a9a" />
          </TouchableOpacity>
          <Text style={{ fontSize: 11, letterSpacing: 3, color: '#a855f7', textTransform: 'uppercase', marginBottom: 1 }}>SITUATIONSHIP TRACKER™</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#f0e6ff', letterSpacing: -1 }}>The Rotation</Text>
          {!showForm && <Text style={{ fontSize: 12, color: '#7c6a9a', marginTop: 1 }}>{t(lang, 'hey')}, {userName} 💜</Text>}
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}>
          {(['roster', 'analytics', 'reqs'] as const).map(v => (
            <TouchableOpacity key={v} onPress={() => { setView(v); setShowForm(false); setEditing(null); }}
              style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: view === v && !showForm ? '#a855f7' : '#1a1028' }}>
              <Text style={{ fontSize: 13, color: view === v && !showForm ? '#fff' : '#7c6a9a', fontWeight: view === v && !showForm ? '700' : '400' }}>
                {v === 'roster' ? '👥 Roster' : v === 'analytics' ? '📊 Analytics' : '💜 Reqs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        {showForm ? (
          <CandidateForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
        ) : view === 'roster' ? (
          <RosterScreen onAdd={() => { setEditing(null); setShowForm(true); }} onEdit={c => { setEditing(c); setShowForm(true); }} />
        ) : view === 'analytics' ? (
          <AnalyticsScreen />
        ) : (
          <ReqsScreen />
        )}
      </View>

      {!showForm && view === 'roster' && (
        <TouchableOpacity onPress={() => { setEditing(null); setShowForm(true); }}
          style={{ position: 'absolute', bottom: 28, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '300' }}>+</Text>
        </TouchableOpacity>
      )}

      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        notifOn={notifOn}
        onToggleNotif={toggleNotif}
        onLogout={onLogout}
        onDeleteAccount={handleDeleteAccount}
      />
    </View>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
function AppContent() {
  const [screen, setScreen] = useState<'loading' | 'splash' | 'login' | 'main'>('loading');
  const [userName, setUserName] = useState('');

  useEffect(() => { setScreen('splash'); }, []);

  const handleSplashDone = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        const lastActive = await AsyncStorage.getItem('lastActive');
        if (lastActive && Date.now() - parseInt(lastActive) > 72 * 60 * 60 * 1000) {
          setScreen('login'); return;
        }
        setUserName(u.name);
        setScreen('main');
      } else {
        setScreen('login');
      }
    } catch { setScreen('login'); }
  };

  const handleLogin = async (name: string) => {
    setUserName(name);
    await AsyncStorage.setItem('lastActive', Date.now().toString());
    setScreen('main');
    try {
      const asked = await AsyncStorage.getItem('notifAsked');
      if (!asked) {
        await AsyncStorage.setItem('notifAsked', 'true');
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await AsyncStorage.setItem('notifOn', 'true');
        }
      }
    } catch {}
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('lastActive');
    setScreen('login');
  };

  if (screen === 'loading') return (
    <View style={{ flex: 1, backgroundColor: '#0a0612', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 40 }}>💜</Text>
    </View>
  );
  if (screen === 'splash') return <SplashScreen onEnter={handleSplashDone} />;
  if (screen === 'login') return <LoginScreen onLogin={handleLogin} />;
  return <MainApp userName={userName} onLogout={handleLogout} />;
}

export default function Index() {
  return <AppProvider><AppContent /></AppProvider>;
}
