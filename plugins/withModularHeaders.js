const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Google Sign-In pulls in AppCheckCore, a Swift pod that imports GoogleUtilities
// and RecaptchaInterop. Those two are Obj-C and ship no module maps, so as static
// libraries they can't be imported from Swift and `pod install` fails with
// "The following Swift pods cannot yet be integrated as static libraries".
// Declaring them with :modular_headers => true generates the module maps.
//
// This runs on every prebuild so the fix survives `expo prebuild --clean` and
// clean EAS builds, which regenerate ios/Podfile from scratch.

const MARKER = "pod 'GoogleUtilities', :modular_headers => true";

const INJECTED = [
  '  # Google Sign-In pulls in AppCheckCore (Swift), which imports these Obj-C pods.',
  '  # As static libraries they need explicit module maps to be importable from Swift.',
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
].join('\n');

const ANCHOR = '  use_react_native!(';

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes(MARKER)) {
        return cfg;
      }

      if (!contents.includes(ANCHOR)) {
        // Fail loudly: silently skipping would surface later as a confusing
        // pod install error rather than pointing at this plugin.
        throw new Error(
          `withModularHeaders: anchor "${ANCHOR.trim()}" not found in ios/Podfile. ` +
            'The Expo Podfile template likely changed — update this plugin.'
        );
      }

      fs.writeFileSync(podfile, contents.replace(ANCHOR, `${INJECTED}\n\n${ANCHOR}`));
      return cfg;
    },
  ]);
};
