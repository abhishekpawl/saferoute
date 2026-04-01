import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { palette } from "../theme/theme";

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{user?.name}</Text>
        <Text style={styles.meta}>Role: {user?.role}</Text>
        <Text style={styles.meta}>Phone: {user?.phone}</Text>
        <Text style={styles.meta}>Verified: {user?.is_verified ? "Yes" : "Pending guardian verification"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Safety rules in this MVP</Text>
        <Text style={styles.meta}>Phone numbers are masked during discovery.</Text>
        <Text style={styles.meta}>Guardians only appear when active and verified.</Text>
        <Text style={styles.meta}>SOS is intended for traveler accounts only.</Text>
      </View>

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 18,
    gap: 16,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: "800",
  },
  sectionTitle: {
    color: palette.ink,
    fontWeight: "800",
    fontSize: 18,
  },
  meta: {
    color: palette.muted,
    lineHeight: 22,
  },
  signOutButton: {
    marginTop: 8,
    backgroundColor: palette.ink,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  signOutText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
});

