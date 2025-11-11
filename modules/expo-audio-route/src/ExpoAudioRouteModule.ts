import { NativeModule, requireNativeModule } from "expo";
import { AudioRoute } from "./ExpoAudioRoute.types";

declare class ExpoAudioRouteModule extends NativeModule {
  getCurrentRouteAsync(): Promise<AudioRoute>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");