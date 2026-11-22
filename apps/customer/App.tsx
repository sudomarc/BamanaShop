import "./global.css";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Providers } from "@/components/Providers";
import { useAuthStore } from "@/store/authStore";
import { SemanticColors } from "@/constants/colors";
import { navigationRef } from "@/navigation/compat";

import LoginScreen from "./app/(auth)/login";
import ProfileSetupScreen from "./app/(onboarding)/profile";
import HomeScreen from "./app/(tabs)/index";
import CategoriesScreen from "./app/(tabs)/categories";
import CartScreen from "./app/(tabs)/cart";
import OrdersScreen from "./app/(tabs)/orders";
import ProfileScreen from "./app/(tabs)/profile";
import CategoryDetailScreen from "./app/(tabs)/categories/[slug]";
import ProductDetailScreen from "./app/product/[id]";
import StoreDetailScreen from "./app/store/[id]";
import OrderDetailScreen from "./app/orders/[id]";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function CustomerTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: SemanticColors.tabActive,
        tabBarInactiveTintColor: SemanticColors.tabInactive,
        tabBarStyle: {
          backgroundColor: SemanticColors.tabBackground,
          borderTopColor: SemanticColors.borderDefault,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, string> = {
            Home: focused ? "home" : "home-outline",
            Categories: focused ? "grid" : "grid-outline",
            Cart: focused ? "cart" : "cart-outline",
            Orders: focused ? "bag-handle" : "bag-handle-outline",
            Profile: focused ? "person" : "person-outline",
          };
          return <Ionicons name={icons[route.name] ?? "ellipse-outline"} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: "Accueil" }} />
      <Tabs.Screen name="Categories" component={CategoriesScreen} options={{ title: "Catégories" }} />
      <Tabs.Screen name="Cart" component={CartScreen} options={{ title: "Panier" }} />
      <Tabs.Screen name="Orders" component={OrdersScreen} options={{ title: "Commandes" }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil" }} />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="CustomerTabs" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: "modal" }} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => { void initAuth(); }, [initAuth]);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={SemanticColors.primaryAction} />
      </View>
    );
  }

  return <Providers><AppNavigator /></Providers>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: SemanticColors.screenBackground },
});
