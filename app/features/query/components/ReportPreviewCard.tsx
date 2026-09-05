// ReportPreviewCard.tsx: visual summary of the paid report returned by the x402 mock.
// It mirrors Creva's report cards: subject, signal count, sources, seal and payment evidence.
import { Text, View } from "react-native";

import { Card, Badge, EvidenceLink } from "./VisualPrimitives";
import { SignalResponse } from "../gatewayClient";

export function ReportPreviewCard({ result }: { result: SignalResponse }) {
  const sources = Array.isArray(result.signal.sources) ? result.signal.sources.map(String) : [];
  const rawBusinessName = String(result.signal.businessName ?? "Reporte sin negocio declarado");
  const businessName = rawBusinessName === "Panaderia La Espiga" ? "Panadería La Espiga" : rawBusinessName;
  const signalsFound = Number(result.signal.signalsFound ?? sources.length);

  return (
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
            <Text className="mt-1 text-3xl font-bold tabular-nums text-text">{signalsFound}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-surface-2 p-3">
            <Text className="text-xs text-text/70">Red</Text>
            <Text className="mt-1 text-base font-bold text-text">{result.settlement.network}</Text>
          </View>
        </View>

        <View className="gap-2">
          {sources.map((source) => (
            <View key={source} className="flex-row items-center justify-between border-b border-text/10 pb-2">
              <Text className="font-semibold text-text">{source}</Text>
              <Badge tone={source === "SAT" ? "warning" : "info"}>{source === "SAT" ? "Por revisar" : "Consultado"}</Badge>
            </View>
          ))}
        </View>

        <View className="rounded-xl bg-success/15 p-3">
          <Text className="text-sm font-bold text-success">Sello del pago</Text>
          <Text className="mt-1 text-xs leading-5 text-success">
            El reporte y su settlement viajan juntos para que el receptor pueda verificar el resultado.
          </Text>
          <EvidenceLink href={result.settlement.transaction} label="Transacción" />
        </View>
      </View>
    </Card>
  );
}
