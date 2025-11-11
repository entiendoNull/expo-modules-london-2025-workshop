import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import ExpoAudioRoute, { AudioRoute } from "./modules/expo-audio-route";
import { useEvent } from "expo";

const initialRoute: AudioRoute = "unknown";

export default function App() {

  const { route } = useEvent(ExpoAudioRoute, "onAudioRouteChange", {
    route: initialRoute,
  });

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>Current Route: {route}</Text>
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