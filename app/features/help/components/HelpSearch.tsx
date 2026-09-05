// HelpSearch.tsx: mobile port of creva_finance's components/help/HelpSearch.tsx — one search
// box over the whole help index (never scoped to a category), rendering `children` (the browse
// view) while empty and the matching articles while typed. Uses app/lib/help-content.ts as-is.
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { articleHref, searchHelp } from "../../../lib/help-content";
import { Section } from "../../query/components/VisualPrimitives";

export function HelpSearch({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const hits = useMemo(() => (trimmed ? searchHelp(trimmed) : []), [trimmed]);

  return (
    <>
      <Section>
        <View className="flex-row items-center gap-2 rounded-xl border border-text/10 bg-surface-1 px-4 py-3">
          <Text className="text-text/40">🔎</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="¿Cuál es tu duda?"
            accessibilityLabel="Busca en toda la ayuda"
            className="flex-1 text-base text-text"
            testID="help-search-input"
          />
          {trimmed ? (
            <Pressable onPress={() => setQuery("")} accessibilityLabel="Borrar la búsqueda" testID="help-search-clear">
              <Text className="text-text/40">✕</Text>
            </Pressable>
          ) : null}
        </View>
      </Section>

      {trimmed ? (
        <Section title={hits.length > 0 ? "Resultados" : undefined}>
          {hits.length > 0 ? (
            <View className="gap-3">
              {hits.map(({ category, article }) => (
                <View
                  key={`${category.slug}/${article.slug}`}
                  className="rounded-xl border border-text/10 bg-surface-1 p-4"
                  testID={`help-hit-${articleHref(category.slug, article.slug)}`}
                >
                  <Text className="text-sm font-semibold text-text">{article.question}</Text>
                  <Text className="mt-1 text-xs text-text/50">{category.title}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-text">
                No encontramos nada con esas palabras.
              </Text>
              <Text className="text-sm leading-5 text-text/70">
                Prueba con una palabra sola —tarjeta, score, reporte, contraseña— o entra por tema
                borrando la búsqueda.
              </Text>
            </View>
          )}
        </Section>
      ) : (
        children
      )}
    </>
  );
}
