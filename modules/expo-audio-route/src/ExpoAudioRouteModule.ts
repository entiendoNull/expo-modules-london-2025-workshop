import { NativeModule, requireNativeModule, useEvent } from "expo";
import { AudioRoute, ExpoAudioRouteModuleEvents } from "./ExpoAudioRoute.types";

declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  getCurrentRouteAsync(): Promise<AudioRoute>;
}

const nativeModule = requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");

export function useAudioRoute() {
  return nativeModule;
}

const initialRoute: AudioRoute = "unknown";

export function useAudioRouteChangedEvent() {
  return useEvent(nativeModule, "onAudioRouteChange", {
    route: initialRoute,
  });
}

export default nativeModule;