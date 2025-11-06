# Module 5

In this module, we'll learn how to create a native view for iOS (using SwiftUI), and Android (using Jetpack Compose),
and use it in our Expo app.

## Goals

- Display the current audio route (speaker, wired headset, or bluetooth) using a native segmented control component
- Update the native view automatically when the route changes
- Use SwiftUI on iOS and Jetpack Compose on Android

## Concepts

- Add a native view with Expo Modules
- Configuring and using SwiftUI as a native view
- Configuring and using Jetpack Compose as a native view

## Exercises

### Exercise 1: Define the JavaScript API

Just like we did in Module 2, let's begin by defining the JavaScript API for our view component. We'll do this by adding
types and the native binding to our Expo Module.

#### Task 1: Define TypeScript types

First, let's declare our types:

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

#### Task 2: Create the TypeScript binding

Next, let's create the view component in TypeScript:

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

#### Task 3: Export the native view

**File:** `modules/expo-audio-route/index.ts`

```diff
export { default } from "./src/ExpoAudioRouteModule";
export * from "./src/ExpoAudioRoute.types";
export { useAudioRouteChangedEvent } from "./src/ExpoAudioRouteModule";
export { useAudioRoute } from "./src/ExpoAudioRouteModule";
+export { default as ExpoAudioRouteView } from "./src/ExpoAudioRouteView";
```

### Exercise 2: Create a SwiftUI view for iOS

SwiftUI is Apple's modern declarative framework for building user interfaces. With Expo Modules, we can use SwiftUI views directly in our React Native app.

### Task 1: Implement a SwiftUI View

We'll start by creating a new file for our SwiftUI view:

<details>
<summary>
<code>modules/expo-audio-route/ios/ExpoAudioRouteView.swift</code>
</summary>

```swift
import ExpoModulesCore
import SwiftUI

// Props class for the segmented picker
final class ExpoAudioRouteViewProps: ExpoSwiftUI.ViewProps {
    @Field var options: [String] = []
    @Field var selectedIndex: Int?
    var onOptionChange = EventDispatcher()
}

struct ExpoAudioRouteView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
    @ObservedObject var props: ExpoAudioRouteViewProps

    init(props: ExpoAudioRouteViewProps) {
        self.props = props
    }

    var body: some View {
        if #available(iOS 13.0, *) {
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
            Text("Segmented Picker requires iOS 13.0+")
                .background(.red)
                .padding()
        }
    }
}
```

</details>

#### Task 2: Expose the view through the Expo Module

Now let's update the Swift module definition to include our view:

<details>
<summary>
<code>modules/expo-audio-route/ios/ExpoAudioRouteModule.swift</code>
</summary>

> [!NOTE]
> Unlike UIKit views, you don't need to provide a full list of props and events for a SwiftUI view - Expo Modules takes care of this automatically

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

+   View(ExpoAudioRouteView.self)
  }
}
```

</details>

#### Task 3: Build and run the app

Now let's try building the app:

```bash
npx expo run:ios --device
```

#### Task 4: Update `App.tsx`

Now that we've got a successfully built and running app, let's update the `App.tsx` file to display our new native view.

<details>
<summary>
<code>App.tsx</code>
</summary>

```diff
import * as React from "react";
import { Text, View } from "react-native";
-import { useAudioRouteChangedEvent } from "./modules/expo-audio-route";
+import { ExpoAudioRouteView, useAudioRouteChangedEvent } from "./modules/expo-audio-route";

export default function App() {
  const { route } = useAudioRouteChangedEvent();
+ const possibleRoutes = ["wiredHeadset", "bluetooth", "speaker", "unknown"];

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>Audio Route: {route}</Text>
+     <View style={{ width: '100%', padding: 20 }}>
+       <ExpoAudioRouteView
+         style={{
+           width: "100%",
+           padding: 20,
+         }}
+         options={possibleRoutes}
+         onOptionChange={({ nativeEvent: { index, value } }) => {
+           console.log({
+             index,
+             value,
+           });
+         }}
+       />
+     </View>
    </View>
  );
}
```

</details>

After making the changes to `App.tsx`, we should now see our new Native View being rendered:

<details>
  <summary>iOS</summary>
  <img width="360" alt="iOS device showing the newly-created native view" src="https://github.com/user-attachments/assets/11ea25e8-d1cc-4e3a-b410-863c340703e8" />
</details>

If you tap on a segment, you should see a log in your terminal showing the `index` and `value` of that segment.

### Exercise 3: Create a Jetpack Compose view for Android

Jetpack Compose is Android's modern toolkit for building native UI. Like SwiftUI, it also uses a declarative approach to building UI.

#### Task 1: Update build configuration

> [!NOTE]
> Jetpack Compose does not come preinstalled with the Android system OS, so we need to add its build dependencies to our native project first

First, we need to make a few changes to our module's `build.gradle` so that we can use Jetpack Compose:

<details>
<summary>
<code>modules/expo-audio-route/android/build.gradle</code>
</summary>

```diff
apply plugin: 'com.android.library'

