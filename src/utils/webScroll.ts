/**
 * webScrollStyle
 *
 * The correct ScrollView style for Expo web.
 *
 * WHY THIS IS NEEDED:
 * On web, React Native ScrollView renders as a <div> with overflow-y:scroll.
 * For that div to actually scroll, it needs a DEFINED HEIGHT — not flex:1
 * (which resolves to the parent's height, which itself needs a defined height).
 * The only reliable way on web is to use `height: '100%'` so the div fills
 * its nearest positioned/sized ancestor.
 *
 * The App.tsx CSS sets html/body/  #root to height:100% with a flex column,
 * so this chain resolves correctly to the viewport height minus the tab bar.
 *
 * overflowY:'auto' rather than 'scroll' hides the scrollbar when not needed.
 *
 * On native (iOS/Android) we pass nothing — RN handles scrolling natively.
 */
import { Platform, StyleProp, ViewStyle } from 'react-native';

export const webScrollStyle: StyleProp<ViewStyle> =
  Platform.OS === 'web'
    ? ({ height: '100%', overflowY: 'auto' } as any)
    : undefined;

/**
 * webRootStyle
 *
 * Applied to the outermost View of every screen on web.
 * Forces it to fill the available height without overflowing.
 */
export const webRootStyle: StyleProp<ViewStyle> =
  Platform.OS === 'web'
    ? ({ height: '100%', overflow: 'hidden' } as any)
    : undefined;
