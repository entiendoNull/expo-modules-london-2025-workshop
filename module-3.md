# Module 3

In the third module, you'll extend your audio route detector to handle real-time updates. You'll add native event support so your app can respond automatically when the audio route changes — for example, when you plug in headphones or connect a Bluetooth speaker. You'll plan the event API, implement the listener logic in both Swift and Kotlin, and wire it up in React using event subscriptions.

### Goals

- Add event support to your native module for real-time audio route changes.
- Connect native events to React using Expo’s listener and lifecycle hooks.
- Test the event flow on a physical device to ensure updates trigger correctly.

### Tasks

- Plan and define the event API in TypeScript
- Implement native event support in Swift and/or Kotlin
- Build the app and implement event listeners in React
- Test real-time audio route detection with different audio outputs

# Exercises

## Exercise 0: Plan and define the event API

The first part of our module is now ready and we can query for the current audio route. In this exercise, we'll define the event types that will allow our module to notify JavaScript when the audio route changes.

Just as in Module 2, we'll start by defining the API that we would like to expose. We've already defined the available audio routes, so now we'll add the event payloads and the shape of the events our module will emit.

### Tasks

#### 1. Define the event types

**File:** `modules/expo-audio-route/src/ExpoAudioRoute.types.ts`

Add the event type definitions to describe what data will be sent when the audio route changes:

```diff
export type AudioRoute = "speaker" | "wiredHeadset" | "bluetooth" | "unknown";

+ export type RouteChangeEvent = {
+   route: AudioRoute;
+ };
+
+ export type ExpoAudioRouteModuleEvents = {
+   onAudioRouteChange: (params: RouteChangeEvent) => void;
+ };
```

The `RouteChangeEvent` type describes the data payload that will be sent with each event (the new audio route), and `ExpoAudioRouteModuleEvents` defines the event name and its handler signature.

#### 2. Update the module declaration

Now we need to update our module declaration to include the event types. By adding `ExpoAudioRouteModuleEvents` as a generic parameter to `NativeModule`, we get full TypeScript support for our event listeners.

**File:** `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`

Import the event types and pass them to the NativeModule generic:

```diff
import { NativeModule, requireNativeModule } from "expo";
-import { AudioRoute } from "./ExpoAudioRoute.types";
+import { AudioRoute, ExpoAudioRouteModuleEvents } from "./ExpoAudioRoute.types";

-declare class ExpoAudioRouteModule extends NativeModule {
+declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  getCurrentRouteAsync(): Promise<AudioRoute>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");
```

With this change, TypeScript will now know about the `onAudioRouteChange` event. We don't need to explicitly declare `addListener` or `removeListener`—these are already provided by Expo Modules with full type safety.

## Exercise 1: Implement native event support

Now we'll implement the native side of event handling. This involves setting up observers that watch for audio route changes and send events to JavaScript when they occur.

### Tasks

#### 1. Define the event name

Let's start with defining the event names that the module can send to JavaScript. This part is exactly the same in both `swift` and `kotlin` and it should be placed _within_ your `ModuleDefinition`.`:

**Swift:**

```diff
public func definition() -> ModuleDefinition {
  Name("ExpoAudioRoute")

+ Events("onAudioRouteChange")
  ...
}
```

**Kotlin:**

```kotlin
override fun definition() = ModuleDefinition {
  Name("ExpoAudioRoute")

+ Events("onAudioRouteChange")
  ...
}
```

> [!NOTE]
>
> If your module needs to send multiple events, you can separate them with commas: `Events("onAudioRouteChange", "onSomethingElse")`

#### 2. Add an observer method

Now we'll create a method to listen for audio route changes on the native side. Note that we're just defining the method here - we won't actually start observing yet. We'll activate it using Expo's lifecycle hooks in a later step.

<details>
<summary>Swift (iOS)</summary>

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteModule.swift`

**2.1 Add properties for notification handling**

First, add two properties at the class level (outside of `ModuleDefinition`:

```diff
+ private let notificationCenter: NotificationCenter = .default
+ private var routeChangeObserver: NSObjectProtocol?
public func definition() -> ModuleDefinition { ... }
```

- `notificationCenter` is declared as `let` because it's a constant reference to the notification system
- `routeChangeObserver` is declared as `var` because we need to store and potentially remove the observer later (it starts as `nil`)

**2.2 Create the start observing method**

Add this method outside of your `ModuleDefinition`, for example above your `currentRoute()` method:

```diff
private let notificationCenter: NotificationCenter = .default
private var routeChangeObserver: NSObjectProtocol?
public func definition() -> ModuleDefinition { ... }
+ private func startObservingRouteChanges() {
+   func handleRouteChange(_: Notification) {
+     self.sendEvent("onAudioRouteChange", ["route": self.currentRoute()])
+   }
+
+   self.routeChangeObserver = NotificationCenter.default.addObserver(
+     forName: AVAudioSession.routeChangeNotification,
+     object: AVAudioSession.sharedInstance(),
+     queue: .main,
+     using: handleRouteChange
+   )
+ }
private func currentRoute() -> String { ... }
```

This method registers an observer that watches for route change notifications from the audio session. When a change occurs, it calls `sendEvent()` to notify JavaScript with the new route.

</details>

<details>
<summary>Kotlin (Android)</summary>

**File:** `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt`

**2.1** Import import android.media.AudioDeviceInfo

```diff
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
+import android.media.AudioDeviceCallback
```

**2.2 Add a property for the device callback**

Add this property at the class level (outside of `definition()`), right below your `audioManager` declaration:

```diff
  private var audioManager: AudioManager? = null
