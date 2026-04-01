import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../hooks/useRealtime";
import { palette } from "../theme/theme";
import { SOSResponse } from "../types/api";

export function SafetyScreen() {
  const { token, user } = useAuth();
  const { connected, events, send } = useRealtime(token);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [lastSos, setLastSos] = useState<SOSResponse | null>(null);

  useEffect(() => {
    if (!trackingEnabled) {
      return;
    }

    const interval = setInterval(async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const payload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy_meters: position.coords.accuracy,
        heading: position.coords.heading,
        speed_mps: position.coords.speed,
      };

      send({ type: "location:update", payload });
      await api.post("/locations/me", payload);
    }, 10000);

    return () => clearInterval(interval);
  }, [trackingEnabled]);

  async function triggerSos() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Location required", "SOS needs a location fix to notify nearby guardians.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { data } = await api.post<SOSResponse>("/sos/trigger", {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        message: sosMessage || undefined,
      });
      setLastSos(data);
      Alert.alert("SOS sent", `Alert dispatched to ${data.notified_guardians} nearby guardians.`);
    } catch (error) {
      Alert.alert("SOS failed", "Please confirm the backend, Redis, and your location permissions are available.");
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Realtime safety</Text>
        <Text style={styles.heroTitle}>Stay visible. Escalate instantly.</Text>
        <Text style={styles.heroSubtitle}>
          Live tracking uses Redis-backed location updates and the WebSocket channel keeps SOS acknowledgements fast.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Live tracking</Text>
            <Text style={styles.cardSubtitle}>Share your movement every 10 seconds while this screen is active.</Text>
          </View>
          <Switch value={trackingEnabled} onValueChange={setTrackingEnabled} />
        </View>
        <Text style={styles.metaText}>
          Connection: {connected ? "Realtime channel connected" : "Waiting for realtime channel"}
        </Text>
      </View>

      <View style={styles.cardDanger}>
        <Text style={styles.cardTitleDanger}>SOS trigger</Text>
        <Text style={styles.cardSubtitleDanger}>
          The alert creates a persistent event and notifies verified guardians nearby.
        </Text>
        <TextInput
          style={styles.messageInput}
          value={sosMessage}
          onChangeText={setSosMessage}
          placeholder="Optional distress message"
          placeholderTextColor={palette.muted}
          multiline
        />
        <Pressable style={styles.sosButton} onPress={triggerSos}>
          <Text style={styles.sosButtonText}>Trigger SOS</Text>
        </Pressable>
        {lastSos ? (
          <Text style={styles.metaText}>
            Last alert: {lastSos.status} at {new Date(lastSos.created_at).toLocaleTimeString()}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Activity feed</Text>
        <Text style={styles.cardSubtitle}>Recent WebSocket messages for {user?.name ?? "this user"}.</Text>
        <View style={styles.feed}>
          {events.length === 0 ? (
            <Text style={styles.metaText}>No events received yet.</Text>
          ) : (
            events.map((event, index) => (
              <View key={`${event.type}-${index}`} style={styles.feedItem}>
                <Text style={styles.feedType}>{event.type}</Text>
                <Text style={styles.feedPayload}>{JSON.stringify(event.payload ?? {})}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 18,
    gap: 16,
  },
  hero: {
    backgroundColor: palette.ink,
    borderRadius: 28,
    padding: 22,
    gap: 8,
  },
  heroLabel: {
    color: "#F2C4B4",
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontSize: 12,
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#DBE3E7",
    lineHeight: 22,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardDanger: {
    backgroundColor: "#FFF1F0",
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F0C1BC",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  cardTitleDanger: {
    color: palette.safety,
    fontSize: 18,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: palette.muted,
    marginTop: 4,
    lineHeight: 20,
  },
  cardSubtitleDanger: {
    color: "#864840",
    marginTop: 4,
    lineHeight: 20,
  },
  metaText: {
    color: palette.muted,
    lineHeight: 20,
  },
  messageInput: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7B5AD",
    backgroundColor: "#FFF8F7",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.ink,
    textAlignVertical: "top",
  },
  sosButton: {
    backgroundColor: palette.safety,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  sosButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
  feed: {
    gap: 10,
  },
  feedItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    backgroundColor: "#FFFCF8",
  },
  feedType: {
    color: palette.accentDeep,
    fontWeight: "800",
    marginBottom: 4,
  },
  feedPayload: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
