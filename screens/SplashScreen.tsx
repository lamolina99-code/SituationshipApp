// screens/SplashScreen.tsx
import React, { useEffect, useState } from "react";
import {
    Animated,
    SafeAreaView,
    StyleSheet,
    Text, TouchableOpacity,
    View
} from "react-native";
import { PHRASES } from "../constants/data";
import { useApp } from "../context/AppContext";

export default function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const { lang, setLang, gender, setGender } = useApp();
  const [phraseIdx, setPhraseIdx] = useState(Math.floor(Math.random() * PHRASES.length));
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setPhraseIdx(i => (i + 1) % PHRASES.length), 400);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const t = lang === "en" ? {
    tag: "SITUATIONSHIP TRACKER™",
    title: "The Rotation",
    iAmA: "I am a...",
    girl: "Girl 💜", guy: "Guy 💛",
    enter: "Enter The Rotation →",
    disclaimer: "No candidates will be harmed.\n(Emotionally, that's on you.) 💜",
  } : {
    tag: "SITUATIONSHIP TRACKER™",
    title: "The Rotation",
    iAmA: "Soy...",
    girl: "Chica 💜", guy: "Chico 💛",
    enter: "Entrar a The Rotation →",
    disclaimer: "Ningún candidato será dañado.\n(Emocionalmente, eso es problema tuyo.) 💜",
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Lang toggle */}
      <TouchableOpacity style={s.langBtn} onPress={() => setLang(lang === "en" ? "es" : "en")}>
        <Text style={s.langText}>{lang === "en" ? "ES" : "EN"}</Text>
      </TouchableOpacity>

      {/* Heart */}
      <Text style={s.heart}>{gender === "guy" ? "💛" : "💜"}</Text>

      {/* Tag */}
      <Text style={s.tag}>{t.tag}</Text>

      {/* Title */}
      <Text style={s.title}>{t.title}</Text>

      {/* Rotating phrase */}
      <Animated.View style={[s.phraseBox, { opacity: fadeAnim }]}>
        <Text style={s.phrase}>"{PHRASES[phraseIdx]}"</Text>
      </Animated.View>

      {/* Gender picker */}
      <Text style={s.iAmA}>{t.iAmA}</Text>
      <View style={s.genderRow}>
        {(["girl", "guy"] as const).map(g => (
          <TouchableOpacity
            key={g}
            style={[s.genderBtn, gender === g && s.genderBtnActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[s.genderBtnText, gender === g && s.genderBtnTextActive]}>
              {g === "girl" ? t.girl : t.guy}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[s.enterBtn, !gender && s.enterBtnDisabled]}
        onPress={() => gender && onEnter()}
      >
        <Text style={s.enterBtnText}>{t.enter}</Text>
      </TouchableOpacity>

      <Text style={s.disclaimer}>{t.disclaimer}</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0612", alignItems: "center", justifyContent: "center", padding: 24 },
  langBtn: { position: "absolute", top: 50, right: 20, borderWidth: 1, borderColor: "#2a1f3d", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  langText: { color: "#4a3f62", fontSize: 11, fontWeight: "600" },
  heart: { fontSize: 52, marginBottom: 8 },
  tag: { fontSize: 11, letterSpacing: 4, color: "#7c3aed", textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 40, fontWeight: "800", color: "#f0e6ff", letterSpacing: -1, marginBottom: 16 },
  phraseBox: { minHeight: 50, paddingHorizontal: 20, marginBottom: 24, alignItems: "center" },
  phrase: { fontSize: 16, color: "#c4b5d4", fontStyle: "italic", textAlign: "center", lineHeight: 24 },
  iAmA: { fontSize: 15, color: "#7c6a9a", marginBottom: 12, fontWeight: "500" },
  genderRow: { flexDirection: "row", gap: 12, marginBottom: 28, width: "100%", maxWidth: 320 },
  genderBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: "#2a1f3d", backgroundColor: "#1a1028", alignItems: "center" },
  genderBtnActive: { borderColor: "#7c3aed", backgroundColor: "#2d1f4a" },
  genderBtnText: { fontSize: 18, color: "#7c6a9a", fontWeight: "400" },
  genderBtnTextActive: { color: "#f0e6ff", fontWeight: "700" },
  enterBtn: { backgroundColor: "#7c3aed", paddingHorizontal: 36, paddingVertical: 16, borderRadius: 16, marginBottom: 16 },
  enterBtnDisabled: { backgroundColor: "#2a1f3d" },
  enterBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  disclaimer: { fontSize: 12, color: "#3d2d5a", textAlign: "center", lineHeight: 18 },
});
