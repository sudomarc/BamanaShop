"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PROFILES = new Set(["dev", "beta", "production"]);

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let state = "code";
  let quote = "";
  let escaped = false;

  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (state === "line-comment") {
      if (char === "\n") state = "code";
      continue;
    }
    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        state = "code";
        i += 1;
      }
      continue;
    }
    if (state === "string") {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) state = "code";
      continue;
    }

    if (char === "/" && next === "/") {
      state = "line-comment";
      i += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      state = "block-comment";
      i += 1;
      continue;
    }
    if (char === "'" || char === '"') {
      state = "string";
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  throw new Error("Unbalanced braces in generated Android Gradle file.");
}

function configureReactBundle(source) {
  const reactMatch = /\breact\s*\{/.exec(source);
  if (!reactMatch) throw new Error("Could not find the React Native Gradle react block.");

  const reactOpen = source.indexOf("{", reactMatch.index);
  const reactClose = findMatchingBrace(source, reactOpen);
  const body = source.slice(reactOpen + 1, reactClose);
  const propertyPattern = /^([ \t]*)debuggableVariants\s*=\s*\[[^\]]*\]\s*$/m;
  let updatedBody;

  if (propertyPattern.test(body)) {
    updatedBody = body.replace(propertyPattern, "$1debuggableVariants = []");
  } else {
    const newline = source.includes("\r\n") ? "\r\n" : "\n";
    updatedBody = newline + "    debuggableVariants = []" + body;
  }

  return source.slice(0, reactOpen + 1) + updatedBody + source.slice(reactClose);
}

function configureReleaseNonDebuggable(source) {
  const buildTypesMatch = /\bbuildTypes\s*\{/.exec(source);
  if (!buildTypesMatch) throw new Error("Could not find the Android buildTypes block.");

  const buildTypesOpen = source.indexOf("{", buildTypesMatch.index);
  const buildTypesClose = findMatchingBrace(source, buildTypesOpen);
  const buildTypesBody = source.slice(buildTypesOpen + 1, buildTypesClose);
  const releaseMatch = /\brelease\s*\{/.exec(buildTypesBody);
  if (!releaseMatch) throw new Error("Could not find the release build type.");

  const releaseOpen = buildTypesOpen + 1 + releaseMatch.index + releaseMatch[0].lastIndexOf("{");
  const releaseClose = findMatchingBrace(source, releaseOpen);
  const releaseBody = source.slice(releaseOpen + 1, releaseClose);
  const propertyPattern = /^([ \t]*)debuggable\s+(?:true|false)\s*$/m;
  let updatedBody;

  if (propertyPattern.test(releaseBody)) {
    updatedBody = releaseBody.replace(propertyPattern, "$1debuggable false");
  } else {
    const newline = source.includes("\r\n") ? "\r\n" : "\n";
    updatedBody = newline + "            debuggable false" + releaseBody;
  }

  return source.slice(0, releaseOpen + 1) + updatedBody + source.slice(releaseClose);
}

function disableReactNativeDevSupport(source) {
  const kotlinExpression = /override\s+fun\s+getUseDeveloperSupport\s*\(\s*\)\s*:\s*Boolean\s*=\s*BuildConfig\.DEBUG/;
  if (kotlinExpression.test(source)) {
    return source.replace(kotlinExpression, "override fun getUseDeveloperSupport(): Boolean = false");
  }

  const kotlinBlock = /override\s+fun\s+getUseDeveloperSupport\s*\(\s*\)\s*:\s*Boolean\s*\{\s*return\s+BuildConfig\.DEBUG\s*\}/;
  if (kotlinBlock.test(source)) {
    return source.replace(kotlinBlock, "override fun getUseDeveloperSupport(): Boolean = false");
  }

  const javaBlock = /@Override\s+protected\s+boolean\s+getUseDeveloperSupport\s*\(\s*\)\s*\{\s*return\s+BuildConfig\.DEBUG\s*;?\s*\}/;
  if (javaBlock.test(source)) {
    return source.replace(javaBlock, "@Override\n  protected boolean getUseDeveloperSupport() {\n    return false;\n  }");
  }

  if (/getUseDeveloperSupport\s*\(/.test(source) && /return\s+false/.test(source)) {
    return source;
  }
  throw new Error("Could not safely disable Metro support in generated MainApplication source.");
}

function findMainApplication(androidAppDir) {
  const root = path.join(androidAppDir, "src", "main");
  const matches = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name === "MainApplication.kt" || entry.name === "MainApplication.java") {
        matches.push(fullPath);
      }
    }
  }

  walk(root);
  if (matches.length !== 1) {
    throw new Error("Expected exactly one generated MainApplication source file; found " + matches.length + ".");
  }
  return matches[0];
}

function configureAndroidBuild(profile, gradleSource, applicationSource) {
  if (!PROFILES.has(profile)) throw new Error("Profile must be dev, beta, or production.");

  return {
    gradle: configureReleaseNonDebuggable(configureReactBundle(gradleSource)),
    application: disableReactNativeDevSupport(applicationSource),
  };
}

function main() {
  const [profile, androidAppDir] = process.argv.slice(2);
  if (!profile || !androidAppDir) {
    throw new Error("Usage: node scripts/android-build-profile.cjs <dev|beta|production> <apps/customer/android/app>");
  }

  const gradlePath = path.join(androidAppDir, "build.gradle");
  const applicationPath = findMainApplication(androidAppDir);
  const configured = configureAndroidBuild(
    profile,
    fs.readFileSync(gradlePath, "utf8"),
    fs.readFileSync(applicationPath, "utf8")
  );

  fs.writeFileSync(gradlePath, configured.gradle);
  fs.writeFileSync(applicationPath, configured.application);
  process.stdout.write("Configured " + profile + ": JS bundle enabled, React Native Metro support disabled.\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}

module.exports = { configureAndroidBuild };
