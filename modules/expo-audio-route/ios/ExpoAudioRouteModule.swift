import ExpoModulesCore
import AVFoundation

public class ExpoAudioRouteModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoAudioRoute')` in JavaScript.
    Name("ExpoAudioRoute")

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    // This function retrieves the current audio output route (e.g., "speaker", "bluetooth",
    // "wiredHeadset") from the device's audio session. The asynchronous nature ensures that
    // querying the AVAudioSession doesn't block the JavaScript thread, maintaining smooth UI performance.
    AsyncFunction("getCurrentRouteAsync") {
      return self.currentRoute()
    }
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