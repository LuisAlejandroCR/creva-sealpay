// ScoreScreen.tsx: minimal real screen for the bottom nav's "Score" tab. QueryScreen (the paid
// SealPay signal-query flow) is a different, deliberate flow and keeps its own identity per the
// UI audit — this screen does not repurpose it, it links to it: "Consultar con pago" opens
// QueryScreen the same way Dashboard's score CTA already does. Score's own gauge/history is out
// of scope for this pass (see docs/plan.md, judgment-call note).
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Section } from "../query/components/VisualPrimitives";
import { ScoreGauge } from "../query/components/ScoreGauge";

export interface ScoreScreenProps {
  onOpenQuery: () => void;
  scoreValue?: number;
}

export function ScoreScreen({ onOpenQuery, scoreValue = 74 }: ScoreScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="px-6 pb-10 pt-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text">Tu score</Text>
          <Text className="mt-2 text-base leading-6 text-text/70">
            Lo que Creva puede observar de tu actividad, en un solo número.
          </Text>
        </View>

        <Section>
          <Card>
            <ScoreGauge value={scoreValue} max={100} band={scoreValue >= 70 ? "success" : "warning"} />
          </Card>
        </Section>

        <Pressable onPress={onOpenQuery} testID="score-open-query">
          <Card>
            <Text className="text-center text-sm font-semibold text-crimson">
              Consultar con pago (SealPay) →
            </Text>
          </Card>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
