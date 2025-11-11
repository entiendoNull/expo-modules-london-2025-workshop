// Reexport the native module. On web, it will be resolved to ExpoAudioRouteModule.web.ts
// and on native platforms to ExpoAudioRouteModule.ts
export { default } from './src/ExpoAudioRouteModule';
export { default as ExpoAudioRouteView } from './src/ExpoAudioRouteView';
export * from  './src/ExpoAudioRoute.types';
