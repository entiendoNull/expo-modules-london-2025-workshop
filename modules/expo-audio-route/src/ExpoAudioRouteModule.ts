import { NativeModule, requireNativeModule } from "expo";

declare class ExpoAudioRouteModule extends NativeModule {}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioRouteModule>("ExpoAudioRoute");