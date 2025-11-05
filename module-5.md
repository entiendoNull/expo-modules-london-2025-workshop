# Module 5

## Goals

- Display the current audio route (speaker, wired headset, or bluetooth) using a native view
- Update the native view automatically when the route changes
- Use SwiftUI on iOS and Jetpack Compose on Android

## Concepts

- Add a native view with Expo Modules
- Configuring and using SwiftUI as a native view
- Configuring and using Jetpack Compose as a native view

## Tasks

### Task 1: Define TypeScript Types

Define the props for our view component.

**File:** modules/expo-audio-route/src/ExpoAudioRoute.types.ts

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
+export type ExpoAudioControlViewProps = {
+  options: string[];
+  selectedIndex?: number;
+  onOptionChange: (event: {
+    nativeEvent: OptionChangeEventPayload;
+  }) => void;
+  style?: StyleProp<ViewStyle>;
+};
```

### Task 2: Create the TypeScript View Component

Create the view component in TypeScript.

**File:** modules/expo-audio-route/src/ExpoAudioControlView.tsx

```tsx
import { requireNativeView } from "expo";
import * as React from "react";

import { ExpoAudioControlViewProps } from "./ExpoAudioRoute.types";

const NativeView: React.ComponentType<ExpoAudioControlViewProps> =
  requireNativeView("ExpoAudioRoute", "ExpoAudioControlView");

export default function ExpoAudioControlView(props: ExpoAudioControlViewProps) {
  return <NativeView {...props} />;
}
```

**File:** modules/expo-audio-route/index.ts

```diff
 export { default } from "./src/ExpoAudioRouteModule";
 export * from "./src/ExpoAudioRoute.types";
 export { useAudioRouteChangedEvent } from "./src/ExpoAudioRouteModule";
 export { useAudioRoute } from "./src/ExpoAudioRouteModule";
+export { default as ExpoAudioControlView } from "./src/ExpoAudioControlView";
```

### Task 3: Implement iOS SwiftUI View

SwiftUI is Apple's modern declarative framework for building user interfaces. With Expo Modules, we can use SwiftUI views directly in our React Native app.

<details>
<summary>Swift</summary>

Create a new file for our SwiftUI view:

**File:** modules/expo-audio-route/ios/ExpoAudioControlView.swift

```swift
import ExpoModulesCore
import SwiftUI

// Props class for the segmented picker
final class ExpoAudioControlViewProps: ExpoSwiftUI.ViewProps {
    @Field var options: [String] = []
    @Field var selectedIndex: Int?
    var onOptionChange = EventDispatcher()
}

struct ExpoAudioControlView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
    @ObservedObject var props: ExpoAudioControlViewProps

    init(props: ExpoAudioControlViewProps) {
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

Now update the module definition to include our view:

**File:** modules/expo-audio-route/ios/ExpoAudioRouteModule.swift

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

+   View(ExpoAudioControlView.self)
  }
}
```

</details>

### Task 4: Implement Android Jetpack Compose View

Jetpack Compose is Android's modern toolkit for building native UI. Like SwiftUI, it also uses a declarative approach to building UI.

<details>
<summary>Kotlin</summary>

First, we need to make a few changes to our module's `build.gradle`:

**File:** modules/expo-audio-route/android/build.gradle

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

Next, let's create a new file for the view:

**File:** modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteView.kt

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

class ExpoAudioControlView(context: Context, appContext: AppContext) :
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

Now update the module definition to include our view:

**File:** modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt

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


+   View(ExpoAudioControlView::class) {
+     Events("onOptionChange")
+   }
  }
}
```

</details>

### Task 5: Use the Native View

Build your app to include the new native view code:

**iOS:**

```bash
npx expo run:ios --device
```

**Android:**

```bash
npx expo run:android --device
```

Update your `App.tsx` to display the native view component. The view will automatically update when the audio route changes.

<details>
<summary>See solution</summary>

**File:** App.tsx

```diff
import * as React from "react";
import { Text, View } from "react-native";
-import { useAudioRouteChangedEvent } from "./modules/expo-audio-route";
+import { ExpoAudioControlView, useAudioRouteChangedEvent } from "./modules/expo-audio-route";

export default function App() {
  const { route } = useAudioRouteChangedEvent();
+ const possibleRoutes = ["wiredHeadset", "bluetooth", "speaker", "unknown"];
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
+     <View style={{ width: '100%', padding: 20 }}>
+       <ExpoAudioControlView
+         style={{
+           width: "100%",
+           padding: 20,
+         }}
+         selectedIndex={index}
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

### Task 6: Test Different Audio Routes

With the app running on your device:

1. Observe the initial audio route display
2. Connect Bluetooth headphones and watch the view update automatically
3. Disconnect Bluetooth and plug in wired headphones to see the view change again
4. Disconnect all devices to return to the speaker display
