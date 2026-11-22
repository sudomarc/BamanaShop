"use strict";

const fs = require("node:fs");

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
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        state = "code";
      }
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

  throw new Error("Unbalanced braces in generated Android app/build.gradle.");
}

function configureReleaseDebuggable(source, profile) {
  if (!PROFILES.has(profile)) {
    throw new Error("Profile must be dev, beta, or production.");
  }

  const buildTypesMatch = /\bbuildTypes\s*\{/.exec(source);
  if (!buildTypesMatch) {
    throw new Error("Could not find the Android buildTypes block.");
  }

  const buildTypesOpen = source.indexOf("{", buildTypesMatch.index);
  const buildTypesClose = findMatchingBrace(source, buildTypesOpen);
  const buildTypesBody = source.slice(buildTypesOpen + 1, buildTypesClose);
  const releaseMatch = /\brelease\s*\{/.exec(buildTypesBody);

  if (!releaseMatch) {
    throw new Error("Could not find the release build type in buildTypes.");
  }

  const releaseOpen = buildTypesOpen + 1 + releaseMatch.index + releaseMatch[0].lastIndexOf("{");
  const releaseClose = findMatchingBrace(source, releaseOpen);
  const releaseBody = source.slice(releaseOpen + 1, releaseClose);
  const debuggable = profile === "dev";
  const propertyPattern = /^([ \t]*)debuggable\s+(?:true|false)\s*$/m;
  let updatedBody;

  if (propertyPattern.test(releaseBody)) {
    updatedBody = releaseBody.replace(
      propertyPattern,
      (_match, indentation) => indentation + "debuggable " + debuggable
    );
  } else {
    const newline = source.includes("\r\n") ? "\r\n" : "\n";
    updatedBody = newline + "            debuggable " + debuggable + releaseBody;
  }

  return source.slice(0, releaseOpen + 1) + updatedBody + source.slice(releaseClose);
}

function main() {
  const [profile, gradlePath] = process.argv.slice(2);
  if (!profile || !gradlePath) {
    throw new Error("Usage: node scripts/android-build-profile.cjs <dev|beta|production> <app/build.gradle>");
  }

  const original = fs.readFileSync(gradlePath, "utf8");
  const updated = configureReleaseDebuggable(original, profile);
  fs.writeFileSync(gradlePath, updated);
  process.stdout.write("Configured release debuggable=" + (profile === "dev") + " for " + profile + ".\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}

module.exports = { configureReleaseDebuggable };
