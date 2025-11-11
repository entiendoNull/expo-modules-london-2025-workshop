import { registerWebModule, NativeModule } from "expo";

class ExpoAudioRouteModule extends NativeModule {
  async getCurrentRouteAsync(): Promise<"unknown"> {
    return Promise.resolve("unknown");
  }
}

const webModule = registerWebModule(
  ExpoAudioRouteModule,
  "ExpoAudioRouteModule"
);

export function useAudioRouteChangedEvent() {
  return { route: "unknown" };
}

export function useAudioRoute() {
  return webModule;
}

export default webModule;