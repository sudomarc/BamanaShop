import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/store/cartStore";
import { SemanticColors } from "@/constants/colors";

export default function TabLayout() {
  // We can't use hooks here directly, so we'll use a workaround
  // In a real app, we'd use a context or the cart store's subscribe method
  const cartCount = 0; // Will be updated via context in real app

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SemanticColors.tabActive,
        tabBarInactiveTintColor: SemanticColors.tabInactive,
        tabBarStyle: {
          backgroundColor: SemanticColors.tabBackground,
          borderTopWidth: 1,
          borderTopColor: SemanticColors.borderDefault,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Catégories",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Panier",
          tabBarIcon: ({ focused, color }) => (
            <View>
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                size={24}
                color={color}
              />
              {/* Badge would go here in real implementation */}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Commandes",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "bag-handle" : "bag-handle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}