# Module 5

In this module, we'll learn how to create a native view for iOS (using SwiftUI), and Android (using Jetpack Compose), and use it in our Expo app. While the imperative APIs we built in earlier modules exposed functions and events, native views work differently. A native view is a React component that renders native UI directly, while still giving us the ability to pass props from JavaScript.

### Goals

- Display the current audio route (speaker, wired headset, or Bluetooth) using a native segmented control component
- Use SwiftUI on iOS and Jetpack Compose on Android
- Update the native view automatically when the route changes

### Tasks

- Plan and define the TypeScript API for the native views
- Implement a native view in SwiftUI and/or Jetpack Compose
- Build and test the view on a physical device

# Exercises

## Exercise 1: Define the JavaScript API

Just like we did in Module 2, let's begin by defining the JavaScript API for our view component. We'll do this by adding types and the native binding to our Expo Module.

### Tasks

#### 1. Define TypeScript types

First, let's update our types file with the prop types for our view:

**File:** `modules/expo-audio-route/src/ExpoAudioRoute.types.ts`

```diff
+import { StyleProp, ViewStyle } from "react-native";

export type RouteChangeEvent = {
  route: AudioRoute;
};

export type ExpoAudioRouteModuleEvents = {
  onAudioRouteChange: (params: RouteChangeEvent) => void;
};

export type AudioRoute = "speaker" | "wiredHeadset" | "bluetooth" | "unknown";

+export type OptionChangeEventPayload = {
+  index: number;
+  value: string;
+};
+
+export type ExpoAudioRouteViewProps = {
+  options: string[];
+  selectedIndex?: number;
+  onOptionChange: (event: {
+    nativeEvent: OptionChangeEventPayload;
+  }) => void;
+  style?: StyleProp<ViewStyle>;
+};
```

#### 2. Create the TypeScript binding

Next, let's create the view component in TypeScript:

```bash
touch modules/expo-audio-route/src/ExpoAudioRouteView.tsx
```

**File:** `modules/expo-audio-route/src/ExpoAudioRouteView.tsx`

```tsx
import { requireNativeView } from "expo";
import * as React from "react";

import { ExpoAudioRouteViewProps } from "./ExpoAudioRoute.types";

const NativeView: React.ComponentType<ExpoAudioRouteViewProps> =
  requireNativeView("ExpoAudioRoute", "ExpoAudioRouteView");

export default function ExpoAudioRouteView(props: ExpoAudioRouteViewProps) {
  return <NativeView {...props} />;
}
```

#### 3. Export the native view

**File:** `modules/expo-audio-route/index.ts`

```diff
export { default } from "./src/ExpoAudioRouteModule";
export * from "./src/ExpoAudioRoute.types";
export { useAudioRouteChangedEvent } from "./src/ExpoAudioRouteModule";
export { useAudioRoute } from "./src/ExpoAudioRouteModule";
+export { default as ExpoAudioRouteView } from "./src/ExpoAudioRouteView";
```

## Exercise 2: Create a SwiftUI view for iOS

[SwiftUI](https://developer.apple.com/documentation/SwiftUI) is Apple's modern declarative framework for building user interfaces. With Expo Modules, we can use SwiftUI views directly in our React Native app.

> [!NOTE]
>
> 👀 We strongly recommend using Xcode for this section, as it will surface any potential build/compile issues early

### Background: How SwiftUI Integrates with Expo Modules

Expo Modules provides special [protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/) (`ExpoSwiftUI.View` and `ExpoSwiftUI.ViewProps`) that allow SwiftUI views to be used as React Native components. A bridged SwiftUI view will typically make use of the following:

- A props class: This will define properties that can be set from React (like `options` and `selectedIndex`)
- A view struct: This will contain the actual SwiftUI view and rendering logic
- An `EventDispatcher`: This allows the native view to call back to JavaScript

### Tasks

#### 1. Implement a SwiftUI View

We'll start by creating a new file for our SwiftUI view:

```bash
touch modules/expo-audio-route/ios/ExpoAudioRouteView.swift
```

<details>
<summary>Swift (iOS)</summary>

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteView.swift`

```swift
import ExpoModulesCore
import SwiftUI

// Props class for the SwiftUI view
final class ExpoAudioRouteViewProps: ExpoSwiftUI.ViewProps {
    // We use the @Field property wrapper here to expose props that can be set from React Native
    @Field var options: [String] = []
    @Field var selectedIndex: Int?
    // An EventDispatcher is how we associate callbacks from React Native
    var onOptionChange = EventDispatcher()
}

// Our SwiftUI view that conforms to the `ExpoSwiftUI.View` and `ExpoSwiftUI.WithHostingView`
// protocols. These protocols allow Expo Modules to host your SwiftUI view within your Expo app
struct ExpoAudioRouteView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
    @ObservedObject var props: ExpoAudioRouteViewProps

    init(props: ExpoAudioRouteViewProps) {
        self.props = props
    }

    var body: some View {
        if #available(iOS 13.0, *) {
            // The first parameter to `Picker` is a label, as an exercise you could try and expose this as a prop
            // The second parameter binds the selected option prop to this component with a getter and setter
            Picker("", selection: Binding(
                get: { props.selectedIndex ?? 0 },
                set: { newValue in
                    props.onOptionChange([
                        "index": newValue,
                        "value": props.options[newValue],
                    ])
                }
            )) {
                ForEach(Array(props.options.enumerated()), id: \.0) { index, option in
                    Text(option).tag(index)
                }
            }
            .pickerStyle(.segmented)
        } else {
            // Fallback for older iOS versions that don't have support for `Picker`
            Text("Segmented Picker requires iOS 13.0+")
                .background(.red)
                .padding()
        }
    }
}
```

</details>

#### 2. Expose the view through the Expo Module

Now let's update the Swift module definition to include our view:

<details>
<summary>Swift (iOS)</summary>

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteModule.swift`

