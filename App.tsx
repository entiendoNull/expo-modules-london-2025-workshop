import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AudioRoute, useAudioRouteChangedEvent } from "./modules/expo-audio-route";

const initialRoute: AudioRoute = "unknown";

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