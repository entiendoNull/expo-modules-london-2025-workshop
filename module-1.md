# Module 1

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

```terminal
npx create-expo-app@latest expo-custom-local-module-example --template blank-typescript
```

The name of our project would in this case be `expo-custom-local-module-example`. Feel free to name it however you like!

#### 2. Install Expo Dev Client

This project will have custom native code, it can’t run inside Expo Go, so we'll want to start by creating a development build. The `expo-dev-client` package gives us an app similar to Expo Go - complete with debugging tools - but with our own native modules included.

```terminal
npx expo install expo-dev-client
```

#### 3 Create new Expo Module

When prompted the name I’ll be using `expo-audio-route`, and then just go ahead and accept the suggestions for the following prompts.

The `--local` flag creates a module that lives inside your project rather than a standalone package that could be published to npm. It’s perfect when you just need some custom native functionality for a specific app.

```
npx create-expo-module@latest --local
```

## Exercise 1: Get it running

#### 1. Prebuild

Continuous Native Generation (CNG) is the process of generating native projects on demand from a set of concise inputs (such as e.g. your app config and package.json).

Instead of committing entire native projects (ios and android root directories) to source control, you only commit the configuration and code that define your app. Whenever you need to compile, Expo regenerates the full native projects for you.

```
npx expo prebuild --clean
```

> [!NOTE]
>
> 👀 Check your file tree out and notice how the `ios` and `android` directories have been created in the root of your project

#### 2. Build

You can build your project locally by running the compile commands provided by the Expo CLI. These commands generate the `ios` and `android` directories that Xcode and Android Studio use to compile your app.

The first time your build an app it will also trigger a `prebuild` if `ios` and `android` directories are not present in the project.

```
npx expo run:ios

# or

npx expo run:android
```

> [!NOTE]
>
> 👀 Once the build is done the development server should start and your app be installed and opened up on your simulator/emulator

## Exercise 2: Consume parts of the imperative API

Now that your module is built and running, let's explore how to use it.

Your new module, `expo-audio-route`, lives inside your project's `modules` directory.

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
> 3.14159
>
> Hello world! 👋

<details>
<summary>See full solution</summary>

```tsx
import { Text, View } from "react-native";
import ExpoAudioRoute from "./modules/expo-audio-route";

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>{ExpoAudioRoute.PI}</Text>
      <Text>{ExpoAudioRoute.hello()}</Text>
    </View>
  );
}
```

</details>

## Exercise 3: Listen to an event

### Background: Understanding Events

You might notice that in the `ExpoAudioRouteModule` file (`modules/expo-audio-route/src/ExpoAudioRouteModule.ts`) there are no `addListener` or `removeListener` functions. That's because these are already built into Expo's `NativeModule` type!

