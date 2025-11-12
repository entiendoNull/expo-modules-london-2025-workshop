# Chapter 1

### Goals

- Successfully install and build a local module for iOS and/or Android.
- Understand how to consume both imperative modules and native views.
- Gain confidence making and testing small native code changes.

### Tasks

- Create a new app, install the necessary dependencies and create a new local Expo Module
- Build the app and have it run on your simulator/emulator or physical device
- Consume parts of imperative API
- Listen to an event
- Consume a View
- Create a few changes
- Build from Xcode / Android Studio

# Exercises

## Exercise 0: Get this thing setup

#### 1. Create new project

Get started by creating a new Expo project

```sh
npx create-expo-app@latest expo-custom-local-module-example --template blank-typescript --no-install
```

If you want to use npm, you can omit the `--no-install` flag. Otherwise, keep it and install the dependencies with the package manager of your choice.

```sh
# For example
cd expo-custom-local-module-example
bun install
```

The name of our project would in this case be `expo-custom-local-module-example`. Feel free to name it however you like!

#### 2. Install Expo Dev Client

This project will have custom native code, it can’t run inside Expo Go, so we'll want to start by creating a development build. The `expo-dev-client` package gives us an app similar to Expo Go - complete with debugging tools - but with our own native modules included.

```sh
npx expo install expo-dev-client
```

#### 3. Create new Expo Module

When prompted the name I’ll be using is `expo-audio-route`, and then I'll just go ahead and accept the suggestions for the subsequent prompts.

The `--local` flag creates a module that lives inside your project, instead of a standalone package that could be published to npm. It’s perfect when you just need custom native functionality for a specific app.

```
npx create-expo-module@latest --local
```

## Exercise 1: Get it running

#### 1. Prebuild

Continuous Native Generation (CNG) is the process of generating native projects on-demand from a set of concise inputs (such as e.g. your app config and package.json).

Instead of committing entire native projects (`ios/` and `android/` directories) to source control, you only commit the configuration and code that defines your app. Whenever you need to compile, the Expo CLI regenerates the native project folders for you.

```
npx expo prebuild --clean
```

> [!NOTE]
>
> 👀 Check your file tree out and notice how the `ios/` and `android/` directories have now been created in the root of your project

#### 2. Build

You can build your project locally by running the compile commands provided by the Expo CLI. These commands generate the `ios/` and `android/` directories that Xcode and Android Studio use to compile your app.

The first time your build an app it will also trigger a prebuild if the `ios/` and `android/` directories are not present in the project. You can also manually trigger a prebuild with `npx expo prebuild --clean`.

```
npx expo run:ios --device

# or

npx expo run:android --device
```

> [!NOTE]
>
> 👀 Once the build is complete, the development server should start and your app will be installed and launched on your simulator/emulator

## Exercise 2: Consume parts of the imperative API

Now that your module is built and running, let's explore how to use it.

Your new module, `expo-audio-route`, lives inside your project's `modules` directory.

Here's the module structure with descriptions of each file:

```
expo-audio-route
├──android
│  ├──build.gradle                               # Android dependencies and build configuration
│  └──src
│     └──main
│        ├──AndroidManifest.xml                  # Android manifest for the module
│        └──java
│           └──expo
│              └──modules
│                 └──audioroute
│                    ├──ExpoAudioRouteModule.kt  # Android entry point for the Expo Module
│                    └──ExpoAudioRouteView.kt    # Optional. Contains a view to exposed by the Expo Module
├──expo-module.config.json
├──index.ts
├──ios                                           # Barrel file with all JavaScript exports from the Expo Module
│  ├──ExpoAudioRoute.podspec                     # iOS dependencies and build configuration
│  ├──ExpoAudioRouteModule.swift                 # iOS entry point for the Expo Module
│  └──ExpoAudioRouteView.swift                   # Optional. Contains a view to exposed by the Expo Module
└──src
   ├──ExpoAudioRoute.types.ts                    # Optional. Contains types to be used with the Expo Module
   ├──ExpoAudioRouteModule.ts                    # JavaScript entry point for the Expo Module
   ├──ExpoAudioRouteModule.web.ts                # Optional. Web fallback for the Expo Module
   └──ExpoAudioRouteView.tsx                     # JavaScript entry point for a view exposed by the Expo Module
```

### Background: Understanding the Module API

The `ExpoAudioRouteModule` file (`modules/expo-audio-route/src/ExpoAudioRouteModule.ts`) defines what functionality is available from the module's imperative API:

```ts
declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}
```

This shows us that the module exposes:

- A constant: `PI`
- A synchronous function: `hello()`
- An async function: `setValueAsync()`

> [!NOTE]
>
> By convention, Expo uses the `Async` suffix to denote async functions, but this is simply a naming convention

### Tasks

Follow these steps to use the module in your app:

#### 1. Import the Module

Open `App.tsx` and add the import at the top of the file:

