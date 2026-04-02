import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, UrlTile } from "react-native-maps";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Guardian } from "../types/api";
import { palette } from "../theme/theme";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function GuardiansMapScreen() {
  const { isDemoSession } = useAuth();
  const [region, setRegion] = useState<Region | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendWarning, setBackendWarning] = useState<string | null>(null);

  async function refresh() {
    try {
      setBackendWarning(null);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Location required", "Guardian discovery needs your current location.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };

      setRegion(nextRegion);
      if (isDemoSession) {
        setGuardians([
          {
            id: "demo-guardian-1",
            user_id: "demo-guardian-user-1",
            name: "Anaya Sharma",
            phone_masked: "91******24",
            rating_average: 4.8,
            rating_count: 31,
            is_verified: true,
            is_active: true,
            lat: location.coords.latitude + 0.006,
            lng: location.coords.longitude + 0.004,
            distance_km: 0.8,
          },
          {
            id: "demo-guardian-2",
            user_id: "demo-guardian-user-2",
            name: "Rohit Mehta",
            phone_masked: "91******76",
            rating_average: 4.6,
            rating_count: 18,
            is_verified: true,
            is_active: true,
            lat: location.coords.latitude - 0.004,
            lng: location.coords.longitude + 0.003,
            distance_km: 0.63,
          },
        ]);
        return;
      }

      try {
        await api.post("/locations/me", {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy_meters: location.coords.accuracy,
          heading: location.coords.heading,
          speed_mps: location.coords.speed,
        });

        const response = await api.get<Guardian[]>("/guardians/nearby", {
          params: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
        });
        setGuardians(response.data);
      } catch (error) {
        setGuardians([]);
        setBackendWarning("Map loaded, but live guardian updates are temporarily unavailable.");
      }
    } catch (error) {
      Alert.alert("Could not load location", "Check location permission and GPS availability on this device.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [isDemoSession]);

  if (loading || !region) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={styles.loadingText}>Finding nearby verified guardians...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region} showsUserLocation>
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />
        {guardians.map((guardian) => (
          <Marker
            key={guardian.id}
            coordinate={{ latitude: guardian.lat, longitude: guardian.lng }}
            title={guardian.name}
            description={`${guardian.distance_km} km away • ${guardian.rating_average.toFixed(1)} stars`}
            pinColor={palette.mapGuardian}
          />
        ))}
      </MapView>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Nearby guardians</Text>
            <Text style={styles.panelSubtitle}>
              {guardians.length} verified helpers in range{isDemoSession ? " • demo mode" : ""}
            </Text>
          </View>
          <Pressable style={styles.refreshButton} onPress={refresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </Pressable>
        </View>

        {backendWarning ? <Text style={styles.warningText}>{backendWarning}</Text> : null}

        {guardians.length === 0 ? (
          <Text style={styles.emptyState}>No active guardians are sharing live location nearby right now.</Text>
        ) : (
          guardians.slice(0, 3).map((guardian) => (
            <View key={guardian.id} style={styles.guardianCard}>
              <View>
                <Text style={styles.guardianName}>{guardian.name}</Text>
                <Text style={styles.guardianMeta}>
                  {guardian.phone_masked} • {guardian.distance_km} km away
                </Text>
              </View>
              <Text style={styles.guardianRating}>{guardian.rating_average.toFixed(1)} ★</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  map: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
    gap: 12,
  },
  loadingText: {
    color: palette.muted,
    fontSize: 15,
  },
  panel: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: palette.ink,
  },
  panelSubtitle: {
    color: palette.muted,
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: palette.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  emptyState: {
    color: palette.muted,
    lineHeight: 22,
  },
  warningText: {
    color: palette.accentDeep,
    lineHeight: 22,
  },
  guardianCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
  },
  guardianName: {
    color: palette.ink,
    fontWeight: "800",
    fontSize: 16,
  },
  guardianMeta: {
    color: palette.muted,
    marginTop: 4,
  },
  guardianRating: {
    color: palette.accentDeep,
    fontWeight: "800",
    fontSize: 16,
  },
});
