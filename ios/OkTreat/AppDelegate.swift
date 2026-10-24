import Expo
import React
import ReactAppDependencyProvider
import UIKit

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  // Stashed so SceneDelegate can hand them to React Native. Under the UIScene
  // lifecycle the root view is built in scene(_:willConnectTo:options:), which
  // runs after didFinishLaunchingWithOptions and never receives launchOptions
  // itself — and RN uses them for things like a notification that cold-started
  // the app.
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    self.launchOptions = launchOptions

    // The window is NOT created here any more — see SceneDelegate below.

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // MARK: - UIScene lifecycle adoption
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

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

/// Owns the window under the UIScene lifecycle.
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

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
