import ExpoModulesCore
import SwiftUI

// Props class for the SwiftUI view
final class ExpoAudioRouteViewProps: ExpoSwiftUI.ViewProps {
    // We use the @Field property wrapper here to expose props that can be set from React Native
    @Field var options: [String] = []
    @Field var selectedIndex: Int?
    // An EventDispatcher is how we associate callbacks from React Native
    var onOptionChange = EventDispatcher()
}

// Our SwiftUI view that conforms to the `ExpoSwiftUI.View` and `ExpoSwiftUI.WithHostingView`
// protocols. These protocols allow Expo Modules to host your SwiftUI view within your Expo app
struct ExpoAudioRouteView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
    @ObservedObject var props: ExpoAudioRouteViewProps

    init(props: ExpoAudioRouteViewProps) {
        self.props = props
    }

    var body: some View {
        if #available(iOS 13.0, *) {
            // The first parameter to `Picker` is a label, as an exercise you could try and expose this as a prop
            // The second parameter binds the selected option prop to this component with a getter and setter
            Picker("", selection: Binding(
                get: { props.selectedIndex ?? 0 },
                set: { newValue in
                    props.onOptionChange([
                        "index": newValue,
                        "value": props.options[newValue],
                    ])
                }
            )) {
                ForEach(Array(props.options.enumerated()), id: \.0) { index, option in
                    Text(option).tag(index)
                }
            }
            .pickerStyle(.segmented)
        } else {
            // Fallback for older iOS versions that don't have support for `Picker`
            Text("Segmented Picker requires iOS 13.0+")
                .background(.red)
                .padding()
        }
    }
}
