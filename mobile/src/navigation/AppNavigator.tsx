import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { GuardiansMapScreen } from "../screens/GuardiansMapScreen";
import { PlannerScreen } from "../screens/PlannerScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { TicketSearchScreen } from "../screens/TicketSearchScreen";
import { palette } from "../theme/theme";

const Tab = createBottomTabNavigator();
const FLOATING_TAB_BAR_SPACE = 116;

const tabMeta = {
  Tickets: {
    label: "Tickets",
    icon: { active: "ticket", inactive: "ticket-outline" },
  },
  Planner: {
    label: "Planner",
    icon: { active: "sparkles", inactive: "sparkles-outline" },
  },
  Guardians: {
    label: "Guardians",
    icon: { active: "people", inactive: "people-outline" },
  },
  Safety: {
    label: "Safety",
    icon: { active: "shield-checkmark", inactive: "shield-checkmark-outline" },
  },
  Profile: {
    label: "Profile",
    icon: { active: "person-circle", inactive: "person-circle-outline" },
  },
} as const;

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={styles.tabBarShell}>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const options = descriptors[route.key].options;
          const meta = tabMeta[route.name as keyof typeof tabMeta];
          const iconName = isFocused ? meta.icon.active : meta.icon.inactive;
          const label = typeof options.tabBarLabel === "string" ? options.tabBarLabel : meta.label;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never, route.params as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? "#FFF8F2" : palette.muted}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AppNavigator() {
  const { loading, token } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: palette.ink,
        headerShadowVisible: false,
        headerTitleAlign: "left",
        sceneStyle: styles.scene,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Tickets"
        component={TicketSearchScreen}
        options={{ title: "Trip Tickets" }}
      />
      <Tab.Screen
        name="Planner"
        component={PlannerScreen}
        options={{ title: "Trip Planner" }}
      />
      <Tab.Screen
        name="Guardians"
        component={GuardiansMapScreen}
        options={{ title: "Nearby Guardians" }}
      />
      <Tab.Screen
        name="Safety"
        component={SafetyScreen}
        options={{ title: "Safety Center" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Your Profile" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
  scene: {
    backgroundColor: palette.background,
    paddingBottom: FLOATING_TAB_BAR_SPACE,
  },
  header: {
    backgroundColor: palette.background,
  },
  headerTitle: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: "800",
  },
  tabBarShell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "rgba(255, 251, 244, 0.98)",
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: "#E5D7C8",
    shadowColor: "#3A2418",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  tabItemActive: {
    backgroundColor: "#FFF3EA",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapActive: {
    backgroundColor: palette.accentDeep,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.muted,
  },
  tabLabelActive: {
    color: palette.ink,
  },
});