```diff
import ExpoModulesCore
import AVFoundation

public class ExpoAudioRouteModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAudioRoute")

    Events("onAudioRouteChange")

    AsyncFunction("getCurrentRouteAsync") {
      return self.currentRoute()
    }

    OnStartObserving("onAudioRouteChange") {
      self.sendEvent("onAudioRouteChange", ["route": self.currentRoute()])
      self.startObservingRouteChanges()
    }

    OnStopObserving("onAudioRouteChange")  {
      self.stopObservingRouteChanges()
    }

+   // Registers `ExpoAudioRouteView` as a native view component provided by this module
+   // Because we used the `@Field` property in the SwiftUI view, we don't need to declare any props here
+   View(ExpoAudioRouteView.self)
  }
}
```

</details>

#### 3. Update `App.tsx`

Now that we've got a successfully built and running app, let's update the `App.tsx` file to display our new native view.

**File:** `App.tsx`

```diff
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
-import { useAudioRouteChangedEvent } from "./modules/expo-audio-route";
+import { ExpoAudioRouteView, useAudioRouteChangedEvent } from "./modules/expo-audio-route";

export default function App() {
  const { route } = useAudioRouteChangedEvent();
+ const possibleRoutes = ["wiredHeadset", "bluetooth", "speaker", "unknown"];

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text>Current Route: {route}</Text>
+       <View style={styles.audioRouteContainer}>
+         <ExpoAudioRouteView
+           style={styles.audioRoute}
+           options={possibleRoutes}
+           onOptionChange={({ nativeEvent: { index, value } }) => {
+             console.log({
+               index,
+               value,
+             });
+           }}
+         />
+       </View>
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
+ audioRouteContainer: {
+   width: '100%',
+   padding: 20
+ },
+ audioRoute: {
+   width: "100%",
+   padding: 20,
+ }
});
```

After making the changes to `App.tsx`, we should now see our new Native View being rendered:

> [!NOTE]
>
> 👀 **Try it**: Build the app with `npx expo run:ios --device`. A successful build of the app should look like the screenshot below:
>
> <img width="200" alt="iOS device showing the newly-created native view" src="https://github.com/user-attachments/assets/11ea25e8-d1cc-4e3a-b410-863c340703e8" />

If you tap on a segment, you should see a log in your terminal showing the `index` and `value` of that segment.

## Exercise 3: Create a Jetpack Compose view for Android