+ private var deviceCallback: AudioDeviceCallback? = null

  override fun definition() = ModuleDefinition { ... }
```

We declare this as `var` because we'll assign it when we start observing and may need to unregister it later.

**2.3 Create the start observing method**

Add this method outside of your `ModuleDefinition`, for example above your `currentRoute()` method:

```diff
  private var audioManager: AudioManager? = null
  private var deviceCallback: AudioDeviceCallback? = null

  override fun definition() = ModuleDefinition { ... }
+ private fun startObservingRouteChanges() {
+   if (deviceCallback != null || audioManager == null) return
+
+   fun onChange() {
+     sendEvent("onAudioRouteChange", mapOf("route" to currentRoute()))
+   }
+
+   deviceCallback = object : AudioDeviceCallback() {
+     override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>) = onChange()
+     override fun onAudioDevicesRemoved(removed: Array<out AudioDeviceInfo>) = onChange()
+   }
+
+   audioManager?.registerAudioDeviceCallback(deviceCallback, null)
+ }
  private fun currentRoute(): String { ... }
```

This method creates an `AudioDeviceCallback` that watches for when audio devices are added or removed (like plugging in headphones or connecting Bluetooth). When either happens, it calls `sendEvent()` to notify JavaScript.

</details>

#### 3. Add a stop observing method

We also need a way to clean up when we're done observing. This prevents unnecessary callbacks and ensures proper resource cleanup when JavaScript stops listening.

<details>
<summary>Swift (iOS)</summary>

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteModule.swift`

Add this method right after `startObservingRouteChanges()`:

```diff
private func startObservingRouteChanges() { ... }

+ private func stopObservingRouteChanges() {
+   if (routeChangeObserver == nil) {
+     return
+   }
+   notificationCenter.removeObserver(routeChangeObserver!)
+   routeChangeObserver = nil
+ }

private func currentRoute() -> String { ... }
```

It checks if an observer exists, and if so, removes it and sets `routeChangeObserver` back to `nil` to indicate we're no longer observing.

</details>

<details>
<summary>Kotlin (Android)</summary>

**File:** `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt`

Add this method right after `startObservingRouteChanges()`:

```diff
private fun startObservingRouteChanges() { ... }

+ private fun stopObservingRouteChanges() {
+   if (deviceCallback == null || audioManager == null) return
+   audioManager?.unregisterAudioDeviceCallback(deviceCallback)
+   deviceCallback = null
+ }

private fun currentRoute(): String { ... }
```

This unregisters our callback from the audio manager and sets `deviceCallback` back to `null`.

</details>

#### 4. Managing listeners

Finally, we connect the listening logic using `OnStartObserving` and `OnStopObserving`. These lifecycle hooks are called automatically by Expo Modules.
This ensures the native side only does work when needed (the system listeners are active only while JavaScript is subscribed) and from the JS side, the API remains as simple as using `.addListener()` and `remove` methods.

- `OnStartObserving` runs automatically when the first JS listener is added with .addListener.
- `OnStopObserving` - runs automatically when the last JS listener is removed.

This methods should be placed _within_ your `ModuleDefinition`, for example below `getCurrentRouteAsync`.

<details>
<summary>Swift (iOS)</summary>

```diff
AsyncFunction("getCurrentRouteAsync") { ... }
+ OnStartObserving("onAudioRouteChange") {
+   self.startObservingRouteChanges()
+ }
+
+ OnStopObserving("onAudioRouteChange")  {
+   self.stopObservingRouteChanges()
+ }
```

</details>

<details>
<summary>Kotlin (Android)</summary>

```diff
AsyncFunction("getCurrentRouteAsync") { ... }
+ OnStartObserving("onAudioRouteChange") {
+   startObservingRouteChanges()
+ }
+
+ OnStopObserving("onAudioRouteChange")  {
+   stopObservingRouteChanges()
+ }
```

</details>

## Exercise 2: Build and implement event listeners in React

Now that we've implemented the native event support, it's time to build the app and wire up the event listeners in React!

### Tasks

#### 1. Build and run on your device

Since we changed native code, we need to rebuild. As before, we'll test on a physical device.

**iOS:**

```bash
npx expo run:ios --device
```

**Android:**

```bash
npx expo run:android --device
```

When prompted, select your connected device from the list.

#### 2. Set up the event listener

Now let's implement the React side of event handling. We'll break this into clear steps.

Open `App.tsx`. We'll add an event listener that automatically updates the state when the audio route changes.

**2.1 Add a useEffect hook**

