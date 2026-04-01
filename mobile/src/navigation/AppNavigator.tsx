import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { GuardiansMapScreen } from "../screens/GuardiansMapScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { palette } from "../theme/theme";

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const { loading, token } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.ink,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
        tabBarActiveTintColor: palette.accentDeep,
        tabBarInactiveTintColor: palette.muted,
      }}
    >
      <Tab.Screen name="Guardians" component={GuardiansMapScreen} />
      <Tab.Screen name="Safety" component={SafetyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

