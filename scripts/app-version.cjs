"use strict";
const SEMVER_PATTERN = new RegExp("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$");
const NAMED_VERSION_PATTERN = new RegExp("^([A-Za-z][A-Za-z0-9._]*)-(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$");
function parseAppVersion(input) {
  const version = String(input ?? "").trim();
  const semver = SEMVER_PATTERN.exec(version);
  const named = semver ? null : NAMED_VERSION_PATTERN.exec(version);
  const match = semver || named;
  if (!match) throw new Error("Unsupported version. Use 1.2.3-beta.1 or dev.test-0.1.");
  const parts = semver ? match.slice(1, 4).map(Number) : [Number(match[2]), Number(match[3]), 0];
  const [major, minor, patch] = parts;
  if (major > 2099 || minor > 999 || patch > 999) throw new Error("Version is outside the supported Android versionCode range.");
  const versionCode = major * 1000000 + minor * 1000 + patch + 1;
  if (!Number.isSafeInteger(versionCode) || versionCode > 2100000000) throw new Error("Calculated Android versionCode exceeds Android supported maximum.");
  return { version, major, minor, patch, versionCode };
}
module.exports = { parseAppVersion };
if (require.main === module) {
  try { process.stdout.write(String(parseAppVersion(process.argv[2]).versionCode)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}