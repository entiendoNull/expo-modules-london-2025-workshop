# React Native London 2025: Expo Modules Workshop

## How to use this repo

1. Start at the first chapter by opening up the file called **chapter-1.md**.
2. Proceed to **chapter-2.md**
3. etc.

## Prerequisites

You will want to be able to make a native build on both iOS and Android emulators, and at least one device of either platform.

- A local development environment ready for native iOS and Android React Native / Expo development, capable of running the `npx expo run:ios` and `npx expo run:android`, including recent versions of:
  - Xcode (version 26+)
  - Watchman
  - Cocoapods
  - JDK 17
  - Android Studio
  - iOS simulator
  - Android emulator
  - If you're not sure if you have all of these or if you have the right versions, check the [Expo Local App Development requirements](https://docs.expo.dev/guides/local-app-development/) for details on how to install these tools in order to enable local native development with the Expo CLI.
- Other general development tools:
  - Node 18.
  - Visual Studio Code
  - Git (Github Desktop works great)
- Hardware:
  - A Mac is highly recommended for the full experience.
    - If a Mac isn't available to you, at least make sure your Android native setup is good. We may be able to help you make it through parts of the iOS exercises with EAS Build, provided you have an iOS device and paid Apple developer account.
  - An iOS or Android device. Highly recommended to bring devices for both platforms if have them available.
  - Recommended: your bluetooth earbuds/headphones. You can use these to do extra tests on the audio source API we'll be interacting with
- Make sure your iOS / Android devices have [developer mode (iOS)](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device) / [Developer options and USB debugging (Android)](https://developer.android.com/studio/debug/dev-options) enabled

## Test your setup before the workshop

Do these steps to ensure you'll be able to complete the workshop exercises.

1. Create a new Expo project with `npx create-expo-app@latest`

2. Build and run the app on your iOS simulator:

```
npx expo run:ios
```

3. Build and run the app on your Android emulator:

```
npx expo run:android
```

**If you're able to run a new project on a simulator and emulator, that's a great start!**

Now, let's try to run on a device so we can test more features in our native module:

4. Plug in your device via USB. Click through any prompts (e.g., allow debugging? or enter your password).

5. For Android, run `npx expo run:android --device`. For iOS run `npx expo run:ios --device`

6. Choose your device from the list. If you don't see your device, check settings for [developer mode (iOS)](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device) / [Developer options and USB debugging (Android)](https://developer.android.com/studio/debug/dev-options).

**If you're able to run a new project on your device, you're in a great shape!**
