import { NativeModule, requireNativeModule } from "expo";
import { AudioRoute, ExpoAudioRouteModuleEvents } from "./ExpoAudioRoute.types";

declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  getCurrentRouteAsync(): Promise<AudioRoute>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");