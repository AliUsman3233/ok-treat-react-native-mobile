const { withXcodeProject } = require('expo/config-plugins');

// Manual signing for the Release configuration.
//
// Xcode's "Automatically manage signing" insists on maintaining a *development*
// provisioning profile for the target, and development profiles require at least
// one registered iOS device. With no device on the team, archiving fails with
// "Your team has no devices from which to generate a provisioning profile" — even
// though App Store distribution itself never needs one.
//
// Pinning Release to manual signing with the App Store profile sidesteps that
// entirely. Debug stays on automatic so day-to-day simulator work is unaffected
// (simulator builds aren't signed at all).
//
// None of these values are secret: a team ID and a profile name are both public
// identifiers. The private key lives only in the keychain.

const TEAM_ID = '2TC9W568PJ';
const PROFILE_NAME = 'AliUsmanProvisioningProfile';
// Pin the exact certificate by SHA-1. Two "Apple Distribution: Patrick Leong"
// certs exist in the keychain and only this one is embedded in the profile
// above; the bare name "Apple Distribution" is ambiguous and xcodebuild picks
// the wrong one, failing with "profile doesn't include signing certificate".
const CERT_SHA1 = 'FF5DD8442347060E69CE65056CA9D43289BA32B5';
const BUNDLE_ID = 'com.mubbits.oktreat';

const unquote = (v) => (typeof v === 'string' ? v.replace(/^"|"$/g, '') : v);

module.exports = function withReleaseSigning(config) {
  return withXcodeProject(config, (cfg) => {
    const configurations = cfg.modResults.pbxXCBuildConfigurationSection();
    let patched = 0;

    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      // Section keys come in pairs: the object plus a `<key>_comment` string.
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) continue;

      const settings = entry.buildSettings;
      // Only the app target — Pods targets share this section but must not be touched.
      if (unquote(settings.PRODUCT_BUNDLE_IDENTIFIER) !== BUNDLE_ID) continue;

      settings.DEVELOPMENT_TEAM = TEAM_ID;

      if (entry.name === 'Release') {
        settings.CODE_SIGN_STYLE = 'Manual';
        settings.CODE_SIGN_IDENTITY = `"${CERT_SHA1}"`;
        settings.PROVISIONING_PROFILE_SPECIFIER = `"${PROFILE_NAME}"`;
        patched++;
      } else {
        // Debug must stay automatic. Unticking "Automatically manage signing" in
        // Xcode flips the whole target to Manual, which leaves Debug pointing at
        // an empty profile and breaks device builds. Assert it back every prebuild.
        settings.CODE_SIGN_STYLE = 'Automatic';
        settings.CODE_SIGN_IDENTITY = '"Apple Development"';
        settings.PROVISIONING_PROFILE_SPECIFIER = '""';
      }
    }

    if (patched === 0) {
      throw new Error(
        `withReleaseSigning: no Release build configuration found for ${BUNDLE_ID}. ` +
          'If the bundle identifier changed, update BUNDLE_ID in this plugin.'
      );
    }

    return cfg;
  });
};
