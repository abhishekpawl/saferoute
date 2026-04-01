import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { palette } from "../theme/theme";
import { UserRole } from "../types/api";

export function LoginScreen() {
  const { requestOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<UserRole>("TRAVELER");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function handleRequestOtp() {
    try {
      setLoading(true);
      const response = await requestOtp({ phone, name, role });
      setDevOtp(response.dev_otp ?? null);
      setOtpSent(true);
    } catch (error) {
      Alert.alert("Could not send OTP", "Check the API server and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      setLoading(true);
      await verifyOtp({ phone, otp, name, role });
    } catch (error) {
      Alert.alert("Login failed", "The OTP was invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <Text style={styles.eyebrow}>Travel safety network</Text>
              <Text style={styles.title}>Find trusted local help when it matters most.</Text>
              <Text style={styles.subtitle}>
                Sign in as a traveler or guardian. The development OTP is surfaced below until SMS delivery is wired up.
              </Text>

              <View style={styles.roleRow}>
                {(["TRAVELER", "GUARDIAN"] as UserRole[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setRole(item)}
                    style={[styles.roleChip, role === item && styles.roleChipSelected]}
                  >
                    <Text style={[styles.roleChipText, role === item && styles.roleChipTextSelected]}>{item}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={palette.muted}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
                placeholderTextColor={palette.muted}
                returnKeyType={otpSent ? "next" : "done"}
              />

              {otpSent ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Enter OTP"
                    keyboardType="number-pad"
                    placeholderTextColor={palette.muted}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                  {devOtp ? <Text style={styles.devOtp}>Dev OTP: {devOtp}</Text> : null}
                  <Pressable style={styles.primaryButton} onPress={handleVerifyOtp} disabled={loading}>
                    <Text style={styles.primaryButtonText}>{loading ? "Verifying..." : "Verify & Continue"}</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.primaryButton} onPress={handleRequestOtp} disabled={loading}>
                  <Text style={styles.primaryButtonText}>{loading ? "Sending..." : "Request OTP"}</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  eyebrow: {
    color: palette.accentDeep,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: palette.ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.surface,
  },
  roleChipSelected: {
    backgroundColor: palette.accentDeep,
    borderColor: palette.accentDeep,
  },
  roleChipText: {
    color: palette.ink,
    fontWeight: "700",
  },
  roleChipTextSelected: {
    color: "#FFF",
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.ink,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  devOtp: {
    color: palette.accentDeep,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: palette.accent,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
