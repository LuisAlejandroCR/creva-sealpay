// DeleteAccountScreen.tsx: confirmation-only screen for Profile's "Eliminar mi cuenta" row —
// dedicated flow rather than reusing the generic Avisos stub, since deletion needs its own copy
// (help-content.ts's "borrar-mi-cuenta" article already has the exact steps and warning). No
// backend exists for real deletion yet, so this never deletes anything — it only explains the
// real path (an email request) and lets the reader back out.
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { findArticle } from "../../lib/help-content";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";

export interface DeleteAccountScreenProps {
  onBack: () => void;
}

export function DeleteAccountScreen({ onBack }: DeleteAccountScreenProps) {
  const article = findArticle("datos", "borrar-mi-cuenta")?.article;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="delete-account-screen">
      <View className="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Eliminar mi cuenta</Text>

        <Section>
          <Card>
            <Text className="text-sm leading-5 text-text">{article?.answer}</Text>
            {article?.steps ? (
              <View className="mt-3 gap-1.5">
                {article.steps.map((step, index) => (
                  <Text key={index} className="text-sm leading-5 text-text/70">
                    {index + 1}. {step}
                  </Text>
                ))}
              </View>
            ) : null}
            {article?.note ? (
              <Text className="mt-3 text-xs leading-4 text-text/50">{article.note}</Text>
            ) : null}
          </Card>
        </Section>

        <Pressable onPress={onBack} testID="delete-account-back-cta">
          <Card dashed>
            <Text className="text-center text-sm font-semibold text-text">Volver sin pedir la baja</Text>
          </Card>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
