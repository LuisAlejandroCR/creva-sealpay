// HelpCategoryScreen.tsx: the screen HelpScreen's onOpenCategory lands on — lists one
// app/lib/help-content.ts category's articles so the reader can pick one, then hands off to
// HelpArticleScreen. Wires the dead-end HelpScreen onOpenCategory handler the UI audit flagged.
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { HelpArticle, HelpCategory } from "../../lib/help-content";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";
import { HelpGlyph } from "./components/HelpGlyph";

export interface HelpCategoryScreenProps {
  category: HelpCategory;
  onOpenArticle: (article: HelpArticle) => void;
  onBack: () => void;
}

export function HelpCategoryScreen({ category, onOpenArticle, onBack }: HelpCategoryScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="help-category-screen">
      <View className="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />

        <View className="mb-2 flex-row items-center gap-2">
          <HelpGlyph icon={category.icon} size={20} />
          <Text className="text-2xl font-bold text-text">{category.title}</Text>
        </View>
        <Text className="mb-6 text-base leading-6 text-text/70">{category.lead}</Text>

        <Section>
          <Card>
            <View>
              {category.articles.map((article) => (
                <Pressable
                  key={article.slug}
                  onPress={() => onOpenArticle(article)}
                  testID={`help-article-${article.slug}`}
                  className="flex-row items-center justify-between border-b border-text/5 py-4"
                >
                  <Text className="flex-1 text-sm font-semibold text-text">{article.question}</Text>
                  <Text className="text-text/30">›</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </Section>
      </View>
    </SafeAreaView>
  );
}
