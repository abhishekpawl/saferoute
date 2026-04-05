import { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "../api/client";
import { palette } from "../theme/theme";
import { CabinClass, TicketMode, TicketProviderResult, TicketSearchResponse } from "../types/api";

const today = new Date();
const defaultDepartureDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const modeLabels: Record<TicketMode, string> = {
  AIR: "Air",
  TRAIN: "Train",
  BUS: "Bus",
};

const cabinOptions: CabinClass[] = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];

function buildLocalFallbackResults(
  mode: TicketMode,
  origin: string,
  destination: string,
  departureDate: string,
  adults: number,
  children: number,
  infants: number,
  cabinClass: CabinClass
): TicketProviderResult[] {
  const searchHint = `${origin} to ${destination} on ${departureDate}`;
  const airTravellerSummary = `Travellers: ${adults} adult${adults > 1 ? "s" : ""}${
    children ? `, ${children} child${children > 1 ? "ren" : ""}` : ""
  }${infants ? `, ${infants} infant${infants > 1 ? "s" : ""}` : ""}. Class: ${cabinClass.replaceAll("_", " ").toLowerCase()}.`;

  const commonNotes = [
    "Live fares are not connected in fallback mode.",
    "Tap through to continue the search on the provider site.",
  ];

  const providers = [
    { provider_id: "makemytrip", provider_name: "MakeMyTrip", AIR: "https://www.makemytrip.com/flights/", TRAIN: "https://www.makemytrip.com/railways/", BUS: "https://www.makemytrip.com/bus-tickets/" },
    { provider_id: "goibibo", provider_name: "Goibibo", AIR: "https://www.goibibo.com/flights/", TRAIN: "https://www.goibibo.com/trains", BUS: "https://www.goibibo.com/bus/" },
    { provider_id: "yatra", provider_name: "Yatra", AIR: "https://www.yatra.com/flights", TRAIN: "https://www.yatra.com/trains.html", BUS: "https://www.yatra.com/bus-tickets" },
  ] as const;

  return providers.map((provider) => ({
    provider_id: provider.provider_id,
    provider_name: provider.provider_name,
    mode,
    deeplink_url: provider[mode],
    source_home_url: provider[mode],
    live_price_supported: false,
    fare_display: null,
    currency: "INR",
    search_hint: mode === "AIR" ? `${searchHint}. ${airTravellerSummary}` : `Search ${searchHint}.`,
    redirect_label: "Open On Site",
    notes: commonNotes,
  }));
}

