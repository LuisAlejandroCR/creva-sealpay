// RegulatoryScreen.tsx: mobile port of creva_finance's app/regulatory/page.tsx — the regulatory
// radar. One scan for every user that reads none of her data, split into freshly published notices
// and standing rules, each with its official source, date and evidence link.
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { crevaScore, type RegulatoryAlert, type RegulatoryRadar, type SourceResult } from "../../lib/api";
import { formatLongDay } from "../../lib/format-date";
import { BackButton } from "../shared/BackButton";
import { Card, EvidenceLink, Section } from "../query/components/VisualPrimitives";

export interface RegulatoryScreenProps {
  onBack: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  "mx.dof": "Diario Oficial de la Federación",
  "mx.cnbv": "Normas vigentes de la CNBV",
};

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

function metaOf(alert: RegulatoryAlert): string {
  const day = formatLongDay(alert.published_at);
  return [sourceLabel(alert.source), alert.agency ?? "", day]
    .filter((part) => part.length > 0)
    .join(" · ");
}

function AlertGroup({
  title,
  hint,
  emptyHint,
  alerts,
}: {
  title: string;
  hint: string;
  emptyHint: string;
  alerts: RegulatoryAlert[];
}) {
  return (
    <Section title={title} lead={alerts.length === 0 ? emptyHint : hint}>
      <View className="gap-3">
        {alerts.map((alert) => (
          <Card key={`${alert.source}:${alert.external_id}`} testID="regulatory-alert">
            <View className="gap-2.5">
              <Text className="text-sm font-semibold text-text">{alert.title}</Text>
              <Text className="text-xs text-text/50">{metaOf(alert)}</Text>
              {alert.url ? <EvidenceLink href={alert.url} /> : null}
            </View>
          </Card>
        ))}
      </View>
    </Section>
  );
}

export function RegulatoryScreen({ onBack }: RegulatoryScreenProps) {
  const [radar, setRadar] = useState<SourceResult<RegulatoryRadar> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    crevaScore
      .radar()
      .then((result) => {
        if (!cancelled) setRadar(result);
      })
      .catch(() => {
        if (!cancelled) setRadar(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = radar?.available ? radar.data : null;
  const news = data?.alerts.filter((alert) => alert.kind === "publication") ?? [];
  const standing = data?.alerts.filter((alert) => alert.kind === "standing_rule") ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="regulatory-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Reglas que te afectan</Text>
        <Text className="mb-6 mt-1 text-sm leading-5 text-text/60">
          Revisamos el diario oficial y las normas vigentes de la autoridad bancaria, y separamos lo
          que toca tu crédito de lo que no.
        </Text>

        <View className="mb-7 rounded-2xl border border-info-border bg-info-bg p-4">
          <Text className="text-sm leading-5 text-text/70">
            Esta revisión no consulta ningún dato tuyo. Es la misma para todas, y cada aviso trae su
            fuente, su fecha y el documento oficial detrás.
          </Text>
        </View>

        {isLoading ? (
          <View className="items-center py-6" testID="regulatory-loading">
            <ActivityIndicator />
          </View>
        ) : data === null ? (
          <View
            className="rounded-2xl border border-warning-border bg-warning-bg p-4"
            testID="regulatory-unavailable"
          >
            <Text className="text-sm font-bold text-text">Revisión no disponible</Text>
            <Text className="mt-1.5 text-sm leading-5 text-text/70">
              No pudimos leer las publicaciones oficiales en este momento. Preferimos decírtelo a
              dejarte creer que no había nada.
            </Text>
          </View>
        ) : (
          <View>
            <AlertGroup
              title="Novedades publicadas"
              hint="Publicadas en los días revisados."
              emptyHint="No hubo publicaciones que te toquen en los días revisados."
              alerts={news}
            />
            <AlertGroup
              title="Reglas que ya estaban vigentes"
              hint="No son novedad: llevan tiempo aplicando."
              emptyHint="Ninguna regla vigente coincidió con los temas revisados."
              alerts={standing}
            />
            <View className="gap-1.5">
              <Text className="text-xs text-text/50">
                Fuentes consultadas:{" "}
                {data.sources_available.map(sourceLabel).join(" · ") || "ninguna"}
              </Text>
              {data.failed_dates.length > 0 ? (
                <Text className="text-xs text-text/50">
                  No pudimos leer {data.failed_dates.length} fecha(s) del diario oficial.
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
