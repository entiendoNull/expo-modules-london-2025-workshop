import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import ExpoAudioRoute, { AudioRoute, useAudioRoute } from "./modules/expo-audio-route";
import { useEvent } from "expo";

const initialRoute: AudioRoute = "unknown";

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