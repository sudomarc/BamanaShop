const { expo: staticConfig } = require("./app.json");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = ({ config = staticConfig } = {}) => {
  const extra = { ...(config.extra ?? {}) };

  // GitHub Actions supplies EAS_PROJECT_ID when it starts a build. EAS also
  // exposes EAS_BUILD_PROJECT_ID inside its remote build workers; GitHub
  // repository secrets are not forwarded to those workers.
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
    // Local Expo development does not require an EAS project association.
    delete extra.eas;
  }

  return {
    ...config,
    extra,
  };
};
