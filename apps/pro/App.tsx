import "./global.css";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Providers } from "@/components/Providers";
import {
  AccessReviewScreen,
  BackendUnavailableScreen,
  RolePickerScreen,
  SignInScreen,
} from "@/components/ProAccessScreens";
import { useAuthStore } from "@/store/authStore";
import { isSupabaseConfigured } from "@/utils/supabase";
import { getProAccessDecision } from "@/utils/proAccess";
import type { ProRole } from "@/utils/proAccess";
import { navigationRef } from "@/navigation/compat";

import SellerDashboardScreen from "./app/(seller)/dashboard";
import CourierMissionsScreen from "./app/(courier)/missions";

const Tabs = createBottomTabNavigator();

function AppNavigator({ role }: { role: ProRole }) {
  return (
    <NavigationContainer ref={navigationRef}>
      <Tabs.Navigator
        key={role}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2563EB",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E2E8F0",
            height: 64,
            paddingBottom: 8,
          },
        }}
      >
        {role === "seller" ? (
          <Tabs.Screen
            name="Seller"
            component={SellerDashboardScreen}
            options={{
              title: "Vendeur",
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "storefront" : "storefront-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        ) : (
          <Tabs.Screen
            name="Courier"
            component={CourierMissionsScreen}
            options={{
              title: "Livreur",
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "bicycle" : "bicycle-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        )}
      </Tabs.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const selectedRole = useAuthStore((state) => state.selectedRole);
  const profileLoading = useAuthStore((state) => state.profileLoading);
  const profileError = useAuthStore((state) => state.profileError);
  const requestedRoles = useAuthStore((state) => state.requestedRoles);
  const roleStatuses = useAuthStore((state) => state.roleStatuses);
  const selectRole = useAuthStore((state) => state.selectRole);
  const fetchProfiles = useAuthStore((state) => state.fetchProfiles);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  const access = getProAccessDecision({
    backendConfigured: isSupabaseConfigured,
    initialized,
    userId: user?.id ?? null,
    profileLoading,
    profileError,
    approvedRoles: roles,
    selectedRole,
  });

  if (access.kind === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Providers>
          {access.kind === "backend-unavailable" ? (
            <BackendUnavailableScreen />
          ) : access.kind === "sign-in" ? (
            <SignInScreen />
          ) : access.kind === "profile-error" ||
            access.kind === "no-approved-role" ? (
            <AccessReviewScreen
              profileError={
                access.kind === "profile-error" ? access.message : null
              }
              requestedRoles={requestedRoles}
              roleStatuses={roleStatuses}
              onRetry={() => fetchProfiles().catch(() => undefined)}
              onSignOut={() => signOut()}
            />
          ) : access.kind === "choose-role" ? (
            <RolePickerScreen
              roles={access.roles}
              onSelect={selectRole}
              onSignOut={() => signOut()}
            />
          ) : (
            <AppNavigator role={access.kind} />
          )}
        </Providers>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
});