First, add a `useEffect` hook that will set up and clean up the event listener:

```tsx
React.useEffect(() => {
  // Event listener setup will go here

  return () => {
    // Cleanup will go here
  };
}, []);
```

**2.2 Register the listener**

Inside the `useEffect`, call `addListener` to register for the `onAudioRouteChange` event:

```tsx
React.useEffect(() => {
  const sub = ExpoAudioRoute.addListener("onAudioRouteChange", ({ route }) => {
    setAudioRoute(route);
  });

  return () => {
    // Cleanup will go here
  };
}, []);
```

The listener receives a `RouteChangeEvent` object with a `route` property, which we use to update our component's state.

**2.3 Add cleanup**

Finally, return a cleanup function that removes the listener when the component unmounts:

```tsx
React.useEffect(() => {
  const sub = ExpoAudioRoute.addListener("onAudioRouteChange", ({ route }) => {
    setAudioRoute(route);
  });

  return () => {
    sub.remove();
  };
}, []);
```

This ensures we properly unregister the listener and stop the native observers.

<details>
<summary>Full solution</summary>

```tsx
import * as React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import ExpoAudioRoute, { AudioRoute } from "./modules/expo-audio-route";

export default function App() {
  const [audioRoute, setAudioRoute] = React.useState<AudioRoute | null>(
    "unknown"
  );

  React.useEffect(() => {
    // Registers an event listener for audio route changes
    const sub = ExpoAudioRoute.addListener(
      "onAudioRouteChange",
      ({ route }) => {
        setAudioRoute(route);
      }
    );

    return () => {
      // Unregisters the event listener
      sub.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text>{audioRoute}</Text>
        <Button
          title="Get Audio Route"
          onPress={() => {
            ExpoAudioRoute.getCurrentRouteAsync().then((route) => {
              setAudioRoute(route);
            });
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

</details>

#### 3. Test real-time audio route detection

With the app running on your device, test the automatic event detection:

**Test 1: Initial state**

1. Open the app - you should see the current audio route displayed. At this point it may be "unknown".

**Test 2: Connect Bluetooth**

1. Connect a Bluetooth audio device (e.g. headphones)
2. Watch the display update automatically to `"bluetooth"` without pressing any button
3. The event listener detected the change and updated the state!

**Test 3: Wired headphones**

1. Disconnect the Bluetooth device
2. Connect wired headphones
3. The display should automatically update to `"wiredHeadset"`

**Test 4: Back to speaker**

1. Disconnect all external audio devices
2. The display should automatically return to `"speaker"`

> [!NOTE]
>
> 👀 **Try it:** Unlike Module 2 where you had to press a button to check the route, now the app automatically responds to audio route changes in real-time! This is the power of event-driven architecture.
>
> https://github.com/user-attachments/assets/73927bf2-1bcb-4f68-9ab0-1b8200a908c1



## Bonus Exercise: Debug lifecycle hooks in Xcode / Android Studio

Want to see exactly when the native observers start and stop?

### Tasks

#### 1. Store the listener in a reference

Store the listener in a reference and add/remove it by clicking buttons. This lets you manually control when the observer starts and stops.

#### 2. Set breakpoints

Set breakpoints in Xcode or Android Studio to observe when the `getCurrentRouteAsync`, `OnStartObserving` and `OnStopObserving` methods are executed.

```tsx
import * as React from "react";
import { Button, Text, View } from "react-native";
import ExpoAudioRoute, { type AudioRoute } from "./modules/expo-audio-route";
import type { EventSubscription } from "expo-modules-core";

export default function App() {
  const [currentRoute, setCurrentRoute] = React.useState<AudioRoute>("unknown");
  const routeChangeSubscriptionRef = React.useRef<EventSubscription | null>(
    null
  );

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>Audio Route: {currentRoute}</Text>

      <Button
        title="Get current route"
        onPress={() => {
          ExpoAudioRoute.getCurrentRouteAsync().then((route) => {
            setCurrentRoute(route);
          });
        }}
      />

      <Button
        title="Register for route changes"
        onPress={() => {
          if (routeChangeSubscriptionRef.current) return;

          routeChangeSubscriptionRef.current = ExpoAudioRoute.addListener(
            "onAudioRouteChange",
            ({ route }) => {
              setCurrentRoute(route);
            }
          );
        }}
      />

      <Button
        title="Unregister for route changes"
        onPress={() => {
          routeChangeSubscriptionRef.current?.remove();
          routeChangeSubscriptionRef.current = null;
        }}
      />
    </View>
  );
}
```

<details>
  <summary>Xcode instructions</summary>
  <img width="1282" height="785" alt="image" src="https://github.com/user-attachments/assets/3abb3f32-99a4-4421-a372-c7d63947c030" />
</details>

<details>
  <summary>Android Studio instructions</summary>
  <img width="1282" height="785" alt="image" src="https://github.com/user-attachments/assets/880376b5-afd7-4003-a3df-62bcd1ce9643" />
</details>

## Next exercise

[Module 4 👉](./module-4.md)
