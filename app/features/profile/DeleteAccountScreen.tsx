// DeleteAccountScreen.tsx: confirmation-only screen for Profile's "Eliminar mi cuenta" row —
// dedicated flow rather than reusing the generic Avisos stub, since deletion needs its own copy
// (help-content.ts's "borrar-mi-cuenta" article already has the exact steps and warning). No
// backend exists for real deletion yet, so this never deletes anything — it only explains the
// real path (an email request, opened via Linking so it hits the reader's own mail app) and lets
// the reader back out. Mailbox/subject/body mirror creva_finance/frontend's
// app/profile/delete-account/page.tsx exactly, so the two channels never drift.
import { Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { findArticle } from "../../lib/help-content";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";

const MAILBOX = "privacidad@finarahub.mx";
const SUBJECT = "Solicitud de eliminación de cuenta";
const BODY = [
  "Hola:",
  "",
  "Quiero que se elimine mi cuenta de Creva y todo lo que guardan de mí.",
  "Escribo desde el correo con el que me registré.",
  "",
  "Gracias.",
].join("\n");

const MAILTO = `mailto:${MAILBOX}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

export interface DeleteAccountScreenProps {
  onBack: () => void;
  onOpenPrivacy: () => void;
}

export function DeleteAccountScreen({ onBack, onOpenPrivacy }: DeleteAccountScreenProps) {
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
          </Card>
        </Section>

        <Pressable onPress={() => Linking.openURL(MAILTO)} testID="delete-account-mailto-cta">
          <Card>
            <Text className="text-center text-sm font-semibold text-crimson">Escribir el correo</Text>
          </Card>
        </Pressable>

        <Section>
          <Card tone="highlight">
            <Text className="text-xs font-bold uppercase text-text/70">Ten en cuenta</Text>
            <Text className="mt-1 text-sm leading-5 text-text">
              {article?.note ??
                "Es permanente: no hay copia que podamos devolverte después. Si lo que quieres es dejar de usar Creva por un tiempo, basta con cerrar sesión."}
            </Text>
          </Card>
        </Section>

        <Pressable onPress={onOpenPrivacy} testID="delete-account-open-privacy">
          <Text className="mt-4 text-center text-sm text-text/60">
            Antes de decidir, lee el{" "}
            <Text className="font-semibold text-crimson">Aviso de privacidad</Text>
          </Text>
        </Pressable>

        <Pressable onPress={onBack} testID="delete-account-back-cta">
          <Card dashed>
            <Text className="text-center text-sm font-semibold text-text">Volver sin pedir la baja</Text>
          </Card>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
