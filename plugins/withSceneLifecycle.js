const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

// Adopt the UIScene lifecycle.
//
// iOS 26 added a launch-time check for scene adoption and on iOS 27 it is a
// hard trap: an app linked against the iOS 26+ SDK that still drives its window
// from the app delegate is killed ~200ms into launch with EXC_BREAKPOINT in
// _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption. App Review hit
// this on iOS 27.0 and rejected 1.1.11 as "crashed on launch"; it does NOT
// reproduce on an iOS 26.5 simulator, which is why local testing missed it.
//
// Neither React Native 0.81 nor Expo 54 ships scene support, so the generated
// AppDelegate.swift creates the window itself. This plugin moves that into a
// SceneDelegate and declares the scene configuration, on every prebuild.
//
// Every anchor below throws if it is missing rather than silently skipping —
// a silent skip would come back as another App Review rejection.

const MARKER = 'UIScene lifecycle adoption';

const ANCHORS = {
  imports: 'import ReactAppDependencyProvider',
  factoryProp: '  var reactNativeFactory: RCTReactNativeFactory?',
  linkingComment: '  // Linking API',
  delegateClass: 'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {',
};

// The window-creation block Expo generates. Matched loosely on its distinctive
// lines so whitespace changes in the template don't break the match.
const WINDOW_BLOCK =
  /#if os\(iOS\) \|\| os\(tvOS\)\s*\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\s*\n\s*factory\.startReactNative\([\s\S]*?\)\s*\n#endif\n/;

const LAUNCH_OPTIONS_PROP = `  var reactNativeFactory: RCTReactNativeFactory?

  // Stashed so SceneDelegate can hand them to React Native. Under the UIScene
  // lifecycle the root view is built in scene(_:willConnectTo:options:), which
  // runs after didFinishLaunchingWithOptions and never receives launchOptions
  // itself — and RN uses them for things like a notification that cold-started
  // the app.
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?`;

const SCENE_CONFIG_METHOD = `  // MARK: - ${MARKER}
  //
  // iOS 26 added a launch-time check for scene adoption, and on iOS 27 it is a
  // hard trap: an app linked against the iOS 26+ SDK that still drives its
  // window from the app delegate is killed ~200ms into launch with
  // EXC_BREAKPOINT in
  // _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption. That is what
  // App Review hit on iOS 27.0 — it does not reproduce on an iOS 26.5
  // simulator.
  //
  // Adoption is declared twice on purpose: UIApplicationSceneManifest in
  // Info.plist (with a real configuration — a manifest carrying only
  // UIApplicationSupportsMultipleScenes does not satisfy the check) and this
  // method. Either alone is reported to be enough; both together is cheap.
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }

  // Linking API`;

const SCENE_DELEGATE_CLASS = `/// Owns the window under the UIScene lifecycle.
///
/// UIKit stops calling the app delegate's URL and user-activity handlers once an
/// app adopts scenes, so every callback here is forwarded back to the app
/// delegate. That keeps one code path for deep links: RCTLinkingManager plus
/// every Expo module that subscribes to those app-delegate methods
/// (expo-linking, expo-notifications, and the Google Sign-In OAuth callback,
/// which arrives as an oktreat:// URL).
@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    // Mirrored onto the app delegate because some native modules still reach
    // for UIApplication.shared.delegate?.window.
    appDelegate.window = window

    // Builds the root view and calls makeKeyAndVisible.
    appDelegate.reactNativeFactory?.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions
    )

    // A cold start from a deep link or universal link delivers it here rather
    // than through the app delegate.
    for context in connectionOptions.urlContexts {
      forward(url: context.url)
    }
    for activity in connectionOptions.userActivities {
      forward(userActivity: activity)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      forward(url: context.url)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    forward(userActivity: userActivity)
  }

  private func forward(url: URL) {
    _ = UIApplication.shared.delegate?.application?(UIApplication.shared, open: url, options: [:])
  }

  private func forward(userActivity: NSUserActivity) {
    _ = UIApplication.shared.delegate?.application?(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {`;

const require_ = (contents, anchor, what) => {
  if (!contents.includes(anchor)) {
    throw new Error(
      `withSceneLifecycle: anchor for ${what} not found in AppDelegate.swift. ` +
        'The Expo AppDelegate template likely changed — update this plugin. ' +
        'Shipping without it crashes on launch on iOS 27.'
    );
  }
};

const withSceneAppDelegate = (config) =>
  withAppDelegate(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (contents.includes(MARKER)) return cfg;

    if (cfg.modResults.language !== 'swift') {
      throw new Error(
        `withSceneLifecycle: expected a Swift AppDelegate, got ${cfg.modResults.language}.`
      );
    }

    require_(contents, ANCHORS.imports, 'imports');
    require_(contents, ANCHORS.factoryProp, 'the factory property');
    require_(contents, ANCHORS.linkingComment, 'the Linking API section');
    require_(contents, ANCHORS.delegateClass, 'the ReactNativeDelegate class');
    if (!WINDOW_BLOCK.test(contents)) {
      throw new Error(
        'withSceneLifecycle: the window-creation block was not found in ' +
          'AppDelegate.swift. The Expo template likely changed — update this plugin.'
      );
    }

    // UIWindow/UIScene types.
    contents = contents.replace(ANCHORS.imports, `${ANCHORS.imports}\nimport UIKit`);
    // Keep launchOptions reachable from the scene delegate.
    contents = contents.replace(ANCHORS.factoryProp, LAUNCH_OPTIONS_PROP);
    // The scene owns the window now.
    contents = contents.replace(
      WINDOW_BLOCK,
      '    self.launchOptions = launchOptions\n\n' +
        '    // The window is NOT created here any more — see SceneDelegate below.\n'
    );
    contents = contents.replace(ANCHORS.linkingComment, SCENE_CONFIG_METHOD);
    contents = contents.replace(ANCHORS.delegateClass, SCENE_DELEGATE_CLASS);

    cfg.modResults.contents = contents;
    return cfg;
  });

const withSceneManifest = (config) =>
  withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

module.exports = function withSceneLifecycle(config) {
  return withSceneManifest(withSceneAppDelegate(config));
};
