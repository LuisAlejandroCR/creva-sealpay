// ReportScreen.tsx: mobile port of creva_finance's app/report/page.tsx — the composed public-record
// report. Building it is button-gated because crevaScore.report() is a POST that spends the shared
// provider quota. No print sheet here (ReportPaper is web-only); the sealed file is handed over via
// the native Share sheet instead of a browser download.
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { crevaScore, type ReportSignal, type SealedReport } from "../../lib/api";
import { formatLongDay } from "../../lib/format-date";
import { stateLabel } from "../../lib/mx-states";
import {
  CATEGORY_HINTS,
  CATEGORY_TITLES,
  REPORT_CATEGORIES,
  TONE_LABELS,
} from "../../lib/report-display";
import { BackButton } from "../shared/BackButton";
import { Card, EvidenceLink, Section } from "../query/components/VisualPrimitives";

export interface ReportScreenProps {
  onBack: () => void;
}

const TONE_CLASS: Record<ReportSignal["tone"], string> = {
  positive: "text-success-text",
  neutral: "text-text-muted",
  unavailable: "text-warning-text",
};

async function shareSealed(sealed: SealedReport) {
  try {
    await Share.share({
      message: JSON.stringify(sealed, null, 2),
      title: `reporte-creva-${sealed.certificate.folio.slice(0, 8).toLowerCase()}.json`,
    });
  } catch {
    // Share sheet dismissed or unavailable — nothing to recover from here.
  }
}

function SignalCard({ signal }: { signal: ReportSignal }) {
  const checked = formatLongDay(signal.checked_at);
  return (
    <Card>
      <View className="gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-sm font-semibold text-text">{signal.label}</Text>
          <Text className={`text-xs font-bold ${TONE_CLASS[signal.tone]}`}>{TONE_LABELS[signal.tone]}</Text>
        </View>
        <Text className="text-sm leading-5 text-text/70">{signal.detail}</Text>
        <Text className="text-xs text-text/50">
          {signal.source}
          {checked ? ` · ${checked}` : ""}
        </Text>
        {signal.evidence_url ? <EvidenceLink href={signal.evidence_url} /> : null}
      </View>
    </Card>
  );
}

