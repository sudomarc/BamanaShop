import "./global.css";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Providers } from "@/components/Providers";
import { useAuthStore } from "@/store/authStore";
import { navigationRef } from "@/navigation/compat";

import SellerDashboardScreen from "./app/(seller)/dashboard";
import CourierMissionsScreen from "./app/(courier)/missions";

const Tabs = createBottomTabNavigator();

function AppNavigator() {
  const roles = useAuthStore((state) => state.roles);
  const hasSeller = roles.includes("seller");
  const hasCourier = roles.includes("courier");
  const showBoth = !hasSeller && !hasCourier;

  return (
    <NavigationContainer ref={navigationRef}>
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#2563EB",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E2E8F0", height: 64, paddingBottom: 8 },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={route.name === "Seller"
                ? (focused ? "storefront" : "storefront-outline")
                : (focused ? "bicycle" : "bicycle-outline")}
              size={size}
              color={color}
            />
          ),
        })}
      >
        {(hasSeller || showBoth) && (
          <Tabs.Screen name="Seller" component={SellerDashboardScreen} options={{ title: "Vendeur" }} />
        )}
        {(hasCourier || showBoth) && (
          <Tabs.Screen name="Courier" component={CourierMissionsScreen} options={{ title: "Livreur" }} />
        )}
      </Tabs.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => { void initAuth(); }, [initAuth]);

  if (!initialized) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return <Providers><AppNavigator /></Providers>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
});
