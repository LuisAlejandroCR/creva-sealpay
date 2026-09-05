// CardScreen.tsx: what Dashboard's "Activar mi tarjeta Creva" CTA and the disabled Tarjeta tab's
// PRONTO badge both point at when a real explanation is needed — reuses help-content.ts's own
// "por-que-dice-pronto" answer instead of inventing new copy, since that article already exists.
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { findArticle } from "../../lib/help-content";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";

export interface CardScreenProps {
  onBack: () => void;
}

export function CardScreen({ onBack }: CardScreenProps) {
  const article = findArticle("tarjeta", "por-que-dice-pronto")?.article;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="card-screen">
      <View className="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Tarjeta</Text>

        <Section>
          <Card>
            <Text className="text-sm font-semibold text-text">PRONTO</Text>
            <Text className="mt-2 text-sm leading-5 text-text/70">
              {article?.answer ?? "Emitir una tarjeta exige verificar tu identidad; esa integración no está lista todavía."}
            </Text>
            {article?.note ? (
              <Text className="mt-2 text-xs leading-4 text-text/50">{article.note}</Text>
            ) : null}
          </Card>
        </Section>
      </View>
    </SafeAreaView>
  );
}
