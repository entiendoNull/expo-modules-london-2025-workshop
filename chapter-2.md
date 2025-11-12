# Chapter 2

In the second chapter, you'll create your own native module from scratch: an audio route detector that tells your app whether sound is playing through the speaker, wired headphones, or Bluetooth. There are more audio available routes available, but for the sake of simplicity we'll be focusing on these specific ones as they're straightforward to work with.

You'll clean up the boilerplate from the previous exercise, plan a simple TypeScript API, and then implement the native functionality in Swift and Kotlin. Finally, you'll build and test the module on a real device to confirm everything works as expected.

### Goals

- Plan and implement a custom Expo module from the ground up.
- Build a simple cross-platform API that connects JavaScript to native code.
- Build and test the module on a physical device to verify real-world behavior.

### Tasks

- Clean up the boilerplate module from Module 1
- Plan and define the TypeScript API for an audio route detector
- Implement native functionality in Swift and/or Kotlin
- Build and test the module on a physical device and verify audio route detection with different audio outputs

# Exercises

## Exercise 0: Clean up the boilerplate

Now that we have familiarized ourselves a little bit with the Expo Module's boilerplate module, let's create our own.

Since we won't be displaying any views in this module, we'll start by removing the view-related files from the boilerplate.

### Tasks

#### 1. Remove unnecessary files

Delete the following files that we won't need:

- `modules/expo-audio-route/src/ExpoAudioRouteView.tsx`
- `modules/expo-audio-route/src/ExpoAudioRouteView.web.tsx`
- `modules/expo-audio-route/src/ExpoAudioRouteModule.web.ts`
- `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteView.kt`
- `modules/expo-audio-route/ios/ExpoAudioRouteView.swift`

You can either remove them manually or by running these commands in your terminal:

```sh
rm modules/expo-audio-route/src/ExpoAudioRouteView.tsx
rm modules/expo-audio-route/src/ExpoAudioRouteView.web.tsx
rm modules/expo-audio-route/src/ExpoAudioRouteModule.web.ts
rm modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteView.kt
rm modules/expo-audio-route/ios/ExpoAudioRouteView.swift
```

In the end you should end up with the following structure in your `modules` directory:

```
modules/
└── expo-audio-route/
    ├── android/
    │   ├── src/
    │   │  ├── java/
    │   │  │   └── expo/
    │   │  │       └── modules/
    │   │  │           └── audioroute/
    │   │  │               └── ExpoAudioRouteModule.kt
    │   │  └── AndroidManifest.xml
    │   └── build.gradle
    ├── ios/
    │   ├── ExpoAudioRoute.podspec
    │   └── ExpoAudioRouteModule.swift
    ├── src/
    │   ├── ExpoAudioRoute.types.ts
    │   └── ExpoAudioRouteModule.ts
    ├── expo-module.config.json
    └── index.ts
```

#### 2. Remove boilerplate from module files

Remove the example code from the native modules, leaving just the basic module structure. Replace the entire contents of each file with the code shown below.

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteModule.swift`

Replace the entire file contents with this minimal module definition:

```swift
import ExpoModulesCore

public class ExpoAudioRouteModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAudioRoute")
  }
}
```

**File:** `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt`

Replace the entire file contents with this minimal module definition:

```kotlin
package expo.modules.audioroute

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoAudioRouteModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAudioRoute")
  }
}
```

**File:** `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`

Replace the entire file with this minimal module declaration:

```ts
import { NativeModule, requireNativeModule } from "expo";

declare class ExpoAudioRouteModule extends NativeModule {}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");
```

**File:** `modules/expo-audio-route/src/ExpoAudioRoute.types.ts`

Delete all content from this file - we'll add our own types in the next exercise.

```tsx
// modules/expo-audio-route/src/ExpoAudioRoute.types.ts should be empty
```

**File:** `modules/expo-audio-route/index.ts`

Replace the file contents with:

```ts
export { default } from "./src/ExpoAudioRouteModule";
export * from "./src/ExpoAudioRoute.types";
```

**File:** `App.tsx`

Remove all the example code from Module 1. Replace with this simple starter:

```tsx
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>Hello world!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
```

Finally, run prebuild again to remove outdated files from the native projects.

```sh
npx expo prebuild --clean
```

## Exercise 1: Plan and implement the API

As a first step, we'll focus on retrieving the current audio route in our app. This function will return the route when requested, without listening for changes yet.

Before we touch any Swift or Kotlin, we'll decide what our JavaScript API should look like. This is what developers will actually use. Everything we do on the native side is in service of this contract.

For our Audio Route module, we want a way to ask for the current audio route. Developers should be able to call one function and get back information about where audio is being routed. There are more possible options to cover, but these will do for now:

- `wiredHeadset` - Wired headphones or headset
- `bluetooth` - Bluetooth headphones or speakers
- `speaker` - Built-in device speaker
- `unknown` - Fallback for anything else

### Tasks

#### 1. Define the `AudioRoute` type

**File:** `modules/expo-audio-route/src/ExpoAudioRoute.types.ts`

Create a type describing our audio routes:

```ts
export type AudioRoute = "speaker" | "wiredHeadset" | "bluetooth" | "unknown";
```

#### 2. Declare the TypeScript module interface

Now we need to declare the TypeScript interface for our module. This tells TypeScript what methods our native module exposes.

**File:** `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`

Import the `AudioRoute` type and extend the module declaration:

```diff
import { NativeModule, requireNativeModule } from "expo";
+import { AudioRoute } from "./ExpoAudioRoute.types";

