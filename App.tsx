import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ExpoAudioRouteView, useAudioRouteChangedEvent } from "./modules/expo-audio-route";

export default function App() {
  const { route } = useAudioRouteChangedEvent();
  const possibleRoutes = ["wiredHeadset", "bluetooth", "speaker", "unknown"];
  const index = possibleRoutes.indexOf(route);

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text>Current Route: {route}</Text>
        <View style={styles.audioRouteContainer}>
          <ExpoAudioRouteView
            style={styles.audioRoute}
            selectedIndex={index}
            options={possibleRoutes}
            onOptionChange={({ nativeEvent: { index, value } }) => {
              console.log({
                index,
                value,
              });
            }}
          />
        </View>
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
  audioRouteContainer: {
    width: '100%',
    padding: 20
  },
  audioRoute: {
    width: "100%",
    padding: 20,
  }
});
