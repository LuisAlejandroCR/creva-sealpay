// HelpCategoryScreen.tsx: mobile port of creva_finance's help/[category]/page.tsx — one theme's
// questions, flat, each with its one-line answer as the description. The whole-index search box
// sits above the list (search is never scoped to a category), same as the reference.
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { articleHref, type HelpCategory } from "../../lib/help-content";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";
import { HelpGlyph } from "./components/HelpGlyph";
import { HelpSearch } from "./components/HelpSearch";

export interface HelpCategoryScreenProps {
  category: HelpCategory;
  onOpenArticle: (href: string) => void;
  onBack: () => void;
}

export function HelpCategoryScreen({ category, onOpenArticle, onBack }: HelpCategoryScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="help-category-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />

        <View className="mb-2 flex-row items-center gap-2">
          <HelpGlyph icon={category.icon} size={20} />
          <Text className="text-2xl font-bold text-text">{category.title}</Text>
        </View>
        <Text className="mb-4 text-base leading-6 text-text/70">{category.lead}</Text>

        <HelpSearch onOpenArticle={onOpenArticle}>
          <Section>
            <Card>
              <View>
                {category.articles.map((article) => (
                  <Pressable
                    key={article.slug}
                    onPress={() => onOpenArticle(articleHref(category.slug, article.slug))}
                    testID={`help-article-${article.slug}`}
                    className="flex-row items-start justify-between gap-3 border-b border-text/5 py-4"
                  >
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm font-semibold text-text">{article.question}</Text>
                      <Text className="text-xs leading-4 text-text/50">{article.answer}</Text>
                    </View>
                    <Text className="text-text/30">›</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </Section>
        </HelpSearch>
      </ScrollView>
    </SafeAreaView>
  );
}
