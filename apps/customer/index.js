// Keep the Metro runtime first, as required by Expo Router for Fast Refresh.
import '@expo/metro-runtime';

import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

// Mirrors Expo SDK 51's expo-router/entry.js bootstrap without resolving
// that package-root entry file through the PNPM workspace symlink.
renderRootComponent(App);