group = 'expo.modules.audioroute'
version = '0.7.6'

def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")
apply from: expoModulesCorePlugin
applyKotlinExpoModulesCorePlugin()
useCoreDependencies()
useExpoPublishing()

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
+ buildFeatures {
+   compose true
+ }
  lintOptions {
    abortOnError false
  }
}

+dependencies {
+  implementation 'androidx.compose.material3:material3:1.3.2'
+  implementation 'androidx.compose.ui:ui:1.9.1'
+  implementation 'androidx.compose.runtime:runtime:1.9.1'
+  implementation 'androidx.compose.foundation:foundation:1.9.1'
+}
```

</details>

Additionally, we'll need to enable Compose support in Expo Modules. We can do that by editing `expo-module.config.json` and adding
a `coreFeatures` property:

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

#### Task 2: Implement a Jetpack Compose View

Next, let's create a new file for the view:

<details>
<summary>
<code>modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteView.kt</code>
</summary>

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

data class PickerProps(
    val options: MutableState<Array<String>> = mutableStateOf(emptyArray()),
    val selectedIndex: MutableState<Int?> = mutableStateOf(null),
) : ComposeProps

class ExpoAudioRouteView(context: Context, appContext: AppContext) :
    ExpoComposeView<PickerProps>(context, appContext, withHostingView = true) {
    override val props = PickerProps()
    private val onOptionChange by EventDispatcher()

    @OptIn(ExperimentalMaterial3Api::class)
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

#### Task 3: Expose the view through the Expo Module

Now let's update the module definition to include our view:

<details>
<summary>
<code>modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt</code>
</summary>

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


+   View(ExpoAudioRouteView::class) {
+     Events("onOptionChange")
+   }
  }
}
```

</details>

#### Task 4: Build and run the app

Just as we did for iOS, let's build the app and run it. Because we've already updated `App.tsx` earlier, we should see
the newly-created Native View as soon as the app launches:

<details>
  <summary>Android</summary>
  <img width="360" alt="Android device showing the newly-created native view" src="https://github.com/user-attachments/assets/a9e842c2-f461-4a46-b5cf-22ee9a8251ab" />
</details>

### Exercise 4: Connect the Native View to the audio route

Now that we've got our Native View successfully built and working for both platforms, let's have it update when the current
audio route changes.

#### Task 1: Hook up the audio route to the Native View

Update your `App.tsx` to display the native view component. The view will automatically update when the audio route changes.

<details>
<summary>
<code>App.tsx</code>
</summary>

```diff
import * as React from "react";
import { Text, View } from "react-native";
-import { useAudioRouteChangedEvent } from "./modules/expo-audio-route";
+import { ExpoAudioRouteView, useAudioRouteChangedEvent } from "./modules/expo-audio-route";

export default function App() {
  const { route } = useAudioRouteChangedEvent();
  const possibleRoutes = ["wiredHeadset", "bluetooth", "speaker", "unknown"];
+ const index = possibleRoutes.indexOf(route);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>Audio Route: {route}</Text>
      <View style={{ width: '100%', padding: 20 }}>
        <ExpoAudioRouteView
          style={{
            width: "100%",
            padding: 20,
          }}
+         selectedIndex={index}
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
  );
}
```

</details>

With the changes above, we should now see our view displays the currently active audio route:

<details>
  <summary>iOS</summary>
  <img width="360" alt="iOS device showing the currently active audio route" src="https://github.com/user-attachments/assets/d20c3472-ecca-492f-be17-20e1cea27a33" />
</details>

<details>
  <summary>Android</summary>
  <img width="360" alt="Android device showing the currently active audio route" src="https://github.com/user-attachments/assets/05578b6f-bc9c-4359-81c1-84abcfa7c0e3" />
</details>

#### Task 2: Test by changing audio routes

With the app running on your device:

1. Observe the initial audio route display
2. Connect Bluetooth headphones and watch the view update automatically
3. Disconnect Bluetooth and plug in wired headphones to see the view change again
4. Disconnect all devices to see the view update to the speaker route once again
