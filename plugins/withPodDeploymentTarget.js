const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Xcode 27 raised the minimum supported iOS deployment target to 15.0 and
// reports anything lower as an *error* rather than a warning. Several pods —
// and especially their generated resource-bundle targets (*_Privacy,
// *Bundle, *_resources) — still declare 10.0-13.0, which fails the archive:
//
//   error: The iOS deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to
//   13.0, but the range of supported deployment target versions is 15.0 to 27.0
//
// react_native_post_install only normalises the pod targets it knows about, so
// the resource bundles slip through. This raises every target in every
// generated project to the Podfile's own platform minimum.

const MARKER = 'IPHONEOS_DEPLOYMENT_TARGET raised for Xcode 27';

const ANCHOR = `      :ccache_enabled => ccache_enabled?(podfile_properties),
    )`;

const INJECTED = `      :ccache_enabled => ccache_enabled?(podfile_properties),
    )

    # ${MARKER}
    min_target = podfile_properties['ios.deploymentTarget'] || '15.1'
    projects = [installer.pods_project]
    projects += installer.generated_projects if installer.respond_to?(:generated_projects)
    projects.compact.uniq.each do |project|
      project.targets.each do |target|
        target.build_configurations.each do |bc|
          current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
          if current.nil? || Gem::Version.new(current.to_s) < Gem::Version.new(min_target)
            bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_target
          end
        end
      end
      project.save
    end`;

module.exports = function withPodDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes(MARKER)) return cfg;

      if (!contents.includes(ANCHOR)) {
        throw new Error(
          'withPodDeploymentTarget: post_install anchor not found in ios/Podfile. ' +
            'The Expo Podfile template likely changed — update this plugin.'
        );
      }

      fs.writeFileSync(podfile, contents.replace(ANCHOR, INJECTED));
      return cfg;
    },
  ]);
};
