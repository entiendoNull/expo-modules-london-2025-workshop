package expo.modules.audioroute

import android.content.Context
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

// Props class for the Jetpack Compose view
data class ExpoAudioRouteViewProps(
    val options: MutableState<Array<String>> = mutableStateOf(emptyArray()),
    val selectedIndex: MutableState<Int?> = mutableStateOf(null),
) : ComposeProps

// Our Jetpack Compose view that subclasses `ExpoComposeView`. This allow Expo Modules to host your
// Jetpack Compose view within your Expo app
class ExpoAudioRouteView(context: Context, appContext: AppContext) :
    ExpoComposeView<ExpoAudioRouteViewProps>(context, appContext, withHostingView = true) {
    override val props = ExpoAudioRouteViewProps()
    private val onOptionChange by EventDispatcher()

    // We have to enable the Material 3 experimental API for the `SingleChoiceSegmentedButtonRow` to work
    @OptIn(ExperimentalMaterial3Api::class)
    // Similarly, we need to mark this function to be handled by the Compose compiler
    @Composable
    override fun Content(modifier: Modifier) {
        val (selectedIndex) = props.selectedIndex
        val (options) = props.options

        SingleChoiceSegmentedButtonRow(modifier = modifier) {
            options.forEachIndexed { index, value ->
                SegmentedButton(
                    shape = SegmentedButtonDefaults.itemShape(
                        index = index,
                        count = options.size
                    ),
                    onClick = {
                        onOptionChange(mapOf("index" to index, "value" to value))
                    },
                    selected = index == selectedIndex,
                    label = { Text(value) },
                )
            }
        }
    }
}
