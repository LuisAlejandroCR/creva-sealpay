// HelpArticleScreen.tsx: the screen HelpScreen's onOpenArticle/HelpSearch hits land on — renders
// one app/lib/help-content.ts article in full (answer, steps, note, the screen that resolves it).
// Wires the dead-end HelpScreen/HelpSearch onPress handlers the UI audit flagged.
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { HelpArticle, HelpCategory } from "../../lib/help-content";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";
import { HelpGlyph } from "./components/HelpGlyph";

export interface HelpArticleScreenProps {
  category: HelpCategory;
  article: HelpArticle;
  onBack: () => void;
}

export function HelpArticleScreen({ category, article, onBack }: HelpArticleScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="help-article-screen">
      <View className="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />

        <View className="mb-2 flex-row items-center gap-2">
          <HelpGlyph icon={category.icon} size={16} />
          <Text className="text-sm font-semibold text-text/50">{category.title}</Text>
        </View>
        <Text className="mb-6 text-2xl font-bold text-text">{article.question}</Text>

        <Section>
          <Card>
            <Text className="text-sm leading-5 text-text">{article.answer}</Text>
            {article.steps ? (
              <View className="mt-3 gap-1.5">
                {article.steps.map((step, index) => (
                  <Text key={index} className="text-sm leading-5 text-text/70">
                    {index + 1}. {step}
                  </Text>
                ))}
              </View>
            ) : null}
            {article.note ? (
              <Text className="mt-3 text-xs leading-4 text-text/50">{article.note}</Text>
            ) : null}
          </Card>
        </Section>
      </View>
    </SafeAreaView>
  );
}
