import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoAudioRoute.types';

type ExpoAudioRouteModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoAudioRouteModule extends NativeModule<ExpoAudioRouteModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoAudioRouteModule, 'ExpoAudioRouteModule');
