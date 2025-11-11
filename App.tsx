import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import ExpoAudioRoute, { AudioRoute } from "./modules/expo-audio-route";

export default function App() {
  const [audioRoute, setAudioRoute] = React.useState<AudioRoute>("unknown");
  React.useEffect(() => {
    const sub = ExpoAudioRoute.addListener("onAudioRouteChange", ({ route }) => {
      setAudioRoute(route);
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>Current Route: {audioRoute}</Text>
      <Button
        title="Get Audio Route"
        onPress={async () => {
          const route = await ExpoAudioRoute.getCurrentRouteAsync();
          setAudioRoute(route);
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