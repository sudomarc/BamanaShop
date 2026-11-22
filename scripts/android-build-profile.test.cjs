"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { configureAndroidBuild } = require("./android-build-profile.cjs");

const gradleFixture = `android {
    buildTypes {
        debug {
            applicationIdSuffix ".debug"
        }
        release {
            minifyEnabled false
            debuggable true
        }
    }
}
react {
    debuggableVariants = ["debug"]
    entryFile = file("index.js")
}
`;

const kotlinFixture = `class MainApplication : Application(), ReactApplication {
    override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
}
`;

test("all profiles bundle JavaScript instead of delegating to Metro", () => {
  for (const profile of ["dev", "beta", "production"]) {
    const result = configureAndroidBuild(profile, gradleFixture, kotlinFixture);
    assert.match(result.gradle, /debuggableVariants = \[\]/);
    assert.match(result.application, /getUseDeveloperSupport\(\): Boolean = false/);
  }
});

test("release remains non-debuggable for every profile", () => {
  for (const profile of ["dev", "beta", "production"]) {
    const result = configureAndroidBuild(profile, gradleFixture, kotlinFixture);
    assert.match(result.gradle, /release\s*\{[\s\S]*?debuggable false/);
  }
});

test("configuration is idempotent", () => {
  const once = configureAndroidBuild("dev", gradleFixture, kotlinFixture);
  const twice = configureAndroidBuild("dev", once.gradle, once.application);
  assert.deepEqual(twice, once);
});

test("rejects unknown profiles and unexpected generated templates", () => {
  assert.throws(() => configureAndroidBuild("staging", gradleFixture, kotlinFixture), /Profile must be/);
  assert.throws(() => configureAndroidBuild("dev", "android { buildTypes { release {} } }", kotlinFixture), /React Native Gradle react block/);
  assert.throws(() => configureAndroidBuild("dev", gradleFixture, "class MainApplication {}"), /Could not safely disable Metro support/);
});
