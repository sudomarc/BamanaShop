import { Stack } from "expo-router";
import { Providers } from "@/components/Providers";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function RootLayout() {
  const { initAuth, initialized } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="(seller)" />
        <Stack.Screen name="(courier)" />
      </Stack>
    </Providers>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
