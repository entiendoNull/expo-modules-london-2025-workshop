import * as React from 'react';

import { ExpoAudioRouteViewProps } from './ExpoAudioRoute.types';

export default function ExpoAudioRouteView(props: ExpoAudioRouteViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
