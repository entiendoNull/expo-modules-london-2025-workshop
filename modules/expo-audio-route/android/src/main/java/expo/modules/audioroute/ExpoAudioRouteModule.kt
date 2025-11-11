package expo.modules.audioroute

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager

class ExpoAudioRouteModule : Module() {
  // Reference to the Android AudioManager system service.
  // This is initialized in the OnCreate lifecycle method and used to query audio routing information.
  private var audioManager: AudioManager? = null

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoAudioRoute')` in JavaScript.
    Name("ExpoAudioRoute")

    // Module lifecycle callback that executes when the module is created.
    // Initializes the audioManager by retrieving the AUDIO_SERVICE from the Android system services.
    // This ensures the AudioManager is available for all audio routing queries throughout the module's lifetime.
    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }

    // Exposes the current audio route to JavaScript as an async function.
    // Can be called from JavaScript using: ExpoAudioRoute.getCurrentRouteAsync()
    AsyncFunction("getCurrentRouteAsync") {
      currentRoute()
    }
  }

  /**
  * Determines the current audio output route by querying connected audio devices.
  * Devices are checked in priority order: wired headsets → bluetooth → built-in speakers.
  *
  * The priority hierarchy ensures that:
  * - Wired connections take precedence over wireless (typically user's explicit choice)
  * - Bluetooth is preferred over built-in speakers
  * - Built-in speaker/earpiece is the fallback option
  *
  * @return String identifier of the current audio route:
  * - "wiredHeadset": Wired headphones or headset connected
  * - "bluetooth": Bluetooth A2DP or SCO device connected
  * - "speaker": Using built-in speaker or earpiece
  * - "unknown": No recognizable audio output device found or AudioManager unavailable
  *
  * Implementation details:
  * - Queries all available output devices using AudioManager.GET_DEVICES_OUTPUTS
  * - Returns "unknown" if AudioManager is null (initialization failed)
  * - Uses firstOrNull with type matching to find the highest priority connected device
  */
  private fun currentRoute(): String {
    val outputs = audioManager?.getDevices(AudioManager.GET_DEVICES_OUTPUTS)

    if(outputs.isNullOrEmpty()) return "unknown"

    // Check in priority order: wired > bluetooth > speaker
    val wiredTypes = listOf(
      AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
      AudioDeviceInfo.TYPE_WIRED_HEADSET,
      AudioDeviceInfo.TYPE_USB_HEADSET
    )

    val bluetoothTypes = listOf(
      AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
      AudioDeviceInfo.TYPE_BLUETOOTH_SCO
    )

    val speakerTypes = listOf(
      AudioDeviceInfo.TYPE_BUILTIN_SPEAKER,
      AudioDeviceInfo.TYPE_BUILTIN_EARPIECE
    )

    val wired = outputs.firstOrNull { it.type in wiredTypes }
    val bluetooth = outputs.firstOrNull { it.type in bluetoothTypes }
    val speaker = outputs.firstOrNull { it.type in speakerTypes }

    val device = when {
      wired != null -> wired
      bluetooth != null -> bluetooth
      speaker != null -> speaker
      else -> null
    }

    return when (device?.type) {
      in wiredTypes -> "wiredHeadset"
      in bluetoothTypes -> "bluetooth"
      in speakerTypes -> "speaker"
      else -> "unknown"
    }
  }
}