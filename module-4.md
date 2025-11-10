# Module 4

In the fourth module, you'll refine your Expo module to make it cleaner, more convenient, and easier to use. You'll replace manual event subscriptions with Expo’s `useEvent` and `useEventListener` hooks, simplify your React code, and expose your module as custom hooks for even better developer experience. Finally, you’ll add a simple web fallback so the module behaves gracefully on unsupported platforms.

### Goals

- Improve usability by integrating Expo’s event hooks and creating custom React hooks.
- Streamline event handling and state management in React.
- Add a fallback implementation for unsupported platforms like web.

### Tasks

- Simplify event handling using Expo's built-in hooks
- Wrap the module as custom React hooks for better developer experience
- Add a web fallback implementation for graceful degradation

# Exercises

## Exercise 0: Improve event handling with Expo hooks

We now have a working Expo Module where we can query for the current audio route and listen to changes. But there are refinements we can make to improve the developer experience when consuming our module.

Currently, we're handling events like this:

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

There's nothing wrong with this approach, but Expo provides built-in hooks that can make our code cleaner and more concise.

### Tasks

#### 1. Simplify with useEventListener

Without any changes to our native code, we can use the `useEventListener` hook instead. This hook automatically handles registering and unregistering the listener for us, eliminating the need for manual cleanup.

**File:** `App.tsx`

Replace your `useEffect` event handling with:

```diff
import * as React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import ExpoAudioRoute, { AudioRoute } from "./modules/expo-audio-route";
+import { useEventListener } from "expo";

export default function App() {
  const [audioRoute, setAudioRoute] = React.useState<AudioRoute | null>(
    "unknown"
  );

+ useEventListener(ExpoAudioRoute, "onAudioRouteChange", ({ route }) => {
+   setAudioRoute(route);
+ });

- React.useEffect(() => {
-   // Registers an event listener for audio route changes
-   const sub = ExpoAudioRoute.addListener(
-     "onAudioRouteChange",
-     ({ route }) => {
-       setAudioRoute(route);
-     }
-   );
-
-   return () => {
-     // Unregisters the event listener
-     sub.remove();
-   };
- }, []);

  return (
    <>
      ...
    </>
  );
}
```

This is much cleaner! The hook manages the subscription lifecycle automatically.

> [!NOTE]
> 👀 **Try it:** Save and test your app. It should work exactly the same as before, but with less boilerplate code.

#### 2. Eliminate state management with useEvent

There's an even more elegant approach using `useEvent` that eliminates the need for state management entirely. The `useEvent` hook both listens for events and manages the state for you.

**File:** `App.tsx`

```diff
import * as React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import ExpoAudioRoute, { AudioRoute } from "./modules/expo-audio-route";
-import { useEventListener } from "expo";
+import { useEvent } from "expo";

+ const initialRoute: AudioRoute = "unknown";

export default function App() {
-  const [audioRoute, setAudioRoute] = React.useState<AudioRoute | null>(
-    "unknown"
-  );
-
-  useEventListener(ExpoAudioRoute, "onAudioRouteChange", ({ route }) => {
-    setAudioRoute(route);
-  });

+  const { route } = useEvent(ExpoAudioRoute, "onAudioRouteChange", {
+    route: initialRoute,
+  });

  return (
    <>
      <View style={styles.container}>
+       <Text>{route}</Text>
-       <Text>{audioRoute}</Text>
-       <Button
-         title="Get Audio Route"
-         onPress={() => {
-           ExpoAudioRoute.getCurrentRouteAsync().then((route) => {
-             setAudioRoute(route);
-           });
-         }}
-       />
      </View>
    </>
  );
}
```

Now `route` is automatically updated whenever the event fires, and you don't need to manage state manually!

#### 3. Send initial value immediately

There's one catch with `useEvent`: it only updates when the event fires, meaning you won't see the current route until it changes. Let's fix this by dispatching the current route immediately when someone starts listening.

This requires just one line of native code—we'll send an event as soon as `OnStartObserving` is called.

<details>
<summary>Swift (iOS)</summary>

