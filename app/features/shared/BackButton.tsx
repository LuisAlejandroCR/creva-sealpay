// BackButton.tsx: shared back-navigation control for full-screen flows that have no persistent
// bottom nav (onboarding, query, verify) — same 44px chevron affordance and "Volver" label as
// creva_finance's BackControl.tsx (components/BackControl.tsx), recreated in NativeWind since
// that component is a Next.js <Link>/router.back() control with no RN equivalent to import.
import { Pressable, Text } from "react-native";

export function BackButton({ onPress, testID = "back-button" }: { onPress: () => void; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-surface-1 border border-text/10"
    >
      <Text className="text-lg text-text">←</Text>
    </Pressable>
  );
}
