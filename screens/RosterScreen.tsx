// screens/RosterScreen.tsx
import React from "react";
import {
    Alert, SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SCORE_EMOJIS_GIRL, SCORE_EMOJIS_GUY, SCORE_KEYS, scoreColor } from "../constants/data";
import { useApp } from "../context/AppContext";

function CompatRing({ score, disqualified }: { score: number; disqualified: boolean }) {
  const color = disqualified ? "#f87171" : score >= 80 ? "#4ade80" : score >= 60 ? "#fbbf24" : score >= 40 ? "#fb923c" : "#f87171";
  return (
    <View style={r.ringContainer}>
      <View style={[r.ringOuter, { borderColor: "#2a1f3d" }]}>
        <View style={[r.ringInner, { borderColor: color }]}>
          {disqualified
            ? <Text style={{ fontSize: 18 }}>🚫</Text>
            : <>
                <Text style={[r.ringPct, { color }]}>{score}%</Text>
                <Text style={r.ringLabel}>match</Text>
              </>
          }
        </View>
      </View>
    </View>
  );
}

export default function RosterScreen({ onAdd, onEdit }: { onAdd: () => void; onEdit: (c: any) => void }) {
  const { candidates, deleteCandidate, requirements, nonNegs, gender, lang } = useApp();
  const scoreEmojis = gender === "girl" ? SCORE_EMOJIS_GIRL : SCORE_EMOJIS_GUY;
  const t = lang === "en" ? {
    empty: "The rotation is empty.", hint: "Tap + to add your first candidate 👇",
    edit: "✏️ Edit", added: "Added", disq: "DISQUALIFIED", out: "OUT 🚫",
    green: "green", red: "red", mood: "mood",
  } : {
    empty: "La rotación está vacía.", hint: "Toca + para agregar tu primer candidato 👇",
    edit: "✏️ Editar", added: "Agregado", disq: "DESCALIFICADO", out: "FUERA 🚫",
    green: "green", red: "red", mood: "mood",
  };

  const getCompat = (c: any) => {
    if (nonNegs.some(nn => c.nonNegotiables[nn.id])) return 0;
    const avg = Object.values(c.scores as Record<string,number>).reduce((a, b) => a + b, 0) / SCORE_KEYS.length;
    const reqMet = requirements.filter(r => c.requirements[r.id]).length;
    return Math.round(avg * 0.6 + (reqMet / Math.max(1, requirements.length)) * 40);
  };

  const moods = ["😞","😕","😐","🙂","🤩"];

  if (!candidates.length) {
    return (
      <SafeAreaView style={r.container}>
        <View style={r.empty}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>{gender === "guy" ? "💛" : "💜"}</Text>
          <Text style={r.emptyTitle}>{t.empty}</Text>
          <Text style={r.emptyHint}>{t.hint}</Text>
        </View>
        <TouchableOpacity style={r.fab} onPress={onAdd}>
          <Text style={r.fabText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={r.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {candidates.map(c => {
          const disq = nonNegs.some(nn => c.nonNegotiables[nn.id]);
          const compat = getCompat(c);
          const gf = c.flags.filter((f: string) => f.startsWith("✅")).length;
          const rf = c.flags.filter((f: string) => f.startsWith("🚩")).length;
          const tox = Math.round((rf / Math.max(1, rf + gf)) * 100);
          const toxColors = ["#4ade80","#a3e635","#fbbf24","#fb923c","#f87171"];
          const toxIdx = tox < 20 ? 0 : tox < 40 ? 1 : tox < 60 ? 2 : tox < 80 ? 3 : 4;
          const toxLabels = lang === "en"
            ? ["Angel 😇","Borderline 😐","Yellow Flag 🟡","Red Alert 🚩","RUN 🏃"]
            : ["Angelito 😇","En el límite 😐","Flag amarilla 🟡","Alerta roja 🚩","CORRE 🏃"];

          return (
            <View key={c.id} style={[r.card, disq && r.cardDisq]}>
              {disq && <View style={r.disqBadge}><Text style={r.disqText}>{t.disq}</Text></View>}
              <View style={r.cardHeader}>
                <CompatRing score={compat} disqualified={disq} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={r.name} numberOfLines={1}>{c.name || "Unnamed"}</Text>
                  <Text style={r.meta}>{t.added} {c.addedDate} · {c.dates} dates</Text>
                  <View style={r.badges}>
                    <View style={r.badgeGreen}><Text style={r.badgeGreenText}>✅ {gf}</Text></View>
                    <View style={r.badgeRed}><Text style={r.badgeRedText}>🚩 {rf}</Text></View>
                    <View style={r.badgePurple}><Text style={r.badgePurpleText}>💜 {requirements.filter(req => c.requirements[req.id]).length}/{requirements.length}</Text></View>
                    <View style={r.badgeBlue}><Text style={r.badgeBlueText}>{moods[c.moodAfter - 1]}</Text></View>
                  </View>
                </View>
              </View>

              {/* Score bars */}
              <View style={r.scoresGrid}>
                {SCORE_KEYS.map(k => {
                  const v = (c.scores as Record<string,number>)[k];
                  const col = scoreColor(v);
                  return (
                    <View key={k} style={r.scoreRow}>
                      <Text style={{ fontSize: 11 }}>{scoreEmojis[k]}</Text>
                      <View style={r.scoreBarBg}>
                        <View style={[r.scoreBarFill, { width: `${Math.max(v * 10, v === 0 ? 3 : 0)}%` as any, backgroundColor: col }]} />
                      </View>
                      <Text style={[r.scoreVal, { color: col }]}>{v}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Toxicity */}
              <View style={{ marginTop: 8 }}>
                <Text style={r.toxLabel}>☢️ TOXICITY METER</Text>
                <View style={r.toxBars}>
                  {[20,40,60,80,100].map((v,i) => (
                    <View key={i} style={[r.toxBar, { backgroundColor: tox >= v - 19 ? toxColors[i] : "#2a1f3d" }]} />
                  ))}
                </View>
                <Text style={[r.toxLevel, { color: toxColors[toxIdx] }]}>{toxLabels[toxIdx]}</Text>
              </View>

              {c.notes ? <Text style={r.notes}>"{c.notes}"</Text> : null}

              <View style={r.cardBtns}>
                <TouchableOpacity style={r.editBtn} onPress={() => onEdit(c)}>
                  <Text style={r.editBtnText}>{t.edit}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={r.deleteBtn} onPress={() => {
                  Alert.alert("Delete?", `Remove ${c.name || "this candidate"}?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete 🗑️", style: "destructive", onPress: () => deleteCandidate(c.id) }
                  ]);
                }}>
                  <Text style={r.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={r.fab} onPress={onAdd}>
        <Text style={r.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const r = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0612" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 18, color: "#5c4a7a", marginBottom: 8, textAlign: "center" },
  emptyHint: { fontSize: 15, color: "#3d2d5a", textAlign: "center" },
  card: { backgroundColor: "#1a1028", borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#3d2d5a" },
  cardDisq: { borderColor: "#f8717144" },
  disqBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "#f87171", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  disqText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  cardHeader: { flexDirection: "row", marginBottom: 12 },
  ringContainer: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  ringOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, alignItems: "center", justifyContent: "center" },
  ringInner: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  ringPct: { fontSize: 16, fontWeight: "800", lineHeight: 18 },
  ringLabel: { fontSize: 10, color: "#7c6a9a" },
  name: { fontSize: 20, fontWeight: "800", color: "#f0e6ff", marginBottom: 2 },
  meta: { fontSize: 12, color: "#7c6a9a", marginBottom: 6 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  badgeGreen: { backgroundColor: "#0d2a1a", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeGreenText: { color: "#4ade80", fontSize: 12 },
  badgeRed: { backgroundColor: "#2a0d0d", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeRedText: { color: "#f87171", fontSize: 12 },
  badgePurple: { backgroundColor: "#1a1028", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgePurpleText: { color: "#c084fc", fontSize: 12 },
  badgeBlue: { backgroundColor: "#1a1a28", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeBlueText: { color: "#818cf8", fontSize: 12 },
  scoresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 4, width: "48%" },
  scoreBarBg: { flex: 1, height: 4, backgroundColor: "#2a1f3d", borderRadius: 999 },
  scoreBarFill: { height: "100%", borderRadius: 999 },
  scoreVal: { fontSize: 11, minWidth: 14 },
  toxLabel: { fontSize: 12, color: "#7c6a9a", marginBottom: 3 },
  toxBars: { flexDirection: "row", gap: 3, marginBottom: 3 },
  toxBar: { flex: 1, height: 5, borderRadius: 3 },
  toxLevel: { fontSize: 13, fontWeight: "700" },
  notes: { marginTop: 8, padding: 8, backgroundColor: "#130e1f", borderRadius: 8, fontSize: 13, color: "#a89bc0", fontStyle: "italic", lineHeight: 20 },
  cardBtns: { flexDirection: "row", gap: 8, marginTop: 12 },
  editBtn: { flex: 1, padding: 9, backgroundColor: "#2d1f4a", borderRadius: 10, alignItems: "center" },
  editBtnText: { color: "#c084fc", fontSize: 14, fontWeight: "700" },
  deleteBtn: { padding: 9, paddingHorizontal: 14, backgroundColor: "#2a0d0d", borderRadius: 10, alignItems: "center" },
  deleteBtnText: { fontSize: 14 },
  fab: { position: "absolute", bottom: 28, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center" },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 32, fontWeight: "300" },
});
