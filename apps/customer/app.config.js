const { expo: staticConfig } = require("./app.json");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

module.exports = ({ config = staticConfig } = {}) => {
  const extra = { ...(config.extra ?? {}) };

  // Optional EAS project association for workflows that still use EAS.
  // The Android GitHub Actions workflow builds locally with Gradle and does
  // not require an Expo account, EXPO_TOKEN, or EAS_PROJECT_ID.
  const projectId =
    process.env.EAS_PROJECT_ID?.trim() ||
    process.env.EAS_BUILD_PROJECT_ID?.trim() ||
    extra.eas?.projectId;

  if (projectId) {
    if (!UUID_PATTERN.test(projectId)) {
      throw new Error(
        "EAS project ID must be a valid Expo project UUID. Check EAS_PROJECT_ID or EAS_BUILD_PROJECT_ID."
      );
    }

    extra.eas = {
      ...(extra.eas ?? {}),
      projectId,
    };
  } else {
    delete extra.eas;
  }

  const appVersion = process.env.BAMANASHOP_VERSION?.trim();
  if (appVersion && !VERSION_PATTERN.test(appVersion)) {
    throw new Error(
      "BAMANASHOP_VERSION must use MAJOR.MINOR.PATCH, for example 1.2.3."
    );
  }

  const versionCodeRaw = process.env.BAMANASHOP_ANDROID_VERSION_CODE?.trim();
  const androidVersionCode = versionCodeRaw ? Number(versionCodeRaw) : undefined;
  if (
    androidVersionCode !== undefined &&
    (!Number.isSafeInteger(androidVersionCode) ||
      androidVersionCode < 1 ||
      androidVersionCode > 2100000000)
  ) {
    throw new Error(
      "BAMANASHOP_ANDROID_VERSION_CODE must be an integer between 1 and 2100000000."
    );
  }

  const buildProfile = process.env.BAMANASHOP_BUILD_PROFILE?.trim();
  if (
    buildProfile &&
    !["dev", "beta", "production"].includes(buildProfile)
  ) {
    throw new Error(
      "BAMANASHOP_BUILD_PROFILE must be dev, beta, or production."
    );
  }

  if (buildProfile) {
    extra.buildProfile = buildProfile;
  }

  return {
    ...config,
    ...(appVersion ? { version: appVersion } : {}),
    android: {
      ...(config.android ?? {}),
      ...(androidVersionCode !== undefined
        ? { versionCode: androidVersionCode }
        : {}),
    },
    extra,
  };
};
