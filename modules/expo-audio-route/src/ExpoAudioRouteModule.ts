import { NativeModule, requireNativeModule } from 'expo';

import { ExpoAudioRouteModuleEvents } from './ExpoAudioRoute.types';

declare class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioRouteModule>('ExpoAudioRoute');
