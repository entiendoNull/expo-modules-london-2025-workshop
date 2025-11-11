export type AudioRoute = "speaker" | "wiredHeadset" | "bluetooth" | "unknown";

export type RouteChangeEvent = {
  route: AudioRoute;
};

export type ExpoAudioRouteModuleEvents = {
  onAudioRouteChange: (params: RouteChangeEvent) => void;
};