-declare class ExpoAudioRouteModule extends NativeModule {}
+declare class ExpoAudioRouteModule extends NativeModule {
+  getCurrentRouteAsync(): Promise<AudioRoute>;
+}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");
```

With these declarations in place, once we implement the native side, we'll be able to retrieve the current audio route in our React code like this:

```ts
await ExpoAudioRoute.getCurrentRouteAsync();
```

This will return one of the strings declared in our `AudioRoute` type: `"speaker"`, `"wiredHeadset"`, `"bluetooth"`, or `"unknown"`.

## Exercise 2: Implement native functionality in Swift and/or Kotlin

Choose your platform(s) and implement the audio route detection:

<details>
<summary>Swift (iOS)</summary>

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteModule.swift`

#### 2.1 Imports

First, import `AVFoundation`. This is Apple's framework for working with audio and video; we need it to access the `AVAudioSession` API, which lets us query the device's current audio routing information.

```diff
import ExpoModulesCore
+import AVFoundation
```

#### 2.2 Add private method `currentRoute`

Next, create a helper method called `currentRoute()`. This method should be placed outside of your `ModuleDefinition` (as a private method of the class).

```diff
import ExpoModulesCore
import AVFoundation

public class ExpoAudioRouteModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAudioRoute")
  }

+ private func currentRoute() -> String {
+   let session = AVAudioSession.sharedInstance()
+   let outputs = session.currentRoute.outputs
+
+   let first = outputs.first
+   if (first == nil) {
+     return "unknown"
+   }
+
+   switch (first?.portType) {
+     case .headphones, .headsetMic:
+       return "wiredHeadset"
+     case .bluetoothA2DP, .bluetoothLE, .bluetoothHFP:
+       return "bluetooth"
+     case .builtInSpeaker:
+       return "speaker"
+     default:
+       return "unknown"
+   }
+ }
}
```

This method checks the audio session's current output and returns a string matching our `AudioRoute` type based on the port type.

#### 2.3 Create async function to query for audio route

Finally, expose this functionality to JavaScript by adding an `AsyncFunction` called `getCurrentRouteAsync`. This should be placed _within_ your `ModuleDefinition`, right below `Name("ExpoAudioRoute")`.

```diff
public func definition() -> ModuleDefinition {
  Name("ExpoAudioRoute")

+ AsyncFunction("getCurrentRouteAsync") {
+   return self.currentRoute()
+ }
}
```

</details>

<details>
<summary>Kotlin (Android)</summary>

**File:** `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt`

#### 2.1 Imports

Start by adding the necessary Android imports. We need `Context` to access system services, `AudioDeviceInfo` to identify audio device types, and `AudioManager` to query the audio routing information.

```diff
package expo.modules.audioroute

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
+import android.content.Context
+import android.media.AudioDeviceInfo
+import android.media.AudioManager
```

#### 2.2 Initialize the `AudioManager`

Add a property to hold a reference to the `AudioManager`. This should be declared on the `Module` as a private class property.

```diff
class ExpoAudioRouteModule : Module() {
+ private var audioManager: AudioManager? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoAudioRoute")
  }
}
```

Initialize the `AudioManager` using the `OnCreate` lifecycle method _within_ your `ModuleDefinition`. This ensures we get the audio manager when the module is created, giving us access to the device's audio routing system.

```diff
override fun definition() = ModuleDefinition {
  Name("ExpoAudioRoute")

+ // App context is the Expo Module's API context that provices access to various system services. It's available automatically in all Expo modules that extend the Module class.
+ // The reactContext provides access to the system Android Context which is used for Android-specific operations.
+ OnCreate {
+   audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
+ }
}
```

#### 2.3 Add private method `currentRoute`

Next, create a helper method called `currentRoute()`. This method should be placed outside of your `ModuleDefinition` (as a private method of the class).

