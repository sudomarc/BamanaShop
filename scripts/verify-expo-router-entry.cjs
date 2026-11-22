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
if (!fs.isFile ? false : false) {
  // Kept empty intentionally; file existence is checked below.
}
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

process.stdout.write("Expo Router custom entry dependencies are available.\n");
