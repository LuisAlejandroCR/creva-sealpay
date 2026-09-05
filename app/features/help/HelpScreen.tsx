// HelpScreen.tsx: mobile port of creva_finance's help/page.tsx — the help centre index: search,
// the four most-asked questions, the eight themes, and the one real contact channel Creva has
// (privacidad@finarahub.mx). Content comes from app/lib/help-content.ts, already ported/tested.
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HELP_CATEGORIES, MOST_ASKED, articleHref, categoryHref } from "../../lib/help-content";
import { Card, Section } from "../query/components/VisualPrimitives";
import { HelpGlyph } from "./components/HelpGlyph";
import { HelpSearch } from "./components/HelpSearch";

export interface HelpScreenProps {
  onOpenArticle?: (href: string) => void;
  onOpenCategory?: (href: string) => void;
}

export function HelpScreen({ onOpenArticle, onOpenCategory }: HelpScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text">Ayuda</Text>
          <Text className="mt-2 text-base leading-6 text-text/70">
            Busca tu duda o entra por tema. Cada respuesta termina en la pantalla que la resuelve.
          </Text>
        </View>

        <HelpSearch>
          <>
            <Section title="Lo que más se pregunta">
              <View className="flex-row flex-wrap gap-3">
                {MOST_ASKED.map(({ category, article, short, icon }) => {
                  const href = articleHref(category, article);
                  return (
                    <Pressable
                      key={href}
                      onPress={() => onOpenArticle?.(href)}
                      testID={`help-most-asked-${article}`}
                      className="w-[47%] items-center gap-2 rounded-xl border border-text/10 bg-surface-1 p-4"
                    >
                      <HelpGlyph icon={icon} size={22} />
                      <Text className="text-center text-sm font-semibold text-text">{short}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title="Entra por tema">
              <Card>
                <View>
                  {HELP_CATEGORIES.map((category) => (
                    <Pressable
                      key={category.slug}
                      onPress={() => onOpenCategory?.(categoryHref(category))}
                      testID={`help-category-${category.slug}`}
                      className="flex-row items-center gap-3 border-b border-text/5 py-4"
                    >
                      <HelpGlyph icon={category.icon} />
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-text">{category.title}</Text>
                        <Text className="text-xs text-text/50">{category.lead}</Text>
                      </View>
                      <Text className="text-text/30">›</Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
            </Section>

            <Section title="¿Y si mi duda no está aquí?">
              <Card>
                <View className="gap-2">
                  <Text className="text-sm leading-5 text-text">
                    Para lo que tenga que ver con tus datos personales —consultarlos, corregirlos o
                    pedir que se borren— escribe a{" "}
                    <Text className="font-bold">privacidad@finarahub.mx</Text>. Es el canal que el
                    aviso de privacidad publica, y el que atiende esas solicitudes.
                  </Text>
                  <Text className="text-xs leading-4 text-text/50">
                    Creva todavía no tiene una línea de soporte general: si tu duda es de otro tipo,
                    este es el único correo que existe hoy.
                  </Text>
                </View>
              </Card>
            </Section>
          </>
        </HelpSearch>
      </ScrollView>
    </SafeAreaView>
  );
}