```ts
import ExpoAudioRoute from "./modules/expo-audio-route";
```

#### 2. Display a Constant from Native Code

Add a `<Text>` component that displays the `PI` constant:

```tsx
<Text>{ExpoAudioRoute.PI}</Text>
```

#### 3. Call a Synchronous Function

Now add a second `<Text>` component that calls the `hello()` function:

```tsx
<Text>{ExpoAudioRoute.hello()}</Text>
```

> [!NOTE]
>
> 👀 **Try it:**
> Save your changes and check your app. You should see:
>
> <img width="200"  alt="Screenshot_1762424912" src="https://github.com/user-attachments/assets/450a047f-3671-4071-9e1f-f52912ec68f8" />

<details>
<summary>See full solution</summary>

```tsx
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import ExpoAudioRoute from "./modules/expo-audio-route";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>{ExpoAudioRoute.PI}</Text>
      <Text>{ExpoAudioRoute.hello()}</Text>
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

</details>

## Exercise 3: Listen to an event

### Background: Understanding Events

You might notice that in `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`, there are no `addListener` or `removeListener` functions. That's because these are already built into Expo's `NativeModule` type!

The event definitions live in `modules/expo-audio-route/src/ExpoAudioRoute.types.ts`, which defines the event names and payload shapes:

```ts
export type ExpoAudioRouteModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};
```

By passing `ExpoAudioRouteModuleEvents` as a generic to `NativeModule`, TypeScript automatically knows which events are available and what data they provide:

**File:** `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`

```ts
declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {}
```

### Tasks

#### 1. Subscribe to the `onChange` Event

Add an event listener that shows an alert when the native code sends an event:

```tsx
React.useEffect(() => {
  const sub = ExpoAudioRoute.addListener("onChange", (ev) => {
    Alert.alert("Event received", ev.value);
  });

  return () => {
    sub.remove();
  };
}, []);
```

The example module will require us to manually trigger an `onChange` event. But with the above code snippet we're now ready to interact with them.

#### 2. Add a Button to Trigger the Event

The example module requires us to manually trigger the `onChange` event. Add a button that calls `setValueAsync`, which will emit the event:

```tsx
<Button
  title="Click me"
  onPress={() => {
    ExpoAudioRoute.setValueAsync("Hello World");
  }}
/>
```

> [!NOTE]
>
> 👀 **Try it:**
> Save your changes and check your app. You should now see a "Click Me" button. When you press it, an alert should appear with the title "Event received" and "Hello World" as its message.
>
> https://github.com/user-attachments/assets/0c5efa36-e4c0-40a6-9fb9-1ebc4b1baa81

<details>
<summary>Full solution</summary>

```tsx
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import ExpoAudioRoute from "./modules/expo-audio-route";

