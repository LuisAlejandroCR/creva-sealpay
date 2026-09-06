// BackendPendingState.tsx: the one state every core-backed section shows when the user is signed
// in with Clerk but the core hasn't been configured to accept the token yet (api.ts isBackendUnlinked
// / the JwtAuthGuard AUTH_PROVIDER gap in docs/plan.md). Calm and neutral — not the user's fault,
// nothing to retry — matching the muted tone of the loading/empty states, never the red error one.
import { Text, View } from "react-native";

export function BackendPendingState({
  testID = "backend-pending",
  compact = false,
}: {
  testID?: string;
  compact?: boolean;
}) {
  return (
    <View className={`items-center ${compact ? "py-3" : "py-6"}`} testID={testID}>
      <Text className="text-center text-sm leading-5 text-text/60">
        Estás dentro. Tu información de Creva se conecta pronto.
      </Text>
    </View>
  );
}
