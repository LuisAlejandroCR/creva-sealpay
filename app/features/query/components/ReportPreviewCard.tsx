// ReportPreviewCard.tsx: mobile card view of the real SealedReport returned by
// POST /creva-score/report (frontend/lib/api.ts:739-743, proxied by gateway/src/creva-proxy.ts).
// Layout follows frontend/components/report/ReportPaper.tsx:35-134 — the KPI row (signal count /
// own-business signal count / source count), the per-signal tone chip, and the "what this does NOT
// prove" block combining certificate.does_not_prove with disclosure.does_not_estimate
// (ReportPaper.tsx:18) — condensed for a phone card instead of the full printed sheet.
import { Text, View } from "react-native";

import { Card, Badge, Section } from "./VisualPrimitives";
import { SignalResponse } from "../gatewayClient";

const TONE_BADGE: Record<string, "success" | "info" | "warning"> = {
  positive: "success",
  neutral: "info",
  unavailable: "warning",
};

const TONE_LABEL: Record<string, string> = {
  positive: "Consultado",
  neutral: "Consultado",
  unavailable: "No disponible",
};

export function ReportPreviewCard({ result }: { result: SignalResponse }) {
  const { report, certificate } = result.report;
  const ownSignals = report.signals.filter((s) => s.category === "business_verification").length;
  const businessName = report.subject?.business_name ?? "Reporte sin negocio declarado";
  const limits = [...certificate.does_not_prove, ...report.disclosure.does_not_estimate];

  return (
    <>
      <Card testID="query-result">
        <View className="gap-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase text-text/60">Reporte Creva</Text>
              <Text className="mt-1 text-lg font-bold text-text">{businessName}</Text>
            </View>
            <Badge tone="success">Pagado</Badge>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-xl bg-surface-2 p-3">
              <Text className="text-xs text-text/70">Señales</Text>
              <Text className="mt-1 text-3xl font-bold tabular-nums text-text">{report.signals.length}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-surface-2 p-3">
              <Text className="text-xs text-text/70">Sobre este negocio</Text>
              <Text className="mt-1 text-3xl font-bold tabular-nums text-text">{ownSignals}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-surface-2 p-3">
              <Text className="text-xs text-text/70">Fuentes</Text>
              <Text className="mt-1 text-3xl font-bold tabular-nums text-text">{report.sources.length}</Text>
            </View>
          </View>

          <View className="gap-2">
            {report.signals.map((signal) => (
              <View key={signal.key} className="border-b border-text/10 pb-2">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 font-semibold text-text">{signal.label}</Text>
                  <Badge tone={TONE_BADGE[signal.tone] ?? "info"}>{TONE_LABEL[signal.tone] ?? signal.tone}</Badge>
                </View>
                <Text className="mt-1 text-xs leading-5 text-text/70">{signal.detail}</Text>
              </View>
            ))}
          </View>

          {result.settlement ? (
            <View className="rounded-xl bg-success/15 p-3">
              <Text className="text-sm font-bold text-success">Sello del pago</Text>
              <Text className="mt-1 text-xs leading-5 text-success">
                {result.settlement.transaction} · {result.settlement.network}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Section title="Qué este reporte NO acredita">
        <Card>
          <View className="gap-2">
            {limits.map((limit) => (
              <View key={limit} className="flex-row gap-2">
                <Text className="text-crimson">•</Text>
                <Text className="flex-1 text-sm leading-5 text-text/70">{limit}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>

      <Card testID="report-seal">
        <Text className="text-xs font-bold uppercase text-text/60">Sello del reporte</Text>
        <Text className="mt-1 text-sm font-semibold tabular-nums text-text">{certificate.folio}</Text>
        <Text className="mt-1 text-xs leading-5 text-text/70">
          {certificate.signature
            ? `Firmado por Creva con la llave ${certificate.signature.key_id}.`
            : "Sin firma: el sello comprueba que el contenido no cambió, no quién lo emitió."}
        </Text>
      </Card>
    </>
  );
}
