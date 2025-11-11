import ExpoModulesCore
import AVFoundation

public class ExpoAudioRouteModule: Module {
  // Reference to the system's NotificationCenter for managing audio route change notifications.
  // Uses the default shared instance to observe AVAudioSession route change events.
  private let notificationCenter: NotificationCenter = .default

  // Observer token returned by NotificationCenter when registering for audio route change notifications.
  // This token is retained to allow proper cleanup and removal of the observer when no longer needed.
  private var routeChangeObserver: NSObjectProtocol?

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoAudioRoute')` in JavaScript.
    Name("ExpoAudioRoute")

    // Declares an event that JavaScript can subscribe to for audio route change notifications.
    Events("onAudioRouteChange")

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    // This function retrieves the current audio output route (e.g., "speaker", "bluetooth",
    // "wiredHeadset") from the device's audio session. The asynchronous nature ensures that
    // querying the AVAudioSession doesn't block the JavaScript thread, maintaining smooth UI performance.
    AsyncFunction("getCurrentRouteAsync") {
      return self.currentRoute()
    }

    // Module lifecycle callback that executes when JavaScript begins listening to the onAudioRouteChange event.
    // This is called automatically when the first event listener is added on the JavaScript side.
    OnStartObserving("onAudioRouteChange") {
      self.sendEvent("onAudioRouteChange", ["route": self.currentRoute()])
      self.startObservingRouteChanges()
    }

    // Module lifecycle callback that executes when JavaScript stops listening to the onAudioRouteChange event.
    // This is called automatically when the last event listener is removed on the JavaScript side.
    OnStopObserving("onAudioRouteChange")  {
      self.stopObservingRouteChanges()
    }
  }

  // Registers an observer with NotificationCenter to monitor AVAudioSession route changes.
  //
  // When audio routing changes (e.g., headphones plugged in/out, Bluetooth connected/disconnected),
  // the observer callback is triggered and sends an event to JavaScript with the updated route.
  //
  // Implementation details:
  // - Observes AVAudioSession.routeChangeNotification
  // - Stores the observer token in routeChangeObserver for later cleanup
  //
  // The event payload includes:
  // - route: The current audio route as determined by currentRoute()
  private func startObservingRouteChanges() {
    func handleRouteChange(_: Notification) {
      self.sendEvent("onAudioRouteChange", ["route": self.currentRoute()])
    }

    self.routeChangeObserver = NotificationCenter.default.addObserver(
      forName: AVAudioSession.routeChangeNotification,
      object: AVAudioSession.sharedInstance(),
      queue: .main,
      using: handleRouteChange
    )
  }

  // Unregisters the AVAudioSession route change notification observer.
  //
  // This cleanup function:
  // - Removes the observer from NotificationCenter to prevent memory leaks
  // - Nullifies the routeChangeObserver reference to free resources
  // - Is safe to call even if no observer is currently registered
  //
  // Should be called when:
  // - JavaScript removes all event listeners for onAudioRouteChange
  // - The module is being destroyed or cleaned up
  private func stopObservingRouteChanges() {
    if (routeChangeObserver == nil) {
      return
    }
    notificationCenter.removeObserver(routeChangeObserver!)
    routeChangeObserver = nil
  }

  // Determines the current audio output route from the AVAudioSession.
  // This method queries the AVAudioSession's current route and examines the first output port
  // to determine where audio is being routed. It maps various iOS audio port types to
  // simplified route names for easier handling in JavaScript.
  //
  // Returns: A string representing the current audio route:
  // - "wiredHeadset": Audio is routed through wired headphones or headset microphone
  // - "bluetooth": Audio is routed through any Bluetooth device (A2DP, LE, or HFP)
  // - "speaker": Audio is routed through the device's built-in speaker
  // - "unknown": No output detected or unrecognized port type
  private func currentRoute() -> String {
    let session = AVAudioSession.sharedInstance()
    let outputs = session.currentRoute.outputs

    let first = outputs.first
    if (first == nil) {
      return "unknown"
    }

    switch (first?.portType) {
      case .headphones, .headsetMic:
        return "wiredHeadset"
      case .bluetoothA2DP, .bluetoothLE, .bluetoothHFP:
        return "bluetooth"
      case .builtInSpeaker:
        return "speaker"
      default:
        return "unknown"
    }
  }
}