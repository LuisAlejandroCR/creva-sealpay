// ScoreScreen.tsx: the bottom-nav "Score" tab — a mobile port of
// creva_finance/frontend/app/score/page.tsx. Every figure comes from the real GET /score
// (app/lib/api.ts's score.get(), core-direct with the Clerk session token, exactly like
// DashboardScreen) plus /recommendations and /creva-score/disclosure; nothing is hardcoded and a
// failure shows a visible message, never an invented number. QueryScreen (the paid SealPay
// signal-query flow) keeps its own identity — this screen links to it, it does not repurpose it.
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  score as scoreApi,
  recommendations as recsApi,
  crevaScore,
  isBackendUnlinked,
  type ScoreData,
  type ScoreBandKey,
  type Recommendation,
  type ScoreDisclosure,
} from "../../lib/api";
import { factorHint, factorLabel, factorLever } from "../../lib/score-display";
import { BackButton } from "../shared/BackButton";
import { BackendPendingState } from "../shared/BackendPendingState";
import { Card, Progress, Section } from "../query/components/VisualPrimitives";
import { ScoreGauge } from "../query/components/ScoreGauge";

export interface ScoreScreenProps {
  onOpenQuery: () => void;
  onBack?: () => void;
  onOpenHelp?: () => void;
}

type BandTone = "success" | "warning" | "danger" | "neutral";

// The API bands the score and each factor; this only translates that band to the app's gauge
// tones and es-MX chrome. It never decides a band from a cut-off — when the API sends none, the
// gauge falls back to a neutral ring rather than inventing a threshold.
const BAND_TONE: Record<ScoreBandKey, BandTone> = {
  excellent: "success",
  good: "success",
  fair: "warning",
  poor: "danger",
};

const TONE_TEXT: Record<BandTone, string> = {
  success: "text-success",
  warning: "text-warning-text",
  danger: "text-crimson",
  neutral: "text-text/60",
};

const TONE_BAR: Record<BandTone, string> = {
  success: "bg-success",
  warning: "bg-warning-text",
  danger: "bg-crimson",
  neutral: "bg-text/30",
};

const TONE_LABEL: Record<BandTone, string> = {
  success: "Bueno",
  warning: "Por revisar",
  danger: "Falta evidencia",
  neutral: "Informativo",
};

// Where the score sends her next — ported verbatim from score/page.tsx's NEXT_STOPS. Rows, not
// cards: three navigation cards pushed the factors under the fold on the web.
const NEXT_STOPS = [
  { key: "calculator", label: "Calculadora", description: "Qué entró, qué salió y qué hacer con lo que queda." },
  { key: "business-verification", label: "Sello de tu negocio", description: "Búscalo en el directorio oficial. No suma ni resta puntos." },
  { key: "regulatory", label: "Reglas que te afectan", description: "Novedades del diario oficial, con su fuente y su fecha." },
  { key: "report", label: "Tu reporte", description: "Todo junto y sellado, para entregarlo a quien lo pida." },
];

