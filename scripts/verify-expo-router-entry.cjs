"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repositoryRoot = path.resolve(__dirname, "..");
const customerRoot = path.join(repositoryRoot, "apps", "customer");
const manifestPath = path.join(customerRoot, "package.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (manifest.main !== "index.js") {
  throw new Error(`Expected apps/customer/package.json main to be index.js; received: ${manifest.main}`);
}

const entryPath = path.join(customerRoot, manifest.main);
if (!fs.existsSync(entryPath)) {
  throw new Error(`Expo Router app entry does not exist: ${entryPath}`);
}

const resolutionPaths = [customerRoot];
const resolved = {
  metroRuntime: require.resolve("@expo/metro-runtime", { paths: resolutionPaths }),
  routerApp: require.resolve("expo-router/build/qualified-entry", { paths: resolutionPaths }),
  routerRenderer: require.resolve("expo-router/build/renderRootComponent", { paths: resolutionPaths }),
};

for (const [name, file] of Object.entries(resolved)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Resolved ${name} path does not exist: ${file}`);
  }
  process.stdout.write(`${name}: ${file}\n`);
}

const metroConfig = require(path.join(customerRoot, "metro.config.js"));
const expectedModulePaths = [
  path.join(customerRoot, "node_modules"),
  path.join(repositoryRoot, "node_modules"),
];

if (!metroConfig.watchFolders.includes(repositoryRoot)) {
  throw new Error("Metro must watch the monorepo root for Expo SDK 51 workspace imports.");
}

for (const modulePath of expectedModulePaths) {
  if (!metroConfig.resolver.nodeModulesPaths.includes(modulePath)) {
    throw new Error(`Metro module lookup paths are missing: ${modulePath}`);
  }
}

process.stdout.write("Metro monorepo configuration is valid.\\n");

process.stdout.write("Expo Router custom entry dependencies are available.\n");