export function TicketSearchScreen() {
  const [mode, setMode] = useState<TicketMode>("AIR");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState(defaultDepartureDate);
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [infants, setInfants] = useState("0");
  const [cabinClass, setCabinClass] = useState<CabinClass>("ECONOMY");
  const [results, setResults] = useState<TicketProviderResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const passengerSummary = useMemo(() => {
    if (mode !== "AIR") {
      return "Redirecting you to provider searches for this route.";
    }
    return `${adults} adult${adults === "1" ? "" : "s"}, ${children} child${children === "1" ? "" : "ren"}, ${infants} infant${infants === "1" ? "" : "s"}`;
  }, [adults, children, infants, mode]);

  async function searchTickets() {
    if (!origin.trim() || !destination.trim() || !departureDate.trim()) {
      Alert.alert("Missing details", "Enter origin, destination, and departure date.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        mode,
        origin: origin.trim(),
        destination: destination.trim(),
        departure_date: departureDate.trim(),
        return_date: null,
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        infants: Number(infants) || 0,
        cabin_class: mode === "AIR" ? cabinClass : null,
      };

      const { data } = await api.post<TicketSearchResponse>("/tickets/search", payload);
      setResults(data.providers);
      setStatusMessage(data.message);
    } catch (error) {
      const fallbackResults = buildLocalFallbackResults(
        mode,
        origin.trim(),
        destination.trim(),
        departureDate.trim(),
        Number(adults) || 1,
        Number(children) || 0,
        Number(infants) || 0,
        cabinClass
      );
      setResults(fallbackResults);
      setStatusMessage("Showing redirect-only fallback results because the backend search service is currently unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function openProvider(url: string) {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Could not open site", "This provider link is not supported on this device.");
      return;
    }
    await Linking.openURL(url);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Compare tickets</Text>
        <Text style={styles.heroTitle}>Search air, train, and bus routes in one place.</Text>
        <Text style={styles.heroSubtitle}>
          This version compares provider availability and redirects you to MakeMyTrip, Goibibo, or Yatra. Live provider fares can plug into the same cards later through official APIs or MCP connectors.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.modeRow}>
          {(["AIR", "TRAIN", "BUS"] as TicketMode[]).map((item) => (
            <Pressable
              key={item}
              style={[styles.modeChip, mode === item && styles.modeChipSelected]}
              onPress={() => setMode(item)}
            >
              <Text style={[styles.modeChipText, mode === item && styles.modeChipTextSelected]}>{modeLabels[item]}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={origin}
          onChangeText={setOrigin}
          placeholder={mode === "AIR" ? "Origin city or code (e.g. DEL)" : "Origin"}
          placeholderTextColor={palette.muted}
        />
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder={mode === "AIR" ? "Destination city or code (e.g. BOM)" : "Destination"}
          placeholderTextColor={palette.muted}
        />
        <TextInput
          style={styles.input}
          value={departureDate}
          onChangeText={setDepartureDate}
          placeholder="Departure date (YYYY-MM-DD)"
          placeholderTextColor={palette.muted}
        />

        {mode === "AIR" ? (
          <>
            <View style={styles.counterRow}>
              <TextInput
                style={[styles.input, styles.counterInput]}
                value={adults}
                onChangeText={setAdults}
                keyboardType="number-pad"
                placeholder="Adults"
                placeholderTextColor={palette.muted}
              />
              <TextInput
                style={[styles.input, styles.counterInput]}
                value={children}
                onChangeText={setChildren}
                keyboardType="number-pad"
                placeholder="Children"
                placeholderTextColor={palette.muted}
              />
              <TextInput
                style={[styles.input, styles.counterInput]}
                value={infants}
                onChangeText={setInfants}
                keyboardType="number-pad"
                placeholder="Infants"
                placeholderTextColor={palette.muted}
              />
            </View>
            <View style={styles.modeRow}>
              {cabinOptions.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.smallChip, cabinClass === item && styles.smallChipSelected]}
                  onPress={() => setCabinClass(item)}
                >
                  <Text style={[styles.smallChipText, cabinClass === item && styles.smallChipTextSelected]}>
                    {item.replaceAll("_", " ")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.helperText}>{passengerSummary}</Text>

        <Pressable style={styles.searchButton} onPress={searchTickets} disabled={loading}>
          <Text style={styles.searchButtonText}>{loading ? "Searching..." : `Search ${modeLabels[mode]} Tickets`}</Text>
        </Pressable>
      </View>

      {statusMessage ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>{statusMessage}</Text>
        </View>
      ) : null}

      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Providers</Text>
        {results.length === 0 ? (
          <Text style={styles.emptyText}>Run a search to compare official provider entry points.</Text>
        ) : (
          results.map((result) => (
            <View key={`${result.provider_id}-${result.mode}`} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.providerName}>{result.provider_name}</Text>
                  <Text style={styles.providerMeta}>{modeLabels[result.mode]} • {result.live_price_supported ? "Live fare connected" : "Redirect only"}</Text>
                </View>
                <Text style={styles.priceText}>{result.fare_display ?? "Price on site"}</Text>
              </View>
              <Text style={styles.searchHint}>{result.search_hint}</Text>
              {result.notes.map((note, index) => (
                <Text key={`${result.provider_id}-note-${index}`} style={styles.noteText}>
                  {note}
                </Text>
              ))}
              <Pressable style={styles.openButton} onPress={() => openProvider(result.deeplink_url)}>
                <Text style={styles.openButtonText}>{result.redirect_label}</Text>
              </Pressable>
            </View>
          ))
        )}
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
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#18323B",
    gap: 8,
  },
  heroEyebrow: {
    color: "#F1B39A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#D7E1E5",
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
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F2E8DA",
  },
  modeChipSelected: {
    backgroundColor: palette.ink,
  },
  modeChipText: {
    color: palette.ink,
    fontWeight: "800",
  },
  modeChipTextSelected: {
    color: "#FFF",
  },
  smallChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#FFFCF8",
  },
  smallChipSelected: {
    borderColor: palette.accentDeep,
    backgroundColor: "#FCE7DF",
  },
  smallChipText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  smallChipTextSelected: {
    color: palette.accentDeep,
  },
  input: {
    backgroundColor: "#FFFCF8",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.ink,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  counterRow: {
    flexDirection: "row",
    gap: 10,
  },
  counterInput: {
    flex: 1,
  },
  helperText: {
    color: palette.muted,
    lineHeight: 20,
  },
  searchButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: palette.accent,
  },
  searchButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  infoCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFF7E3",
    borderWidth: 1,
    borderColor: "#F0D9A7",
  },
  infoText: {
    color: "#7B5B18",
    lineHeight: 20,
  },
  resultsSection: {
    gap: 12,
  },
  sectionTitle: {
    color: palette.ink,
    fontWeight: "800",
    fontSize: 20,
  },
  emptyText: {
    color: palette.muted,
    lineHeight: 22,
  },
  resultCard: {
    borderRadius: 22,
    padding: 18,
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  providerName: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  providerMeta: {
    color: palette.muted,
    marginTop: 2,
  },
  priceText: {
    color: palette.accentDeep,
    fontWeight: "800",
    fontSize: 15,
  },
  searchHint: {
    color: palette.ink,
    lineHeight: 21,
  },
  noteText: {
    color: palette.muted,
    lineHeight: 20,
  },
  openButton: {
    marginTop: 4,
    backgroundColor: palette.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  openButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
