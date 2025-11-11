import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoAudioRouteViewProps } from './ExpoAudioRoute.types';

const NativeView: React.ComponentType<ExpoAudioRouteViewProps> =
  requireNativeView('ExpoAudioRoute');

export default function ExpoAudioRouteView(props: ExpoAudioRouteViewProps) {
  return <NativeView {...props} />;
}