export function ReportScreen({ onBack }: ReportScreenProps) {
  const [sealed, setSealed] = useState<SealedReport | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = useCallback(async () => {
    setIsBuilding(true);
    setError(null);
    try {
      setSealed(await crevaScore.report());
    } catch {
      setError("No pudimos armar tu reporte ahora. Intenta de nuevo en un momento.");
    } finally {
      setIsBuilding(false);
    }
  }, []);

  const report = sealed?.report ?? null;
  const own = report?.signals.filter((s) => s.category === "business_verification").length ?? 0;
  const total = report?.signals.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="report-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Tu reporte</Text>
        <Text className="mb-6 mt-1 text-sm leading-5 text-text/60">
          Todo lo que hoy se puede saber de tu negocio en registros públicos, cada dato con su fuente
          y su fecha.
        </Text>

        {report === null ? (
          <View className="gap-4">
            <View className="rounded-2xl border border-info-border bg-info-bg p-4">
              <Text className="text-sm leading-5 text-text/70">
                Armarlo consulta registros oficiales en ese momento, así que puede tardar unos
                segundos. Usamos el nombre y el estado que tengas guardados en tu perfil fiscal.
              </Text>
            </View>

            <Pressable
              className={`rounded-xl bg-crimson px-5 py-3 ${isBuilding ? "opacity-60" : ""}`}
              onPress={build}
              disabled={isBuilding}
              testID="report-generate-cta"
            >
              <Text className="text-center font-semibold text-white">
                {isBuilding ? "Armando tu reporte…" : "Generar mi reporte"}
              </Text>
            </Pressable>

            {error ? (
              <View className="rounded-2xl border border-danger-border bg-danger-bg p-4" testID="report-error">
                <Text className="text-sm leading-5 text-crimson">{error}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View>
            <Section>
              <View className="gap-4">
                <View className="gap-1">
                  {report.subject ? (
                    <Text className="text-[15px] font-semibold text-text">
                      {report.subject.business_name}
                      {stateLabel(report.subject.state_code)
                        ? ` · ${stateLabel(report.subject.state_code)}`
                        : ""}
                    </Text>
                  ) : null}
                  <Text className="text-xs text-text/50">
                    Generado el {formatLongDay(report.generated_at)}
                  </Text>
                </View>

                <View className="rounded-2xl border border-info-border bg-info-bg p-4">
                  <Text className="text-sm leading-5 text-text/70">
                    {own === 1 ? "1 de estas" : `${own} de estas`} {total} señales{" "}
                    {own === 1 ? "es sobre tu negocio" : "son sobre tu negocio"}. Las otras{" "}
                    {total - own} son el marco regulatorio y las tasas de referencia: las mismas para
                    cualquiera.
                  </Text>
                </View>
              </View>
            </Section>

            {REPORT_CATEGORIES.map((category) => {
              const signals = report.signals.filter((s) => s.category === category);
              if (signals.length === 0) return null;
              return (
                <Section key={category} title={CATEGORY_TITLES[category]} lead={CATEGORY_HINTS[category]}>
                  <View className="gap-3">
                    {signals.map((signal) => (
                      <SignalCard key={signal.key} signal={signal} />
                    ))}
                  </View>
                </Section>
              );
            })}

            {report.notes.length > 0 ? (
              <Section>
                <View className="gap-1.5 rounded-2xl border border-warning-border bg-warning-bg p-4">
                  {report.notes.map((note) => (
                    <Text key={note} className="text-sm leading-5 text-text/70">
                      {note}
                    </Text>
                  ))}
                </View>
              </Section>
            ) : null}

            <Section title="Qué se consultó">
              <View className="gap-2">
                {report.sources.map((sourceItem) => (
                  <View
                    key={`${sourceItem.provider}:${sourceItem.dataset}`}
                    className="flex-row justify-between gap-3 border-b border-text/5 pb-2"
                  >
                    <Text className="flex-1 text-sm text-text/70">{sourceItem.dataset}</Text>
                    <Text className="text-sm font-semibold text-text">
                      {formatLongDay(sourceItem.queried_at) || "—"}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section>
              <View className="gap-4">
                <Card>
                  <View className="gap-2.5">
                    <Text className="text-sm font-bold text-text">Lo que este reporte NO dice</Text>
                    {report.disclosure.does_not_estimate.map((item) => (
                      <Text key={item} className="text-sm leading-5 text-text/70">
                        • {item}
                      </Text>
                    ))}
                  </View>
                </Card>

                <Card testID="report-seal">
                  <View className="gap-2.5">
                    <Text className="text-sm font-bold text-text">Sello del reporte</Text>
                    <Text className="text-sm text-text">{sealed?.certificate.folio}</Text>
                    <Text
                      className={`text-sm font-semibold ${sealed?.certificate.signature ? "text-success-text" : "text-warning-text"}`}
                    >
                      {sealed?.certificate.signature
                        ? `Firmado por Creva con la llave ${sealed.certificate.signature.key_id}.`
                        : "Sin firma: el sello comprueba que el contenido no cambió, no quién lo emitió."}
                    </Text>
                    {(sealed?.certificate.does_not_prove ?? []).map((item) => (
                      <Text key={item} className="text-sm leading-5 text-text/70">
                        • {item}
                      </Text>
                    ))}
                    <Pressable
                      className="rounded-xl bg-crimson px-5 py-3"
                      onPress={() => sealed && shareSealed(sealed)}
                      testID="report-share-cta"
                    >
                      <Text className="text-center font-semibold text-white">Compartir reporte y sello</Text>
                    </Pressable>
                    <Text className="text-xs leading-4 text-text/50">
                      Quien lo reciba puede comprobar que no fue alterado sin necesidad de una cuenta.
                    </Text>
                  </View>
                </Card>

                <Pressable
                  onPress={build}
                  disabled={isBuilding}
                  testID="report-rebuild-cta"
                >
                  <Text className="text-center text-sm font-semibold text-text/60">
                    {isBuilding ? "Actualizando…" : "Volver a consultar"}
                  </Text>
                </Pressable>
              </View>
            </Section>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
