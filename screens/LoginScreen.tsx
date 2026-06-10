// screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView, Text, TextInput, TouchableOpacity,
  StyleSheet, View, ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from "react-native";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      onLogin();
    } catch (e: any) {
      const msg =
        e.code === "auth/invalid-email" ? "Invalid email address." :
        e.code === "auth/wrong-password" ? "Incorrect password." :
        e.code === "auth/user-not-found" ? "No account found with this email." :
        e.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        e.code === "auth/weak-password" ? "Password must be at least 6 characters." :
        "Something went wrong. Please try again.";
      Alert.alert("Error", msg);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.inner}>
        <Text style={s.heart}>💜</Text>
        <Text style={s.tag}>SITUATIONSHIP TRACKER™</Text>
        <Text style={s.title}>The Rotation</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>
            {mode === "login" ? "Welcome back 👋" : "Create account ✨"}
          </Text>

          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor="#4a3f62"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor="#4a3f62"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={s.btn} onPress={handle} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>{mode === "login" ? "Log In" : "Create Account"}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
            <Text style={s.switchText}>
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0612" },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  heart: { fontSize: 48, marginBottom: 8 },
  tag: { fontSize: 11, letterSpacing: 4, color: "#7c3aed", textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 40, fontWeight: "800", color: "#f0e6ff", letterSpacing: -1, marginBottom: 32 },
  card: { width: "100%", maxWidth: 360, backgroundColor: "#1a1028", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#2a1f3d" },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#f0e6ff", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#110b1e", borderRadius: 12, borderWidth: 1, borderColor: "#2a1f3d", color: "#f0e6ff", fontSize: 16, padding: 14, marginBottom: 12 },
  btn: { backgroundColor: "#7c3aed", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 14 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchText: { color: "#7c6a9a", fontSize: 14, textAlign: "center" },
});
