import { StatusBar } from 'expo-status-bar';
import React from "react";
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
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
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
      <Text>{ExpoAudioRoute.PI}</Text>
      <Text>{ExpoAudioRoute.hello()}</Text>
      <Text>{ExpoAudioRoute.goodbye()}</Text>
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