```diff
class ExpoAudioRouteModule : Module() {
  private var audioManager: AudioManager? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoAudioRoute")

    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }
  }

+ private fun currentRoute(): String {
+   val outputs = audioManager?.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
+
+   if(outputs.isNullOrEmpty()) return "unknown"
+
+   // Check in priority order: wired > bluetooth > speaker
+   val wiredTypes = listOf(
+     AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
+     AudioDeviceInfo.TYPE_WIRED_HEADSET,
+     AudioDeviceInfo.TYPE_USB_HEADSET
+   )
+
+   val bluetoothTypes = listOf(
+     AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
+     AudioDeviceInfo.TYPE_BLUETOOTH_SCO
+   )
+
+   val speakerTypes = listOf(
+     AudioDeviceInfo.TYPE_BUILTIN_SPEAKER,
+     AudioDeviceInfo.TYPE_BUILTIN_EARPIECE
+   )
+
+   val wired = outputs.firstOrNull { it.type in wiredTypes }
+   val bluetooth = outputs.firstOrNull { it.type in bluetoothTypes }
+   val speaker = outputs.firstOrNull { it.type in speakerTypes }
+
+   val device = when {
+     wired != null -> wired
+     bluetooth != null -> bluetooth
+     speaker != null -> speaker
+     else -> null
+   }
+
+   return when (device?.type) {
+     in wiredTypes -> "wiredHeadset"
+     in bluetoothTypes -> "bluetooth"
+     in speakerTypes -> "speaker"
+     else -> "unknown"
+   }
+ }
}
```

This method queries all connected audio output devices and checks them in priority order (wired first, then Bluetooth, then built-in speaker), returning a string that matches our `AudioRoute` type.

#### 2.4 Create async function to query for audio route

Finally, expose this functionality to JavaScript by adding an `AsyncFunction` called `getCurrentRouteAsync`. This should be placed _within_ your `ModuleDefinition`, right below `OnCreate { ... }`.

```diff
override fun definition() = ModuleDefinition {
  Name("ExpoAudioRoute")

  OnCreate {
    audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  }

+ AsyncFunction("getCurrentRouteAsync") {
+   currentRoute()
+ }
}
```

</details>

## Exercise 3: Build and test the audio route detector

Now that we've implemented the native code, it's time to build and test our module on a real device!

### Tasks

#### 1. Build and run on your device

Since we changed native code, we need to rebuild. We'll test on a physical device since audio routing works best on real hardware.

**iOS:**

```sh
npx expo run:ios --device
```

**Android:**

```sh
npx expo run:android --device
```

When prompted, select your connected device from the list.

<img width="496" height="101" alt="image" src="https://github.com/user-attachments/assets/0a782ec7-1cfa-4123-9f42-5e5c3ef7d3d9" />

> [!NOTE]
>
> 👀 **Simulators vs Real Devices:**
>
> - **iOS Simulator:** Cannot detect Bluetooth devices or wired headphones. Will typically always return `"speaker"`.
> - **Android Emulator:** Cannot detect Bluetooth devices or wired headphones. Will typically always return `"speaker"`.
> - **Physical Devices:** Full audio route detection works - you can test speaker, wired headphones, and Bluetooth connections.

#### 2. Create a test interface in App.tsx

Open `App.tsx` and create a button that calls `getCurrentRouteAsync()` and displays the result.

**File:** `App.tsx`

```tsx
import * as React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import ExpoAudioRoute from "./modules/expo-audio-route";
import type { AudioRoute } from "./modules/expo-audio-route";

export default function App() {
  const [audioRoute, setAudioRoute] = React.useState<AudioRoute>("unknown");

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text>Current Route: {audioRoute}</Text>
        <Button
          title="Get Audio Route"
          onPress={async () => {
            const route = await ExpoAudioRoute.getCurrentRouteAsync();
            setAudioRoute(route);
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
```

#### 3. Test with different audio routes

With the app running on your physical device, test all the different audio output options:

**Test 1: Built-in speaker**

1. Make sure no audio devices are connected
2. Tap "Get Audio Route"
3. You should see `"speaker"`

**Test 2: Wired headphones**

1. Connect wired headphones or a wired headset to your device
2. Tap "Get Audio Route"
3. You should see `"wiredHeadset"`

**Test 3: Bluetooth**

1. Disconnect wired headphones if connected
2. Connect a Bluetooth device (headphones, speaker, or car audio)
3. Tap "Get Audio Route"
4. You should see `"bluetooth"`

**Test 4: Switch back to speaker**

1. Disconnect all external audio devices
2. Tap "Get Audio Route"
3. You should see `"speaker"` again

> [!NOTE]
>
> 👀 **Try it:** Each time you change the audio route (by connecting or disconnecting audio devices), tap the button to verify the module correctly detects the new route. The module detects which output is currently connected, so you should see the route change immediately after plugging in or pairing a device.
>
> https://github.com/user-attachments/assets/4aa25453-a6d8-462b-af4f-3470a2ca67f7

## Next exercise

[Chapter 3 👉](./chapter-3.md)
