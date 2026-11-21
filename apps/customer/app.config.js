const { expo: staticConfig } = require("./app.json");

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

module.exports = ({ config = staticConfig } = {}) => {
  const appVersion = process.env.BAMANASHOP_VERSION?.trim();
  if (appVersion) {
    parseAppVersion(appVersion);
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

  const extra = { ...(config.extra ?? {}) };
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