[Jetpack Compose](https://developer.android.com/compose) is Android's modern toolkit for building native UI. Like SwiftUI, it also uses a declarative approach to building UI.

> [!NOTE]
>
> 👀 We strongly recommend using Android Studio for this section, as it will surface any potential build/compile issues early

### Background: How Jetpack Compose Integrates with Expo Modules

Similar to how we bridged SwiftUI, Expo Modules provides `ExpoComposeView` and `ComposeProps` to bridge Jetpack Compose views to React Native. A bridged Jetpack Compose view will typically make use of

- A props data class: This will define properties that can be set from React (like `options` and `selectedIndex`)
- A view class: This will contain the actual Jetpack Compose view and rendering logic within a `Content` method marked with `@Composable`
- An `EventDispatcher`: This allows the native view to call back to JavaScript

### Tasks

#### 1. Update build configuration

First, we need to make a few changes to our module's `build.gradle` so that we can use Jetpack Compose.

Unlike SwiftUI which comes with iOS, Jetpack Compose is a separate library that needs to be explicitly added as a dependency. We'll need to:

- Enable the Compose compiler plugin
- Enable Compose in the build features
- Add the Compose library dependencies

<details>
<summary>Groovy</summary>

**File:** `modules/expo-audio-route/android/build.gradle`

```diff
apply plugin: 'com.android.library'

group = 'expo.modules.audioroute'
version = '0.7.6'

def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")
apply from: expoModulesCorePlugin
applyKotlinExpoModulesCorePlugin()
useCoreDependencies()
useExpoPublishing()

+// We need to add the Gradle plugin for Jetpack Compose
+apply plugin: 'org.jetbrains.kotlin.plugin.compose'
+
+buildscript {
+  // Simple helper that allows the root project to override versions declared by this library.
+  ext.safeExtGet = { prop, fallback ->
+    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
+  }
+  repositories {
+    mavenCentral()
+  }
+  dependencies {
+    // We also need to update the build script's dependencies to include Jetpack Compose
+    classpath("org.jetbrains.kotlin.plugin.compose:org.jetbrains.kotlin.plugin.compose.gradle.plugin:${kotlinVersion}")
+  }
+}
+
+project.android {
+  compileSdkVersion safeExtGet("compileSdkVersion", 36)
+  defaultConfig {
+    minSdkVersion safeExtGet("minSdkVersion", 24)
+    targetSdkVersion safeExtGet("targetSdkVersion", 36)
+  }
+}
-// If you want to use the managed Android SDK versions from expo-modules-core, set this to true.
-// The Android SDK versions will be bumped from time to time in SDK releases and may introduce breaking changes in your module code.
-// Most of the time, you may like to manage the Android SDK versions yourself.
-def useManagedAndroidSdkVersions = false
-if (useManagedAndroidSdkVersions) {
-  useDefaultAndroidSdkVersions()
-} else {
-  buildscript {
-    // Simple helper that allows the root project to override versions declared by this library.
-    ext.safeExtGet = { prop, fallback ->
-      rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
-    }
-  }
-  project.android {
-    compileSdkVersion safeExtGet("compileSdkVersion", 36)
-    defaultConfig {
-      minSdkVersion safeExtGet("minSdkVersion", 24)
-      targetSdkVersion safeExtGet("targetSdkVersion", 36)
-    }
-  }
-}

android {
  namespace "expo.modules.audioroute"
  defaultConfig {
    versionCode 1
    versionName "0.7.6"
  }
+ // We have to enable Compose
+ buildFeatures {
+   compose true
+ }
  lintOptions {
    abortOnError false
  }
}

+// Finally, we need to add the Jetpack Compose dependencies to the Android module
+dependencies {
+  implementation 'androidx.compose.material3:material3:1.3.2'
+  implementation 'androidx.compose.ui:ui:1.9.1'
+  implementation 'androidx.compose.runtime:runtime:1.9.1'
+  implementation 'androidx.compose.foundation:foundation:1.9.1'
+}
```

</details>

Additionally, we'll need to enable Compose support in Expo Modules. We can do that by editing `expo-module.config.json` and adding a `coreFeatures` property:

```diff
{
  "platforms": ["apple", "android", "web"],
+ "coreFeatures": ["compose"],
  "apple": {
    "modules": ["ExpoAudioRouteModule"]
  },
  "android": {
    "modules": ["expo.modules.audioroute.ExpoAudioRouteModule"]
  }
}
```

#### 2. Implement a Jetpack Compose View

Next, let's create a new file for the view:

```bash
touch modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteView.kt
```

<details>
<summary>Kotlin (Android)</summary>

**File:** `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteView.kt`

```kotlin
package expo.modules.audioroute

import android.content.Context
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

// Props class for the Jetpack Compose view
data class ExpoAudioRouteViewProps(
    val options: MutableState<Array<String>> = mutableStateOf(emptyArray()),
    val selectedIndex: MutableState<Int?> = mutableStateOf(null),
) : ComposeProps

// Our Jetpack Compose view that subclasses `ExpoComposeView`. This allow Expo Modules to host your
// Jetpack Compose view within your Expo app
class ExpoAudioRouteView(context: Context, appContext: AppContext) :
    ExpoComposeView<ExpoAudioRouteViewProps>(context, appContext, withHostingView = true) {
    override val props = ExpoAudioRouteViewProps()
    private val onOptionChange by EventDispatcher()

    // We have to enable the Material 3 experimental API for the `SingleChoiceSegmentedButtonRow` to work
    @OptIn(ExperimentalMaterial3Api::class)
    // Similarly, we need to mark this function to be handled by the Compose compiler
    @Composable
    override fun Content(modifier: Modifier) {
        val (selectedIndex) = props.selectedIndex
        val (options) = props.options

        SingleChoiceSegmentedButtonRow(modifier = modifier) {
            options.forEachIndexed { index, value ->
                SegmentedButton(
                    shape = SegmentedButtonDefaults.itemShape(
                        index = index,
                        count = options.size
                    ),
                    onClick = {
                        onOptionChange(mapOf("index" to index, "value" to value))
                    },
                    selected = index == selectedIndex,
                    label = { Text(value) },
                )
            }
        }
    }
}
```

</details>

#### 3. Expose the view through the Expo Module

Now let's update the module definition to include our view:

<details>
<summary>Kotlin (Android)</summary>

**File:** `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt`

```diff
package expo.modules.audioroute

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager

class ExpoAudioRouteModule : Module() {
  private var audioManager: AudioManager? = null
  private var deviceCallback: AudioDeviceCallback? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoAudioRoute")

    Events("onAudioRouteChange")

    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }

    AsyncFunction("getCurrentRouteAsync") {
      currentRoute()
    }

    OnStartObserving("onAudioRouteChange") {
      sendEvent("onAudioRouteChange", mapOf("route" to currentRoute()))
      startObservingRouteChanges()
    }

    OnStopObserving("onAudioRouteChange")  {
      stopObservingRouteChanges()
    }

+   // Registers `ExpoAudioRouteView` as a native view component provided by this module
+   // Unlike SwiftUI, we do need to declare any event callbacks here
+   View(ExpoAudioRouteView::class) {
+     Events("onOptionChange")
+   }
  }
}
```

</details>

> [!NOTE]
>
> 👀 **Try it**: Build the app with `npx expo run:android --device`. A successful build of the app should look like the screenshot below:
>
> <img width="200" alt="Android device showing the newly-created native view" src="https://github.com/user-attachments/assets/a9e842c2-f461-4a46-b5cf-22ee9a8251ab" />

## Exercise 4: Connect the Native View to the audio route

Now that we've got our Native View successfully built and working for both platforms, let's have it update when the current audio route changes.

### Tasks

#### 1. Hook up the audio route to the Native View

Now let's wire up `App.tsx` to display the native view component. We'll use the value of `route` from `useAudioRouteChangedEvent` to ensure that the correct segment in our native view is selected. Whenever `route` changes, the selected segment will also change.

**File:** `App.tsx`

```diff
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ExpoAudioRouteView, useAudioRouteChangedEvent } from "./modules/expo-audio-route";

export default function App() {
  const { route } = useAudioRouteChangedEvent();
  const possibleRoutes = ["wiredHeadset", "bluetooth", "speaker", "unknown"];
+ const index = possibleRoutes.indexOf(route);

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text>Current Route: {route}</Text>
        <View style={styles.audioRouteContainer}>
          <ExpoAudioRouteView
            style={styles.audioRoute}
+           selectedIndex={index}
            options={possibleRoutes}
            onOptionChange={({ nativeEvent: { index, value } }) => {
              console.log({
                index,
                value,
              });
            }}
          />
        </View>
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
  audioRouteContainer: {
    width: '100%',
    padding: 20
  },
  audioRoute: {
    width: "100%",
    padding: 20,
  }
});
```

With the changes above, we should now see our view displaying the currently active audio route.

> [!NOTE]
>
> 👀 **Try it**: Build the app and run it on your device. A successful build of the app should look like the screenshot below:
>
> <img width="200" alt="iOS device showing the currently active audio route" src="https://github.com/user-attachments/assets/d20c3472-ecca-492f-be17-20e1cea27a33" /> <img width="200" alt="Android device showing the currently active audio route" src="https://github.com/user-attachments/assets/05578b6f-bc9c-4359-81c1-84abcfa7c0e3" />

#### 2. Test by changing audio routes

With the app running on your device:

1. Observe the initial audio route display
2. Connect Bluetooth headphones and watch the view update automatically
3. Disconnect Bluetooth and plug in wired headphones to see the view change again
4. Disconnect all devices to see the view update to the speaker route once again

> [!NOTE]
>
> 👀 **Try it**: Build the app and run it on your device. Changing the audio route should look like the video below:
>
> <video width=200 src="https://github.com/user-attachments/assets/00590643-e278-4dc4-b548-7de82565e21f"></video> <video width=200 src="https://github.com/user-attachments/assets/caaae093-846d-4990-a065-b73888367e10"></video>

## Further reading

The examples used in this module are simplified versions of the `<Picker />` component from [`@expo/ui/swift-ui`](https://github.com/expo/expo/blob/sdk-54/packages/expo-ui/ios/PickerView.swift) and [`@expo/ui/jetpack-compose`](https://github.com/expo/expo/blob/sdk-54/packages/expo-ui/android/src/main/java/expo/modules/ui/PickerView.kt) in SDK 54. We strongly recommend checking out their source code to learn more.

From SDK 55, wrapping bridged SwiftUI and Jetpack Compose views with a `<Host />` component will be **required**. This is because the `style` prop cannot be applied directly to bridged views. Additionally, in our SwiftUI view, we'd drop conformance with the `ExpoSwiftUI.WithHostingView` protocol, and in our Jetpack Compose view, we'd set `withHostingView = false` in the component's constructor.