**File:** `modules/expo-audio-route/ios/ExpoAudioRouteModule.swift`

```diff
OnStartObserving("onAudioRouteChange") {
+ self.sendEvent("onAudioRouteChange", ["route": self.currentRoute()])
  self.startObservingRouteChanges()
}
```

</details>

<details>
<summary>Kotlin (Android)</summary>

**File:** `modules/expo-audio-route/android/src/main/java/expo/modules/audioroute/ExpoAudioRouteModule.kt`

```diff
OnStartObserving("onAudioRouteChange") {
+ sendEvent("onAudioRouteChange", mapOf("route" to currentRoute()))
  startObservingRouteChanges()
}
```

</details>

#### 4. Rebuild and test

Since we changed native code, rebuild your app:

```sh
npx expo run:ios --device
# or
npx expo run:android --device
```

Now when your app launches, the current audio route will appear immediately, and it will still update automatically when you connect or disconnect audio devices!

<details>
<summary>Full solution with useEvent</summary>

```tsx
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEvent } from "expo";
import ExpoAudioRoute from "./modules/expo-audio-route";
import type { AudioRoute } from "./modules/expo-audio-route";

const initialRoute: AudioRoute = "unknown";

export default function App() {
  const { route } = useEvent(ExpoAudioRoute, "onAudioRouteChange", {
    route: initialRoute,
  });

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text>Current Route: {route}</Text>
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

## Exercise 1: Create custom React hooks

We've come a long way with our module, but we can make it even easier to consume. With just a few TypeScript changes, we can expose the module as custom React hooks, following React best practices and conventions.

By wrapping our module in a function called `useAudioRoute()`, we're creating a hook. It might seem like a small change, but this unlocks a better developer experience.

### Tasks

#### 1. Create a basic module hook

Let's start by wrapping our module in a function that follows the hook naming convention.

**File:** `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`

```diff
import { NativeModule, requireNativeModule } from "expo";
import { AudioRoute, ExpoAudioRouteModuleEvents } from "./ExpoAudioRoute.types";

declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  getCurrentRouteAsync(): Promise<AudioRoute>;
}

-export default requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");
+const nativeModule = requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");
+
+export function useAudioRoute() {
+  return nativeModule;
+}
+
+export default nativeModule;
```

**File:** `modules/expo-audio-route/index.ts`

```diff
export { default } from "./src/ExpoAudioRouteModule";
export * from "./src/ExpoAudioRoute.types";
+export { useAudioRoute } from "./src/ExpoAudioRouteModule";
```

Now developers can use your module as a hook:

```tsx
const audioRoute = useAudioRoute();

// Query the current route
audioRoute.getCurrentRouteAsync().then((route) => {
  console.log("Current Route:", route);
});

// Listen to events
React.useEffect(() => {
  const sub = audioRoute.addListener("onAudioRouteChange", ({ route }) => {
    console.log("Current Route:", route);
  });
  return () => sub.remove();
}, []);
```

Or with `useEvent` like this:

```ts
const audioRoute = useAudioRoute();
const { route } = useEvent(audioRoute, "onAudioRouteChange", {
  route: initialRoute,
});
```

> [!NOTE]
> 👀 **Try it:** Update your `App.tsx` to use `useAudioRoute()` instead of directly importing the module. The functionality should work exactly the same — this change is purely about changing the API.

<details>
<summary>Full solution</summary>

```tsx
import * as React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAudioRoute, AudioRoute } from "./modules/expo-audio-route";

