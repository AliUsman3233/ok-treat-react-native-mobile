const { withXcodeProject, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

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

// Release needs its own entitlements file.
//
// expo-notifications writes aps-environment=development into OkTreat.entitlements.
// With *automatic* signing Xcode rewrites that to production when it exports for
// the App Store, but Release is pinned to manual signing above, so the file is
// signed verbatim. The App Store profile only grants aps-environment=production,
// so the shipped binary asked for an entitlement its profile did not grant and
// amfid killed it at launch — App Review saw "crashed on launch" while the
// Simulator, which never validates entitlements, ran fine.
//
// Keep Debug on development (that is what a development profile grants) and
// point Release at this production copy.
const RELEASE_ENTITLEMENTS_NAME = 'OkTreatRelease.entitlements';
const RELEASE_ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>aps-environment</key>
    <string>production</string>
    <key>com.apple.developer.applesignin</key>
    <array>
      <string>Default</string>
    </array>
  </dict>
</plist>
`;

const unquote = (v) => (typeof v === 'string' ? v.replace(/^"|"$/g, '') : v);

const withReleaseEntitlementsFile = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      // Written on every prebuild so the fix survives `expo prebuild --clean`.
      const dest = path.join(
        cfg.modRequest.platformProjectRoot,
        'OkTreat',
        RELEASE_ENTITLEMENTS_NAME
      );
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, RELEASE_ENTITLEMENTS);
      return cfg;
    },
  ]);

module.exports = function withReleaseSigning(config) {
  return withXcodeProject(withReleaseEntitlementsFile(config), (cfg) => {
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
        settings.CODE_SIGN_ENTITLEMENTS = `OkTreat/${RELEASE_ENTITLEMENTS_NAME}`;
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