export function ScoreScreen({ onOpenQuery, onBack, onOpenHelp }: ScoreScreenProps) {
  const [data, setData] = useState<ScoreData | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [disclosure, setDisclosure] = useState<ScoreDisclosure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendPending, setBackendPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBackendPending(false);
    Promise.allSettled([scoreApi.get(), recsApi.get(), crevaScore.disclosure()])
      .then(([scoreResult, recsResult, disclosureResult]) => {
        if (cancelled) return;
        if (scoreResult.status === "fulfilled") {
          setData(scoreResult.value);
        } else if (isBackendUnlinked(scoreResult.reason)) {
          setBackendPending(true);
        } else {
          setError("No pudimos cargar tu score. Intenta de nuevo más tarde.");
        }
        if (recsResult.status === "fulfilled") setRecs(recsResult.value.recommendations ?? []);
        if (disclosureResult.status === "fulfilled") setDisclosure(disclosureResult.value);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scoreValue = data?.score ?? null;
  const scoreMax = data?.maxScore ?? 100;
  const bandKey = data?.band ?? null;
  const tone: BandTone = bandKey
    ? BAND_TONE[bandKey]
    : scoreValue !== null && scoreValue / scoreMax >= 0.7
      ? "success"
      : "neutral";
  const factors = data?.factors ?? null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        {onBack ? <BackButton onPress={onBack} testID="score-back" /> : null}

        <View className="mb-6">
          <Text className="text-3xl font-bold text-text">Score Creva</Text>
          <Text className="mt-2 text-base leading-6 text-text/70">
            Tu salud financiera, explicada factor por factor.
          </Text>
          {onOpenHelp ? (
            <Pressable onPress={onOpenHelp} testID="score-help" accessibilityRole="button" hitSlop={8}>
              <Text className="mt-2 text-[13px] font-semibold text-crimson">Ayuda sobre tu score</Text>
            </Pressable>
          ) : null}
        </View>

        <Section>
          <Card size="lg">
            {loading ? (
              <View className="items-center py-8" testID="score-loading">
                <ActivityIndicator />
              </View>
            ) : backendPending ? (
              <BackendPendingState />
            ) : error || scoreValue === null ? (
              <Text className="text-sm text-crimson" testID="score-error">
                {error ?? "No pudimos cargar tu score."}
              </Text>
            ) : (
              <ScoreGauge value={scoreValue} max={scoreMax} band={tone} shape="ring" />
            )}
          </Card>
        </Section>

        {factors && factors.length > 0 ? (
          <Section title="De dónde sale tu score" lead="Cada factor dice qué mide, cómo vas y qué lo movería.">
            <View className="gap-3">
              {factors.map((factor) => {
                const factorTone: BandTone = factor.band ? BAND_TONE[factor.band] : "neutral";
                return (
                  <Card key={factor.name}>
                    <View className="gap-3">
                      <Progress
                        value={factor.score}
                        max={factor.maxScore}
                        label={factorLabel(factor.name)}
                        valueLabel={`${factor.score}/${factor.maxScore}`}
                        colorClass={TONE_BAR[factorTone]}
                      />
                      <Text className={`text-xs font-bold ${TONE_TEXT[factorTone]}`}>
                        {TONE_LABEL[factorTone]}
                      </Text>
                      <View className="gap-1 border-t border-border pt-3">
                        <Text className="text-xs font-bold text-text">Qué mide</Text>
                        <Text className="text-sm leading-5 text-text/70">{factorHint(factor.name)}</Text>
                      </View>
                      <View className="gap-1">
                        <Text className="text-xs font-bold text-text">Cómo vas</Text>
                        <Text className="text-sm leading-5 text-text/70">{factor.rationale}</Text>
                      </View>
                      <View className="gap-1">
                        <Text className="text-xs font-bold text-text">Qué lo movería</Text>
                        <Text className="text-sm leading-5 text-text/70">{factorLever(factor.name)}</Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </Section>
        ) : null}

        {recs.length > 0 ? (
          <Section title="Qué puedes hacer">
            <View className="gap-2">
              {recs.slice(0, 3).map((rec) => (
                <Card key={rec.ruleId}>
                  <Text className="text-sm leading-5 text-text/80">{rec.messageEs}</Text>
                </Card>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Sigue por aquí">
          <View>
            {NEXT_STOPS.map((stop) => (
              <View key={stop.key} className="border-b border-text/5 py-4">
                <Text className="text-base text-text">{stop.label}</Text>
                <Text className="mt-1 text-sm leading-5 text-text/60">{stop.description}</Text>
              </View>
            ))}
          </View>
        </Section>

        {disclosure ? (
          <Section>
            <Card>
              <View className="gap-3">
                <Text className="text-sm font-semibold text-text">Qué no hace este puntaje</Text>
                <Text className="text-sm leading-5 text-text/70">{disclosure.describes}</Text>
                {disclosure.does_not_estimate.length > 0 ? (
                  <View className="gap-1">
                    {disclosure.does_not_estimate.map((item) => (
                      <Text key={item} className="text-sm leading-5 text-text/70">
                        • {item}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <Text className="text-xs text-text/50">
                  Creva · versión {disclosure.score_version} · ventana de {disclosure.window_days} días
                </Text>
              </View>
            </Card>
          </Section>
        ) : null}

        <Pressable onPress={onOpenQuery} testID="score-open-query">
          <Card>
            <Text className="text-center text-sm font-semibold text-crimson">
              Consultar con pago (SealPay) →
            </Text>
          </Card>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
