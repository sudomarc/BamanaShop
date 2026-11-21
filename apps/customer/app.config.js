const { expo: staticConfig } = require("./app.json");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = ({ config = staticConfig } = {}) => {
  const projectId = process.env.EAS_PROJECT_ID?.trim();
  const extra = { ...(config.extra ?? {}) };

  if (projectId) {
    if (!UUID_PATTERN.test(projectId)) {
      throw new Error(
        "EAS_PROJECT_ID must be a valid Expo project UUID. Check the GitHub Actions secret."
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
