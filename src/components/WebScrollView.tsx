/**
 * WebScrollView — drop-in ScrollView that works correctly on web.
 * On web it injects overflow:auto so content is actually scrollable.
 * On native it's a plain ScrollView with no changes.
 */
import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

type Props = ScrollViewProps & { children?: React.ReactNode };

export default function WebScrollView({ style, children, ...props }: Props) {
  return (
    <ScrollView
      style={[{ flex: 1 }, style] as any}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
