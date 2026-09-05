// CreditScreen.tsx: minimal real screen for the bottom nav's "Crédito" tab. VerifyScreen (the
// public seal-verification flow) is a different, deliberate flow and keeps its own identity per
// the UI audit — it does not become "Crédito". The link here is the closest honest bridge: a
// sealed report is what a credit product asks a candidate to prove, so "Comprobar un reporte"
// opens VerifyScreen. Real product matching/eligibility is out of scope for this pass.
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Section } from "../query/components/VisualPrimitives";

export interface CreditScreenProps {
  onOpenVerify: () => void;
}

export function CreditScreen({ onOpenVerify }: CreditScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="px-6 pb-10 pt-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text">Crédito</Text>
          <Text className="mt-2 text-base leading-6 text-text/70">
            Creva compara tu perfil contra un catálogo de productos y te dice cuáles te quedan.
          </Text>
        </View>

        <Section>
          <Card dashed testID="credit-catalog-placeholder">
            <Text className="text-sm font-semibold text-text">Próximamente</Text>
            <Text className="mt-1 text-sm leading-5 text-text/60">
              El catálogo de productos y tus criterios todavía no están cableados en esta app.
            </Text>
          </Card>
        </Section>

        <Pressable onPress={onOpenVerify} testID="credit-open-verify">
          <Card>
            <Text className="text-center text-sm font-semibold text-crimson">
              Comprobar un reporte sellado →
            </Text>
          </Card>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
