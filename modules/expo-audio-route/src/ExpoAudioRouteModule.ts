import { NativeModule, requireNativeModule } from "expo";
import { AudioRoute, ExpoAudioRouteModuleEvents } from "./ExpoAudioRoute.types";

declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  getCurrentRouteAsync(): Promise<AudioRoute>;
}

const nativeModule = requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");

export function useAudioRoute() {
  return nativeModule;
}

export default nativeModule;