export default function App() {
  React.useEffect(() => {
    const sub = ExpoAudioRoute.addListener("onChange", (ev) => {
      Alert.alert("Event received", ev.value);
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>{ExpoAudioRoute.PI}</Text>
      <Text>{ExpoAudioRoute.hello()}</Text>
      <Button
        title="Click me"
        onPress={() => {
          ExpoAudioRoute.setValueAsync("Hello World");
        }}
      />
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

</details>

## Exercise 4: Consume the custom native view

### Background: Native View Components

In addition to functions and constants, Expo modules can expose custom native UI components. Your module includes `ExpoAudioRouteView`, which wraps a native WebView component. You can use it just like any other React component.

### Tasks

#### 1. Import the View Component

Update your import in `App.tsx` to include the view:

```diff
-import ExpoAudioRoute from "./modules/expo-audio-route";
+import ExpoAudioRoute, { ExpoAudioRouteView } from "./modules/expo-audio-route";
```

#### 2. Render the Native View

Add the native view component to your App:

```tsx
<ExpoAudioRouteView
  onLoad={() => {
    console.log("loaded");
  }}
  url="https://expo.dev"
/>
```

If you hit save here you have indeed added the view to your app, but you won't see it just yet.

#### 3. Apply Styling to the View

Add a `style` prop with explicit width and height:

```tsx
<ExpoAudioRouteView
  onLoad={() => {
    console.log("loaded");
  }}
  url="https://expo.dev"
  style={{ width: 200, height: 200 }}
/>
```

> [!NOTE]
>
> 👀 **Try it:** Save your changes and check your app. You should see the Expo website loaded inside a WebView component in the center of your screen. Check your console/logs - you should see "loaded" printed when the page finishes loading.
>
> <img width="200" alt="Screenshot_1762425917" src="https://github.com/user-attachments/assets/9a6621c6-e62b-4e3c-be1e-f5b81280868c" />
>
> 👀 **Try changing the `url` prop** to a different website (like `"https://reactnative.dev"`) and save. The WebView should update to show the new site.

<details>
<summary>Full solution</summary>

```tsx
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import ExpoAudioRoute, { ExpoAudioRouteView } from "./modules/expo-audio-route";

export default function App() {
  React.useEffect(() => {
    const sub = ExpoAudioRoute.addListener("onChange", (ev) => {
      Alert.alert("Event received", ev.value);
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>{ExpoAudioRoute.PI}</Text>
      <Text>{ExpoAudioRoute.hello()}</Text>
      <Button
        title="Click me"
        onPress={() => {
          ExpoAudioRoute.setValueAsync("Hello World");
        }}
      />
      <ExpoAudioRouteView
        onLoad={() => {
          console.log("loaded");
        }}
        url="https://expo.dev"
        style={{ width: 200, height: 200 }}
      />
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

</details>

## Exercise 5: Extend the Module

Now let's add our own functionality to the module! Because we'll be making changes to native code, we'll need to rebuild the app.

### Add a synchronous function

#### 1. Update the TypeScript Types

First, declare the new function in the TypeScript interface

**File**: `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`

```diff
declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  PI: number;
  hello(): string;
+ goodbye(): string;
  setValueAsync(value: string): Promise<void>;
}
```

#### 2. Implement the Native Function

Add the `goodbye()` function to iOS and/or Android native modules.

<details>
<summary>Swift</summary>

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteModule.swift`

```diff
Function("hello") {
  return "Hello world! 👋"
}
+
+Function("goodbye") {
+  return "Goodbye! 👋"
+}
```

</details>

<details>
<summary>Kotlin</summary>

**File:** `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt`

```diff
Function("hello") {
  "Hello world! 👋"
}
+
+Function("goodbye") {
+  "Goodbye! 👋"
+}
```

</details>

#### 2. Call it from React

**File**: `App.tsx`

```diff
<Text>{ExpoAudioRoute.PI}</Text>
<Text>{ExpoAudioRoute.hello()}</Text>
+<Text>{ExpoAudioRoute.goodbye()}</Text>
```

> [!NOTE]
>
> 👀 **Try it**
>
> 1. Save the file and try to consume the new `goodbye` function.
>
> 2. Remember to rebuild after native changes: `npx expo run:ios` or `npx expo run:android`. Now you should be able to run the app.
>
> <img width="200" alt="Screenshot_1762426096" src="https://github.com/user-attachments/assets/977f66e6-e092-485c-83b9-76a21cd7f8c1" />

## Exercise 6: Build from Xcode / Android Studio

Opening your project in the native IDEs allows you to view, debug, and modify the native code directly. This is especially useful for setting breakpoints, viewing native logs, and understanding how your module integrates with the native platform.

### Tasks

#### 1. Open the Project in Your Native IDE

Choose the platform you want to work with:

**For iOS:**

```sh
xed ios
```

This opens the iOS workspace in Xcode.

**For Android:**

```sh
open -a "Android Studio" android
```

Alternatively, open Android Studio manually and select **Open**, then navigate to the `android` directory.

#### 2. Locate Your Module Files

**In Xcode:**

1. In the Project Navigator, look under **Pods > Development Pods > ExpoAudioRoute**
2. Here you'll find `ExpoAudioRouteModule.swift` and `ExpoAudioRouteView.swift`

<img width="320" height="429" alt="Xcode Project Navigator showing the new Expo Module" src="https://github.com/user-attachments/assets/f374aa55-183d-45ae-8b07-b1f6cc285e35" />

**In Android Studio:**

1. In the Project view, look under **expo-audio-route > kotlin+java > expo.modules.audioroute**
2. Here you'll find `ExpoAudioRouteModule` and `ExpoAudioRouteView`

<img width="337" height="337" alt="Android Project Tool Window showing the new Expo Module" src="https://github.com/user-attachments/assets/94ba9eab-c81c-4636-b67c-e817f3b9fee9" />

#### 3. Build and Run from the IDE

**In Xcode:**

1. Select a simulator from the device dropdown at the top
2. Press the Play button to build and run

<img width="627" height="38" alt="Screenshot 2025-11-11 at 00 47 46" src="https://github.com/user-attachments/assets/e8055a1b-9210-44f2-8aa2-7cf3955bf3c1" />

**In Android Studio:**

1. Select an emulator from the device dropdown at the top
2. Press the Play button to build and run

<img width="333" height="45" alt="image" src="https://github.com/user-attachments/assets/9ea45cc0-e1e5-43f6-8a9a-bc365790b550" />

> [!WARNING]
> Android Studio might not be able to run your app without first configuring Gradle correctly. If you see Gradle sync
> errors, open Android Studio's settings and navigate to **Settings > Build, Execution, Deployment > Build Tools > Gradle**
> then switch the **Gradle JDK** setting to **JAVA_HOME**. After changing the setting, start a Gradle sync again and wait
> for it to complete - this may take a few minutes.

## Next exercise

[Chapter 2 👉](./chapter-2.md)
