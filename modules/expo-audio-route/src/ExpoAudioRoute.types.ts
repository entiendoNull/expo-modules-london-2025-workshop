import { StyleProp, ViewStyle } from "react-native";

export type AudioRoute = "speaker" | "wiredHeadset" | "bluetooth" | "unknown";

export type RouteChangeEvent = {
  route: AudioRoute;
};

export type ExpoAudioRouteModuleEvents = {
  onAudioRouteChange: (params: RouteChangeEvent) => void;
};

export type OptionChangeEventPayload = {
  index: number;
  value: string;
};

export type ExpoAudioRouteViewProps = {
  options: string[];
  selectedIndex?: number;
  onOptionChange: (event: {
    nativeEvent: OptionChangeEventPayload;
  }) => void;
  style?: StyleProp<ViewStyle>;
};