The event definitions live in `ExpoAudioRoute.types.ts` (`modules/expo-audio-route/src/ExpoAudioRoute.types.ts`), which defines the event names and payload shapes:

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
useEffect(() => {
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

<details>
<summary>Full solution</summary>

```tsx
import * as React from "react";
import { Button, Text, View, Alert } from "react-native";
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
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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
```

</details>

## Exercise 4: Consume the custom native view

### Background: Native View Components

In addition to functions and constants, Expo modules can expose custom native UI components. Your module includes `ExpoAudioRouteView`, which wraps a native WebView component. You can use it just like any other React component.

### Tasks

#### 1. Import the View Component

Update your import in `App.tsx` to include the view:

```ts
import ExpoAudioRoute, { ExpoAudioRouteView } from "./modules/expo-audio-route";
```

#### 2. Render the Native View

Add the native view component to your App:

```ts
<ExpoAudioRouteView
  onLoad={() => {
    console.log("loaded");
  }}
  url="https://expo.dev"
/>
```

#### 3. Apply Styling to the View

Add a `style` prop with explicit width and height:

```ts
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
> 👀 **Try it:** Save your changes and check your app. You should see the Expo website loaded inside a WebView component in the center of your screen. Check your console/logs - you should see "loaded" printed when the page > finishes loading.
>
> 👀 **Try changing the `url` prop** to a different website (like `"https://reactnative.dev"`) and save. The WebView should update to show the new site.

<details>
<summary>Full solution</summary>

```tsx
import * as React from "react";
import { Button, Text, View, Alert } from "react-native";
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
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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
```

</details>

## Exercise 5: Extend the Module

Now let's add our own functionality to the module! Any changes to native code require rebuilding the app.

### Add a syncronous function

#### 1. Update the TypeScript Types

First, declare the new function in the TypeScript interface

**File**: modules/expo-audio-route/src/ExpoAudioRouteModule.ts

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

**File:** modules/expo-audio-route/ios/ExpoAudioRouteModule.swift

```diff
Function("hello") {
  return "Hello world! 👋"
}
+
+ Function("goodbye") {
+   return "Goodbye! 👋"
+ }
```

</details>

<details>
<summary>Kotlin</summary>

**File:** modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt

```diff
Function("hello") {
  "Hello world! 👋"
}
+
+ Function("goodbye") {
+   "Goodbye! 👋"
+ }
```

</details>

#### 2. Call it from React

**File**: App.tsx

```diff
<Text>{ExpoAudioRoute.PI}</Text>
<Text>{ExpoAudioRoute.hello()}</Text>
+ <Text>{ExpoAudioRoute.goodbye()}</Text>
```

> [!NOTE]
>
> 👀 **Try it**
>
> 1. Save the file and try to consume the the new `goodbye` function.
>
> 2. Remember to rebuild after native changes: `npx expo run:ios` or `npx expo run:android`. Now you should be able to run the app.

### Add an Asynchronous Function

#### 1. Update the TypeScript types to accommodate a new asynchronous function

**File:** `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`

```diff
declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  PI: number;
  hello(): string;
+ concatStringAsync(value: string): Promise<string>;
  setValueAsync(value: string): Promise<void>;
}
```

#### 2. Add a new async function that returns data to both native modules (iOS/Android)

<details>
<summary>Swift</summary>

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteModule.swift`

```diff
Function("hello") {
  return "Hello world! 👋"
}
+
+ AsyncFunction("concatStringAsync") { (value: String) -> String in
+   try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay
+   return value + " And hello from native code!"
+ }
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
+ AsyncFunction("concatStringAsync") { value: String ->
+   Thread.sleep(1000)
+   value + " And hello from native code!"
+ }
```

</details>

#### 3. Rebuild the app

Since you changed native code, you must rebuild:

```terminal
npx expo run:ios
# or
npx expo run:android
```

#### 4. Call it from React

**File:** `App.tsx`

```diff
<Text>{ExpoAudioRoute.hello()}</Text>
<Text>{ExpoAudioRoute.PI}</Text>
+ <Button
+   title="Hello from JS!"
+   onPress={() => {
+     ExpoAudioRoute.concatStringAsync("Hello from JS!").then(
+       (result) => {
+         console.log(result);
+       }
+     );
+   }}
+ />
```

> [!NOTE]
>
> 👀 **Try it:** After the rebuild completes and your app launches, press the "Hello from JS!" button. Check your console/logs - after a 1-second delay, you should see: `Hello from JS! And hello from native code!`

## Exercise 6: Build from Xcode / Android Studio

Opening your project in the native IDEs allows you to view, debug, and modify the native code directly. This is especially useful for setting breakpoints, viewing native logs, and understanding how your module integrates with the native platform.

### Tasks

#### 1. Open the Project in Your Native IDE

Choose the platform you want to work with:

**For iOS:**

```terminal
xed ios
```

This opens the iOS workspace in Xcode.

**For Android:**

```terminal
open -a "Android Studio" android
```

Alternatively, open Android Studio manually and select "Open" → navigate to the `android` directory.

#### 2. Locate Your Module Files

**In Xcode:**

1. In the Project Navigator, look under `Pods` → `Development Pods` → `ExpoAudioRoute`
2. Here you'll find `ExpoAudioRouteModule.swift` and `ExpoAudioRouteView.swift`

**In Android Studio:**

1. In the Project view, expand `android` → `expo-audio-route`
2. Navigate to `src` → `main` → `java` → `expo` → `modules` → `audioroute`
3. Here you'll find `ExpoAudioRouteModule.kt` and `ExpoAudioRouteView.kt`

#### 3. Build and Run from the IDE

**In Xcode:**

1. Select a simulator from the device dropdown at the top
2. Press `Cmd + R` or click the Play button to build and run

**In Android Studio:**

1. Select an emulator from the device dropdown at the top
2. Press `Ctrl + R` or click the Run button to build and run

> [!NOTE]
>
> 👀 **Try it:** Your app should build and launch from the native IDE. You can now set breakpoints in your native code, view native logs, and debug just like any native app. Try adding a breakpoint in the `goodbye()` function and calling it from your app!
