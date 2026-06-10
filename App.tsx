// App.tsx - Main entry point
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { AppProvider, useApp } from "./context/AppContext";
import SplashScreen from "./screens/SplashScreen";
import RosterScreen from "./screens/RosterScreen";
import LoginScreen from "./screens/LoginScreen";

function AnalyticsScreen() {
  const { lang } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0612", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
      <Text style={{ color: "#7c6a9a", fontSize: 16 }}>
        {lang === "en" ? "Analytics coming soon!" : "Analytics próximamente!"}
      </Text>
    </SafeAreaView>
  );
}

function SettingsScreen() {
  const { lang, setLang, gender, setGender, resetAll, logout, deleteAccount } = useApp();
  const t = lang === "en"
    ? { title: "Settings ⚙️", reset: "Reset all data", logout: "Log Out", deleteAccount: "Delete Account", deleteConfirm: "This will permanently delete your account and all data. This cannot be undone.", deleteBtn: "Delete Account 🗑️" }
    : { title: "Configuración ⚙️", reset: "Borrar todos los datos", logout: "Cerrar sesión", deleteAccount: "Eliminar cuenta", deleteConfirm: "Esto eliminará permanentemente tu cuenta y todos los datos. Esto no se puede deshacer.", deleteBtn: "Eliminar cuenta 🗑️" };

  const handleDeleteAccount = () => {
    const { Alert } = require("react-native");
    Alert.alert(
      t.deleteAccount,
      t.deleteConfirm,
      [
        { text: lang === "en" ? "Cancel" : "Cancelar", style: "cancel" },
        {
          text: t.deleteBtn,
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (e: any) {
              const { Alert: A } = require("react-native");
              A.alert("Error", lang === "en" ? "Could not delete account. Please log out and log back in, then try again." : "No se pudo eliminar la cuenta. Por favor cierra sesión, vuelve a entrar e intenta de nuevo.");
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    const { Alert } = require("react-native");
    Alert.alert(
      t.logout,
      lang === "en" ? "Are you sure you want to log out?" : "¿Segura que quieres cerrar sesión?",
      [
        { text: lang === "en" ? "Cancel" : "Cancelar", style: "cancel" },
        { text: t.logout, onPress: logout }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0612", padding: 20 }}>
      <Text style={{ color: "#f0e6ff", fontSize: 22, fontWeight: "700", marginBottom: 20 }}>{t.title}</Text>

      {/* Language */}
      <View style={{ backgroundColor: "#1a1028", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#2a1f3d", marginBottom: 14 }}>
        <Text style={{ color: "#f0e6ff", fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
          {lang === "en" ? "🌐 Language" : "🌐 Idioma"}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {(["en","es"] as const).map(l => (
            <TouchableOpacity key={l} onPress={() => setLang(l)}
              style={{ flex: 1, padding: 11, borderRadius: 12, borderWidth: 2, borderColor: lang === l ? "#7c3aed" : "#2a1f3d", backgroundColor: lang === l ? "#2d1f4a" : "#110b1e", alignItems: "center" }}>
              <Text style={{ color: lang === l ? "#c084fc" : "#7c6a9a", fontSize: 15, fontWeight: lang === l ? "700" : "400" }}>
                {l === "en" ? "🇺🇸 English" : "🇪🇸 Español"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Gender */}
      <View style={{ backgroundColor: "#1a1028", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#2a1f3d", marginBottom: 14 }}>
        <Text style={{ color: "#f0e6ff", fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
          {lang === "en" ? "I am a..." : "Soy..."}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {(["girl","guy"] as const).map(g => (
            <TouchableOpacity key={g} onPress={() => setGender(g)}
              style={{ flex: 1, padding: 11, borderRadius: 12, borderWidth: 2, borderColor: gender === g ? "#7c3aed" : "#2a1f3d", backgroundColor: gender === g ? "#2d1f4a" : "#110b1e", alignItems: "center" }}>
              <Text style={{ color: gender === g ? "#c084fc" : "#7c6a9a", fontSize: 15, fontWeight: gender === g ? "700" : "400" }}>
                {g === "girl" ? "Girl 💜" : "Guy 💛"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reset */}
      <View style={{ backgroundColor: "#1a1028", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#2a1f3d", marginBottom: 14 }}>
        <Text style={{ color: "#f87171", fontSize: 16, fontWeight: "700", marginBottom: 12 }}>🔄 {t.reset}</Text>
        <TouchableOpacity onPress={resetAll}
          style={{ padding: 12, backgroundColor: "#2a0d0d", borderRadius: 12, borderWidth: 1, borderColor: "#f8717133", alignItems: "center" }}>
          <Text style={{ color: "#f87171", fontSize: 15, fontWeight: "700" }}>{t.reset} 🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout}
        style={{ backgroundColor: "#1a1028", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#2a1f3d", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ color: "#c084fc", fontSize: 16, fontWeight: "700" }}>🚪 {t.logout}</Text>
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity onPress={handleDeleteAccount}
        style={{ backgroundColor: "#2a0d0d", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f8717133", alignItems: "center" }}>
        <Text style={{ color: "#f87171", fontSize: 16, fontWeight: "700" }}>🗑️ {t.deleteAccount}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function MainApp() {
  const { gender, lang, candidates } = useApp();
  const [view, setView] = useState<"roster"|"analytics"|"settings">("roster");
  const accentColor = gender === "guy" ? "#f59e0b" : "#a855f7";
  const active = candidates.filter(() => true);

  const navItems = [
    { id: "roster" as const, label: lang === "en" ? "👥 Roster" : "👥 Roster" },
    { id: "analytics" as const, label: "📊" },
    { id: "settings" as const, label: "⚙️" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0612" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0612" />
      <SafeAreaView style={{ backgroundColor: "#0a0612" }}>
        <View style={a.header}>
          <Text style={[a.headerTag, { color: accentColor }]}>SITUATIONSHIP TRACKER™</Text>
          <Text style={a.headerTitle}>The Rotation</Text>
          {view === "roster" && (
            <Text style={a.headerSub}>
              {lang === "en"
                ? `${active.length} candidate${active.length !== 1 ? "s" : ""} under evaluation 📊`
                : `${active.length} candidato${active.length !== 1 ? "s" : ""} bajo evaluación 📊`}
            </Text>
          )}
        </View>
        <View style={a.nav}>
          {navItems.map(n => (
            <TouchableOpacity key={n.id} onPress={() => setView(n.id)}
              style={[a.navBtn, view === n.id && { backgroundColor: accentColor }]}>
              <Text style={[a.navBtnText, view === n.id && { color: "#fff", fontWeight: "700" }]}>
                {n.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
      <View style={{ flex: 1 }}>
        {view === "roster" && <RosterScreen onAdd={() => {}} onEdit={() => {}} />}
        {view === "analytics" && <AnalyticsScreen />}
        {view === "settings" && <SettingsScreen />}
      </View>
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <AppProvider>
      <Inner showSplash={showSplash} setShowSplash={setShowSplash} />
    </AppProvider>
  );
}

function Inner({ showSplash, setShowSplash }: { showSplash: boolean; setShowSplash: (v: boolean) => void }) {
  const { user } = useApp();
  if (showSplash) return <SplashScreen onEnter={() => setShowSplash(false)} />;
  if (!user) return <LoginScreen onLogin={() => {}} />;
  return <MainApp />;
}

const a = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, alignItems: "center" },
  headerTag: { fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 2 },
  headerTitle: { fontSize: 30, fontWeight: "800", color: "#f0e6ff", letterSpacing: -1, marginBottom: 2 },
  headerSub: { fontSize: 13, color: "#7c6a9a" },
  nav: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  navBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: "#1a1028", alignItems: "center" },
  navBtnText: { fontSize: 14, color: "#7c6a9a" },
});