export default function App() {
  const audioRoute = useAudioRoute();

  React.useEffect(() => {
    // Registers an event listener for audio route changes
    const sub = audioRoute.addListener("onAudioRouteChange", ({ route }) => {
      console.log(route);
    });

    return () => {
      // Unregisters the event listener
      sub.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Button
          title="Get Audio Route"
          onPress={() => {
            audioRoute.getCurrentRouteAsync().then((route) => {
              console.log(route);
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

#### 2. Create a specialized event hook

Let's take it further by creating a hook specifically for handling audio route changes. This will encapsulate all the event handling logic.

**File:** `modules/expo-audio-route/src/ExpoAudioRouteModule.ts`

First, add the import for `useEvent` at the top:

```diff
-import { NativeModule, requireNativeModule } from "expo";
+import { NativeModule, requireNativeModule, useEvent } from "expo";
import { AudioRoute, ExpoAudioRouteModuleEvents } from "./ExpoAudioRoute.types";
```

Then add the new hook:

```diff
const nativeModule = requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");

export function useAudioRoute() {
  return nativeModule;
}

+const initialRoute: AudioRoute = "unknown";
+
+export function useAudioRouteChangedEvent() {
+  return useEvent(nativeModule, "onAudioRouteChange", {
+    route: initialRoute,
+  });
+}

export default nativeModule;
```

**File:** `modules/expo-audio-route/index.ts`

```diff
export { default } from "./src/ExpoAudioRouteModule";
export * from "./src/ExpoAudioRoute.types";
-export { useAudioRoute } from "./src/ExpoAudioRouteModule";
+export { useAudioRoute, useAudioRouteChangedEvent } from "./src/ExpoAudioRouteModule";
```

#### 3. Use the new hook in your app

Now consuming your module becomes incredibly simple!

**File:** `App.tsx`

```tsx
import * as React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAudioRouteChangedEvent } from "./modules/expo-audio-route";

export default function App() {
  const { route } = useAudioRouteChangedEvent();

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text>Current Route: {route}</Text>
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

Look how clean that is! One line to get the current audio route with automatic updates. No manually added event listeners, no state management, no cleanup — just a simple hook.

> [!NOTE]
> 👀 **Try it:** Save and test your app. The audio route should display immediately and update automatically when you connect or disconnect audio devices. All that functionality in one line!

With this implementation, developers can now consume your API in multiple ways depending on their needs:

- **Direct module access**:

```tsx
ExpoAudioRoute.getCurrentRouteAsync();
```

- **Hook-based access**:

```tsx
const audioRote = useAudioRoute();
audioRoute.getCurrentRouteAsync();
```

- **Event hook**:

```tsx
const { route } = useAudioRouteChangedEvent();
```

This flexibility makes your module accessible to different coding styles and use cases.

## Exercise 2: Add web fallback support

If your module doesn't support a specific platform (or can't support it due to platform limitations), it's good practice to provide a fallback implementation. This prevents crashes and provides a graceful degradation experience.

Let's add web support to our application with a fallback implementation.

### Tasks

#### 1. Install web dependencies

First, add the necessary packages for web support:

```sh
npx expo install react-dom react-native-web @expo/metro-runtime
```

#### 2. Test the web app without a fallback

Start the dev server and press `w` to open the web version:

```sh
npx expo start --clear
```

Press `w` in the terminal. Your browser will open, but the app will be blank with this error in the console:

```sh
Uncaught Error: Cannot find native module 'ExpoAudioRoute'
```

#### 3. Create a web-specific module implementation

Create a web-specific implementation that gracefully handles the unsupported platform:

```sh
touch modules/expo-audio-route/src/ExpoAudioRouteModule.web.ts
```

**File:** `modules/expo-audio-route/src/ExpoAudioRouteModule.web.ts`

Add the following code:

```ts
import { registerWebModule, NativeModule } from "expo";

class ExpoAudioRouteModule extends NativeModule {
  async getCurrentRouteAsync(): Promise<"unknown"> {
    return Promise.resolve("unknown");
  }
}

const webModule = registerWebModule(
  ExpoAudioRouteModule,
  "ExpoAudioRouteModule"
);

export function useAudioRouteChangedEvent() {
  return { route: "unknown" };
}

export function useAudioRoute() {
  return webModule;
}

export default webModule;
```

This implementation:

- Provides the same API as the native modules
- Returns `"unknown"` for all audio route queries
- Exposes the same hooks for consistency

#### 4. Test the web fallback

Refresh your web browser. The app should now display:

```
Current Route: unknown
```

You may need to restart your development server:

```sh
npx expo start --clear
```

## Next exercise

[Module 5 👉](./module-5.md)
