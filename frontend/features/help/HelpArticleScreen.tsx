// HelpArticleScreen.tsx: mobile port of creva_finance's help/[category]/[article]/page.tsx — one
// answer with its lead line, "Cómo se hace" steps, the "Ten en cuenta" caveat, the CTA to the
// screen that resolves it, "Otras de este tema", and the data-privacy contact footer.
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { relatedArticles, type HelpArticle, type HelpCategory } from "../../lib/help-content";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";
import { HelpGlyph } from "./components/HelpGlyph";

export interface HelpArticleScreenProps {
  category: HelpCategory;
  article: HelpArticle;
  onBack: () => void;
  onOpenArticle: (article: HelpArticle) => void;
  onResolve: (href: string) => void;
}

export function HelpArticleScreen({
  category,
  article,
  onBack,
  onOpenArticle,
  onResolve,
}: HelpArticleScreenProps) {
  const related = relatedArticles(category.slug, article.slug);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="help-article-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />

        <View className="mb-2 flex-row items-center gap-2">
          <HelpGlyph icon={category.icon} size={16} />
          <Text className="text-sm font-semibold text-text/50">{category.title}</Text>
        </View>
        <Text className="mb-5 text-2xl font-bold text-text">{article.question}</Text>

        <Text className="mb-7 text-[15px] leading-6 text-text">{article.answer}</Text>

        {article.steps ? (
          <Section title="Cómo se hace">
            <Card>
              <View className="gap-3">
                {article.steps.map((step, index) => (
                  <View key={index} className="flex-row gap-3">
                    <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-surface-2">
                      <Text className="text-xs font-bold text-crimson">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-sm leading-5 text-text/80">{step}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </Section>
        ) : null}

        {article.note ? (
          <Section>
            <Card tone="highlight">
              <View className="gap-1.5">
                <Text className="text-xs font-bold uppercase tracking-wide text-text">Ten en cuenta</Text>
                <Text className="text-sm leading-5 text-text/80">{article.note}</Text>
              </View>
            </Card>
          </Section>
        ) : null}

        {article.resolvedBy ? (
          <Section>
            <Pressable
              className="rounded-xl bg-crimson px-5 py-3"
              onPress={() => article.resolvedBy && onResolve(article.resolvedBy.href)}
              testID="help-article-resolve-cta"
            >
              <Text className="text-center font-semibold text-white">{article.resolvedBy.label}</Text>
            </Pressable>
          </Section>
        ) : null}

        {related.length > 0 ? (
          <Section title="Otras de este tema">
            <Card>
              <View>
                {related.map(({ article: other }) => (
                  <Pressable
                    key={other.slug}
                    onPress={() => onOpenArticle(other)}
                    testID={`help-related-${other.slug}`}
                    className="flex-row items-center justify-between border-b border-text/5 py-4"
                  >
                    <Text className="flex-1 pr-3 text-sm font-semibold text-text">{other.question}</Text>
                    <Text className="text-text/30">›</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </Section>
        ) : null}

        <Text className="text-xs leading-4 text-text/50">
          ¿No era esto? <Text className="font-semibold text-crimson">Busca en toda la ayuda</Text> con
          una palabra suelta. Para lo que tenga que ver con tus datos personales, el correo es
          privacidad@finarahub.mx.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
