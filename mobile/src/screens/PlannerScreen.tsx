import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_BASE_URL, api } from "../api/client";
import { palette } from "../theme/theme";
import { PlannerChatResponse, PlannerMessage, PlannerMode } from "../types/api";

const introMessage =
  "Ask me to help plan any trip. Switch between Safe mode for risk-aware advice and General mode for broader itinerary help.";

function localPlannerFallback(mode: PlannerMode, destinationContext: string, prompt: string): string {
  if (mode === "SAFE") {
    return `Here is a safety-first starting point${destinationContext ? ` for ${destinationContext}` : ""}: arrive in daylight if possible, book your first transfer in advance, keep offline maps and emergency contacts ready, avoid isolated areas until you understand the local layout, and verify transport or stay details from official sources. Your question was: ${prompt}`;
  }
  return `Here is a general planning starting point${destinationContext ? ` for ${destinationContext}` : ""}: decide your trip pace, shortlist must-do activities, estimate a daily budget, group nearby places by day, and leave buffer time for transport and rest. Your question was: ${prompt}`;
}

export function PlannerScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [mode, setMode] = useState<PlannerMode>("SAFE");
  const [tripBrief, setTripBrief] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<PlannerMessage[]>([
    {
      role: "assistant",
      content: introMessage,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [plannerStatus, setPlannerStatus] = useState<string | null>(null);
  const [setupExpanded, setSetupExpanded] = useState(true);

  const hasConversation = useMemo(() => messages.some((message) => message.role === "user"), [messages]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [loading, messages, plannerStatus]);

  function buildPromptFromBrief(brief: string, modeOverride?: PlannerMode) {
    const activeMode = modeOverride ?? mode;
    if (activeMode === "SAFE") {
      return `Plan a safe trip using this trip brief: ${brief}. Make the answer detailed, structured, and highly practical, not short. The answer should clearly cover the best areas to stay, safe stay recommendations or hotel categories, a day-wise itinerary that matches the requested number of days, non-negotiable safety rules, a reality check, and pro tips.`;
    }
    return `Plan a general trip using this trip brief: ${brief}. Make the answer detailed and well-structured, not short. The answer should clearly cover the best areas to stay, a day-wise itinerary that matches the requested number of days, transport tips, local experiences, budget guidance, and pro tips.`;
  }

  async function sendPrompt(promptOverride?: string) {
    const activePrompt = promptOverride ?? draft;
    const trimmedPrompt = activePrompt.trim();
    const trimmedBrief = tripBrief.trim();
    const userText = trimmedPrompt || (trimmedBrief ? buildPromptFromBrief(trimmedBrief) : "");
    if (!userText) {
      Alert.alert("Enter trip brief", "Describe the place and trip length, for example: Varanasi for 3 days, solo female traveler.");
      return;
    }

    const nextMessages: PlannerMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setPlannerStatus(null);
    setSetupExpanded(false);

    try {
      const { data } = await api.post<PlannerChatResponse>(
        "/planner/chat",
        {
          mode,
          destination_context: trimmedBrief || null,
          messages: nextMessages.filter(
            (message, index) =>
              (message.role === "user" || message.role === "assistant") &&
              !(index === 0 && message.role === "assistant" && message.content === introMessage)
          ),
        },
        {
          timeout: 90000,
        }
      );

      if (data.fallback_used) {
        setPlannerStatus(
          `Planner fallback response used. ${data.diagnostic ? `Reason: ${data.diagnostic}` : "The live model did not answer."}`
        );
      } else {
        setPlannerStatus(null);
      }

      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (error) {
      const isAxiosError = !!(error && typeof error === "object" && "isAxiosError" in error);
      const errorCode = isAxiosError && typeof error === "object" && "code" in error ? String(error.code) : null;
      const hasResponse = !!(error && typeof error === "object" && "response" in error && error.response);
      const message = hasResponse
        ? `Planner request reached ${API_BASE_URL} but failed before a model response was returned. Check backend status and logs.`
        : errorCode === "ECONNABORTED"
          ? `Planner request to ${API_BASE_URL} timed out before the model finished responding.`
          : `Planner request failed before reaching ${API_BASE_URL}.`;
      setPlannerStatus(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: localPlannerFallback(mode, trimmedBrief, userText),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {!hasConversation || setupExpanded ? (
          <View style={styles.setupCard}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>Trip planner</Text>
              <Text style={styles.title}>Plan a trip like a conversation.</Text>
              <Text style={styles.subtitle}>
                Tell me where you want to go and for how many days. I will build the first plan, and then you can keep chatting with follow-up questions.
              </Text>
            </View>

            <View style={styles.modeRow}>
              {(["SAFE", "GENERAL"] as PlannerMode[]).map((item) => (
                <Pressable
                  key={item}
                  style={[styles.modeChip, mode === item && styles.modeChipSelected]}
                  onPress={() => setMode(item)}
                >
                  <Text style={[styles.modeChipText, mode === item && styles.modeChipTextSelected]}>
                    {item === "SAFE" ? "Safe" : "General"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.tripBriefInput}
              value={tripBrief}
              onChangeText={setTripBrief}
              placeholder="Example: Varanasi for 3 days, solo female traveler. I want a calm, safe trip with ghat visits and good stay options."
              placeholderTextColor={palette.muted}
              multiline
            />
            <Text style={styles.helperText}>
              Include the destination, number of days, who is traveling, and anything important like budget, safety, food, nightlife, temples, or transport preferences.
            </Text>
            <Pressable style={styles.startPlanButton} onPress={() => sendPrompt()} disabled={loading}>
              <Text style={styles.startPlanButtonText}>{loading ? "Starting..." : "Start Planning"}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.compactSetup}>
            <View style={styles.compactLeft}>
              <Text style={styles.compactTitle}>
                {mode === "SAFE" ? "Safe" : "General"} plan
              </Text>
              <Text style={styles.compactMeta}>{tripBrief}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setSetupExpanded(true)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>
        )}

        {plannerStatus ? (
          <View style={[styles.messageBubble, styles.statusCard]}>
            <Text style={styles.statusText}>{plannerStatus}</Text>
          </View>
        ) : null}

        {messages.map((message, index) => (
          <View
            key={`${message.role}-${index}`}
            style={[styles.messageBubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}
          >
            <Text style={[styles.messageLabel, message.role === "user" ? styles.userLabel : styles.assistantLabel]}>
              {message.role === "user" ? "You" : mode === "SAFE" ? "Safe Planner" : "General Planner"}
            </Text>
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
        ))}

        {loading ? (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={styles.messageLabel}>Planner</Text>
            <Text style={styles.messageText}>Thinking through your trip...</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          value={draft}
          onChangeText={setDraft}
          onFocus={() => {
            setTimeout(() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }, 120);
          }}
          placeholder={
            mode === "SAFE"
              ? "Ask a follow-up about safety, stays, transport, or itinerary"
              : "Ask a follow-up about itinerary, food, transport, or budget"
          }
          placeholderTextColor={palette.muted}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={() => sendPrompt()} disabled={loading}>
          <Text style={styles.sendButtonText}>{loading ? "..." : "Send"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  messages: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 132,
  },
  setupCard: {
    gap: 14,
  },
  hero: {
    backgroundColor: "#1E2F2A",
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    color: "#B8E0C5",
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontSize: 12,
  },
  title: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 26,
    lineHeight: 30,
  },
  subtitle: {
    color: "#DCEBE1",
    lineHeight: 22,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modeChipSelected: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
  },
  modeChipText: {
    color: palette.ink,
    fontWeight: "800",
  },
  modeChipTextSelected: {
    color: "#FFF",
  },
  tripBriefInput: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.ink,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  helperText: {
    color: palette.muted,
    lineHeight: 21,
  },
  startPlanButton: {
    backgroundColor: palette.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  startPlanButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
  messageBubble: {
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  userBubble: {
    backgroundColor: "#D96B45",
    alignSelf: "flex-end",
    maxWidth: "90%",
  },
  assistantBubble: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignSelf: "stretch",
  },
  messageLabel: {
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  userLabel: {
    color: "#FFE7DE",
  },
  assistantLabel: {
    color: palette.accentDeep,
  },
  messageText: {
    color: palette.ink,
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: "#FFF7E3",
    borderWidth: 1,
    borderColor: "#EBCB8B",
  },
  statusText: {
    color: "#7B5B18",
    lineHeight: 20,
  },
  compactSetup: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  compactLeft: {
    flex: 1,
    gap: 4,
  },
  compactTitle: {
    color: palette.ink,
    fontWeight: "800",
    fontSize: 15,
  },
  compactMeta: {
    color: palette.muted,
  },
  editButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F2E8DA",
  },
  editButtonText: {
    color: palette.ink,
    fontWeight: "800",
  },
  composer: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  composerInput: {
    flex: 1,
    maxHeight: 110,
    minHeight: 52,
    color: palette.ink,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: palette.ink,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sendButtonText: {
    color: "#FFF",
    fontWeight: "800",
  },
});
