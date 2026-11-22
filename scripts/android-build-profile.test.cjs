"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { configureReleaseDebuggable } = require("./android-build-profile.cjs");

const gradleFixture = `android {
    buildTypes {
        debug {
            applicationIdSuffix ".debug"
        }
        release {
            minifyEnabled false
        }
    }
}
`;

test("dev keeps the release variant debuggable", () => {
  const result = configureReleaseDebuggable(gradleFixture, "dev");
  assert.match(result, /release\s*\{\s*debuggable true\s*minifyEnabled false/s);
});

test("beta and production disable release debugging", () => {
  for (const profile of ["beta", "production"]) {
    const result = configureReleaseDebuggable(gradleFixture, profile);
    assert.match(result, /release\s*\{\s*debuggable false\s*minifyEnabled false/s);
  }
});

test("configuration is idempotent", () => {
  const once = configureReleaseDebuggable(gradleFixture, "dev");
  const twice = configureReleaseDebuggable(once, "dev");
  assert.equal(twice, once);
});

test("rejects an unknown profile or missing release block", () => {
  assert.throws(() => configureReleaseDebuggable(gradleFixture, "staging"), /Profile must be/);
  assert.throws(() => configureReleaseDebuggable("android { buildTypes { debug {} } }", "dev"), /release build type/);
});
