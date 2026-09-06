// BackButton.tsx: shared back-navigation control for full-screen flows that have no persistent
// bottom nav (onboarding, query, verify, every Más/stub screen) — same 44px chevron affordance and
// "Volver" label as creva_finance's BackControl.tsx (components/BackControl.tsx), recreated in
// NativeWind since that component is a Next.js <Link>/router.back() control with no RN equivalent
// to import. The glyph is the shared SVG icon set instead of a plain "←" text character.
import { Pressable } from "react-native";

import { Icon } from "./icons/Icon";

export function BackButton({ onPress, testID = "back-button" }: { onPress: () => void; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-surface-1 border border-text/10"
    >
      <Icon name="back-chevron" size={20} color="text" />
    </Pressable>
  );
}
